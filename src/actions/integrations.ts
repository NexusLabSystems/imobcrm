'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function saveFacebookSettings(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { settings: true },
  })

  const current = (tenant?.settings ?? {}) as Record<string, string>

  await prisma.tenant.update({
    where: { id: profile.tenantId },
    data: {
      settings: {
        ...current,
        facebookVerifyToken:     (formData.get('facebookVerifyToken') as string).trim(),
        facebookPageAccessToken: (formData.get('facebookPageAccessToken') as string).trim(),
      },
    },
  })

  revalidatePath('/admin/integrations')
}

export async function saveWhatsAppSettings(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { settings: true },
  })
  const current = (tenant?.settings ?? {}) as Record<string, string>

  await prisma.tenant.update({
    where: { id: profile.tenantId },
    data: {
      settings: {
        ...current,
        zapiInstanceId: (formData.get('zapiInstanceId') as string).trim(),
        zapiToken:      (formData.get('zapiToken') as string).trim(),
        zapiClientToken:(formData.get('zapiClientToken') as string).trim(),
      },
    },
  })

  revalidatePath('/admin/integrations')
}

export async function saveClickSignSettings(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { settings: true },
  })
  const current = (tenant?.settings ?? {}) as Record<string, string>

  await prisma.tenant.update({
    where: { id: profile.tenantId },
    data: {
      settings: {
        ...current,
        clicksignApiKey: (formData.get('clicksignApiKey') as string).trim(),
        clicksignEnv:    (formData.get('clicksignEnv') as string).trim(),
      },
    },
  })

  revalidatePath('/admin/integrations')
}

export async function saveErpSettings(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { settings: true },
  })
  const current = (tenant?.settings ?? {}) as Record<string, string>

  await prisma.tenant.update({
    where: { id: profile.tenantId },
    data: {
      settings: {
        ...current,
        erpType:       (formData.get('erpType') as string).trim(),
        erpApiUrl:     (formData.get('erpApiUrl') as string).trim(),
        erpApiKey:     (formData.get('erpApiKey') as string).trim(),
        erpWebhookKey: (formData.get('erpWebhookKey') as string).trim(),
      },
    },
  })

  revalidatePath('/admin/integrations')
}
