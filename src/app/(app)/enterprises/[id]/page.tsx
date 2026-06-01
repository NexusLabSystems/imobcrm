import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUnitStatus, updateUnitPrice } from '@/actions/units'
import { updateEnterpriseStatus } from '@/actions/enterprises'
import type { UnitStatus, EnterpriseStatus } from '@prisma/client'

const UNIT_STATUS_LABEL: Record<UnitStatus, string> = {
  available: 'Disponível',
  reserved: 'Reservada',
  sold: 'Vendida',
  unavailable: 'Indisponível',
}

const UNIT_STATUS_COLOR: Record<UnitStatus, string> = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-red-100 text-red-700',
  unavailable: 'bg-slate-100 text-slate-500',
}

const ENT_STATUS_LABEL: Record<EnterpriseStatus, string> = {
  pre_launch: 'Pré-lançamento',
  launch: 'Lançamento',
  selling: 'Em vendas',
  sold_out: 'Esgotado',
  delivered: 'Entregue',
}

export default async function EnterpriseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params
  const { status } = await searchParams
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const enterprise = await prisma.enterprise.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    include: {
      units: {
        where: {
          deletedAt: null,
          ...(status ? { status: status as UnitStatus } : {}),
        },
        orderBy: [{ status: 'asc' }, { identifier: 'asc' }],
        include: {
          priceHistories: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { changedByUser: { select: { name: true } } },
          },
        },
      },
    },
  })

  if (!enterprise) notFound()

  const filters: Array<{ label: string; value?: string }> = [
    { label: 'Todas' },
    ...Object.entries(UNIT_STATUS_LABEL).map(([v, l]) => ({ label: l, value: v })),
  ]

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <a href="/enterprises" className="hover:underline">Empreendimentos</a> › {enterprise.name}
        </p>
        <a
          href={`/enterprises/${id}/map`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          🗺 Ver mapa
        </a>
      </div>

      {/* Header */}
      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
        {enterprise.coverImageUrl && (
          <img
            src={enterprise.coverImageUrl}
            alt={enterprise.name}
            className="h-52 w-full object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{enterprise.name}</h1>
              <p className="mt-0.5 text-sm capitalize text-slate-500">{enterprise.type}</p>
              {enterprise.description && (
                <p className="mt-2 text-sm text-slate-600">{enterprise.description}</p>
              )}
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 whitespace-nowrap">
              {ENT_STATUS_LABEL[enterprise.status]}
            </span>
          </div>

          {/* Status do empreendimento (admin) */}
          {isAdmin && (
            <form action={updateEnterpriseStatus} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="enterpriseId" value={enterprise.id} />
              {Object.entries(ENT_STATUS_LABEL).map(([value, label]) => (
                <button
                  key={value} name="status" value={value}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    enterprise.status === value
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
      </div>

      {/* Unidades */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Unidades</h2>
          {isAdmin && (
            <Link
              href={`/enterprises/${enterprise.id}/units/new`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              + Nova unidade
            </Link>
          )}
        </div>

        {/* Filtro de status */}
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((f) => (
            <a
              key={f.value ?? 'all'}
              href={f.value ? `/enterprises/${id}?status=${f.value}` : `/enterprises/${id}`}
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

        {/* Grid de unidades */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enterprise.units.length === 0 && (
            <p className="col-span-3 py-8 text-center text-sm text-slate-400">
              Nenhuma unidade encontrada.
            </p>
          )}
          {enterprise.units.map((unit) => (
            <div key={unit.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">Unidade {unit.identifier}</p>
                  {unit.typology && (
                    <p className="text-xs text-slate-500">{unit.typology}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-500">
                    {unit.floor != null && <span>{unit.floor}º andar</span>}
                    {unit.bedrooms != null && <span>{unit.bedrooms} dorms</span>}
                    {unit.areaPrivate != null && <span>{Number(unit.areaPrivate)}m²</span>}
                    {unit.currentPrice != null && (
                      <span className="font-medium text-slate-700">
                        {Number(unit.currentPrice).toLocaleString('pt-BR', {
                          style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${UNIT_STATUS_COLOR[unit.status]}`}>
                  {UNIT_STATUS_LABEL[unit.status]}
                </span>
              </div>

              {/* Mudar status (admin) */}
              {isAdmin && (
                <form action={updateUnitStatus} className="mt-3 flex flex-wrap gap-1.5">
                  <input type="hidden" name="unitId" value={unit.id} />
                  <input type="hidden" name="enterpriseId" value={enterprise.id} />
                  {Object.entries(UNIT_STATUS_LABEL).map(([value, label]) => (
                    <button
                      key={value} name="status" value={value}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        unit.status === value
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </form>
              )}

              {/* Atualizar preço (admin) */}
              {isAdmin && (
                <form action={updateUnitPrice} className="mt-3 flex gap-2">
                  <input type="hidden" name="unitId" value={unit.id} />
                  <input type="hidden" name="enterpriseId" value={enterprise.id} />
                  <input
                    name="price" type="number" step="0.01" min="0"
                    placeholder="Novo preço R$"
                    className="w-36 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <input
                    name="note" type="text" placeholder="Motivo (opcional)"
                    className="flex-1 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    Atualizar
                  </button>
                </form>
              )}

              {/* Histórico de preços */}
              {unit.priceHistories.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                    Histórico de preços ({unit.priceHistories.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-2">
                    {unit.priceHistories.map((h) => (
                      <li key={h.id} className="text-xs text-slate-500">
                        {Number(h.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        {' · '}{h.changedByUser.name}
                        {h.note && <span className="text-slate-400"> — {h.note}</span>}
                        {' · '}{new Date(h.createdAt).toLocaleDateString('pt-BR')}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
