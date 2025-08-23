'use client'
import { useEffect, useState } from 'react'
import Button from '@/app/components/ui/Button'
import { subscribeUser, unsubscribeUser } from './actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function EnablePushButton({ className = '' }: { className?: string }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (!ok) return
    ;(async () => {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })()
  }, [])

  const onEnable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const serialized = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serialized)
      setSubscribed(true)
    } finally {
      setBusy(false)
    }
  }

  const onDisable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      const endpoint = sub?.endpoint
      await sub?.unsubscribe()
      await unsubscribeUser(endpoint)
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return (
    <Button className={className} disabled variant="ghost">Notifications non prises en charge</Button>
  )

  return subscribed ? (
    <Button className={className} onClick={onDisable} disabled={busy} variant="danger">Désactiver les notifications</Button>
  ) : (
    <Button className={className} onClick={onEnable} disabled={busy}>Activer les notifications</Button>
  )
}
