'use client'

import { useState, useTransition, useRef } from 'react'
import { setUnitMapPosition, removeUnitMapPosition } from '@/actions/units'
import { setMapImage } from '@/actions/enterprises'
import { createClient } from '@/lib/supabase/client'
import type { UnitStatus } from '@prisma/client'

const STATUS_COLOR: Record<UnitStatus, string> = {
  available:   'bg-green-500',
  reserved:    'bg-yellow-400',
  sold:        'bg-red-500',
  unavailable: 'bg-slate-400',
}

type UnitItem = {
  id: string
  identifier: string
  typology: string | null
  status: UnitStatus
  mapX: number | null
  mapY: number | null
}

type Props = {
  enterpriseId: string
  mapImageUrl: string | null
  units: UnitItem[]
}

export default function MapEditor({ enterpriseId, mapImageUrl: initialMapUrl, units: initialUnits }: Props) {
  const [mapUrl, setMapUrl] = useState(initialMapUrl)
  const [units, setUnits] = useState(initialUnits)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const mapRef = useRef<HTMLDivElement>(null)

  const positioned = units.filter((u) => u.mapX != null && u.mapY != null)
  const unpositioned = units.filter((u) => u.mapX == null || u.mapY == null)
  const selectedUnit = units.find((u) => u.id === selectedId)

  async function handleMapUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const path = `maps/${enterpriseId}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('enterprises').upload(path, file, { contentType: file.type })
    if (error) { setUploading(false); alert('Erro ao enviar imagem.'); return }
    const { data } = supabase.storage.from('enterprises').getPublicUrl(path)
    setMapUrl(data.publicUrl)
    startTransition(() => setMapImage(enterpriseId, data.publicUrl))
    setUploading(false)
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedId || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const rounded = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }

    setUnits((prev) =>
      prev.map((u) => u.id === selectedId ? { ...u, mapX: rounded.x, mapY: rounded.y } : u)
    )
    startTransition(() => setUnitMapPosition(selectedId, rounded.x, rounded.y))
    setSelectedId(null)
  }

  function handleRemove(unitId: string) {
    setUnits((prev) => prev.map((u) => u.id === unitId ? { ...u, mapX: null, mapY: null } : u))
    startTransition(() => removeUnitMapPosition(unitId))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Painel lateral */}
      <div className="lg:col-span-1 space-y-4">
        {/* Upload da imagem */}
        <div className="rounded-lg border bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Imagem do mapa</p>
          <input
            type="file" accept="image/*" onChange={handleMapUpload}
            disabled={uploading}
            className="w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs"
          />
          {uploading && <p className="mt-1 text-xs text-slate-400">Enviando…</p>}
        </div>

        {/* Unidades sem posição */}
        {unpositioned.length > 0 && (
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Clique para posicionar:
            </p>
            <ul className="space-y-1">
              {unpositioned.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => setSelectedId(selectedId === u.id ? null : u.id)}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                      selectedId === u.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {u.identifier}
                    {u.typology && <span className="ml-1 text-xs opacity-70">{u.typology}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unidades posicionadas */}
        {positioned.length > 0 && (
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Posicionadas:</p>
            <ul className="space-y-1">
              {positioned.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-slate-700">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[u.status]}`} />
                    {u.identifier}
                  </span>
                  <button
                    onClick={() => handleRemove(u.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isPending && <p className="text-xs text-slate-400">Salvando…</p>}
      </div>

      {/* Mapa */}
      <div className="lg:col-span-3">
        {!mapUrl ? (
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400">
            Envie a imagem do mapa para começar
          </div>
        ) : (
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className={`relative w-full overflow-hidden rounded-xl border ${
              selectedId ? 'cursor-crosshair ring-2 ring-slate-900' : 'cursor-default'
            }`}
          >
            {selectedId && (
              <div className="absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1 text-xs text-white shadow">
                Clique no mapa para posicionar "{selectedUnit?.identifier}"
              </div>
            )}
            <img src={mapUrl} alt="Mapa" className="w-full object-contain" draggable={false} />
            {units
              .filter((u) => u.mapX != null && u.mapY != null)
              .map((u) => (
                <button
                  key={u.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(u.id) }}
                  style={{ left: `${u.mapX}%`, top: `${u.mapY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white shadow hover:scale-125 transition-transform ${STATUS_COLOR[u.status]}`}
                  title={`Unidade ${u.identifier} — clique para reposicionar`}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
