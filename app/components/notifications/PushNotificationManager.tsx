'use client'
import { useEffect, useState } from "react" 
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'
import Button from '@/app/components/ui/Button'
 
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
 
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [message, setMessage] = useState('')
 
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])
 
  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }
 
  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser(serializedSub)
  }
 
  async function unsubscribeFromPush() {
    const endpoint = subscription?.endpoint
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser(endpoint)
  }
 
  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message)
      setMessage('')
    }
  }
 
  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>
  }
 
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
      <h3 className="font-semibold mb-2">Notifications push</h3>
      {subscription ? (
        <>
          <p className="text-[var(--foreground-secondary)] text-sm">Abonné aux notifications.</p>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={unsubscribeFromPush} variant="ghost">Se désabonner</Button>
          <input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
            <Button onClick={sendTestNotification}>Envoyer un test</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[var(--foreground-secondary)] text-sm">Non abonné aux notifications.</p>
          <div className="mt-3">
            <Button onClick={subscribeToPush}>S’abonner</Button>
          </div>
        </>
      )}
    </div>
  )
}