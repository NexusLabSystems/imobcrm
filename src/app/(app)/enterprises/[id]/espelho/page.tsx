import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EspelhoDigital } from '@/components/EspelhoDigitalWrapper'

export default async function EspelhoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params

  const enterprise = await prisma.enterprise.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    select: {
      id: true,
      name: true,
      type: true,
      units: {
        where: { deletedAt: null },
        select: {
          id: true,
          identifier: true,
          floor: true,
          blockId: true,
          status: true,
          typology: true,
          currentPrice: true,
          bedrooms: true,
          areaPrivate: true,
          block: { select: { name: true } },
        },
        orderBy: [{ floor: 'asc' }, { identifier: 'asc' }],
      },
    },
  })

  if (!enterprise) notFound()

  const units = enterprise.units.map((u) => ({
    id: u.id,
    identifier: u.identifier,
    floor: u.floor,
    blockId: u.blockId,
    blockName: u.block?.name ?? null,
    status: u.status,
    typology: u.typology,
    currentPrice: u.currentPrice ? Number(u.currentPrice) : null,
    bedrooms: u.bedrooms,
    areaPrivate: u.areaPrivate ? Number(u.areaPrivate) : null,
  }))

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            <a href="/enterprises" className="hover:underline">Empreendimentos</a>
            {' › '}
            <a href={`/enterprises/${id}`} className="hover:underline">{enterprise.name}</a>
            {' › '}
            Espelho Digital
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Espelho Digital — {enterprise.name}
          </h1>
        </div>
        <a
          href={`/enterprises/${id}`}
          className="rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Voltar
        </a>
      </div>

      {units.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">
          Nenhuma unidade cadastrada neste empreendimento.
        </div>
      ) : (
        <EspelhoDigital units={units} enterpriseId={id} />
      )}
    </main>
  )
}
