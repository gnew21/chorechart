import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Base64url helpers
function b64u(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64u(s: string) {
  return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
}

async function makeVapidJwt(audience: string) {
  const header = b64u(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = b64u(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: 'mailto:admin@chorechart.app',
  })))
  const sigInput = `${header}.${payload}`
  const keyBytes = fromB64u(VAPID_PRIVATE)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, new TextEncoder().encode(sigInput))
  return `${sigInput}.${b64u(sig)}`
}

async function encryptPayload(subscription: { keys: { p256dh: string; auth: string } }, payload: string) {
  const authSecret = fromB64u(subscription.keys.auth)
  const clientPublicKey = fromB64u(subscription.keys.p256dh)

  // Generate server ephemeral key pair
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'])
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey))

  // Import client public key
  const clientKey = await crypto.subtle.importKey('raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, [])

  // ECDH shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeyPair.privateKey, 256))

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // PRK via HKDF
  const hkdfKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveBits'])

  // PRK-key
  const prkInfo = new Uint8Array([...new TextEncoder().encode('WebPush: info\0'), ...clientPublicKey, ...serverPublicKeyRaw])
  const ikm = new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: prkInfo }, hkdfKey, 256))

  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])

  // Content encryption key
  const cekInfo = new TextEncoder().encode('Content-Encoding: aesgcm\0')
  const cekBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo }, ikmKey, 128))

  // Nonce
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0')
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, ikmKey, 96))

  // Encrypt
  const aesKey = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt'])
  const padded = new Uint8Array([0, 0, ...new TextEncoder().encode(payload)])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded))

  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw }
}

async function sendPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: object) {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt = await makeVapidJwt(audience)

  const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription, JSON.stringify(payload))

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'Encryption': `salt=${b64u(salt)}`,
      'Crypto-Key': `dh=${b64u(serverPublicKey)};p256ecdsa=${VAPID_PUBLIC}`,
      'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      'TTL': '86400',
    },
    body: ciphertext,
  })
  return res.status
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const { household_id, title, body, url } = await req.json()
  if (!household_id || !title) return new Response('missing fields', { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get all member user_ids for this household
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household_id)

  if (!members?.length) return new Response('no members', { status: 200 })

  const userIds = members.map((m: { user_id: string }) => m.user_id)

  // Get all push subscriptions for those users
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  if (!subs?.length) return new Response('no subscriptions', { status: 200 })

  await Promise.allSettled(
    subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        { title, body: body ?? '', url: url ?? '/' }
      )
    )
  )

  return new Response(JSON.stringify({ sent: subs.length }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
