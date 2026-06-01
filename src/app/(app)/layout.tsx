import { getProfile } from '@/lib/auth'
import Nav from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getProfile()

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <Nav profile={profile} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
