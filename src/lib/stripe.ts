import { loadStripe } from '@stripe/stripe-js'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

export const PLANS = {
  family: {
    name: 'Family',
    price: '$4.99/mo',
    priceId: import.meta.env.VITE_STRIPE_FAMILY_PRICE_ID as string,
    features: ['Up to 6 members', 'QR chore logging', 'Weekly leaderboard', 'Tracking views'],
  },
  family_plus: {
    name: 'Family+',
    price: '$9.99/mo',
    priceId: import.meta.env.VITE_STRIPE_FAMILY_PLUS_PRICE_ID as string,
    features: ['Unlimited members', 'AI Vision logging', 'Custom point rules', 'Push notifications', 'Everything in Family'],
  },
}

export async function createCheckoutSession(priceId: string, householdId: string): Promise<void> {
  const { data, error } = await (await import('./supabase')).supabase.functions.invoke('create-checkout', {
    body: { priceId, householdId, returnUrl: window.location.origin },
  })
  if (error) throw error
  // Redirect to Stripe-hosted checkout using the session URL
  if (data?.url) {
    window.location.href = data.url
  } else {
    throw new Error('No checkout URL returned')
  }
}
