import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createLeadQueue, deleteLeadQueue } from '@/actions/queues'
import DeleteButton from '@/components/DeleteButton'
import type { LeadSource } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const SOURCE_LABEL: Record<LeadSource, string> = {
  website: 'Site', facebook: 'Facebook', instagram: 'Instagram',
  indicacao: 'Indicação', portais: 'Portais', manual: 'Manual', importacao: 'Importação',
}

export default async function FilasPage() {
  const { profile } = await requireRole(['admin', 'manager'])
  const tenantId = profile.tenantId

  const [queues, brokers, enterprises] = await Promise.all([
    db.leadQueue.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true, deletedAt: null, role: { in: ['broker', 'coordinator', 'manager'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.enterprise.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Filas de distribuição</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Distribua leads automaticamente entre corretores por round-robin
        </p>
      </div>

      {/* Como funciona */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm font-medium text-blue-800">Como funciona</p>
        <p className="mt-1 text-xs text-blue-700">
          Quando um lead chega via API ou webhook, o sistema encontra a fila que combina com a origem e o empreendimento,
          e atribui automaticamente ao próximo corretor em sequência (round-robin).
          Use o endpoint <code className="font-mono bg-blue-100 px-1 rounded">/api/leads/inbound</code> para receber leads externos.
        </p>
      </div>

      {/* Filas existentes */}
      {queues.length > 0 && (
        <div className="mb-8 space-y-4">
          {queues.map((q: {
            id: string; name: string; strategy: string; isActive: boolean
            sources: string[]; memberIds: string[]; lastPickIdx: number; enterpriseId: string | null
          }) => {
            const members = brokers.filter((b: { id: string }) => q.memberIds.includes(b.id))
            const ent = enterprises.find((e: { id: string }) => e.id === q.enterpriseId)
            return (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{q.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${q.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {q.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span><span className="text-slate-400">Estratégia:</span> {q.strategy === 'round_robin' ? 'Round-robin' : q.strategy}</span>
                      {ent && <span><span className="text-slate-400">Empreendimento:</span> {ent.name}</span>}
                      {q.sources.length > 0 && (
                        <span>
                          <span className="text-slate-400">Origens:</span>{' '}
                          {q.sources.map((s: string) => SOURCE_LABEL[s as LeadSource] ?? s).join(', ')}
                        </span>
                      )}
                      <span><span className="text-slate-400">Próximo:</span> {q.memberIds.length > 0 ? `#${(q.lastPickIdx % q.memberIds.length) + 1}` : '—'}</span>
                    </div>
                    {members.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {members.map((m: { id: string; name: string }) => (
                          <span key={m.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <form action={deleteLeadQueue}>
                    <input type="hidden" name="id" value={q.id} />
                    <DeleteButton message="Excluir esta fila de distribuição?" />
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Nova fila */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-slate-800">Nova fila</h2>
        <form action={createLeadQueue} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Nome da fila *</label>
              <input
                name="name" required placeholder="Ex: Loteamento Norte — Facebook"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Empreendimento (opcional)</label>
              <select
                name="enterpriseId"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="">Todos os empreendimentos</option>
                {enterprises.map((e: { id: string; name: string }) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Estratégia</label>
              <select
                name="strategy"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="round_robin">Round-robin (sequencial)</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Origens (filtra leads por canal)</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(SOURCE_LABEL) as [LeadSource, string][]).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" name="sources" value={value} className="accent-emerald-500" />
                    <span className="text-xs text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Sem seleção = aceita de qualquer origem</p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-medium text-slate-500">Corretores na fila *</label>
              {brokers.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum corretor cadastrado.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {brokers.map((b: { id: string; name: string; role: string }) => (
                    <label key={b.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" name="memberIds" value={b.id} className="accent-emerald-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
            >
              Criar fila
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
