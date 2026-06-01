import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, role: true },
  })

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4">
      <h1 className="text-2xl font-semibold">ImobCRM</h1>
      <p>Olá, {profile?.name ?? user.email}!</p>
      <p className="text-sm text-slate-500">Perfil: {profile?.role}</p>
      <form action="/auth/signout" method="post">
        <button className="rounded-md border px-3 py-2">Sair</button>
      </form>
    </main>
  )
}