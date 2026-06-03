import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import IntegrationsForm from '@/components/IntegrationsForm'

export default async function IntegrationsPage() {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { id: true, settings: true },
  })

  const settings = (tenant?.settings ?? {}) as Record<string, string>

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Integrações</h1>
      <p className="mb-6 text-sm text-slate-500">Configure as integrações externas do seu tenant.</p>

      <IntegrationsForm
        tenantId={profile.tenantId}
        initialSettings={settings}
      />
    </main>
  )
}
