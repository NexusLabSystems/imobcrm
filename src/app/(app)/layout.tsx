import { getProfile } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getProfile()

  return (
    <div className="min-h-dvh bg-slate-50">
      <Sidebar profile={profile} />
      <div className="lg:pl-60">
        <main className="min-h-dvh">
          {children}
        </main>
      </div>
    </div>
  )
}
