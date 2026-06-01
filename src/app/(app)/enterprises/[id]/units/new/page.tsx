import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createUnit } from '@/actions/units'

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireRole(['admin', 'manager'])
  const { id } = await params

  const enterprise = await prisma.enterprise.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    select: { id: true, name: true },
  })

  if (!enterprise) notFound()

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          <a href={`/enterprises/${enterprise.id}`} className="hover:underline">
            {enterprise.name}
          </a>{' '}
          › Nova unidade
        </p>
      </div>

      <form action={createUnit} className="space-y-4 rounded-lg border bg-white p-6">
        <input type="hidden" name="enterpriseId" value={enterprise.id} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Identificador <span className="text-red-500">*</span>
            </label>
            <input
              name="identifier" type="text" required placeholder="Ex: 101, A-01"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Tipologia</label>
            <input
              name="typology" type="text" placeholder="Ex: 2 dorms, Studio"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Andar</label>
            <input
              name="floor" type="number" min="0"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Dormitórios</label>
            <input
              name="bedrooms" type="number" min="0"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Área privativa (m²)</label>
            <input
              name="areaPrivate" type="number" step="0.01" min="0"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Preço (R$)</label>
            <input
              name="currentPrice" type="number" step="0.01" min="0"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Salvar unidade
          </button>
          <a
            href={`/enterprises/${enterprise.id}`}
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </a>
        </div>
      </form>
    </main>
  )
}
