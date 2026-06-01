'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { moveLeadToStage } from '@/actions/leads'

// ── Tipos ──────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  funnelStageId: string | null
  assignee: { name: string } | null
}

type StageRow = {
  id: string
  name: string
  color: string
  order: number
  leads: LeadRow[]
}

// ── Card (arrastável) ───────────────────────────────────────────────────────

function LeadCard({ lead, overlay = false }: { lead: LeadRow; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className="rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing select-none"
    >
      <p className="text-sm font-medium text-slate-900">{lead.name}</p>
      {lead.phone && <p className="mt-0.5 text-xs text-slate-500">{lead.phone}</p>}
      {lead.assignee && (
        <p className="mt-1 text-xs text-slate-400">{lead.assignee.name}</p>
      )}
    </div>
  )
}

// ── Coluna (alvo de drop) ────────────────────────────────────────────────────

function KanbanColumn({ stage, leads }: { stage: StageRow; leads: LeadRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: stage.color }}
        />
        <span className="text-sm font-medium text-slate-700">{stage.name}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors ${
          isOver ? 'bg-slate-200' : 'bg-slate-100'
        } min-h-32`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}

// ── Board principal ──────────────────────────────────────────────────────────

type Props = {
  stages: StageRow[]
  funnelId: string
  tenantId: string
}

export default function KanbanBoard({ stages: initialStages, funnelId, tenantId }: Props) {
  const [stages, setStages] = useState(initialStages)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Supabase Realtime — atualiza o board quando qualquer cliente mover um card
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('kanban-leads')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          const updated = payload.new as {
            id: string
            funnel_stage_id: string | null
            name: string
            phone: string | null
            email: string | null
          }

          setStages((prev) => {
            // Remove o lead de qualquer coluna onde esteja
            const cleared = prev.map((s) => ({
              ...s,
              leads: s.leads.filter((l) => l.id !== updated.id),
            }))

            if (!updated.funnel_stage_id) return cleared

            // Re-insere na nova coluna
            return cleared.map((s) => {
              if (s.id !== updated.funnel_stage_id) return s
              const existing = initialStages
                .flatMap((st) => st.leads)
                .find((l) => l.id === updated.id)
              const lead: LeadRow = existing
                ? { ...existing, funnelStageId: updated.funnel_stage_id }
                : {
                    id: updated.id,
                    name: updated.name,
                    phone: updated.phone,
                    email: updated.email,
                    funnelStageId: updated.funnel_stage_id,
                    assignee: null,
                  }
              return { ...s, leads: [lead, ...s.leads] }
            })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  function findStage(leadId: string) {
    return stages.find((s) => s.leads.some((l) => l.id === leadId))
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const fromStage = findStage(active.id as string)
    const toStage = stages.find((s) => s.id === over.id)

    if (!fromStage || !toStage || fromStage.id === toStage.id) return

    const lead = fromStage.leads.find((l) => l.id === active.id)!

    // Atualização otimista
    setStages((prev) =>
      prev.map((s) => {
        if (s.id === fromStage.id) return { ...s, leads: s.leads.filter((l) => l.id !== lead.id) }
        if (s.id === toStage.id) return { ...s, leads: [lead, ...s.leads] }
        return s
      })
    )

    // Persiste no banco (Realtime notificará os outros clientes)
    const fd = new FormData()
    fd.append('leadId', lead.id)
    fd.append('stageId', toStage.id)
    fd.append('funnelId', funnelId)
    await moveLeadToStage(fd)
  }

  const activeCard = activeId
    ? stages.flatMap((s) => s.leads).find((l) => l.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage} leads={stage.leads} />
        ))}
      </div>

      <DragOverlay>
        {activeCard && <LeadCard lead={activeCard} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
