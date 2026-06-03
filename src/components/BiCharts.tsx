'use client'

type SeriesItem = { label: string; value: number }
type FunnelItem = { name: string; color: string; count: number; pct: number; probability: number }

type Props = {
  series: SeriesItem[]
  funnelData: FunnelItem[]
  days: number
}

export default function BiCharts({ series, funnelData, days }: Props) {
  const maxSeries = Math.max(1, ...series.map((s) => s.value))

  // Mostra no máximo 30 barras para não ficar apertado
  const visible = days <= 30 ? series : series.filter((_, i) => i % Math.ceil(series.length / 30) === 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Leads por período */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Leads por dia</h2>
        {series.every((s) => s.value === 0) ? (
          <p className="py-8 text-center text-sm text-slate-400">Nenhum lead neste período.</p>
        ) : (
          <div className="flex items-end gap-0.5 h-40 mt-2">
            {visible.map((item, i) => (
              <div
                key={i}
                className="group relative flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-full rounded-t bg-slate-900 transition-all group-hover:bg-slate-700"
                  style={{ height: `${(item.value / maxSeries) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                />
                {/* Tooltip */}
                {item.value > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                    <div className="rounded bg-slate-900 px-2 py-1 text-xs text-white whitespace-nowrap">
                      {item.label}: {item.value}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{visible[0]?.label}</span>
          <span>{visible[visible.length - 1]?.label}</span>
        </div>
      </div>

      {/* Funil de conversão */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Funil de conversão</h2>
        {funnelData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Nenhuma etapa configurada.</p>
        ) : (
          <div className="space-y-3">
            {funnelData.map((stage) => (
              <div key={stage.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                    {stage.name}
                  </span>
                  <span className="text-slate-500">
                    {stage.count} lead{stage.count !== 1 ? 's' : ''} · {stage.probability}% prob.
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-100">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{ width: `${stage.pct}%`, background: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
