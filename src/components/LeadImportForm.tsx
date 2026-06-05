'use client'

import { useState, useRef } from 'react'

type RowResult = { row: number; name: string; status: 'ok' | 'error'; message?: string }
type Phase = 'idle' | 'importing' | 'done'

export default function LeadImportForm() {
  const [phase,     setPhase]     = useState<Phase>('idle')
  const [total,     setTotal]     = useState(0)
  const [processed, setProcessed] = useState(0)
  const [results,   setResults]   = useState<RowResult[]>([])
  const [error,     setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const okCount  = results.filter((r) => r.status === 'ok').length
  const errCount = results.filter((r) => r.status === 'error').length
  const pct      = total > 0 ? Math.round((processed / total) * 100) : 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setError(null)
    setResults([])
    setProcessed(0)
    setTotal(0)
    setPhase('importing')

    const formData = new FormData()
    formData.append('file', file)

    let response: Response
    try {
      response = await fetch('/api/leads/import', { method: 'POST', body: formData })
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setPhase('idle')
      return
    }

    if (!response.ok || !response.body) {
      const msg = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      setError(msg.error ?? 'Erro ao importar')
      setPhase('idle')
      return
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''  // guarda linha incompleta

      for (const raw of lines) {
        if (!raw.trim()) continue
        try {
          const msg = JSON.parse(raw)
          if (msg.type === 'total') {
            setTotal(msg.total)
          } else if (msg.type === 'row') {
            const { type: _, ...row } = msg
            setResults((prev) => [...prev, row as RowResult])
            setProcessed((n) => n + 1)
          }
          // 'done' ignorado aqui — usamos state para detectar fim
        } catch { /* linha incompleta, ignorar */ }
      }
    }

    setPhase('done')
  }

  function handleReset() {
    setPhase('idle')
    setResults([])
    setProcessed(0)
    setTotal(0)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5">

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Arquivo CSV <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileRef}
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={phase === 'importing'}
            className="w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200 disabled:opacity-50"
          />
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">Formato esperado (cabeçalho na primeira linha):</p>
          <code className="block font-mono text-slate-700">name,email,phone,source</code>
          <p>ou em português: <code className="font-mono">nome,email,telefone,origem</code></p>
          <p className="mt-1">Origens válidas: <code className="font-mono">website · facebook · instagram · indicacao · portais · manual · importacao</code></p>
          <p>Coluna obrigatória: <strong>name / nome</strong>. As demais são opcionais.</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={phase === 'importing'}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === 'importing' ? 'Importando…' : 'Importar leads'}
          </button>
          <a
            href="/leads"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </a>
        </div>
      </form>

      {/* Progresso em tempo real */}
      {(phase === 'importing' || phase === 'done') && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">

          {/* Barra de progresso */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {phase === 'importing'
                  ? `Processando… ${processed}${total ? ` de ${total}` : ''}`
                  : `Concluído — ${okCount} importado${okCount !== 1 ? 's' : ''}${errCount > 0 ? `, ${errCount} erro${errCount !== 1 ? 's' : ''}` : ''}`}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-500">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${phase === 'done' ? (errCount > 0 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-emerald-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Sumário quando terminar */}
          {phase === 'done' && (
            <div className="flex flex-wrap items-center gap-3">
              {okCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {okCount} criado{okCount !== 1 ? 's' : ''}
                </span>
              )}
              {errCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  {errCount} erro{errCount !== 1 ? 's' : ''}
                </span>
              )}
              <div className="ml-auto flex gap-2">
                {okCount > 0 && (
                  <a
                    href="/leads"
                    className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                  >
                    Ver leads →
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Nova importação
                </button>
              </div>
            </div>
          )}

          {/* Tabela de resultados (cresce em tempo real) */}
          {results.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Linha</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Nome</th>
                    <th className="px-3 py-2 text-xs font-semibold text-slate-500">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.row} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs text-slate-400 tabular-nums">{r.row}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{r.name}</td>
                      <td className="px-3 py-2">
                        {r.status === 'ok' ? (
                          <span className="text-emerald-600 text-xs font-medium">✓ OK</span>
                        ) : (
                          <span className="text-red-600 text-xs">✗ {r.message}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
