import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import KanbanBoard from '@/components/KanbanWrapper'

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ funnelId?: string }>
}) {
  const { profile } = await getProfile()
  const { funnelId } = await searchParams

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
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-slate-500">
          Nenhum funil configurado. Acesse{' '}
          <a href="/admin/funnels" className="underline">Admin → Funis</a>{' '}
          para criar um.
        </p>
      </main>
    )
  }

  return (
    <main className="flex flex-col p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{funnel.name}</h1>

        {allFunnels.length > 1 && (
          <form method="GET" className="flex items-center gap-2">
            <select
              name="funnelId"
              defaultValue={funnel.id}
              onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
              className="rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {allFunnels.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <noscript>
              <button type="submit" className="rounded-md border px-2 py-1 text-sm">Trocar</button>
            </noscript>
          </form>
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
