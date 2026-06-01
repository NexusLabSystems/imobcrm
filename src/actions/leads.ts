'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { LeadSource, LeadStatus } from '@prisma/client'
import { sendPushToAdmins } from '@/actions/push'

export async function createLead(formData: FormData) {
  const { profile } = await getProfile()

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nome é obrigatório')

  const lead = await prisma.lead.create({
    data: {
      tenantId: profile.tenantId,
      assignedTo: profile.role === 'broker' ? profile.id : null,
      name,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      source: (formData.get('source') as LeadSource) || 'manual',
    },
  })

  // Notifica admins/managers via push (sem bloquear o redirect)
  sendPushToAdmins(
    { title: 'Novo lead', body: `${name} foi cadastrado`, url: `/leads/${lead.id}` },
    profile.tenantId
  ).catch(() => {})

  redirect(`/leads/${lead.id}`)
}

export async function updateLeadStatus(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const status = formData.get('status') as LeadStatus

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { status },
  })

  revalidatePath(`/leads/${leadId}`)
}

export async function moveLeadToStage(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const stageId = (formData.get('stageId') as string) || null
  const funnelId = (formData.get('funnelId') as string) || null

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: {
      funnelStageId: stageId,
      funnelId: stageId ? funnelId : null,
      lastInteractionAt: new Date(),
    },
  })
  // Sem revalidatePath — o Realtime atualiza todos os clientes em tempo real.
}

export async function assignLead(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const assignedTo = (formData.get('assignedTo') as string) || null

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { assignedTo },
  })

  revalidatePath(`/leads/${leadId}`)
}
