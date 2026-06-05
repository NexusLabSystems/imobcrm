import Link from 'next/link'
import { Suspense } from 'react'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { completeActivity } from '@/actions/activities'
import type { ActivityType } from '@prisma/client'

const TYPE_LABEL: Record<ActivityType, string> = {
  call: 'Ligação', email: 'E-mail', visit: 'Visita',
  meeting: 'Reunião', whatsapp: 'WhatsApp', note: 'Nota', system: 'Sistema',
}
const TYPE_COLOR: Record<ActivityType, string> = {
  call: 'bg-blue-100 text-blue-700', email: 'bg-violet-100 text-violet-700',
  visit: 'bg-amber-100 text-amber-700', meeting: 'bg-teal-100 text-teal-700',
  whatsapp: 'bg-emerald-100 text-emerald-700', note: 'bg-slate-100 text-slate-500',
  system: 'bg-slate-100 text-slate-400',
}

function fmt(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function isOverdue(date: Date) {
  return date < new Date()
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; user?: string }>
}) {
  const { profile } = await getProfile()
  const { view = 'upcoming', user = 'me' } = await searchParams

  const isAdmin = profile.role === 'admin' || profile.role === 'manager'
  const filterUser = !isAdmin || user === 'me' ? profile.id : undefined

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const where = {
    tenantId:    profile.tenantId,
    scheduledAt: { not: null as unknown as Date },
    ...(filterUser ? { userId: filterUser } : {}),
    ...(view === 'upcoming'  ? { scheduledAt: { gte: startOfToday }, completedAt: null } : {}),
    ...(view === 'overdue'   ? { scheduledAt: { lt: startOfToday }, completedAt: null } : {}),
    ...(view === 'completed' ? { completedAt: { not: null as unknown as Date } } : {}),
  }

  const [activities, allUsers, counts] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
      orderBy: { scheduledAt: view === 'upcoming' ? 'asc' : 'desc' },
      take: 100,
    }),
    isAdmin ? prisma.user.findMany({
      where: { tenantId: profile.tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }) : [],
    Promise.all([
      prisma.activity.count({
        where: { tenantId: profile.tenantId, scheduledAt: { gte: startOfToday }, completedAt: null, ...(filterUser ? { userId: filterUser } : {}) },
      }),
      prisma.activity.count({
        where: { tenantId: profile.tenantId, scheduledAt: { lt: startOfToday }, completedAt: null, ...(filterUser ? { userId: filterUser } : {}) },
      }),
      prisma.activity.count({
        where: { tenantId: profile.tenantId, completedAt: { not: null }, ...(filterUser ? { userId: filterUser } : {}) },
      }),
    ]),
  ])

  const [countUpcoming, countOverdue, countCompleted] = counts

  // Agrupa por data
  const groups = new Map<string, typeof activities>()
  for (const act of activities) {
    if (!act.scheduledAt) continue
    const key = new Date(act.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(act)
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Agenda</h1>
          <p className="mt-0.5 text-xs text-slate-400">Atividades agendadas</p>
        </div>
      </div>

      {/* Filtros de visão */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { value: 'upcoming',  label: `Próximas (${countUpcoming})` },
          { value: 'overdue',   label: `Atrasadas (${countOverdue})` },
          { value: 'completed', label: `Concluídas (${countCompleted})` },
        ].map(({ value, label }) => {
          const sp = new URLSearchParams()
          sp.set('view', value)
          if (user !== 'me') sp.set('user', user)
          return (
            <Link
              key={value}
              href={`/agenda?${sp}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                view === value
                  ? value === 'overdue'
                    ? 'bg-rose-500 text-white ring-rose-500'
                    : 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            {[
              { value: 'me',  label: 'Minhas' },
              { value: 'all', label: 'Equipe' },
            ].map(({ value, label }) => {
              const sp = new URLSearchParams()
              sp.set('view', view)
              if (value !== 'me') sp.set('user', value)
              return (
                <Link
                  key={value}
                  href={`/agenda?${sp}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                    user === value
                      ? 'bg-emerald-500 text-white ring-emerald-500'
                      : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-slate-400">
            {view === 'upcoming'  && 'Nenhuma atividade agendada para os próximos dias.'}
            {view === 'overdue'   && 'Nenhuma atividade atrasada.'}
            {view === 'completed' && 'Nenhuma atividade concluída ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([dateLabel, acts]) => (
            <div key={dateLabel}>
              <p className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide capitalize">
                {dateLabel}
              </p>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {acts.map((act) => {
                    const overdue = act.scheduledAt && isOverdue(new Date(act.scheduledAt)) && !act.completedAt
                    return (
                      <li key={act.id} className="flex items-start gap-4 px-4 py-3">
                        {/* Horário */}
                        <div className={`shrink-0 text-xs font-semibold tabular-nums w-10 pt-0.5 ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                          {act.scheduledAt ? new Date(act.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLOR[act.type]}`}>
                              {TYPE_LABEL[act.type]}
                            </span>
                            {overdue && (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-600">
                                Atrasada
                              </span>
                            )}
                            {act.completedAt && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                                Concluída
                              </span>
                            )}
                          </div>
                          {act.description && (
                            <p className="mt-1 text-sm text-slate-700">{act.description}</p>
                          )}
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                            {act.lead && (
                              <Link href={`/leads/${act.lead.id}`} className="hover:text-emerald-600 hover:underline">
                                {act.lead.name}
                              </Link>
                            )}
                            {isAdmin && act.user && <span>· {act.user.name}</span>}
                          </div>
                        </div>

                        {/* Ação */}
                        {!act.completedAt && (
                          <form action={completeActivity} className="shrink-0">
                            <input type="hidden" name="activityId" value={act.id} />
                            <button
                              type="submit"
                              title="Marcar como concluída"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </form>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
