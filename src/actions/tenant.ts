'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function updateTenantSettings(input: {
  name: string
  document: string
  logoUrl: string | null
  approvalThreshold: string
}) {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { settings: true },
  })
  const current = (tenant?.settings ?? {}) as Record<string, string>

  await prisma.tenant.update({
    where: { id: profile.tenantId },
    data: {
      name: input.name.trim(),
      document: input.document.trim() || null,
      logoUrl: input.logoUrl,
      settings: {
        ...current,
        approvalThreshold: input.approvalThreshold || '',
      },
    },
  })

  revalidatePath('/admin/settings')
}
