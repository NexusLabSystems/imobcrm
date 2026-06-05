'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function createLeadQueue(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const name         = (formData.get('name') as string).trim()
  const strategy     = (formData.get('strategy') as string) || 'round_robin'
  const enterpriseId = (formData.get('enterpriseId') as string) || null
  const sources      = formData.getAll('sources') as string[]
  const memberIds    = formData.getAll('memberIds') as string[]

  if (!name) throw new Error('Nome é obrigatório')
  if (memberIds.length === 0) throw new Error('Adicione ao menos um corretor')

  await db.leadQueue.create({
    data: {
      tenantId: profile.tenantId,
      name,
      strategy,
      enterpriseId,
      sources,
      memberIds,
    },
  })

  revalidatePath('/admin/filas')
  redirect('/admin/filas')
}

export async function updateLeadQueue(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const id           = formData.get('id') as string
  const name         = (formData.get('name') as string).trim()
  const isActive     = formData.get('isActive') === 'true'
  const memberIds    = formData.getAll('memberIds') as string[]
  const sources      = formData.getAll('sources') as string[]

  await db.leadQueue.update({
    where: { id, tenantId: profile.tenantId },
    data: { name, isActive, memberIds, sources },
  })

  revalidatePath('/admin/filas')
}

export async function deleteLeadQueue(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const id = formData.get('id') as string

  await db.leadQueue.delete({
    where: { id, tenantId: profile.tenantId },
  })

  revalidatePath('/admin/filas')
  redirect('/admin/filas')
}

// Retorna o próximo usuário da fila (round-robin) e avança o índice
export async function pickNextFromQueue(queueId: string): Promise<string | null> {
  const queue = await db.leadQueue.findUnique({ where: { id: queueId } })
  if (!queue || !queue.isActive || queue.memberIds.length === 0) return null

  const idx  = queue.lastPickIdx % queue.memberIds.length
  const next = queue.memberIds[idx]

  await db.leadQueue.update({
    where: { id: queueId },
    data: { lastPickIdx: idx + 1 },
  })

  return next
}

// Encontra a fila adequada para uma origem/empreendimento e retorna o próximo userId
export async function resolveQueueAssignment(
  tenantId: string,
  source: string,
  enterpriseId: string | null
): Promise<string | null> {
  const queues = await db.leadQueue.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  if (queues.length === 0) return null

  // Prioridade: fila que filtra por empreendimento + source > source > empreendimento > qualquer
  const match =
    queues.find((q: { enterpriseId: string | null; sources: string[] }) => q.enterpriseId === enterpriseId && q.sources.includes(source)) ??
    queues.find((q: { enterpriseId: string | null; sources: string[] }) => q.enterpriseId === null && q.sources.includes(source)) ??
    queues.find((q: { enterpriseId: string | null; sources: string[] }) => q.enterpriseId === enterpriseId && q.sources.length === 0) ??
    queues.find((q: { enterpriseId: string | null; sources: string[] }) => q.enterpriseId === null && q.sources.length === 0)

  if (!match) return null
  return pickNextFromQueue(match.id)
}
