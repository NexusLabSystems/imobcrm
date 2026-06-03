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
