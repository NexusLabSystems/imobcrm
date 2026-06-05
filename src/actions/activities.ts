'use server'

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateLeadScore } from '@/lib/leadScore'
import type { ActivityType } from '@prisma/client'

export async function createActivity(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const type = (formData.get('type') as ActivityType) || 'note'
  const description = (formData.get('description') as string)?.trim()

  if (!description) throw new Error('Descrição é obrigatória')

  await prisma.activity.create({
    data: {
      tenantId: profile.tenantId,
      leadId,
      userId: profile.id,
      type,
      description,
    },
  })

  recalculateLeadScore(leadId).catch(() => {})
  revalidatePath(`/leads/${leadId}`)
}

export async function createScheduledActivity(formData: FormData) {
  const { profile } = await getProfile()

  const leadId      = (formData.get('leadId') as string) || null
  const type        = (formData.get('type') as ActivityType) || 'call'
  const description = (formData.get('description') as string)?.trim()
  const scheduledAt = formData.get('scheduledAt') as string

  if (!description)  throw new Error('Descrição é obrigatória')
  if (!scheduledAt)  throw new Error('Data/hora é obrigatória')

  await prisma.activity.create({
    data: {
      tenantId:    profile.tenantId,
      leadId,
      userId:      profile.id,
      type,
      description,
      scheduledAt: new Date(scheduledAt),
    },
  })

  if (leadId) revalidatePath(`/leads/${leadId}`)
  revalidatePath('/agenda')
}

export async function completeActivity(formData: FormData) {
  const { profile } = await getProfile()

  const activityId = formData.get('activityId') as string

  const act = await prisma.activity.findFirst({
    where: { id: activityId, tenantId: profile.tenantId },
    select: { leadId: true },
  })
  if (!act) throw new Error('Atividade não encontrada')

  await prisma.activity.update({
    where: { id: activityId },
    data: { completedAt: new Date() },
  })

  if (act.leadId) revalidatePath(`/leads/${act.leadId}`)
  revalidatePath('/agenda')
}
