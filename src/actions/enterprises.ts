'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { EnterpriseType, EnterpriseStatus } from '@prisma/client'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createEnterprise(input: {
  name: string
  type: EnterpriseType
  description: string
  coverImageUrl: string | null
}) {
  const { profile } = await requireRole(['admin', 'manager'])

  await prisma.enterprise.create({
    data: {
      tenantId: profile.tenantId,
      name: input.name.trim(),
      slug: toSlug(input.name),
      type: input.type,
      description: input.description || null,
      coverImageUrl: input.coverImageUrl,
    },
  })

  redirect('/enterprises')
}

export async function setMapImage(enterpriseId: string, mapImageUrl: string | null) {
  const { profile } = await requireRole(['admin', 'manager'])
  await prisma.enterprise.update({
    where: { id: enterpriseId, tenantId: profile.tenantId },
    data: { mapImageUrl },
  })
  revalidatePath(`/enterprises/${enterpriseId}/map`)
}

export async function updateEnterpriseStatus(formData: FormData) {
  await requireRole(['admin', 'manager'])
  const { profile } = await getProfile()

  await prisma.enterprise.update({
    where: {
      id: formData.get('enterpriseId') as string,
      tenantId: profile.tenantId,
    },
    data: { status: formData.get('status') as EnterpriseStatus },
  })

  revalidatePath(`/enterprises/${formData.get('enterpriseId')}`)
}
