import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { EnterpriseStatus, EnterpriseType } from '@prisma/client'

const STATUS_LABEL: Record<EnterpriseStatus, string> = {
  pre_launch: 'Pré-lançamento', launch: 'Lançamento', selling: 'Em vendas',
  sold_out: 'Esgotado', delivered: 'Entregue',
}
const STATUS_BADGE: Record<EnterpriseStatus, string> = {
  pre_launch: 'bg-violet-100 text-violet-700 ring-violet-200',
  launch:     'bg-blue-100 text-blue-700 ring-blue-200',
  selling:    'bg-emerald-100 text-emerald-700 ring-emerald-200',
  sold_out:   'bg-rose-100 text-rose-700 ring-rose-200',
  delivered:  'bg-slate-100 text-slate-400 ring-slate-200',
}
const TYPE_LABEL: Record<EnterpriseType, string> = {
  vertical: 'Vertical', horizontal: 'Horizontal', loteamento: 'Loteamento',
  comercial: 'Comercial', misto: 'Misto',
}

function IcoPlus() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

function IcoBuilding() {
  return (
    <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

export default async function EnterprisesPage() {
  const { profile } = await getProfile()
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const enterprises = await prisma.enterprise.findMany({
    where: { tenantId: profile.tenantId, deletedAt: null },
    include: {
      _count: { select: { units: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const byStatus = enterprises.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1
    return acc
  }, {} as Record<EnterpriseStatus, number>)

  return (
    <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Empreendimentos</h1>
          <p className="mt-0.5 text-xs text-slate-400">{enterprises.length} no total</p>
        </div>
        {isAdmin && (
          <Link
            href="/enterprises/new"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <IcoPlus /> Novo empreendimento
          </Link>
        )}
      </div>

      {/* Resumo por status */}
      {enterprises.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABEL) as EnterpriseStatus[]).filter((s) => byStatus[s]).map((s) => (
            <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${STATUS_BADGE[s]}`}>
              {STATUS_LABEL[s]} · {byStatus[s]}
            </span>
          ))}
        </div>
      )}

      {enterprises.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <IcoBuilding />
          <p className="mt-3 text-sm font-medium text-slate-500">Nenhum empreendimento cadastrado</p>
          {isAdmin && (
            <Link href="/enterprises/new" className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Cadastrar primeiro empreendimento →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enterprises.map((e) => (
            <Link
              key={e.id}
              href={`/enterprises/${e.id}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {e.coverImageUrl ? (
                <img src={e.coverImageUrl} alt={e.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-slate-50">
                  <IcoBuilding />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{e.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{TYPE_LABEL[e.type]}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ${STATUS_BADGE[e.status]}`}>
                    {STATUS_LABEL[e.status]}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{e.availableUnits} disponíveis</span>
                  <span>{e._count.units} unidades</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
