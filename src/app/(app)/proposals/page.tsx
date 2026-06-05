import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ProposalStatus } from '@prisma/client'

const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: 'Rascunho', pending_approval: 'Aguard. aprovação', approved: 'Aprovada',
  rejected: 'Rejeitada', expired: 'Expirada', converted: 'Convertida',
}

const STATUS_BADGE: Record<ProposalStatus, string> = {
  draft:            'bg-slate-100 text-slate-500 ring-slate-200',
  pending_approval: 'bg-amber-100 text-amber-700 ring-amber-200',
  approved:         'bg-emerald-100 text-emerald-700 ring-emerald-200',
  rejected:         'bg-rose-100 text-rose-700 ring-rose-200',
  expired:          'bg-slate-100 text-slate-400 ring-slate-200',
  converted:        'bg-blue-100 text-blue-700 ring-blue-200',
}

function IcoPlus() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

export default async function ProposalsPage() {
  const { profile } = await getProfile()
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const proposals = await prisma.proposal.findMany({
    where: { tenantId: profile.tenantId, deletedAt: null },
    include: {
      lead:       { select: { name: true } },
      unit:       { select: { identifier: true } },
      enterprise: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = proposals.filter((p) => p.status === 'pending_approval')

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Propostas</h1>
          <p className="mt-0.5 text-xs text-slate-400">{proposals.length} no total</p>
        </div>
        <Link
          href="/proposals/new"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
          <IcoPlus /> Nova proposta
        </Link>
      </div>

      {isAdmin && pending.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            {pending.length} proposta{pending.length > 1 ? 's' : ''} aguardando aprovação
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {proposals.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">Nenhuma proposta ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proposals.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/proposals/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {p.enterprise.name} — Unidade {p.unit.identifier}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {p.lead?.name ?? 'Sem lead'} ·{' '}
                      {Number(p.proposedValue).toLocaleString('pt-BR', {
                        style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_BADGE[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
