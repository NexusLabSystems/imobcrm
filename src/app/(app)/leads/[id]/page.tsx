import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createActivity } from '@/actions/activities'
import { updateLeadStatus, moveLeadToStage, updateLeadCpf, updateLeadInfo } from '@/actions/leads'
import ScoreBadge from '@/components/ScoreBadge'
import { safeDecrypt, maskCpf } from '@/lib/crypto'
import type { LeadStatus, ActivityType } from '@prisma/client'

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

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: 'Ligação', email: 'E-mail', visit: 'Visita',
  meeting: 'Reunião', whatsapp: 'WhatsApp', note: 'Nota', system: 'Sistema',
}

const ACTIVITY_ICON: Record<ActivityType, string> = {
  call:     'M2.25 6.338c0-.518.149-1.03.43-1.477l3.63-5.842a1.5 1.5 0 012.58 0l3.63 5.842c.28.447.43.959.43 1.477v12.414a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.338zm6.5 9.912v-1.5M8.75 12V9.25',
  email:    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  visit:    'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  meeting:  'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  whatsapp: 'M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12c0 1.644.48 3.174 1.308 4.458L3.75 20.25l3.866-1.295A8.214 8.214 0 0012 20.25z',
  note:     'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
  system:   'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
}

const ACTIVITY_DOT: Record<ActivityType, string> = {
  call: 'bg-blue-500', email: 'bg-violet-500', visit: 'bg-amber-500',
  meeting: 'bg-teal-500', whatsapp: 'bg-emerald-500', note: 'bg-slate-400', system: 'bg-slate-300',
}

const SOURCE_LABEL: Record<string, string> = {
  website: 'Site', facebook: 'Facebook', instagram: 'Instagram',
  indicacao: 'Indicação', portais: 'Portais', manual: 'Manual', importacao: 'Importação',
}

function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60)   return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  const d = Math.floor(diff / 86400)
  return d === 1 ? 'ontem' : `${d}d atrás`
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await getProfile()
  const { id } = await params

  const [lead, funnel] = await Promise.all([
    prisma.lead.findFirst({
      where: { id, tenantId: profile.tenantId, deletedAt: null },
      include: {
        assignee:   { select: { name: true } },
        activities: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
      },
    }),
    prisma.funnel.findFirst({
      where: { tenantId: profile.tenantId, isDefault: true, deletedAt: null },
      include: { stages: { orderBy: { order: 'asc' } } },
    }),
  ])

  if (!lead) notFound()

  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const decryptedCpf = safeDecrypt(lead.cpf)
  const displayCpf   = decryptedCpf
    ? (isAdmin ? decryptedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : maskCpf(decryptedCpf))
    : null

  const initials = lead.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const phone = lead.phone?.replace(/\D/g, '')
  const waLink = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá ${lead.name.split(' ')[0]}, tudo bem? Estou entrando em contato sobre um empreendimento que pode te interessar.`)}`
    : null

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">

      {/* Breadcrumb + ações */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/leads" className="hover:text-slate-600">Leads</Link>
          <span>›</span>
          <span className="text-slate-600">{lead.name}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-emerald-600 shadow-sm transition-colors hover:bg-emerald-50"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.784.474 3.453 1.301 4.9L2 22l5.234-1.295A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.065-1.112l-.29-.173-3.1.768.785-3.026-.19-.31A7.964 7.964 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8zm4.41-5.855c-.243-.122-1.437-.708-1.659-.789-.222-.08-.383-.121-.544.122-.16.243-.624.789-.765.951-.14.162-.282.182-.524.06-.243-.121-1.024-.377-1.95-1.203-.72-.643-1.207-1.435-1.349-1.678-.14-.243-.015-.374.107-.495.109-.108.243-.283.364-.424.122-.14.162-.243.243-.404.08-.162.04-.304-.02-.426-.062-.121-.544-1.314-.745-1.798-.197-.473-.397-.41-.544-.418l-.465-.008c-.162 0-.425.06-.648.304-.223.243-.85.83-.85 2.026 0 1.195.87 2.35.99 2.511.122.162 1.713 2.614 4.148 3.665.58.25 1.032.4 1.385.512.582.185 1.112.159 1.53.097.466-.07 1.437-.587 1.64-1.154.202-.567.202-1.053.14-1.154-.06-.1-.222-.162-.465-.283z"/>
              </svg>
              WhatsApp
            </a>
          )}
          <Link
            href={`/proposals/new?leadId=${lead.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Criar proposta
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-5 lg:col-span-2">

          {/* Card do lead */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold text-slate-900">{lead.name}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_BADGE[lead.status]}`}>
                    {STATUS_LABEL[lead.status]}
                  </span>
                  <ScoreBadge score={lead.score} showLabel />
                </div>
                <p className="mt-0.5 text-sm text-slate-400">
                  {SOURCE_LABEL[lead.source] ?? lead.source}
                  {lead.assignee && ` · ${lead.assignee.name}`}
                  {' · '}criado {timeAgo(new Date(lead.createdAt))}
                </p>
              </div>
            </div>

            {/* Editar informações */}
            <form action={updateLeadInfo} className="mt-5 grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Nome</label>
                <input
                  name="name"
                  defaultValue={lead.name}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">E-mail</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={lead.email ?? ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Telefone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={lead.phone ?? ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Salvar
                </button>
              </div>
            </form>

            {/* CPF */}
            {isAdmin && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium text-slate-500">CPF</label>
                <form action={updateLeadCpf} className="flex gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input
                    name="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    defaultValue={decryptedCpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') ?? ''}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Salvar
                  </button>
                </form>
                {displayCpf && (
                  <p className="mt-1 font-mono text-xs text-slate-400">{displayCpf}</p>
                )}
              </div>
            )}
          </div>

          {/* Etapa no funil + Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Funil & Status</h2>

            {funnel && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-slate-500">Etapa no funil</label>
                <form action={moveLeadToStage} className="flex gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <select
                    name="stageId"
                    defaultValue={lead.funnelStageId ?? ''}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">— Sem etapa —</option>
                    {funnel.stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Mover
                  </button>
                </form>
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">Status do lead</label>
                <form action={updateLeadStatus} className="flex flex-wrap gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  {(Object.entries(STATUS_LABEL) as [LeadStatus, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      name="status"
                      value={value}
                      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
                        lead.status === value
                          ? STATUS_BADGE[value]
                          : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </form>
              </div>
            )}
          </div>

          {/* Nova atividade */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Registrar atividade</h2>
            <form action={createActivity} className="space-y-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <select
                name="type"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              >
                {(Object.entries(ACTIVITY_LABEL) as [ActivityType, string][])
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
              >
                Salvar atividade
              </button>
            </form>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Timeline</h2>
          {lead.activities.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-slate-400">Nenhuma atividade ainda.</p>
            </div>
          ) : (
            <ol className="relative space-y-1 border-l border-slate-200 pl-5">
              {lead.activities.map((act) => (
                <li key={act.id} className="relative pb-5">
                  {/* Dot */}
                  <span className={`absolute left-[-1.35rem] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${ACTIVITY_DOT[act.type]}`}>
                    <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={ACTIVITY_ICON[act.type]} />
                    </svg>
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-700">{ACTIVITY_LABEL[act.type]}</p>
                    <p className="mt-1 text-sm text-slate-600">{act.description}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {act.user.name} · {timeAgo(new Date(act.createdAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </main>
  )
}
