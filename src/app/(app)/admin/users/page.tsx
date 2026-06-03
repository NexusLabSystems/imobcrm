import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { inviteUser, updateUserRole, toggleUserActive } from '@/actions/users'
import type { Role } from '@prisma/client'

const ROLE_LABEL: Record<Role, string> = {
  admin:       'Admin',
  manager:     'Gerente',
  coordinator: 'Coordenador',
  broker:      'Corretor',
  partner:     'Parceiro',
}

export default async function AdminUsersPage() {
  const { profile } = await requireRole(['admin', 'manager'])

  const users = await prisma.user.findMany({
    where: { tenantId: profile.tenantId },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
      <p className="mt-0.5 text-sm text-slate-500">{users.length} usuário{users.length !== 1 ? 's' : ''} neste tenant</p>

      {/* Convidar */}
      <div className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Convidar usuário</h2>
        <form action={inviteUser} className="flex flex-wrap gap-3">
          <input name="name" type="text" required placeholder="Nome completo"
            className="flex-1 min-w-40 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          <input name="email" type="email" required placeholder="E-mail"
            className="flex-1 min-w-48 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          <select name="role"
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
            {Object.entries(ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Enviar convite
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          O usuário receberá um e-mail com link para definir a senha e acessar o sistema.
        </p>
      </div>

      {/* Lista */}
      <div className="mt-6 rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>

                {/* Mudar role */}
                <td className="px-4 py-3">
                  {u.id === profile.id ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {ROLE_LABEL[u.role]} (você)
                    </span>
                  ) : (
                    <form action={updateUserRole}>
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role}
                        onChange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
                        className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900">
                        {Object.entries(ROLE_LABEL).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </form>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {u.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>

                {/* Ativar/Desativar */}
                <td className="px-4 py-3">
                  {u.id !== profile.id && (
                    <form action={toggleUserActive}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit"
                        className="text-xs text-slate-400 underline hover:text-slate-700">
                        {u.isActive ? 'Desativar' : 'Reativar'}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
