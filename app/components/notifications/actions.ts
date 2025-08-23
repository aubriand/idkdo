'use server'

import webpush, { PushSubscription as WebPushSubscription } from 'web-push'
import { prisma } from '@/app/lib/prisma'
import { api } from '@/app/lib/auth'
import { headers } from 'next/headers'

// Configure VAPID credentials
webpush.setVapidDetails(
  'mailto:aubrian.duhayon@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Narrow the client-provided subscription to the shape expected by web-push and our DB
type SubscriptionInput = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

function toWebPushSubscription(sub: unknown): WebPushSubscription {
  if (!sub || typeof sub !== 'object') throw new Error('Invalid subscription')
  const { endpoint, keys } = sub as Partial<SubscriptionInput>
  if (!endpoint || !keys?.p256dh || !keys?.auth) throw new Error('Invalid subscription payload')
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

export async function subscribeUser(sub: unknown) {
  // Auth: associate subscription with current user
  const session = await api.getSession({ headers: await headers() })
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const s = toWebPushSubscription(sub)

  // Upsert by endpoint to avoid duplicates across devices
  await prisma.pushSubscription.upsert({
    where: { endpoint: s.endpoint },
    update: {
      userId: session.user.id,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
    },
    create: {
      userId: session.user.id,
      endpoint: s.endpoint,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
    },
  })
  return { success: true }
}

export async function unsubscribeUser(endpoint?: string) {
  const session = await api.getSession({ headers: await headers() })
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  // If endpoint provided, delete specific; else delete all for this user
  if (endpoint) {
    await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {})
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } })
  }
  return { success: true }
}

export async function sendNotification(message: string) {
  const session = await api.getSession({ headers: await headers() })
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const subs = await prisma.pushSubscription.findMany({ where: { userId: session.user.id } })
  if (subs.length === 0) return { success: false, error: 'No subscription available' }

  const payload = JSON.stringify({ title: 'IDKDO', body: message, icon: '/IDKDO@192.webp' })
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        .catch(async (err: { statusCode?: number }) => {
          // Clean up gone subscriptions (410/404)
          const status = err?.statusCode
          if (status === 404 || status === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {})
          }
          throw err
        })
    )
  )

  const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
  return { success: rejected.length === 0, failed: rejected.length }
}