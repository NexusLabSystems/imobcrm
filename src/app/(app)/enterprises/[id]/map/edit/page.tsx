import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MapEditor } from '@/components/EnterpriseMapWrapper'

export default async function MapEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireRole(['admin', 'manager'])
  const { id } = await params

  const enterprise = await prisma.enterprise.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      mapImageUrl: true,
      units: {
        where: { deletedAt: null },
        select: {
          id: true, identifier: true, typology: true,
          status: true, mapX: true, mapY: true,
        },
        orderBy: { identifier: 'asc' },
      },
    },
  })

  if (!enterprise) notFound()

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <a href={`/enterprises/${id}`} className="hover:underline">{enterprise.name}</a>
            {' › '}
            <a href={`/enterprises/${id}/map`} className="hover:underline">Mapa</a>
            {' › '}
            Editar
          </div>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Editor de mapa</h1>
        </div>
        <a
          href={`/enterprises/${id}/map`}
          className="rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Ver mapa →
        </a>
      </div>

      <MapEditor
        enterpriseId={enterprise.id}
        mapImageUrl={enterprise.mapImageUrl}
        units={enterprise.units}
      />
    </main>
  )
}
