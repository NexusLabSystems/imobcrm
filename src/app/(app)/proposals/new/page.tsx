import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProposal } from '@/actions/proposals'

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; enterpriseId?: string }>
}) {
  const { profile } = await getProfile()
  const { leadId, enterpriseId } = await searchParams

  const [lead, enterprises, units] = await Promise.all([
    leadId
      ? prisma.lead.findFirst({
          where: { id: leadId, tenantId: profile.tenantId },
          select: { id: true, name: true },
        })
      : null,
    prisma.enterprise.findMany({
      where: { tenantId: profile.tenantId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    enterpriseId
      ? prisma.unit.findMany({
          where: { enterpriseId, tenantId: profile.tenantId, status: 'available', deletedAt: null },
          select: { id: true, identifier: true, typology: true, currentPrice: true },
          orderBy: { identifier: 'asc' },
        })
      : [],
  ])

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Nova proposta</h1>
      {lead && (
        <p className="mb-4 text-sm text-slate-600">
          Lead: <span className="font-medium">{lead.name}</span>
        </p>
      )}

      {/* Passo 1: selecionar empreendimento via GET (sem JS) */}
      {!enterpriseId && (
        <form method="GET" className="space-y-4 rounded-lg border bg-white p-6">
          {leadId && <input type="hidden" name="leadId" value={leadId} />}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Empreendimento <span className="text-red-500">*</span>
            </label>
            <select
              name="enterpriseId"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Selecione…</option>
              {enterprises.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Ver unidades disponíveis →
          </button>
        </form>
      )}

      {/* Passo 2: preencher proposta após escolher empreendimento */}
      {enterpriseId && (
        <form action={createProposal} className="space-y-4 rounded-lg border bg-white p-6">
          {leadId && <input type="hidden" name="leadId" value={leadId} />}
          <input type="hidden" name="enterpriseId" value={enterpriseId} />

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Unidade disponível <span className="text-red-500">*</span>
            </label>
            {units.length === 0 ? (
              <div>
                <p className="text-sm text-red-500">Nenhuma unidade disponível neste empreendimento.</p>
                <a
                  href={`/proposals/new${leadId ? `?leadId=${leadId}` : ''}`}
                  className="mt-2 inline-block text-sm text-slate-500 underline"
                >
                  ← Escolher outro empreendimento
                </a>
              </div>
            ) : (
              <>
                <select
                  name="unitId"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Selecione…</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.identifier}{u.typology ? ` — ${u.typology}` : ''}
                      {u.currentPrice
                        ? ` — ${Number(u.currentPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`
                        : ''}
                    </option>
                  ))}
                </select>
                <a
                  href={`/proposals/new${leadId ? `?leadId=${leadId}` : ''}`}
                  className="mt-1 inline-block text-xs text-slate-400 underline"
                >
                  ← Trocar empreendimento
                </a>
              </>
            )}
          </div>

          {units.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Valor proposto (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="proposedValue" type="number" step="0.01" min="0" required
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Entrada (R$)</label>
                  <input
                    name="downPayment" type="number" step="0.01" min="0"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Parcelas</label>
                  <input
                    name="installments" type="number" min="1"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Financiamento</label>
                  <select
                    name="financingType"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Nenhum</option>
                    <option value="caixa">Caixa Econômica</option>
                    <option value="bancario">Financiamento bancário</option>
                    <option value="direto">Direto com construtora</option>
                    <option value="consorcio">Consórcio</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Observações</label>
                <textarea
                  name="notes" rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Enviar para aprovação
                </button>
                <a
                  href="/proposals"
                  className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </a>
              </div>
            </>
          )}
        </form>
      )}
    </main>
  )
}
