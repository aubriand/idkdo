import webpush from 'web-push'
import { prisma } from '@/app/lib/prisma'

// Configure VAPID (idempotent if called multiple times)
webpush.setVapidDetails(
  'mailto:aubrian.duhayon@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type PushPayload = {
  title: string
  body: string
  icon?: string
  data?: Record<string, unknown>
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!userIds.length) return { success: true, sent: 0, failed: 0 }
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } })
  if (subs.length === 0) return { success: true, sent: 0, failed: 0 }

  const json = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/IDKDO@192.webp',
    data: payload.data ?? {},
  })

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, json)
        .catch(async (err: { statusCode?: number }) => {
          const status = err?.statusCode
          if (status === 404 || status === 410) {
            await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {})
          }
          throw err
        })
    )
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  const sent = results.length - failed
  return { success: failed === 0, sent, failed }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  return sendPushToUsers([userId], payload)
}
