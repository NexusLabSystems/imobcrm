import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createFunnel } from '@/actions/funnels'

export default async function FunnelsPage() {
  const { profile } = await requireRole(['admin', 'manager'])

  const funnels = await prisma.funnel.findMany({
    where: { tenantId: profile.tenantId, deletedAt: null },
    include: { _count: { select: { stages: true, leads: true } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Funis de venda</h1>
      <p className="mt-0.5 text-sm text-slate-500">Gerencie os funis e as etapas de cada um.</p>

      {/* Novo funil */}
      <div className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Novo funil</h2>
        <form action={createFunnel} className="flex flex-wrap gap-3">
          <input
            name="name" type="text" required placeholder="Nome do funil"
            className="flex-1 min-w-48 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isDefault" value="true" />
            Definir como padrão
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Criar funil
          </button>
        </form>
      </div>

      {/* Lista de funis */}
      <div className="mt-4 space-y-3">
        {funnels.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{f.name}</p>
                {f.isDefault && (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">Padrão</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {f._count.stages} etapa{f._count.stages !== 1 ? 's' : ''} · {f._count.leads} lead{f._count.leads !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href={`/admin/funnels/${f.id}`}
              className="rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Editar etapas →
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}
