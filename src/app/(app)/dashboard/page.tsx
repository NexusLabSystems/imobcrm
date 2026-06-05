import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { LeadStatus } from '@prisma/client'

// ── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'agora'
  if (min < 60)  return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24)    return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1)   return 'ontem'
  return `${d} dias`
}

// ── Config de domínio ─────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador', manager: 'Gerente', coordinator: 'Coordenador',
  broker: 'Corretor', partner: 'Parceiro',
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; badge: string; bar: string }> = {
  new:        { label: 'Novo',          badge: 'bg-sky-100 text-sky-700 ring-sky-200',        bar: 'bg-sky-400'     },
  in_progress:{ label: 'Em andamento',  badge: 'bg-amber-100 text-amber-700 ring-amber-200',  bar: 'bg-amber-400'   },
  qualified:  { label: 'Qualificado',   badge: 'bg-violet-100 text-violet-700 ring-violet-200',bar: 'bg-violet-400' },
  converted:  { label: 'Convertido',    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500'},
  lost:       { label: 'Perdido',       badge: 'bg-rose-100 text-rose-700 ring-rose-200',     bar: 'bg-rose-400'    },
  discarded:  { label: 'Descartado',    badge: 'bg-slate-100 text-slate-500 ring-slate-200',  bar: 'bg-slate-300'   },
}

const SOURCE_LABEL: Record<string, string> = {
  website: 'Site', facebook: 'Facebook', instagram: 'Instagram',
  indicacao: 'Indicação', portais: 'Portais', manual: 'Manual', importacao: 'Importação',
}

// ── Ícones ────────────────────────────────────────────────────────────────────

function IcoUsers() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IcoDocument() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}
function IcoClock() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function IcoPlus() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}
function IcoWarn() {
  return <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
}
function IcoArrow() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
}
function IcoEmpty() {
  return <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

// ── Página ────────────────────────────────────────────────────────────────────

const FUNNEL_ORDER: LeadStatus[] = ['new', 'in_progress', 'qualified', 'converted', 'lost']

export default async function DashboardPage() {
  const { profile } = await getProfile()
  const tenantId = profile.tenantId
  const userId   = profile.id

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [leadsThisMonth, pendingProposals, scheduledActivities, leadsByStatus, recentLeads] = await Promise.all([
    // KPI 1 — leads do mês atribuídos a mim
    prisma.lead.count({
      where: { tenantId, assignedTo: userId, deletedAt: null, createdAt: { gte: startOfMonth } },
    }),

    // KPI 2 — propostas pendentes de aprovação (tenant inteiro, não só minhas)
    prisma.proposal.count({
      where: { tenantId, status: 'pending_approval', deletedAt: null },
    }),

    // KPI 3 — atividades agendadas futuras para mim
    prisma.activity.count({
      where: { tenantId, userId, scheduledAt: { gte: new Date() }, completedAt: null },
    }),

    // Funil — meus leads agrupados por status
    prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId, assignedTo: userId, deletedAt: null },
      _count: { _all: true },
    }),

    // Leads recentes — últimos 6 atribuídos a mim
    prisma.lead.findMany({
      where: { tenantId, assignedTo: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, status: true, source: true, createdAt: true },
    }),
  ])

  // Monta mapa status → contagem para o funil
  const statusMap = Object.fromEntries(
    leadsByStatus.map((g) => [g.status, g._count._all])
  ) as Partial<Record<LeadStatus, number>>

  const totalActive = FUNNEL_ORDER.slice(0, 3).reduce((s, st) => s + (statusMap[st] ?? 0), 0)

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9 max-w-5xl mx-auto">

      {/* ── Cabeçalho ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-2 ring-white shadow-sm">
            {initials(profile.name)}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">
              {greeting()}, {profile.name.split(' ')[0]}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs capitalize text-slate-400">{today}</span>
            </div>
          </div>
        </div>

        <Link
          href="/leads/new"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95"
        >
          <IcoPlus />
          Novo lead
        </Link>
      </div>

      {/* ── Alerta propostas pendentes ───────────────────────────── */}
      {pendingProposals > 0 && (
        <Link
          href="/proposals"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm transition-colors hover:bg-amber-100"
        >
          <span className="text-amber-500"><IcoWarn /></span>
          <span className="font-medium text-amber-800">
            {pendingProposals === 1
              ? '1 proposta aguarda aprovação'
              : `${pendingProposals} propostas aguardam aprovação`}
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-amber-500">
            Revisar <IcoArrow />
          </span>
        </Link>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Leads no mês</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              <IcoUsers />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums">{leadsThisMonth}</p>
          <p className="mt-0.5 text-xs text-slate-400">atribuídos a você</p>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm ${
          pendingProposals > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Aprovações</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              pendingProposals > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <IcoDocument />
            </div>
          </div>
          <p className={`mt-3 text-3xl font-bold tabular-nums ${
            pendingProposals > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>{pendingProposals}</p>
          <p className="mt-0.5 text-xs text-slate-400">propostas pendentes</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agendadas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <IcoClock />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums">{scheduledActivities}</p>
          <p className="mt-0.5 text-xs text-slate-400">atividades futuras</p>
        </div>
      </div>

      {/* ── Conteúdo principal: funil + recentes ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Funil de leads */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Meus leads</h2>
            <Link href="/leads" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              Ver todos
            </Link>
          </div>

          {totalActive === 0 && (recentLeads.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IcoEmpty />
              <p className="mt-3 text-sm text-slate-400">Nenhum lead ainda</p>
              <Link
                href="/leads/new"
                className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Cadastrar primeiro lead →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {FUNNEL_ORDER.map((status) => {
                const count = statusMap[status] ?? 0
                const total = Object.values(statusMap).reduce((s, n) => s + (n ?? 0), 0)
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                const cfg   = STATUS_CONFIG[status]
                return (
                  <Link
                    key={status}
                    href={`/leads?status=${status}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cfg.badge} w-28 text-center`}>
                      {cfg.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cfg.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500 group-hover:text-slate-800">
                      {count}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Leads recentes */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Leads recentes</h2>
            <Link href="/leads" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              Ver todos
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IcoEmpty />
              <p className="mt-3 text-sm text-slate-400">Nenhum lead cadastrado</p>
              <Link
                href="/leads/new"
                className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Cadastrar primeiro lead →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeads.map((lead) => {
                const cfg = STATUS_CONFIG[lead.status]
                return (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {lead.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{lead.name}</p>
                        <p className="text-xs text-slate-400">
                          {SOURCE_LABEL[lead.source] ?? lead.source}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400 w-12 text-right">
                        {timeAgo(lead.createdAt)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
