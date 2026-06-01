import Link from 'next/link'
import { getProfile } from '@/lib/auth'
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
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  discarded: 'bg-slate-100 text-slate-500',
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { profile } = await getProfile()
  const { status } = await searchParams
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const leads = await prisma.lead.findMany({
    where: {
      tenantId: profile.tenantId,
      deletedAt: null,
      ...(status ? { status: status as LeadStatus } : {}),
      ...(!isAdmin ? { assignedTo: profile.id } : {}),
    },
    include: { assignee: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const filters: Array<{ label: string; value?: string }> = [
    { label: 'Todos' },
    ...Object.entries(STATUS_LABEL).map(([v, label]) => ({ label, value: v })),
  ]

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
        <Link
          href="/leads/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Novo lead
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <a
            key={f.value ?? 'all'}
            href={f.value ? `/leads?status=${f.value}` : '/leads'}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === f.value || (!status && !f.value)
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {leads.length === 0 && (
          <li className="py-12 text-center text-sm text-slate-400">
            Nenhum lead encontrado.
          </li>
        )}
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between rounded-lg border bg-white p-4 hover:shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{lead.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {lead.phone ?? lead.email ?? 'Sem contato'} · {lead.source}
                  {lead.assignee && ` · ${lead.assignee.name}`}
                </p>
              </div>
              <span className={`ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[lead.status]}`}>
                {STATUS_LABEL[lead.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
