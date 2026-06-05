import Link from 'next/link'
import { Suspense } from 'react'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ScoreBadge from '@/components/ScoreBadge'
import LeadsFilters from '@/components/LeadsFilters'
import type { LeadStatus } from '@prisma/client'

const PAGE_SIZE = 50

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novo', in_progress: 'Em andamento', qualified: 'Qualificado',
  converted: 'Convertido', lost: 'Perdido', discarded: 'Descartado',
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  new:        'bg-sky-100 text-sky-700 ring-sky-200',
  in_progress:'bg-amber-100 text-amber-700 ring-amber-200',
  qualified:  'bg-violet-100 text-violet-700 ring-violet-200',
  converted:  'bg-emerald-100 text-emerald-700 ring-emerald-200',
  lost:       'bg-rose-100 text-rose-700 ring-rose-200',
  discarded:  'bg-slate-100 text-slate-500 ring-slate-200',
}

const SOURCE_LABEL: Record<string, string> = {
  website: 'Site', facebook: 'Facebook', instagram: 'Instagram',
  indicacao: 'Indicação', portais: 'Portais', manual: 'Manual', importacao: 'Importação',
}

function IcoImport() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
}
function IcoPlus() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const { profile } = await getProfile()
  const { status, q, page: pageParam } = await searchParams

  const isAdmin = profile.role === 'admin' || profile.role === 'manager'
  const page    = Math.max(1, Number(pageParam) || 1)
  const skip    = (page - 1) * PAGE_SIZE

  const search = q?.trim()

  const where = {
    tenantId:  profile.tenantId,
    deletedAt: null,
    ...(status ? { status: status as LeadStatus } : {}),
    ...(!isAdmin ? { assignedTo: profile.id } : {}),
    ...(search ? {
      OR: [
        { name:  { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [leads, total, totalAll] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignee: { select: { name: true } } },
      orderBy:  { createdAt: 'desc' },
      take:     PAGE_SIZE,
      skip,
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({
      where: { tenantId: profile.tenantId, deletedAt: null, ...(!isAdmin ? { assignedTo: profile.id } : {}) }
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageHref(p: number) {
    const sp = new URLSearchParams()
    if (status) sp.set('status', status)
    if (q)      sp.set('q', q)
    sp.set('page', String(p))
    return `/leads?${sp.toString()}`
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Leads</h1>
          <p className="mt-0.5 text-xs text-slate-400">{totalAll} no total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leads/import"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <IcoImport />
            Importar CSV
          </Link>
          <Link
            href="/leads/new"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <IcoPlus />
            Novo lead
          </Link>
        </div>
      </div>

      {/* Filtros (client) */}
      <Suspense fallback={null}>
        <LeadsFilters total={totalAll} />
      </Suspense>

      {/* Resultado / contador */}
      {(search || status) && (
        <p className="mt-3 text-xs text-slate-400">
          {total} resultado{total !== 1 ? 's' : ''}
          {search && <> para &ldquo;<span className="font-medium text-slate-600">{search}</span>&rdquo;</>}
          {status && <> · {STATUS_LABEL[status as LeadStatus]}</>}
        </p>
      )}

      {/* Lista */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">Nenhum lead encontrado.</p>
            {(search || status) && (
              <Link href="/leads" className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:text-emerald-700">
                Limpar filtros
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {lead.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{lead.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {lead.phone ?? lead.email ?? 'Sem contato'}
                      {' · '}
                      {SOURCE_LABEL[lead.source] ?? lead.source}
                      {lead.assignee && ` · ${lead.assignee.name}`}
                    </p>
                  </div>

                  {/* Score + status */}
                  <div className="flex shrink-0 items-center gap-2">
                    <ScoreBadge score={lead.score} />
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_BADGE[lead.status]}`}>
                      {STATUS_LABEL[lead.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Página {page} de {totalPages} · {total} resultado{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                ← Anterior
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
              return (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  {p}
                </Link>
              )
            })}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
