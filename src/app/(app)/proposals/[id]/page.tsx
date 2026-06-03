import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { approveProposal, rejectProposal, cancelReservation, renewReservation } from '@/actions/proposals'
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
  active: 'Ativa', expired: 'Expirada', cancelled: 'Cancelada', converted: 'Convertida',
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Nível 1 — Gerência',
  2: 'Nível 2 — Diretoria',
}

const LEVEL_ROLES: Record<number, string[]> = {
  1: ['coordinator', 'manager', 'admin'],
  2: ['admin'],
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params

  const [proposal, tenant] = await Promise.all([
    prisma.proposal.findFirst({
      where: { id, tenantId: profile.tenantId, deletedAt: null },
      include: {
        lead: { select: { id: true, name: true } },
        unit: { select: { identifier: true, typology: true, floor: true, areaPrivate: true, bedrooms: true } },
        enterprise: { select: { id: true, name: true } },
        reservations: { orderBy: { createdAt: 'desc' }, take: 1 },
        approvals: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true, role: true } } },
        },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: profile.tenantId },
      select: { settings: true },
    }),
  ])

  if (!proposal) notFound()

  const settings = (tenant?.settings ?? {}) as Record<string, string>
  const threshold = settings.approvalThreshold ? Number(settings.approvalThreshold) : null
  const value = Number(proposal.proposedValue)
  const maxLevel = threshold && value >= threshold ? 2 : 1

  const reservation = proposal.reservations[0] ?? null
  const isPending = proposal.status === 'pending_approval'
  const isApproved = proposal.status === 'approved'
  const currentLevel = proposal.approvalLevel

  const canActOnLevel = LEVEL_ROLES[currentLevel]?.includes(profile.role) ?? false

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <a href="/proposals" className="hover:underline">Propostas</a> ›{' '}
          {proposal.enterprise.name} · Unidade {proposal.unit.identifier}
        </p>
        <a
          href={`/api/proposals/${proposal.id}/pdf`}
          target="_blank"
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ↓ Baixar PDF
        </a>
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

        {/* Indicador de alçada atual */}
        {isPending && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  {LEVEL_LABEL[currentLevel] ?? `Nível ${currentLevel}`}
                </p>
                <p className="mt-0.5 text-xs text-yellow-700">
                  {maxLevel > 1
                    ? `Esta proposta requer ${maxLevel} aprovações (valor ≥ ${threshold?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })})`
                    : 'Aprovação única necessária'}
                </p>
              </div>
              {/* Progresso dos níveis */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map((lvl) => (
                  <div key={lvl} className="flex items-center gap-1">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      proposal.approvals.some((a) => a.level === lvl && a.action === 'approved')
                        ? 'bg-green-500 text-white'
                        : lvl === currentLevel
                        ? 'bg-yellow-400 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {lvl}
                    </span>
                    {lvl < maxLevel && <div className="h-0.5 w-4 bg-slate-200" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detalhes financeiros */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Valor proposto</dt>
            <dd className="font-semibold text-slate-900">
              {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </dd>
          </div>
          {proposal.downPayment && (
            <div>
              <dt className="text-slate-500">Entrada</dt>
              <dd className="font-semibold text-slate-900">
                {Number(proposal.downPayment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{proposal.notes}</div>
        )}

        {/* Histórico de aprovações */}
        {proposal.approvals.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-slate-700">Histórico de aprovações</h2>
            <ol className="space-y-2">
              {proposal.approvals.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    a.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {a.action === 'approved' ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{a.user.name}</span>
                      {' '}
                      <span className="text-slate-500">
                        {a.action === 'approved' ? 'aprovou' : 'rejeitou'} (Nível {a.level})
                      </span>
                    </p>
                    {a.note && <p className="text-xs text-slate-500 mt-0.5">{a.note}</p>}
                    <p className="text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Reserva */}
        {reservation && (
          <div className={`rounded-lg border p-4 text-sm ${
            reservation.status === 'active' ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Reserva: {RES_STATUS_LABEL[reservation.status]}
                </p>
                {reservation.status === 'active' && (
                  <>
                    <p className="mt-0.5 text-slate-600">
                      Expira em:{' '}
                      <span className="font-medium">
                        {new Date(reservation.expiresAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </p>
                    {reservation.renewalCount > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Renovada {reservation.renewalCount}x
                        {reservation.renewedAt && ` · última: ${new Date(reservation.renewedAt).toLocaleDateString('pt-BR')}`}
                      </p>
                    )}
                  </>
                )}
                {reservation.status === 'cancelled' && reservation.cancelReason && (
                  <p className="mt-0.5 text-slate-500">Motivo: {reservation.cancelReason}</p>
                )}
              </div>
            </div>

            {/* Ações na reserva ativa */}
            {reservation.status === 'active' && canActOnLevel && (
              <div className="mt-4 space-y-3 border-t border-green-200 pt-4">
                {/* Renovar */}
                <form action={renewReservation} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <span className="text-xs font-medium text-slate-600">Renovar por:</span>
                  {(['24h', '48h', '72h', '7d'] as const).map((d) => (
                    <button
                      key={d} name="duration" value={d} type="submit"
                      className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      {d === '7d' ? '7 dias' : d}
                    </button>
                  ))}
                </form>

                {/* Cancelar com motivo */}
                <form action={cancelReservation} className="space-y-2">
                  <input type="hidden" name="reservationId" value={reservation.id} />
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <input
                    name="cancelReason"
                    type="text"
                    required
                    placeholder="Motivo do cancelamento (obrigatório)"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Cancelar reserva
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Ações de aprovação */}
        {isPending && canActOnLevel && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-slate-700">
              Sua aprovação ({LEVEL_LABEL[currentLevel]}):
            </p>
            <div className="space-y-2">
              <textarea
                form="approve-form"
                name="note"
                rows={2}
                placeholder="Observação (opcional)"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="flex gap-3">
                <form id="approve-form" action={approveProposal}>
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    {currentLevel === maxLevel ? 'Aprovar e reservar unidade' : `Aprovar — avançar para Nível ${currentLevel + 1}`}
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
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
