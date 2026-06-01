import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { EnterpriseStatus } from '@prisma/client'

const STATUS_LABEL: Record<EnterpriseStatus, string> = {
  pre_launch: 'Pré-lançamento',
  launch: 'Lançamento',
  selling: 'Em vendas',
  sold_out: 'Esgotado',
  delivered: 'Entregue',
}

const STATUS_COLOR: Record<EnterpriseStatus, string> = {
  pre_launch: 'bg-purple-100 text-purple-700',
  launch: 'bg-blue-100 text-blue-700',
  selling: 'bg-green-100 text-green-700',
  sold_out: 'bg-red-100 text-red-700',
  delivered: 'bg-slate-100 text-slate-500',
}

export default async function EnterprisesPage() {
  const { profile } = await getProfile()
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const enterprises = await prisma.enterprise.findMany({
    where: { tenantId: profile.tenantId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Empreendimentos</h1>
        {isAdmin && (
          <Link
            href="/enterprises/new"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Novo
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enterprises.length === 0 && (
          <p className="col-span-3 py-12 text-center text-sm text-slate-400">
            Nenhum empreendimento cadastrado.
          </p>
        )}
        {enterprises.map((e) => (
          <Link
            key={e.id}
            href={`/enterprises/${e.id}`}
            className="overflow-hidden rounded-xl border bg-white hover:shadow-sm"
          >
            {e.coverImageUrl ? (
              <img
                src={e.coverImageUrl}
                alt={e.name}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400 text-sm">
                Sem foto
              </div>
            )}
            <div className="p-4">
              <p className="font-medium text-slate-900">{e.name}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-500">{e.type}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status]}`}>
                  {STATUS_LABEL[e.status]}
                </span>
                <span className="text-xs text-slate-400">
                  {e.availableUnits} disponíveis
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
