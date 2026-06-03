import { getProfile } from '@/lib/auth'
import LeadImportForm from '@/components/LeadImportForm'

export default async function ImportLeadsPage() {
  await getProfile()

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          <a href="/leads" className="hover:underline">Leads</a> › Importar CSV
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Importar leads via CSV</h1>
      </div>
      <LeadImportForm />
    </main>
  )
}
