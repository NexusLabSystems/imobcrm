import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { approveProposal, rejectProposal, cancelReservation } from '@/actions/proposals'
import type { ProposalStatus, ReservationStatus } from '@prisma/client'

const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  expired: 'Expirada',
  converted: 'Convertida',
}

const STATUS_COLOR: Record<ProposalStatus, string> = {
  draft: 'bg-slate-100 text-slate-500',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-400',
  converted: 'bg-emerald-100 text-emerald-700',
}

const RES_STATUS_LABEL: Record<ReservationStatus, string> = {
  active: 'Ativa',
  expired: 'Expirada',
  cancelled: 'Cancelada',
  converted: 'Convertida',
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const proposal = await prisma.proposal.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    include: {
      lead: { select: { id: true, name: true } },
      unit: { select: { identifier: true } },
      enterprise: { select: { id: true, name: true } },
      reservations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!proposal) notFound()

  const reservation = proposal.reservations[0] ?? null
  const isPending = proposal.status === 'pending_approval'
  const isApproved = proposal.status === 'approved'

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-2 text-sm text-slate-500">
        <a href="/proposals" className="hover:underline">Propostas</a> ›{' '}
        {proposal.enterprise.name} · Unidade {proposal.unit.identifier}
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {proposal.enterprise.name} — Unidade {proposal.unit.identifier}
            </h1>
            {proposal.lead && (
              <p className="mt-0.5 text-sm text-slate-500">
                Lead:{' '}
                <a href={`/leads/${proposal.lead.id}`} className="underline hover:text-slate-900">
                  {proposal.lead.name}
                </a>
              </p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[proposal.status]}`}>
            {STATUS_LABEL[proposal.status]}
          </span>
        </div>

        {/* Detalhes financeiros */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Valor proposto</dt>
            <dd className="font-semibold text-slate-900">
              {Number(proposal.proposedValue).toLocaleString('pt-BR', {
                style: 'currency', currency: 'BRL',
              })}
            </dd>
          </div>
          {proposal.downPayment && (
            <div>
              <dt className="text-slate-500">Entrada</dt>
              <dd className="font-semibold text-slate-900">
                {Number(proposal.downPayment).toLocaleString('pt-BR', {
                  style: 'currency', currency: 'BRL',
                })}
              </dd>
            </div>
          )}
          {proposal.installments && (
            <div>
              <dt className="text-slate-500">Parcelas</dt>
              <dd className="font-medium text-slate-900">{proposal.installments}x</dd>
            </div>
          )}
          {proposal.financingType && (
            <div>
              <dt className="text-slate-500">Financiamento</dt>
              <dd className="font-medium capitalize text-slate-900">{proposal.financingType}</dd>
            </div>
          )}
        </dl>

        {proposal.notes && (
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            {proposal.notes}
          </div>
        )}

        {/* Reserva ativa */}
        {reservation && (
          <div className={`rounded-md p-3 text-sm ${
            reservation.status === 'active'
              ? 'bg-green-50 text-green-800'
              : 'bg-slate-50 text-slate-600'
          }`}>
            <p className="font-medium">
              Reserva: {RES_STATUS_LABEL[reservation.status]}
            </p>
            {reservation.status === 'active' && (
              <p className="mt-0.5">
                Expira em:{' '}
                {new Date(reservation.expiresAt).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}

        {/* Ações admin */}
        {isAdmin && isPending && (
          <div className="flex gap-3 pt-2">
            <form action={approveProposal}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button
                type="submit"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Aprovar e reservar unidade
              </button>
            </form>
            <form action={rejectProposal}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button
                type="submit"
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Rejeitar
              </button>
            </form>
          </div>
        )}

        {/* Cancelar reserva ativa */}
        {isAdmin && isApproved && reservation?.status === 'active' && (
          <form action={cancelReservation}>
            <input type="hidden" name="reservationId" value={reservation.id} />
            <input type="hidden" name="proposalId" value={proposal.id} />
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar reserva
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
