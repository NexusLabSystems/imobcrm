'use client'

import { useState } from 'react'
import type { UnitStatus } from '@prisma/client'

const STATUS_COLOR: Record<UnitStatus, string> = {
  available:   'bg-green-500  border-green-600',
  reserved:    'bg-yellow-400 border-yellow-500',
  sold:        'bg-red-500    border-red-600',
  unavailable: 'bg-slate-400  border-slate-500',
}

const STATUS_LABEL: Record<UnitStatus, string> = {
  available:   'Disponível',
  reserved:    'Reservada',
  sold:        'Vendida',
  unavailable: 'Indisponível',
}

type UnitPin = {
  id: string
  identifier: string
  typology: string | null
  status: UnitStatus
  currentPrice: number | null
  mapX: number
  mapY: number
}

type Props = {
  mapImageUrl: string
  units: UnitPin[]
  editHref?: string
}

export default function EnterpriseMap({ mapImageUrl, units, editHref }: Props) {
  const [popup, setPopup] = useState<UnitPin | null>(null)

  return (
    <div className="space-y-3">
      {editHref && (
        <div className="flex justify-end">
          <a
            href={editHref}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Editar posições
          </a>
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(STATUS_LABEL) as UnitStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-full border ${STATUS_COLOR[s]}`} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Mapa */}
      <div
        className="relative w-full overflow-hidden rounded-xl border"
        onClick={() => setPopup(null)}
      >
        <img
          src={mapImageUrl}
          alt="Mapa do empreendimento"
          className="w-full object-contain"
          draggable={false}
        />

        {units.map((u) => (
          <button
            key={u.id}
            onClick={(e) => { e.stopPropagation(); setPopup(popup?.id === u.id ? null : u) }}
            style={{ left: `${u.mapX}%`, top: `${u.mapY}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 shadow transition-transform hover:scale-125 ${STATUS_COLOR[u.status]}`}
            title={`Unidade ${u.identifier}`}
          />
        ))}

        {/* Popup */}
        {popup && (
          <div
            style={{ left: `${Math.min(popup.mapX + 2, 70)}%`, top: `${Math.min(popup.mapY + 2, 80)}%` }}
            className="absolute z-10 min-w-[160px] rounded-lg border bg-white p-3 shadow-lg text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-slate-900">Unidade {popup.identifier}</p>
            {popup.typology && <p className="text-slate-500">{popup.typology}</p>}
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white ${STATUS_COLOR[popup.status].split(' ')[0]}`}>
              {STATUS_LABEL[popup.status]}
            </span>
            {popup.currentPrice && (
              <p className="mt-1 font-medium text-slate-700">
                {popup.currentPrice.toLocaleString('pt-BR', {
                  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
                })}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-right">{units.length} unidade{units.length !== 1 ? 's' : ''} posicionada{units.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
