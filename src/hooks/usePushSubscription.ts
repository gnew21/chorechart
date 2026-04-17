import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function usePushSubscription(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !VAPID_PUBLIC) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function subscribe() {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        })
      }

      const json = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }, { onConflict: 'endpoint' })
    }

    subscribe()
  }, [userId])
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}
