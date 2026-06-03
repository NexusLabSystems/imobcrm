import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BiCharts from '@/components/BiCharts'

const PERIODS: Record<string, number> = { '7': 7, '30': 30, '90': 90, '365': 365 }

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default async function BiPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { profile } = await requireRole(['admin', 'manager'])
  const tenantId = profile.tenantId

  const { period: periodParam } = await searchParams
  const days = PERIODS[periodParam ?? '30'] ?? 30
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // ── Queries paralelas ──────────────────────────────────────────────────────

  const [
    totalLeads,
    newLeads,
    convertedLeads,
    leadsPerDay,
    funnelStages,
    brokerPerformance,
    proposalsByStatus,
  ] = await Promise.all([
    // Total
    prisma.lead.count({ where: { tenantId, deletedAt: null } }),

    // Novos no período
    prisma.lead.count({ where: { tenantId, deletedAt: null, createdAt: { gte: startDate } } }),

    // Convertidos no período
    prisma.lead.count({ where: { tenantId, deletedAt: null, status: 'converted', updatedAt: { gte: startDate } } }),

    // Leads por dia (série temporal)
    prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', created_at) AS date, COUNT(*) AS count
      FROM public.leads
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND created_at >= ${startDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `,

    // Funil de conversão (funil padrão)
    prisma.funnelStage.findMany({
      where: { funnel: { tenantId, isDefault: true, deletedAt: null } },
      orderBy: { order: 'asc' },
      select: {
        name: true,
        color: true,
        probabilityWeight: true,
        _count: {
          select: {
            leads: { where: { deletedAt: null, status: { notIn: ['lost', 'discarded'] } } },
          },
        },
      },
    }),

    // Performance por corretor
    prisma.user.findMany({
      where: { tenantId, role: { in: ['broker', 'coordinator'] }, isActive: true },
      select: {
        id: true,
        name: true,
        assignedLeads: {
          where: { deletedAt: null },
          select: { id: true, status: true, createdAt: true },
        },
        activities: {
          where: { createdAt: { gte: startDate } },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    }),

    // Propostas por status
    prisma.proposal.groupBy({
      by: ['status'],
      where: { tenantId, deletedAt: null, createdAt: { gte: startDate } },
      _count: true,
      _sum: { proposedValue: true },
    }),
  ])

  // ── Processamento ──────────────────────────────────────────────────────────

  const conversionRate = newLeads > 0 ? ((convertedLeads / newLeads) * 100).toFixed(1) : '0'

  // Série de leads por dia (preenche dias sem lead com 0)
  const dayMap = new Map(leadsPerDay.map((r) => [r.date.toISOString().slice(0, 10), Number(r.count)]))
  const series: Array<{ label: string; value: number }> = []
  for (let i = 0; i < Math.min(days, 60); i++) {
    const d = new Date(Date.now() - (Math.min(days, 60) - 1 - i) * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const label = days <= 30
      ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : d.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })
    series.push({ label, value: dayMap.get(key) ?? 0 })
  }

  // Funil
  const maxFunnelCount = Math.max(1, ...funnelStages.map((s) => s._count.leads))
  const funnelData = funnelStages.map((s) => ({
    name: s.name,
    color: s.color,
    count: s._count.leads,
    pct: Math.round((s._count.leads / maxFunnelCount) * 100),
    probability: s.probabilityWeight,
  }))

  // Performance
  const perfData = brokerPerformance.map((b) => {
    const leadsInPeriod = b.assignedLeads.filter((l) => l.createdAt >= startDate).length
    const converted = b.assignedLeads.filter((l) => l.status === 'converted').length
    return {
      name: b.name,
      total: b.assignedLeads.length,
      inPeriod: leadsInPeriod,
      activities: b.activities.length,
      converted,
      rate: b.assignedLeads.length > 0 ? ((converted / b.assignedLeads.length) * 100).toFixed(1) : '0',
    }
  }).sort((a, b) => b.inPeriod - a.inPeriod)

  // Propostas
  const PROPOSAL_STATUS_LABEL: Record<string, string> = {
    draft: 'Rascunho', pending_approval: 'Aguardando', approved: 'Aprovada',
    rejected: 'Rejeitada', expired: 'Expirada', converted: 'Convertida',
  }
  const propData = proposalsByStatus.map((p) => ({
    status: PROPOSAL_STATUS_LABEL[p.status] ?? p.status,
    count: p._count,
    value: Number(p._sum.proposedValue ?? 0),
  }))

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
      {/* Header + período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">BI — Inteligência de vendas</h1>
          <p className="text-sm text-slate-500">Dados dos últimos {days} dias</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['365', '1 ano']].map(([val, label]) => (
            <a key={val} href={`/admin/bi?period=${val}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                String(days) === val ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total de leads', value: totalLeads },
          { label: `Novos (${days}d)`, value: newLeads },
          { label: `Convertidos (${days}d)`, value: convertedLeads },
          { label: 'Taxa de conversão', value: `${conversionRate}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">{k.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos (Client Component) */}
      <BiCharts
        series={series}
        funnelData={funnelData}
        days={days}
      />

      {/* Performance por corretor */}
      {perfData.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Performance por corretor</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="pb-2 pr-4">Corretor</th>
                  <th className="pb-2 pr-4 text-right">Leads ({days}d)</th>
                  <th className="pb-2 pr-4 text-right">Total</th>
                  <th className="pb-2 pr-4 text-right">Atividades</th>
                  <th className="pb-2 pr-4 text-right">Convertidos</th>
                  <th className="pb-2 text-right">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {perfData.map((b) => (
                  <tr key={b.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-900">{b.name}</td>
                    <td className="py-2 pr-4 text-right text-slate-700">{b.inPeriod}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{b.total}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{b.activities}</td>
                    <td className="py-2 pr-4 text-right text-slate-700">{b.converted}</td>
                    <td className="py-2 text-right">
                      <span className={`font-semibold ${
                        Number(b.rate) >= 20 ? 'text-green-600' :
                        Number(b.rate) >= 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{b.rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Propostas por status */}
      {propData.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Propostas no período</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4 text-right">Quantidade</th>
                  <th className="pb-2 text-right">Valor total</th>
                </tr>
              </thead>
              <tbody>
                {propData.map((p) => (
                  <tr key={p.status} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-slate-700">{p.status}</td>
                    <td className="py-2 pr-4 text-right text-slate-700">{p.count}</td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {p.value > 0 ? fmt(p.value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exportações */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Exportar dados</h2>
        <div className="flex flex-wrap gap-3">
          <a href={`/api/export/leads?period=${days}`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            ↓ Leads CSV
          </a>
          <a href={`/api/export/proposals?period=${days}`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            ↓ Propostas CSV
          </a>
          <a href={`/api/export/activities?period=${days}`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            ↓ Atividades CSV
          </a>
        </div>
      </div>
    </main>
  )
}
