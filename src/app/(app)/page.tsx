import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function HomePage() {
  const { profile } = await getProfile()
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'
  const tenantId = profile.tenantId

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [myLeads, myPendingProposals, myActivitiesThisWeek] = await Promise.all([
    prisma.lead.count({
      where: { tenantId, assignedTo: profile.id, deletedAt: null, createdAt: { gte: startOfMonth } },
    }),
    prisma.proposal.count({
      where: { tenantId, status: 'pending_approval', deletedAt: null },
    }),
    prisma.activity.count({
      where: {
        tenantId,
        userId: profile.id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Olá, {profile.name}
      </h1>
      <p className="mt-0.5 text-sm text-slate-500 capitalize">Perfil: {profile.role}</p>

      {/* KPIs do usuário */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{myLeads}</p>
          <p className="text-sm text-slate-500">Leads este mês</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{myPendingProposals}</p>
          <p className="text-sm text-slate-500">Propostas pendentes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{myActivitiesThisWeek}</p>
          <p className="text-sm text-slate-500">Atividades (7 dias)</p>
        </div>
      </div>

      {/* Atalhos */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/leads" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Leads</p>
          <p className="text-sm text-slate-500">Ver e criar leads</p>
        </Link>
        <Link href="/kanban" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Kanban</p>
          <p className="text-sm text-slate-500">Funil de vendas</p>
        </Link>
        <Link href="/enterprises" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Empreendimentos</p>
          <p className="text-sm text-slate-500">Unidades e fotos</p>
        </Link>
        <Link href="/proposals" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
          <p className="font-medium text-slate-900">Propostas</p>
          <p className="text-sm text-slate-500">Criar e acompanhar</p>
        </Link>
        {isAdmin && (
          <Link href="/admin" className="rounded-lg border bg-white px-5 py-4 hover:shadow-sm">
            <p className="font-medium text-slate-900">Dashboard</p>
            <p className="text-sm text-slate-500">KPIs e gestão</p>
          </Link>
        )}
      </div>
    </main>
  )
}
