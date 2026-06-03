import type { Role } from '@prisma/client'

type Props = {
  profile: { name: string; role: Role }
}

export default function Nav({ profile }: Props) {
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-tight text-slate-900">ImobCRM</span>
          <nav className="flex gap-4 text-sm text-slate-600">
            <a href="/" className="hover:text-slate-900">Início</a>
            <a href="/leads" className="hover:text-slate-900">Leads</a>
            <a href="/kanban" className="hover:text-slate-900">Kanban</a>
            <a href="/enterprises" className="hover:text-slate-900">Empreendimentos</a>
            <a href="/proposals" className="hover:text-slate-900">Propostas</a>
            {isAdmin && (
              <a href="/admin" className="hover:text-slate-900">Admin</a>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <a href="/profile/security" className="text-sm text-slate-600 hover:text-slate-900">
            {profile.name}
          </a>
          <form action="/auth/signout" method="post">
            <button className="rounded border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
