import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ProposalStatus } from '@prisma/client'

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

export default async function ProposalsPage() {
  const { profile } = await getProfile()
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const proposals = await prisma.proposal.findMany({
    where: { tenantId: profile.tenantId, deletedAt: null },
    include: {
      lead: { select: { name: true } },
      unit: { select: { identifier: true } },
      enterprise: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = proposals.filter((p) => p.status === 'pending_approval')

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Propostas</h1>

      {isAdmin && pending.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-800">
            {pending.length} proposta{pending.length > 1 ? 's' : ''} aguardando aprovação
          </p>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {proposals.length === 0 && (
          <li className="py-12 text-center text-sm text-slate-400">
            Nenhuma proposta ainda.
          </li>
        )}
        {proposals.map((p) => (
          <li key={p.id}>
            <Link
              href={`/proposals/${p.id}`}
              className="flex items-center justify-between rounded-lg border bg-white p-4 hover:shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {p.enterprise.name} — Unidade {p.unit.identifier}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {p.lead?.name ?? 'Sem lead'} ·{' '}
                  {Number(p.proposedValue).toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <span className={`ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}>
                {STATUS_LABEL[p.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
