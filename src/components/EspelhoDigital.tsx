'use client'

import { useState } from 'react'
import type { UnitStatus } from '@prisma/client'

const STATUS_COLOR: Record<UnitStatus, string> = {
  available:   'bg-green-500  hover:bg-green-600  text-white',
  reserved:    'bg-orange-400 hover:bg-orange-500 text-white',
  sold:        'bg-red-500    hover:bg-red-600    text-white',
  unavailable: 'bg-slate-300  hover:bg-slate-400  text-slate-600',
}

const STATUS_LABEL: Record<UnitStatus, string> = {
  available:   'Disponível',
  reserved:    'Reservada',
  sold:        'Vendida',
  unavailable: 'Indisponível',
}

export type UnitCell = {
  id: string
  identifier: string
  floor: number | null
  blockId: string | null
  blockName: string | null
  status: UnitStatus
  typology: string | null
  currentPrice: number | null
  bedrooms: number | null
  areaPrivate: number | null
}

type PopupUnit = UnitCell & { position: { x: number; y: number } }

type Props = {
  units: UnitCell[]
  enterpriseId: string
}

function groupUnits(units: UnitCell[]) {
  // Agrupa por bloco (ou "Geral" se sem bloco)
  const blocks = new Map<string, { name: string; floors: Map<number, UnitCell[]> }>()

  for (const unit of units) {
    const blockKey = unit.blockId ?? '__no_block__'
    const blockName = unit.blockName ?? 'Geral'
    const floor = unit.floor ?? 0

    if (!blocks.has(blockKey)) {
      blocks.set(blockKey, { name: blockName, floors: new Map() })
    }
    const block = blocks.get(blockKey)!
    if (!block.floors.has(floor)) block.floors.set(floor, [])
    block.floors.get(floor)!.push(unit)
  }

  // Ordena unidades dentro de cada andar por identificador
  for (const block of blocks.values()) {
    for (const [floor, floorUnits] of block.floors) {
      block.floors.set(
        floor,
        [...floorUnits].sort((a, b) => a.identifier.localeCompare(b.identifier, 'pt', { numeric: true }))
      )
    }
  }

  return blocks
}

export default function EspelhoDigital({ units, enterpriseId }: Props) {
  const [popup, setPopup] = useState<PopupUnit | null>(null)

  const blocks = groupUnits(units)
  const hasMultipleBlocks = blocks.size > 1

  // Totais por status
  const totals = units.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] ?? 0) + 1
    return acc
  }, {} as Record<UnitStatus, number>)

  function openPopup(unit: UnitCell, e: React.MouseEvent) {
    if (popup?.id === unit.id) { setPopup(null); return }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopup({ ...unit, position: { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 8 } })
  }

  return (
    <div onClick={() => setPopup(null)}>
      {/* Legenda */}
      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.keys(STATUS_LABEL) as UnitStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className={`inline-block h-4 w-4 rounded ${STATUS_COLOR[s].split(' ')[0]}`} />
            {STATUS_LABEL[s]}
            {totals[s] != null && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs text-slate-500">{totals[s]}</span>
            )}
          </span>
        ))}
      </div>

      {/* Grade por bloco */}
      <div className={`grid gap-6 ${hasMultipleBlocks ? 'md:grid-cols-2' : ''}`}>
        {[...blocks.entries()].map(([blockKey, block]) => {
          const floors = [...block.floors.entries()].sort(([a], [b]) => b - a) // desc
          const maxUnitsPerFloor = Math.max(...floors.map(([, us]) => us.length))

          return (
            <div key={blockKey}>
              {hasMultipleBlocks && (
                <h3 className="mb-2 font-semibold text-slate-700">{block.name}</h3>
              )}
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-14">Andar</th>
                      {Array.from({ length: maxUnitsPerFloor }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center text-xs font-medium text-slate-400">
                          {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {floors.map(([floor, floorUnits]) => (
                      <tr key={floor} className="border-b last:border-0">
                        <td className="px-3 py-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {floor === 0 ? 'Térreo' : `${floor}º`}
                        </td>
                        {floorUnits.map((unit) => (
                          <td key={unit.id} className="px-1 py-1.5 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); openPopup(unit, e) }}
                              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${STATUS_COLOR[unit.status]} ${popup?.id === unit.id ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
                            >
                              {unit.identifier}
                            </button>
                          </td>
                        ))}
                        {/* Células vazias para alinhar */}
                        {Array.from({ length: maxUnitsPerFloor - floorUnits.length }, (_, i) => (
                          <td key={`empty-${i}`} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {/* Popup flutuante */}
      {popup && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: Math.min(popup.position.x, window.innerWidth - 220), top: popup.position.y, zIndex: 50 }}
          className="w-52 rounded-xl border bg-white p-4 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <p className="font-semibold text-slate-900">Unidade {popup.identifier}</p>
            <button onClick={() => setPopup(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          {popup.typology && <p className="mt-0.5 text-xs text-slate-500">{popup.typology}</p>}

          <span className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[popup.status]}`}>
            {STATUS_LABEL[popup.status]}
          </span>

          <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
            {popup.floor != null && popup.floor > 0 && <div><dt className="inline text-slate-400">Andar: </dt><dd className="inline">{popup.floor}º</dd></div>}
            {popup.bedrooms != null && <div><dt className="inline text-slate-400">Dorms: </dt><dd className="inline">{popup.bedrooms}</dd></div>}
            {popup.areaPrivate != null && <div><dt className="inline text-slate-400">Área: </dt><dd className="inline">{popup.areaPrivate}m²</dd></div>}
            {popup.currentPrice != null && (
              <div className="mt-1 font-semibold text-slate-800 text-sm">
                {popup.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
            )}
          </dl>

          <a
            href={`/enterprises/${enterpriseId}`}
            className="mt-3 block text-center text-xs text-slate-400 underline hover:text-slate-600"
          >
            Ver empreendimento
          </a>
        </div>
      )}
    </div>
  )
}
