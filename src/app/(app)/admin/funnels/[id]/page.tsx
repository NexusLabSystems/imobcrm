import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createStage, updateStage, deleteStage,
  moveStageOrder, updateFunnel, deleteFunnel,
} from '@/actions/funnels'

export default async function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireRole(['admin', 'manager'])
  const { id } = await params

  const funnel = await prisma.funnel.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    include: {
      stages: { orderBy: { order: 'asc' }, include: { _count: { select: { leads: true } } } },
    },
  })

  if (!funnel) notFound()

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-1 text-sm text-slate-500">
        <a href="/admin/funnels" className="hover:underline">Funis</a> › {funnel.name}
      </div>

      {/* Editar funil */}
      <div className="mt-4 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Configurações do funil</h2>
        <form action={updateFunnel} className="flex flex-wrap gap-3">
          <input type="hidden" name="funnelId" value={funnel.id} />
          <input
            name="name" type="text" required defaultValue={funnel.name}
            className="flex-1 min-w-48 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isDefault" value="true" defaultChecked={funnel.isDefault} />
            Funil padrão
          </label>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Salvar
          </button>
        </form>

        {!funnel.isDefault && funnel.stages.every((s) => s._count.leads === 0) && (
          <form action={deleteFunnel} className="mt-3">
            <input type="hidden" name="funnelId" value={funnel.id} />
            <button type="submit" className="text-xs text-red-500 underline hover:text-red-700">
              Excluir este funil
            </button>
          </form>
        )}
      </div>

      {/* Etapas */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-slate-900">Etapas</h2>

        <div className="space-y-3">
          {funnel.stages.map((stage, idx) => (
            <div key={stage.id} className="rounded-xl border bg-white p-4">
              <form action={updateStage} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <input type="hidden" name="stageId" value={stage.id} />
                <input type="hidden" name="funnelId" value={funnel.id} />

                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    name="color" type="color" defaultValue={stage.color}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded border"
                  />
                  <input
                    name="name" type="text" required defaultValue={stage.name}
                    className="flex-1 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 whitespace-nowrap">Prob. %</label>
                  <input
                    name="probabilityWeight" type="number" min="0" max="100"
                    defaultValue={stage.probabilityWeight}
                    className="w-16 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 whitespace-nowrap">SLA (dias)</label>
                  <input
                    name="maxDays" type="number" min="1"
                    defaultValue={stage.maxDays ?? ''}
                    placeholder="—"
                    className="w-16 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button type="submit" className="rounded-md bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                    Salvar
                  </button>
                </div>
              </form>

              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>{stage._count.leads} lead{stage._count.leads !== 1 ? 's' : ''}</span>

                {/* Reordenar */}
                <form action={moveStageOrder} className="inline-flex gap-1">
                  <input type="hidden" name="stageId" value={stage.id} />
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <button name="direction" value="up" disabled={idx === 0}
                    className="rounded px-1 hover:bg-slate-100 disabled:opacity-30">↑</button>
                  <button name="direction" value="down" disabled={idx === funnel.stages.length - 1}
                    className="rounded px-1 hover:bg-slate-100 disabled:opacity-30">↓</button>
                </form>

                {/* Excluir */}
                {stage._count.leads === 0 && (
                  <form action={deleteStage}>
                    <input type="hidden" name="stageId" value={stage.id} />
                    <input type="hidden" name="funnelId" value={funnel.id} />
                    <button type="submit" className="text-red-400 hover:text-red-600">
                      excluir etapa
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nova etapa */}
        <div className="mt-4 rounded-xl border bg-white p-5">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Nova etapa</h3>
          <form action={createStage} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input type="hidden" name="funnelId" value={funnel.id} />

            <div className="flex items-center gap-2 sm:col-span-2">
              <input name="color" type="color" defaultValue="#3B82F6"
                className="h-8 w-8 shrink-0 cursor-pointer rounded border" />
              <input name="name" type="text" required placeholder="Nome da etapa"
                className="flex-1 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Prob. %</label>
              <input name="probabilityWeight" type="number" min="0" max="100" defaultValue="10"
                className="w-16 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">SLA (dias)</label>
              <input name="maxDays" type="number" min="1" placeholder="—"
                className="w-16 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
              <button type="submit"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
                + Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
