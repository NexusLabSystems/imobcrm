import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TenantSettingsForm from '@/components/TenantSettingsForm'

export default async function AdminSettingsPage() {
  const { profile } = await requireRole(['admin', 'manager'])

  const tenant = await prisma.tenant.findUnique({
    where: { id: profile.tenantId },
    select: { id: true, name: true, slug: true, logoUrl: true, document: true, settings: true },
  })

  if (!tenant) return null

  const settings = (tenant.settings ?? {}) as Record<string, string>

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Configurações da imobiliária</h1>
      <TenantSettingsForm tenant={tenant} approvalThreshold={settings.approvalThreshold} />
    </main>
  )
}
