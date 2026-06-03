'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── Funis ─────────────────────────────────────────────────────────────────────

export async function createFunnel(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const name      = (formData.get('name') as string).trim()
  const isDefault = formData.get('isDefault') === 'true'

  if (!name) throw new Error('Nome é obrigatório')

  // Se marcar como padrão, remove padrão dos outros
  if (isDefault) {
    await prisma.funnel.updateMany({
      where: { tenantId: profile.tenantId, isDefault: true },
      data: { isDefault: false },
    })
  }

  const funnel = await prisma.funnel.create({
    data: {
      tenantId: profile.tenantId,
      name,
      isDefault,
    },
  })

  redirect(`/admin/funnels/${funnel.id}`)
}

export async function updateFunnel(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const funnelId  = formData.get('funnelId') as string
  const name      = (formData.get('name') as string).trim()
  const isDefault = formData.get('isDefault') === 'true'

  if (isDefault) {
    await prisma.funnel.updateMany({
      where: { tenantId: profile.tenantId, isDefault: true, NOT: { id: funnelId } },
      data: { isDefault: false },
    })
  }

  await prisma.funnel.update({
    where: { id: funnelId, tenantId: profile.tenantId },
    data: { name, isDefault },
  })

  revalidatePath('/admin/funnels')
  revalidatePath(`/admin/funnels/${funnelId}`)
}

export async function deleteFunnel(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])
  const funnelId = formData.get('funnelId') as string

  const leadsCount = await prisma.lead.count({ where: { funnelId } })
  if (leadsCount > 0) throw new Error('Remova os leads deste funil antes de excluí-lo')

  await prisma.funnel.update({
    where: { id: funnelId, tenantId: profile.tenantId },
    data: { deletedAt: new Date() },
  })

  redirect('/admin/funnels')
}

// ── Etapas ─────────────────────────────────────────────────────────────────────

export async function createStage(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const funnelId          = formData.get('funnelId') as string
  const name              = (formData.get('name') as string).trim()
  const color             = (formData.get('color') as string) || '#1B3A5C'
  const probabilityWeight = Number(formData.get('probabilityWeight')) || 0
  const maxDays           = formData.get('maxDays') ? Number(formData.get('maxDays')) : null

  // Próxima ordem
  const last = await prisma.funnelStage.findFirst({
    where: { funnelId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  await prisma.funnelStage.create({
    data: {
      funnelId,
      name,
      color,
      order: (last?.order ?? 0) + 1,
      probabilityWeight,
      maxDays,
      requiredFields: [],
    },
  })

  revalidatePath(`/admin/funnels/${funnelId}`)
}

export async function updateStage(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const stageId           = formData.get('stageId') as string
  const funnelId          = formData.get('funnelId') as string
  const name              = (formData.get('name') as string).trim()
  const color             = (formData.get('color') as string) || '#1B3A5C'
  const probabilityWeight = Number(formData.get('probabilityWeight')) || 0
  const maxDays           = formData.get('maxDays') ? Number(formData.get('maxDays')) : null

  await prisma.funnelStage.update({
    where: { id: stageId },
    data: { name, color, probabilityWeight, maxDays },
  })

  revalidatePath(`/admin/funnels/${funnelId}`)
}

export async function deleteStage(formData: FormData) {
  await requireRole(['admin', 'manager'])

  const stageId  = formData.get('stageId') as string
  const funnelId = formData.get('funnelId') as string

  const leadsCount = await prisma.lead.count({ where: { funnelStageId: stageId } })
  if (leadsCount > 0) throw new Error('Mova os leads desta etapa antes de excluí-la')

  await prisma.funnelStage.delete({ where: { id: stageId } })

  revalidatePath(`/admin/funnels/${funnelId}`)
}

export async function moveStageOrder(formData: FormData) {
  await requireRole(['admin', 'manager'])

  const stageId  = formData.get('stageId') as string
  const funnelId = formData.get('funnelId') as string
  const direction = formData.get('direction') as 'up' | 'down'

  const stages = await prisma.funnelStage.findMany({
    where: { funnelId },
    orderBy: { order: 'asc' },
    select: { id: true, order: true },
  })

  const idx = stages.findIndex((s) => s.id === stageId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= stages.length) return

  await prisma.$transaction([
    prisma.funnelStage.update({ where: { id: stages[idx].id }, data: { order: stages[swapIdx].order } }),
    prisma.funnelStage.update({ where: { id: stages[swapIdx].id }, data: { order: stages[idx].order } }),
  ])

  revalidatePath(`/admin/funnels/${funnelId}`)
}
