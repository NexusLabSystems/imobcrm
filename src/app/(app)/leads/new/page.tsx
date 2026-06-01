import { createLead } from '@/actions/leads'

export default function NewLeadPage() {
  return (
    <main className="mx-auto max-w-xl p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Novo lead</h1>

      <form action={createLead} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="name" name="name" type="text" required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefone</label>
          <input
            id="phone" name="phone" type="tel"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</label>
          <input
            id="email" name="email" type="email"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="source" className="text-sm font-medium text-slate-700">Origem</label>
          <select
            id="source" name="source"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="manual">Manual</option>
            <option value="website">Website</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="indicacao">Indicação</option>
            <option value="portais">Portais</option>
            <option value="importacao">Importação</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Salvar lead
          </button>
          <a
            href="/leads"
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </a>
        </div>
      </form>
    </main>
  )
}
