import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDefaultFunnel } from '@/actions/funnels'
import KanbanBoard from '@/components/KanbanWrapper'

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ funnelId?: string }>
}) {
  const { profile } = await getProfile()
  const { funnelId } = await searchParams
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  const [funnel, allFunnels] = await Promise.all([
    prisma.funnel.findFirst({
      where: {
        tenantId: profile.tenantId,
        deletedAt: null,
        ...(funnelId ? { id: funnelId } : { isDefault: true }),
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            leads: {
              where: { deletedAt: null },
              include: { assignee: { select: { name: true } } },
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
    }),
    prisma.funnel.findMany({
      where: { tenantId: profile.tenantId, deletedAt: null },
      select: { id: true, name: true, isDefault: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
  ])

  if (!funnel) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800">Nenhum funil configurado</h2>
          <p className="mt-2 text-sm text-slate-500">
            O Kanban precisa de um funil de vendas com etapas definidas para organizar seus leads.
          </p>
          {isAdmin ? (
            <form action={createDefaultFunnel} className="mt-6">
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
              >
                Criar funil padrão imobiliário
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Cria automaticamente: Primeiro Contato → Qualificação → Visita → Proposta → Negociação → Fechado
              </p>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Peça a um administrador para criar o funil em{' '}
              <span className="font-medium">Admin → Funis</span>.
            </p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col h-full p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Kanban</h1>
          <span className="text-sm text-slate-400">·</span>
          {allFunnels.length > 1 ? (
            <form method="GET" className="flex items-center gap-2">
              <select
                name="funnelId"
                defaultValue={funnel.id}
                onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none"
              >
                {allFunnels.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </form>
          ) : (
            <span className="text-sm text-slate-600">{funnel.name}</span>
          )}
        </div>
        {isAdmin && (
          <a
            href="/admin/funnels"
            className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            Editar etapas →
          </a>
        )}
      </div>

      <KanbanBoard
        stages={funnel.stages}
        funnelId={funnel.id}
        tenantId={profile.tenantId}
      />
    </main>
  )
}
