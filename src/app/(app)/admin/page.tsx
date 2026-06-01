import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { LeadStatus } from '@prisma/client'

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novo',
  in_progress: 'Em andamento',
  qualified: 'Qualificado',
  converted: 'Convertido',
  lost: 'Perdido',
  discarded: 'Descartado',
}

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  qualified: 'bg-purple-500',
  converted: 'bg-green-500',
  lost: 'bg-red-500',
  discarded: 'bg-slate-400',
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export default async function AdminPage() {
  const { profile } = await requireRole(['admin', 'manager'])
  const tenantId = profile.tenantId

  const [
    totalLeads,
    leadsByStatus,
    pendingProposals,
    activeReservations,
    unitCounts,
  ] = await Promise.all([
    prisma.lead.count({ where: { tenantId, deletedAt: null } }),
    prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.proposal.count({ where: { tenantId, status: 'pending_approval', deletedAt: null } }),
    prisma.reservation.count({ where: { tenantId, status: 'active' } }),
    prisma.unit.groupBy({
      by: ['status'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
  ])

  const converted = leadsByStatus.find((l) => l.status === 'converted')?._count ?? 0
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0'

  const available = unitCounts.find((u) => u.status === 'available')?._count ?? 0
  const reserved = unitCounts.find((u) => u.status === 'reserved')?._count ?? 0
  const sold = unitCounts.find((u) => u.status === 'sold')?._count ?? 0

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Painel Administrativo</h1>
      <p className="mt-0.5 text-sm text-slate-500 capitalize">{profile.name} · {profile.role}</p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total de leads" value={totalLeads} />
        <KpiCard label="Taxa de conversão" value={`${conversionRate}%`} sub={`${converted} convertidos`} />
        <KpiCard label="Propostas pendentes" value={pendingProposals} />
        <KpiCard label="Reservas ativas" value={activeReservations} />
        <KpiCard label="Unidades disponíveis" value={available} sub={`${reserved} res. · ${sold} vend.`} />
      </div>

      {/* Leads por status */}
      <div className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-medium text-slate-900">Leads por status</h2>
        <div className="space-y-2">
          {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => {
            const count = leadsByStatus.find((l) => l.status === s)?._count ?? 0
            const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-slate-600">{STATUS_LABEL[s]}</span>
                <div className="flex-1 rounded-full bg-slate-100 h-2">
                  <div
                    className={`h-2 rounded-full ${STATUS_COLOR[s]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium text-slate-700">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Unidades */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{available}</p>
          <p className="text-sm text-slate-500">Disponíveis</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{reserved}</p>
          <p className="text-sm text-slate-500">Reservadas</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{sold}</p>
          <p className="text-sm text-slate-500">Vendidas</p>
        </div>
      </div>
    </main>
  )
}
