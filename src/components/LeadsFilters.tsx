'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo', in_progress: 'Em andamento', qualified: 'Qualificado',
  converted: 'Convertido', lost: 'Perdido', discarded: 'Descartado',
}

const STATUS_COLOR: Record<string, string> = {
  new:        'bg-sky-100 text-sky-700 ring-sky-200',
  in_progress:'bg-amber-100 text-amber-700 ring-amber-200',
  qualified:  'bg-violet-100 text-violet-700 ring-violet-200',
  converted:  'bg-emerald-100 text-emerald-700 ring-emerald-200',
  lost:       'bg-rose-100 text-rose-700 ring-rose-200',
  discarded:  'bg-slate-100 text-slate-500 ring-slate-200',
}

export default function LeadsFilters({ total }: { total: number }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const status       = searchParams.get('status') ?? ''
  const q            = searchParams.get('q') ?? ''

  const push = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
      else sp.delete(k)
    })
    sp.delete('page') // reset to page 1 on filter change
    router.push(`/leads?${sp.toString()}`)
  }, [router, searchParams])

  return (
    <div className="space-y-3">
      {/* Busca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone…"
          defaultValue={q}
          onChange={(e) => push({ q: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
        />
        {q && (
          <button
            onClick={() => push({ q: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => push({ status: '' })}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
            !status
              ? 'bg-slate-900 text-white ring-slate-900'
              : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos · {total}
        </button>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <button
            key={value}
            onClick={() => push({ status: value })}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
              status === value
                ? STATUS_COLOR[value]
                : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
