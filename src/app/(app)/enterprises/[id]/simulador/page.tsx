import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PaymentSimulator from '@/components/PaymentSimulator'
import type { UnitStatus } from '@prisma/client'

const STATUS_COLOR: Record<UnitStatus, string> = {
  available:   'bg-emerald-100 text-emerald-700',
  reserved:    'bg-amber-100 text-amber-700',
  sold:        'bg-rose-100 text-rose-700',
  unavailable: 'bg-slate-100 text-slate-400',
}
const STATUS_LABEL: Record<UnitStatus, string> = {
  available: 'Disponível', reserved: 'Reservada', sold: 'Vendida', unavailable: 'Indisponível',
}

export default async function SimuladorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ unitId?: string }>
}) {
  const { profile } = await getProfile()
  const { id } = await params
  const { unitId } = await searchParams

  const [enterprise, tables] = await Promise.all([
    prisma.enterprise.findFirst({
      where: { id, tenantId: profile.tenantId, deletedAt: null },
      select: {
        id: true, name: true,
        units: {
          where: { deletedAt: null, status: 'available' },
          select: { id: true, identifier: true, currentPrice: true, typology: true, status: true },
          orderBy: { identifier: 'asc' },
        },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).paymentTable.findMany({
      where: { tenantId: profile.tenantId, enterpriseId: id, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!enterprise) notFound()

  const selectedUnit = enterprise.units.find((u) => u.id === unitId) ?? enterprise.units[0] ?? null

  return (
    <main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/enterprises" className="hover:text-slate-600">Empreendimentos</Link>
        <span>›</span>
        <Link href={`/enterprises/${id}`} className="hover:text-slate-600">{enterprise.name}</Link>
        <span>›</span>
        <span className="text-slate-600">Simulador</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Simulador de pagamento</h1>
        <Link
          href={`/enterprises/${id}/tabelas`}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Gerenciar tabelas →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Seletor de unidade */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-500">Selecionar unidade</p>
            {enterprise.units.length === 0 ? (
              <p className="text-sm text-slate-400">Sem unidades disponíveis.</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {enterprise.units.map((u) => (
                  <Link
                    key={u.id}
                    href={`/enterprises/${id}/simulador?unitId=${u.id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      u.id === selectedUnit?.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{u.identifier}{u.typology && ` — ${u.typology}`}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${STATUS_COLOR[u.status]}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Simulador */}
        <div className="lg:col-span-2">
          {!selectedUnit ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-400">Selecione uma unidade para simular.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <PaymentSimulator
                unitPrice={selectedUnit.currentPrice ? Number(selectedUnit.currentPrice) : 0}
                unitIdentifier={selectedUnit.identifier}
                tables={tables.map((t: {
                  id: string; name: string; description: string | null
                  downPaymentPct: unknown; installments: number; interestRate: unknown; indexer: string | null
                }) => ({
                  ...t,
                  downPaymentPct: Number(t.downPaymentPct),
                  interestRate:   Number(t.interestRate),
                }))}
              />
              {!selectedUnit.currentPrice && (
                <p className="mt-3 text-xs text-amber-600">
                  Esta unidade não tem preço cadastrado. Edite o valor acima para simular.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
