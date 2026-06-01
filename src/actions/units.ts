'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { UnitStatus } from '@prisma/client'

export async function setUnitMapPosition(unitId: string, x: number, y: number) {
  const { profile } = await requireRole(['admin', 'manager'])
  await prisma.unit.update({
    where: { id: unitId, tenantId: profile.tenantId },
    data: { mapX: x, mapY: y },
  })
}

export async function removeUnitMapPosition(unitId: string) {
  const { profile } = await requireRole(['admin', 'manager'])
  await prisma.unit.update({
    where: { id: unitId, tenantId: profile.tenantId },
    data: { mapX: null, mapY: null },
  })
}

export async function updateUnitPrice(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const unitId = formData.get('unitId') as string
  const enterpriseId = formData.get('enterpriseId') as string
  const price = Number(formData.get('price'))
  const note = (formData.get('note') as string) || null

  if (!price || price <= 0) throw new Error('Preço inválido')

  await prisma.$transaction([
    prisma.unit.update({
      where: { id: unitId, tenantId: profile.tenantId },
      data: { currentPrice: price },
    }),
    prisma.unitPriceHistory.create({
      data: {
        tenantId: profile.tenantId,
        unitId,
        price,
        changedBy: profile.id,
        note,
      },
    }),
  ])

  revalidatePath(`/enterprises/${enterpriseId}`)
}

export async function createUnit(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const enterpriseId = formData.get('enterpriseId') as string

  await prisma.unit.create({
    data: {
      tenantId: profile.tenantId,
      enterpriseId,
      identifier: (formData.get('identifier') as string).trim(),
      typology: (formData.get('typology') as string) || null,
      floor: formData.get('floor') ? Number(formData.get('floor')) : null,
      bedrooms: formData.get('bedrooms') ? Number(formData.get('bedrooms')) : null,
      areaPrivate: formData.get('areaPrivate') ? Number(formData.get('areaPrivate')) : null,
      currentPrice: formData.get('currentPrice') ? Number(formData.get('currentPrice')) : null,
      status: 'available',
    },
  })

  redirect(`/enterprises/${enterpriseId}`)
}

export async function updateUnitStatus(formData: FormData) {
  const { profile } = await getProfile()

  const unitId = formData.get('unitId') as string
  const enterpriseId = formData.get('enterpriseId') as string

  await prisma.unit.update({
    where: { id: unitId, tenantId: profile.tenantId },
    data: { status: formData.get('status') as UnitStatus },
  })

  revalidatePath(`/enterprises/${enterpriseId}`)
}
