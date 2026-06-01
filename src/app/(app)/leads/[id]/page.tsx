import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createActivity } from '@/actions/activities'
import { updateLeadStatus, moveLeadToStage } from '@/actions/leads'
import type { LeadStatus, ActivityType } from '@prisma/client'

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Novo',
  in_progress: 'Em andamento',
  qualified: 'Qualificado',
  converted: 'Convertido',
  lost: 'Perdido',
  discarded: 'Descartado',
}

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: 'Ligação',
  email: 'E-mail',
  visit: 'Visita',
  meeting: 'Reunião',
  whatsapp: 'WhatsApp',
  note: 'Nota',
  system: 'Sistema',
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params

  const [lead, funnel] = await Promise.all([
    prisma.lead.findFirst({
      where: { id, tenantId: profile.tenantId, deletedAt: null },
      include: {
        assignee: { select: { name: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.funnel.findFirst({
      where: { tenantId: profile.tenantId, isDefault: true, deletedAt: null },
      include: { stages: { orderBy: { order: 'asc' } } },
    }),
  ])

  if (!lead) notFound()

  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <a href="/leads" className="hover:underline">Leads</a> › {lead.name}
        </p>
        <a
          href={`/proposals/new?leadId=${lead.id}`}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Criar proposta
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card do lead */}
          <div className="rounded-lg border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{lead.name}</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {lead.phone && <span>{lead.phone} · </span>}
                  {lead.email && <span>{lead.email} · </span>}
                  <span className="capitalize">{lead.source}</span>
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap">
                {STATUS_LABEL[lead.status]}
              </span>
            </div>

            {lead.assignee && (
              <p className="mt-3 text-sm text-slate-600">
                Responsável: <span className="font-medium">{lead.assignee.name}</span>
              </p>
            )}

            {/* Etapa no funil */}
            {funnel && (
              <form action={moveLeadToStage} className="mt-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="funnelId" value={funnel.id} />
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Etapa no funil
                </label>
                <div className="flex gap-2">
                  <select
                    name="stageId"
                    defaultValue={lead.funnelStageId ?? ''}
                    className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">— Sem etapa —</option>
                    {funnel.stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            {/* Atualizar status */}
            {isAdmin && (
              <form action={updateLeadStatus} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="leadId" value={lead.id} />
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <button
                    key={value}
                    name="status"
                    value={value}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      lead.status === value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </form>
            )}
          </div>

          {/* Nova atividade */}
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-medium text-slate-900">Registrar atividade</h2>
            <form action={createActivity} className="space-y-3">
              <input type="hidden" name="leadId" value={lead.id} />

              <select
                name="type"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {Object.entries(ACTIVITY_LABEL)
                  .filter(([v]) => v !== 'system')
                  .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>

              <textarea
                name="description"
                required
                rows={3}
                placeholder="Descreva a atividade…"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />

              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Salvar
              </button>
            </form>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="mb-3 font-medium text-slate-900">Timeline</h2>
          {lead.activities.length === 0 && (
            <p className="text-sm text-slate-400">Nenhuma atividade ainda.</p>
          )}
          <ol className="space-y-4">
            {lead.activities.map((act) => (
              <li key={act.id} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-slate-400">
                <p className="text-xs font-medium text-slate-700">{ACTIVITY_LABEL[act.type]}</p>
                <p className="text-sm text-slate-600">{act.description}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {act.user.name} · {new Date(act.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  )
}
