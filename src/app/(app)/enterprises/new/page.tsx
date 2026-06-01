import { requireRole } from '@/lib/auth'
import EnterpriseForm from '@/components/EnterpriseForm'

export default async function NewEnterprisePage() {
  await requireRole(['admin', 'manager'])

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Novo empreendimento</h1>
      <EnterpriseForm />
    </main>
  )
}
