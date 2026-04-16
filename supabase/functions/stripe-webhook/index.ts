import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const PLAN_MAP: Record<string, string> = {
  [Deno.env.get('STRIPE_FAMILY_PRICE_ID') ?? '']: 'family',
  [Deno.env.get('STRIPE_FAMILY_PLUS_PRICE_ID') ?? '']: 'family_plus',
}

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const householdId = session.metadata?.household_id
    if (!householdId) return new Response('ok')

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0]?.price.id ?? ''
    const plan = PLAN_MAP[priceId] ?? 'family'

    await supabase.from('households').update({
      plan,
      stripe_subscription_id: subscription.id,
    }).eq('id', householdId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('households')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0]?.price.id ?? ''
    const plan = PLAN_MAP[priceId] ?? 'family'
    await supabase.from('households')
      .update({ plan })
      .eq('stripe_subscription_id', sub.id)
  }

  return new Response('ok')
})
