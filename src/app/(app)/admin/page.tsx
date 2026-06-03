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
    forecastStages,
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
    // Forecast: funil padrão + etapas + leads ativos com propostas
    prisma.funnelStage.findMany({
      where: { funnel: { tenantId, isDefault: true, deletedAt: null } },
      orderBy: { order: 'asc' },
      select: {
        name: true,
        color: true,
        probabilityWeight: true,
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
      const val = lead.proposals[0]?.proposedValue ? Number(lead.proposals[0].proposedValue) : 0
      return sum + val
    }, 0)
    const weightedValue = totalValue * (stage.probabilityWeight / 100)
    return { name: stage.name, color: stage.color, count: stage.leads.length, totalValue, weightedValue }
  })
  const totalForecast = forecast.reduce((sum, s) => sum + s.weightedValue, 0)

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

      {/* Forecast do funil */}
      {forecast.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Forecast do funil</h2>
            <span className="text-sm font-semibold text-slate-700">
              Total ponderado:{' '}
              {totalForecast.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="pb-2 pr-4">Etapa</th>
                  <th className="pb-2 pr-4 text-right">Leads</th>
                  <th className="pb-2 pr-4 text-right">Prob.</th>
                  <th className="pb-2 pr-4 text-right">Valor total</th>
                  <th className="pb-2 text-right">Valor ponderado</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((s) => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        {s.name}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-600">{s.count}</td>
                    <td className="py-2 pr-4 text-right text-slate-500">{forecastStages.find(fs => fs.name === s.name)?.probabilityWeight ?? 0}%</td>
                    <td className="py-2 pr-4 text-right text-slate-600">
                      {s.totalValue > 0
                        ? s.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                        : '—'}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {s.weightedValue > 0
                        ? s.weightedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Valor ponderado = valor das propostas × probabilidade da etapa. Apenas leads ativos com proposta.
          </p>
        </div>
      )}

      {/* Atalhos de gestão */}
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/admin/users" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Usuários</p>
          <p className="text-sm text-slate-500">Convidar e gerenciar roles</p>
        </a>
        <a href="/admin/settings" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Configurações</p>
          <p className="text-sm text-slate-500">Nome, CNPJ e logo</p>
        </a>
        <a href="/admin/integrations" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Integrações</p>
          <p className="text-sm text-slate-500">Facebook Lead Ads</p>
        </a>
        <a href="/admin/funnels" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Funis</p>
          <p className="text-sm text-slate-500">Gerenciar funis e etapas</p>
        </a>
        <a href="/admin/bi" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">BI</p>
          <p className="text-sm text-slate-500">Gráficos, performance e exportação</p>
        </a>
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
