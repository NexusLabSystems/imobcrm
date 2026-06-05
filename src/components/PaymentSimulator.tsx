'use client'

import { useState } from 'react'

type PaymentTable = {
  id: string
  name: string
  description: string | null
  downPaymentPct: number
  installments: number
  interestRate: number
  indexer: string | null
}

type Props = {
  unitPrice: number
  unitIdentifier: string
  tables: PaymentTable[]
}

function calcPMT(pv: number, iMonthly: number, n: number): number {
  if (iMonthly === 0) return pv / n
  const i = iMonthly / 100
  return pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

export default function PaymentSimulator({ unitPrice, unitIdentifier, tables }: Props) {
  const [price, setPrice]           = useState(unitPrice)
  const [selectedId, setSelectedId] = useState<string | null>(tables[0]?.id ?? null)

  const selected = tables.find((t) => t.id === selectedId)

  const results = tables.map((t) => {
    const entrada     = price * (Number(t.downPaymentPct) / 100)
    const financiado  = price - entrada
    const installments = t.installments
    const parcela     = calcPMT(financiado, Number(t.interestRate), installments)
    const total       = entrada + parcela * installments
    return { ...t, entrada, financiado, parcela, total }
  })

  const sel = results.find((r) => r.id === selectedId)

  const INDEXER_LABEL: Record<string, string> = {
    INCC: 'INCC', IPCA: 'IPCA', 'IGP-M': 'IGP-M',
  }

  return (
    <div className="space-y-5">
      {/* Preço de referência */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Valor do imóvel (R$)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <p className="mb-2 text-xs text-slate-400">Unidade {unitIdentifier}</p>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma tabela cadastrada para este empreendimento.</p>
      ) : (
        <>
          {/* Selector de tabela */}
          <div className="flex flex-wrap gap-2">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  selectedId === t.id
                    ? 'bg-emerald-500 text-white ring-emerald-500'
                    : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Resultado detalhado do selecionado */}
          {sel && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{sel.name}</p>
                  {sel.description && <p className="text-xs text-emerald-700">{sel.description}</p>}
                  {sel.indexer && (
                    <p className="mt-0.5 text-xs text-emerald-600">
                      Corrigido pelo {INDEXER_LABEL[sel.indexer] ?? sel.indexer}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Entrada', value: fmt(sel.entrada), sub: `${Number(sel.downPaymentPct)}%` },
                  { label: 'Parcela mensal', value: fmt(sel.parcela), sub: `${sel.installments}× meses` },
                  { label: 'Valor financiado', value: fmt(sel.financiado), sub: Number(sel.interestRate) === 0 ? 'Sem juros' : `${Number(sel.interestRate)}% a.m.` },
                  { label: 'Total do contrato', value: fmt(sel.total), sub: ' ' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-lg bg-white px-3 py-2.5 text-center shadow-sm">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-0.5 text-base font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparativo de todas as tabelas */}
          {results.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <p className="px-5 py-3 text-xs font-semibold text-slate-500 border-b border-slate-100">
                Comparativo de tabelas
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Tabela</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Entrada</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Parcela</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map((r) => (
                      <tr
                        key={r.id}
                        className={`cursor-pointer transition-colors ${r.id === selectedId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{r.name}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-600">{fmt(r.entrada)}</td>
                        <td className="px-4 py-2.5 text-right text-xs text-slate-600">{fmt(r.parcela)}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-semibold text-slate-800">{fmt(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
