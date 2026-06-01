'use client'

import { useState, useEffect } from 'react'
import { saveSubscription } from '@/actions/push'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function PushSubscribe() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') subscribe()
    }
  }, [])

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      await saveSubscription(JSON.stringify(sub))
    } catch {
      // usuário negou ou browser não suporta
    }
  }

  async function requestPermission() {
    const p = await Notification.requestPermission()
    setPermission(p)
    if (p === 'granted') await subscribe()
  }

  if (!permission || permission === 'granted' || permission === 'denied') return null

  return (
    <button
      onClick={requestPermission}
      className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-slate-700"
    >
      🔔 Ativar notificações
    </button>
  )
}
