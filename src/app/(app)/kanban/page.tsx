import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import KanbanBoard from '@/components/KanbanWrapper'

export default async function KanbanPage() {
  const { profile } = await getProfile()

  const funnel = await prisma.funnel.findFirst({
    where: { tenantId: profile.tenantId, isDefault: true, deletedAt: null },
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
  })

  if (!funnel) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-slate-500">
          Nenhum funil configurado. Execute{' '}
          <code className="rounded bg-slate-100 px-1">supabase/seed_funnel.sql</code>{' '}
          no SQL Editor do Supabase.
        </p>
      </main>
    )
  }

  return (
    <main className="flex flex-col p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{funnel.name}</h1>
      <KanbanBoard
        stages={funnel.stages}
        funnelId={funnel.id}
        tenantId={profile.tenantId}
      />
    </main>
  )
}
