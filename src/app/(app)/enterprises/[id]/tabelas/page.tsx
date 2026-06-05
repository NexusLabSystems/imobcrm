import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPaymentTable, deletePaymentTable } from '@/actions/payment-tables'
import DeleteButton from '@/components/DeleteButton'

const INDEXER_LABEL: Record<string, string> = {
  INCC: 'INCC', IPCA: 'IPCA', 'IGP-M': 'IGP-M', sem: 'Sem correção',
}

export default async function PaymentTablesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['admin', 'manager'])
  const { id } = await params
  const { profile } = await requireRole(['admin', 'manager'])

  const enterprise = await prisma.enterprise.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    select: { id: true, name: true },
  })
  if (!enterprise) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tables = await (prisma as any).paymentTable.findMany({
    where: { tenantId: profile.tenantId, enterpriseId: id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/enterprises" className="hover:text-slate-600">Empreendimentos</Link>
        <span>›</span>
        <Link href={`/enterprises/${id}`} className="hover:text-slate-600">{enterprise.name}</Link>
        <span>›</span>
        <span className="text-slate-600">Tabelas de pagamento</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Tabelas de pagamento</h1>
      </div>

      {/* Lista de tabelas */}
      {tables.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {tables.map((t: {
              id: string; name: string; description: string | null
              downPaymentPct: number; installments: number; interestRate: number
              indexer: string | null; isActive: boolean
            }) => (
              <li key={t.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{t.name}</p>
                      {!t.isActive && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">inativa</span>
                      )}
                    </div>
                    {t.description && <p className="mt-0.5 text-xs text-slate-400">{t.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Entrada:</span>
                        <span className="font-medium text-slate-700">{Number(t.downPaymentPct)}%</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Parcelas:</span>
                        <span className="font-medium text-slate-700">{t.installments}×</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Juros:</span>
                        <span className="font-medium text-slate-700">
                          {Number(t.interestRate) === 0 ? 'Sem juros' : `${Number(t.interestRate)}% a.m.`}
                        </span>
                      </span>
                      {t.indexer && (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Correção:</span>
                          <span className="font-medium text-slate-700">{INDEXER_LABEL[t.indexer] ?? t.indexer}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <form action={deletePaymentTable}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="enterpriseId" value={id} />
                    <DeleteButton message="Excluir esta tabela de pagamento?" />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulário para nova tabela */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-slate-800">Nova tabela de pagamento</h2>
        <form action={createPaymentTable} className="space-y-4">
          <input type="hidden" name="enterpriseId" value={id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Nome da tabela *</label>
              <input
                name="name" required placeholder="Ex: Plano Facilit, À Vista, Financiado 120×"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Descrição</label>
              <input
                name="description" placeholder="Opcional"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Entrada (%)</label>
              <input
                name="downPaymentPct" type="number" min="0" max="100" step="0.01"
                defaultValue="20" required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Nº de parcelas</label>
              <input
                name="installments" type="number" min="1" max="480"
                defaultValue="120" required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Taxa de juros a.m. (%)</label>
              <input
                name="interestRate" type="number" min="0" step="0.0001"
                defaultValue="0" required
                placeholder="0 = sem juros"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Indexador</label>
              <select
                name="indexer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="">Sem correção</option>
                <option value="INCC">INCC</option>
                <option value="IPCA">IPCA</option>
                <option value="IGP-M">IGP-M</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
            >
              Criar tabela
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
