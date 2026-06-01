import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnterpriseMap } from '@/components/EnterpriseMapWrapper'

export default async function EnterpriseMapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const enterprise = await prisma.enterprise.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      mapImageUrl: true,
      units: {
        where: { deletedAt: null, NOT: { mapX: null } },
        select: {
          id: true, identifier: true, typology: true,
          status: true, currentPrice: true, mapX: true, mapY: true,
        },
      },
    },
  })

  if (!enterprise) notFound()

  if (!enterprise.mapImageUrl) {
    return (
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-2 text-sm text-slate-500">
          <a href={`/enterprises/${id}`} className="hover:underline">{enterprise.name}</a> › Mapa
        </div>
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500">Nenhuma imagem de mapa configurada.</p>
          {isAdmin && (
            <a
              href={`/enterprises/${id}/map/edit`}
              className="mt-3 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Configurar mapa
            </a>
          )}
        </div>
      </main>
    )
  }

  const units = enterprise.units
    .filter((u) => u.mapX != null && u.mapY != null)
    .map((u) => ({
      ...u,
      mapX: u.mapX!,
      mapY: u.mapY!,
      currentPrice: u.currentPrice ? Number(u.currentPrice) : null,
    }))

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <a href={`/enterprises/${id}`} className="hover:underline">{enterprise.name}</a> › Mapa
        </div>
      </div>

      <EnterpriseMap
        mapImageUrl={enterprise.mapImageUrl}
        units={units}
        editHref={isAdmin ? `/enterprises/${id}/map/edit` : undefined}
      />
    </main>
  )
}
