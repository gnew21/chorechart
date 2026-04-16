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

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { priceId, householdId, returnUrl } = await req.json()

    const { data: household } = await supabase
      .from('households')
      .select('stripe_customer_id, name')
      .eq('id', householdId)
      .single()

    let customerId = household?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: household?.name ?? 'ChoreChart Household',
        metadata: { household_id: householdId },
      })
      customerId = customer.id
      await supabase.from('households').update({ stripe_customer_id: customerId }).eq('id', householdId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${returnUrl}/?success=1`,
      cancel_url: `${returnUrl}/settings`,
      metadata: { household_id: householdId },
    })

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
