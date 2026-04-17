import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const sig = parts['v1']
  if (!timestamp || !sig) return false

  const payload = `${timestamp}.${body}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === sig
}

Deno.serve(async (req) => {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)
  if (!valid) return new Response('invalid signature', { status: 400 })

  const event = JSON.parse(body)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const householdId = session.metadata?.household_id
    const priceId = session.line_items?.data?.[0]?.price?.id ?? null

    if (!householdId) return new Response('no household_id', { status: 200 })

    // Determine plan from amount
    const amount = session.amount_total
    const plan = amount <= 499 ? 'family' : 'family_plus'

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await supabase.from('households').update({ plan }).eq('id', householdId)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
