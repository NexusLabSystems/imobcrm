'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const RESERVATION_HOURS = 24

export async function createProposal(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const unitId = formData.get('unitId') as string
  const enterpriseId = formData.get('enterpriseId') as string
  const proposedValue = Number(formData.get('proposedValue'))
  const downPayment = formData.get('downPayment') ? Number(formData.get('downPayment')) : null
  const installments = formData.get('installments') ? Number(formData.get('installments')) : null
  const financingType = (formData.get('financingType') as string) || null
  const notes = (formData.get('notes') as string) || null

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
    },
  })

  redirect(`/proposals/${proposal.id}`)
}

export async function approveProposal(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const proposalId = formData.get('proposalId') as string

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, tenantId: profile.tenantId },
    select: { id: true, unitId: true, leadId: true },
  })
  if (!proposal) throw new Error('Proposta não encontrada')

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
      data: {
        status: 'reserved',
        reservedBy: profile.id,
        reservedUntil: expiresAt,
      },
    }),
  ])

  revalidatePath(`/proposals/${proposalId}`)
}

export async function rejectProposal(formData: FormData) {
  await requireRole(['admin', 'manager'])
  const { profile } = await getProfile()

  const proposalId = formData.get('proposalId') as string

  await prisma.proposal.update({
    where: { id: proposalId, tenantId: profile.tenantId },
    data: { status: 'rejected', approverId: profile.id },
  })

  revalidatePath(`/proposals/${proposalId}`)
}

export async function cancelReservation(formData: FormData) {
  const { profile } = await getProfile()

  const reservationId = formData.get('reservationId') as string
  const proposalId = formData.get('proposalId') as string

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId: profile.tenantId },
    select: { unitId: true },
  })
  if (!reservation) throw new Error('Reserva não encontrada')

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    }),
    prisma.unit.update({
      where: { id: reservation.unitId },
      data: { status: 'available', reservedBy: null, reservedUntil: null },
    }),
  ])

  revalidatePath(`/proposals/${proposalId}`)
}
