import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: object) {
  const webPush = await import('https://esm.sh/web-push@3.6.7?target=deno')
  webPush.setVapidDetails(
    'mailto:hello@chorechart.app',
    Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
    Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
  )
  await webPush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
  )
}

serve(async (req) => {
  const { household_id, title, body, url } = await req.json()

  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household_id)

  if (!members?.length) return new Response('ok')

  const userIds = members.map((m: { user_id: string }) => m.user_id)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  await Promise.allSettled(
    (subs ?? []).map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      sendPush(sub, { title, body, url: url ?? '/' })
    )
  )

  return new Response('ok')
})
