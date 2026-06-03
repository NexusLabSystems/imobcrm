'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const RESERVATION_HOURS = 24

// Nível 1: coordinator, manager, admin
// Nível 2: somente admin
const LEVEL_ROLES: Record<number, string[]> = {
  1: ['coordinator', 'manager', 'admin'],
  2: ['admin'],
}

async function getApprovalThreshold(tenantId: string): Promise<number | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })
  const settings = (tenant?.settings ?? {}) as Record<string, string>
  const val = settings.approvalThreshold
  return val ? Number(val) : null
}

export async function createProposal(formData: FormData) {
  const { profile } = await getProfile()

  const leadId      = formData.get('leadId') as string
  const unitId      = formData.get('unitId') as string
  const enterpriseId = formData.get('enterpriseId') as string
  const proposedValue = Number(formData.get('proposedValue'))
  const downPayment  = formData.get('downPayment') ? Number(formData.get('downPayment')) : null
  const installments = formData.get('installments') ? Number(formData.get('installments')) : null
  const financingType = (formData.get('financingType') as string) || null
  const notes       = (formData.get('notes') as string) || null

  if (!unitId || !enterpriseId || !proposedValue) throw new Error('Dados incompletos')

  const proposal = await prisma.proposal.create({
    data: {
      tenantId: profile.tenantId,
      leadId: leadId || null,
      unitId,
      enterpriseId,
      proposedValue,
      downPayment,
      installments,
      financingType,
      notes,
      status: 'pending_approval',
      approvalLevel: 1,
    },
  })

  redirect(`/proposals/${proposal.id}`)
}

export async function approveProposal(formData: FormData) {
  const { profile } = await getProfile()

  const proposalId = formData.get('proposalId') as string
  const note       = (formData.get('note') as string) || null

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, tenantId: profile.tenantId, status: 'pending_approval' },
    select: { id: true, unitId: true, proposedValue: true, approvalLevel: true },
  })
  if (!proposal) throw new Error('Proposta não encontrada ou já processada')

  const currentLevel = proposal.approvalLevel
  const allowedRoles = LEVEL_ROLES[currentLevel] ?? ['admin']

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(`Nível ${currentLevel} requer role: ${allowedRoles.join(' ou ')}`)
  }

  // Grava o registro desta aprovação
  await prisma.proposalApproval.create({
    data: {
      tenantId: profile.tenantId,
      proposalId,
      level: currentLevel,
      action: 'approved',
      userId: profile.id,
      note,
    },
  })

  // Decide próximo passo
  const threshold = await getApprovalThreshold(profile.tenantId)
  const value = Number(proposal.proposedValue)
  const needsLevel2 = currentLevel === 1 && threshold !== null && value >= threshold

  if (needsLevel2) {
    // Avança para nível 2
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { approvalLevel: 2, approverId: profile.id },
    })
  } else {
    // Aprovação final: cria reserva
    const expiresAt = new Date(Date.now() + RESERVATION_HOURS * 60 * 60 * 1000)
    await prisma.$transaction([
      prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'approved', approverId: profile.id },
      }),
      prisma.reservation.create({
        data: {
          tenantId: profile.tenantId,
          unitId: proposal.unitId,
          proposalId,
          brokerId: profile.id,
          expiresAt,
          status: 'active',
        },
      }),
      prisma.unit.update({
        where: { id: proposal.unitId },
        data: { status: 'reserved', reservedBy: profile.id, reservedUntil: expiresAt },
      }),
    ])
  }

  revalidatePath(`/proposals/${proposalId}`)
}

export async function rejectProposal(formData: FormData) {
  const { profile } = await getProfile()

  const proposalId = formData.get('proposalId') as string
  const note       = (formData.get('note') as string) || null

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, tenantId: profile.tenantId, status: 'pending_approval' },
    select: { approvalLevel: true },
  })
  if (!proposal) throw new Error('Proposta não encontrada ou já processada')

  const allowedRoles = LEVEL_ROLES[proposal.approvalLevel] ?? ['admin']
  if (!allowedRoles.includes(profile.role)) {
    throw new Error('Você não tem permissão para rejeitar neste nível')
  }

  await prisma.proposalApproval.create({
    data: {
      tenantId: profile.tenantId,
      proposalId,
      level: proposal.approvalLevel,
      action: 'rejected',
      userId: profile.id,
      note,
    },
  })

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: 'rejected', approverId: profile.id },
  })

  revalidatePath(`/proposals/${proposalId}`)
}

export async function cancelReservation(formData: FormData) {
  const { profile } = await getProfile()

  const reservationId = formData.get('reservationId') as string
  const proposalId    = formData.get('proposalId') as string
  const reason        = (formData.get('cancelReason') as string)?.trim()

  if (!reason) throw new Error('Informe o motivo do cancelamento')

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId: profile.tenantId, status: 'active' },
    select: { unitId: true },
  })
  if (!reservation) throw new Error('Reserva não encontrada ou já encerrada')

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason,
        cancelledBy: profile.id,
      },
    }),
    prisma.unit.update({
      where: { id: reservation.unitId },
      data: { status: 'available', reservedBy: null, reservedUntil: null },
    }),
  ])

  revalidatePath(`/proposals/${proposalId}`)
}

const RENEWAL_HOURS: Record<string, number> = {
  '24h': 24, '48h': 48, '72h': 72, '7d': 168,
}

export async function renewReservation(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const reservationId = formData.get('reservationId') as string
  const proposalId    = formData.get('proposalId') as string
  const duration      = formData.get('duration') as string

  const hours = RENEWAL_HOURS[duration]
  if (!hours) throw new Error('Duração inválida')

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId: profile.tenantId, status: 'active' },
    select: { unitId: true, expiresAt: true, renewalCount: true },
  })
  if (!reservation) throw new Error('Reserva não encontrada ou não está ativa')

  // Renova a partir de agora (ou do expiresAt atual se ainda não expirou)
  const base = reservation.expiresAt > new Date() ? reservation.expiresAt : new Date()
  const newExpiresAt = new Date(base.getTime() + hours * 60 * 60 * 1000)

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        expiresAt: newExpiresAt,
        renewedAt: new Date(),
        renewedBy: profile.id,
        renewalCount: { increment: 1 },
      },
    }),
    prisma.unit.update({
      where: { id: reservation.unitId },
      data: { reservedUntil: newExpiresAt },
    }),
  ])

  revalidatePath(`/proposals/${proposalId}`)
}
