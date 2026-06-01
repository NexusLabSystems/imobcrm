'use server'

import webpush from 'web-push'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function saveSubscription(subscriptionJson: string) {
  const { profile } = await getProfile()

  await prisma.user.update({
    where: { id: profile.id },
    data: { pushSubscription: JSON.parse(subscriptionJson) },
  })
}

export async function sendPushToAdmins(payload: {
  title: string
  body: string
  url?: string
}, tenantId: string) {
  const admins = await prisma.user.findMany({
    where: {
      tenantId,
      role: { in: ['admin', 'manager'] },
      isActive: true,
      pushSubscription: { not: { equals: 'JsonNull' } },
    },
    select: { pushSubscription: true },
  })

  const message = JSON.stringify(payload)

  await Promise.allSettled(
    admins.map((u) =>
      webpush.sendNotification(
        u.pushSubscription as unknown as webpush.PushSubscription,
        message
      )
    )
  )
}
