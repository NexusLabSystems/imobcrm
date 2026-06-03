import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BGPattern } from '@/components/ui/bg-pattern'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador', manager: 'Gerente', coordinator: 'Coordenador',
  broker: 'Corretor', partner: 'Parceiro',
}

function IconUsers()    { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function IconKanban()   { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> }
function IconBuilding() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> }
function IconDocument() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
function IconChart()    { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }
function IconBolt()     { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> }

export default async function HomePage() {
  const { profile } = await getProfile()
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'
  const tenantId = profile.tenantId

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [myLeads, myPendingProposals, myActivitiesThisWeek] = await Promise.all([
    prisma.lead.count({
      where: { tenantId, assignedTo: profile.id, deletedAt: null, createdAt: { gte: startOfMonth } },
    }),
    prisma.proposal.count({
      where: { tenantId, status: 'pending_approval', deletedAt: null },
    }),
    prisma.activity.count({
      where: { tenantId, userId: profile.id, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ])

  const shortcuts = [
    { href: '/leads',       label: 'Leads',          sub: 'Ver e criar leads',    Icon: IconUsers    },
    { href: '/kanban',      label: 'Kanban',          sub: 'Funil de vendas',       Icon: IconKanban   },
    { href: '/enterprises', label: 'Empreendimentos', sub: 'Unidades e fotos',      Icon: IconBuilding },
    { href: '/proposals',   label: 'Propostas',       sub: 'Criar e acompanhar',    Icon: IconDocument },
    ...(isAdmin ? [{ href: '/admin', label: 'Dashboard', sub: 'KPIs e gestão', Icon: IconChart }] : []),
  ]

  return (
    <div className="flex flex-col">

      {/* ── Hero com BGPattern ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#1B3A5C] px-4 py-10 sm:px-6 sm:py-14">
        <BGPattern
          variant="grid"
          mask="fade-edges"
          size={32}
          fill="rgba(255,255,255,0.07)"
        />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white ring-2 ring-white/20"
                aria-hidden="true"
              >
                {initials(profile.name)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {greeting()}, {profile.name.split(' ')[0]}
                </h1>
                <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-blue-200">
                  {ROLE_LABEL[profile.role] ?? profile.role}
                </span>
              </div>
            </div>

            <Link
              href="/leads/new"
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#1B3A5C] transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1B3A5C]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Novo lead
            </Link>
          </div>

          {/* KPIs no hero */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <IconUsers />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{myLeads}</p>
                <p className="text-xs text-blue-200">Leads este mês</p>
              </div>
            </div>

            <div className={`flex items-center gap-4 rounded-xl px-5 py-4 backdrop-blur-sm ${
              myPendingProposals > 0 ? 'bg-yellow-400/20 ring-1 ring-yellow-300/30' : 'bg-white/10'
            }`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <IconDocument />
              </div>
              <div>
                <p className={`text-2xl font-bold ${myPendingProposals > 0 ? 'text-yellow-200' : 'text-white'}`}>
                  {myPendingProposals}
                </p>
                <p className="text-xs text-blue-200">Propostas pendentes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <IconBolt />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{myActivitiesThisWeek}</p>
                <p className="text-xs text-blue-200">Atividades (7 dias)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Conteúdo principal ────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 sm:p-6">

        {/* Callout propostas pendentes */}
        {myPendingProposals > 0 && (
          <Link
            href="/proposals"
            className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3.5 transition-colors hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
          >
            <svg className="h-5 w-5 shrink-0 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium text-yellow-800">
              {myPendingProposals === 1
                ? '1 proposta aguarda aprovação'
                : `${myPendingProposals} propostas aguardam aprovação`}
            </p>
            <svg className="ml-auto h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Módulos */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Módulos
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shortcuts.map(({ href, label, sub, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-3 rounded-xl border bg-white p-4 transition-all hover:border-[#1B3A5C]/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#1B3A5C]/10 group-hover:text-[#1B3A5C]">
                  <Icon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
