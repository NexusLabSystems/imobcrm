'use client'

import { useState, useTransition } from 'react'
import { importLeadsFromCSV } from '@/actions/leads'

type Result = { row: number; name: string; status: 'ok' | 'error'; message?: string }

export default function LeadImportForm() {
  const [results, setResults] = useState<Result[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResults(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const res = await importLeadsFromCSV(formData)
        setResults(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao importar')
      }
    })
  }

  const ok    = results?.filter((r) => r.status === 'ok').length ?? 0
  const errors = results?.filter((r) => r.status === 'error').length ?? 0

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Arquivo CSV <span className="text-red-500">*</span>
          </label>
          <input
            name="file" type="file" accept=".csv,text/csv" required
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">Formato esperado (cabeçalho na primeira linha):</p>
          <code className="block font-mono">name,email,phone,source</code>
          <p>ou em português: <code className="font-mono">nome,email,telefone,origem</code></p>
          <p className="mt-1">Origens válidas: <code className="font-mono">website · facebook · instagram · indicacao · portais · manual · importacao</code></p>
          <p>Colunas obrigatórias: <strong>name / nome</strong>. As demais são opcionais.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit" disabled={isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isPending ? 'Importando…' : 'Importar leads'}
          </button>
          <a href="/leads" className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </a>
        </div>
      </form>

      {results && (
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-green-700">{ok} importado{ok !== 1 ? 's' : ''}</span>
            {errors > 0 && <span className="text-sm font-medium text-red-600">{errors} erro{errors !== 1 ? 's' : ''}</span>}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-slate-500">
                <th className="pb-2 pr-4">Linha</th>
                <th className="pb-2 pr-4">Nome</th>
                <th className="pb-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.row} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-slate-400">{r.row}</td>
                  <td className="py-2 pr-4 font-medium text-slate-700">{r.name}</td>
                  <td className="py-2">
                    {r.status === 'ok' ? (
                      <span className="text-green-600">✓ OK</span>
                    ) : (
                      <span className="text-red-600">✗ {r.message}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ok > 0 && (
            <a href="/leads" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
              Ver leads importados →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
