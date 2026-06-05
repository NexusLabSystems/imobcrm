import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { LeadStatus } from '@prisma/client'

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novo', in_progress: 'Em andamento', qualified: 'Qualificado',
  converted: 'Convertido', lost: 'Perdido', discarded: 'Descartado',
}

const STATUS_BAR: Record<LeadStatus, string> = {
  new:        'bg-sky-400',
  in_progress:'bg-amber-400',
  qualified:  'bg-violet-500',
  converted:  'bg-emerald-500',
  lost:       'bg-rose-400',
  discarded:  'bg-slate-300',
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

const NAV_CARDS = [
  { href: '/admin/users',        title: 'Usuários',       sub: 'Convidar e gerenciar roles' },
  { href: '/admin/settings',     title: 'Configurações',  sub: 'Nome, CNPJ e logo' },
  { href: '/admin/integrations', title: 'Integrações',    sub: 'Facebook Lead Ads' },
  { href: '/admin/funnels',      title: 'Funis',          sub: 'Gerenciar funis e etapas' },
  { href: '/admin/bi',           title: 'BI',             sub: 'Gráficos, performance e exportação' },
]

export default async function AdminPage() {
  const { profile } = await requireRole(['admin', 'manager'])
  const tenantId = profile.tenantId

  const [
    totalLeads,
    leadsByStatus,
    pendingProposals,
    activeReservations,
    unitCounts,
    forecastStages,
  ] = await Promise.all([
    prisma.lead.count({ where: { tenantId, deletedAt: null } }),
    prisma.lead.groupBy({ by: ['status'], where: { tenantId, deletedAt: null }, _count: true }),
    prisma.proposal.count({ where: { tenantId, status: 'pending_approval', deletedAt: null } }),
    prisma.reservation.count({ where: { tenantId, status: 'active' } }),
    prisma.unit.groupBy({ by: ['status'], where: { tenantId, deletedAt: null }, _count: true }),
    prisma.funnelStage.findMany({
      where: { funnel: { tenantId, isDefault: true, deletedAt: null } },
      orderBy: { order: 'asc' },
      select: {
        name: true, color: true, probabilityWeight: true,
        leads: {
          where: { deletedAt: null, status: { notIn: ['lost', 'discarded', 'converted'] } },
          select: {
            proposals: {
              where: { deletedAt: null, status: { in: ['draft', 'pending_approval', 'approved'] } },
              select: { proposedValue: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    }),
  ])

  const converted = leadsByStatus.find((l) => l.status === 'converted')?._count ?? 0
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0'

  const available = unitCounts.find((u) => u.status === 'available')?._count ?? 0
  const reserved  = unitCounts.find((u) => u.status === 'reserved')?._count ?? 0
  const sold      = unitCounts.find((u) => u.status === 'sold')?._count ?? 0

  const forecast = forecastStages.map((stage) => {
    const totalValue = stage.leads.reduce((sum, lead) => {
      return sum + (lead.proposals[0]?.proposedValue ? Number(lead.proposals[0].proposedValue) : 0)
    }, 0)
    return {
      name: stage.name, color: stage.color, count: stage.leads.length,
      prob: stage.probabilityWeight,
      totalValue, weightedValue: totalValue * (stage.probabilityWeight / 100),
    }
  })
  const totalForecast = forecast.reduce((sum, s) => sum + s.weightedValue, 0)

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Painel Administrativo</h1>
        <p className="mt-0.5 text-xs text-slate-400 capitalize">{profile.name} · {profile.role}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total de leads"       value={totalLeads} />
        <KpiCard label="Taxa de conversão"    value={`${conversionRate}%`} sub={`${converted} convertidos`} />
        <KpiCard label="Propostas pendentes"  value={pendingProposals} />
        <KpiCard label="Reservas ativas"      value={activeReservations} />
        <KpiCard label="Unidades disponíveis" value={available} sub={`${reserved} res. · ${sold} vend.`} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Leads por status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Leads por status</h2>
          <div className="space-y-2.5">
            {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => {
              const count = leadsByStatus.find((l) => l.status === s)?._count ?? 0
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-slate-600">{STATUS_LABEL[s]}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-1.5">
                    <div className={`h-1.5 rounded-full ${STATUS_BAR[s]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-slate-700">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unidades */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Unidades</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Disponíveis', value: available, color: 'text-emerald-600' },
              { label: 'Reservadas',  value: reserved,  color: 'text-amber-600' },
              { label: 'Vendidas',    value: sold,       color: 'text-rose-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast do funil */}
      {forecast.length > 0 && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Forecast do funil</h2>
            <span className="text-sm font-semibold text-slate-700">
              {totalForecast.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              <span className="ml-1 text-xs font-normal text-slate-400">ponderado</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-slate-400">Etapa</th>
                  <th className="pb-2 pr-4 text-right text-xs font-medium text-slate-400">Leads</th>
                  <th className="pb-2 pr-4 text-right text-xs font-medium text-slate-400">Prob.</th>
                  <th className="pb-2 pr-4 text-right text-xs font-medium text-slate-400">Valor total</th>
                  <th className="pb-2 text-right text-xs font-medium text-slate-400">Ponderado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {forecast.map((s) => (
                  <tr key={s.name}>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-sm text-slate-700">{s.name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-500">{s.count}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-400">{s.prob}%</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-500">
                      {s.totalValue > 0 ? s.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '—'}
                    </td>
                    <td className="py-2.5 text-right text-sm font-semibold text-slate-800">
                      {s.weightedValue > 0 ? s.weightedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Valor ponderado = propostas × probabilidade da etapa. Apenas leads ativos com proposta.
          </p>
        </div>
      )}

      {/* Atalhos */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {NAV_CARDS.map(({ href, title, sub }) => (
          <a
            key={href}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-800">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </a>
        ))}
      </div>
    </main>
  )
}
