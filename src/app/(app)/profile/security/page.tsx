import { getProfile } from '@/lib/auth'
import MfaSetup from '@/components/MfaSetup'

export default async function SecurityPage() {
  const { profile } = await getProfile()

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Segurança da conta</h1>
      <p className="mt-0.5 text-sm text-slate-500">{profile.email}</p>

      <div className="mt-6">
        <MfaSetup />
      </div>
    </main>
  )
}
