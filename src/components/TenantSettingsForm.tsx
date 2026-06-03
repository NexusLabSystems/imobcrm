'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateTenantSettings } from '@/actions/tenant'

type Props = {
  tenant: { id: string; name: string; slug: string; logoUrl: string | null; document: string | null }
  approvalThreshold?: string
}

export default function TenantSettingsForm({ tenant, approvalThreshold }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logoUrl)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.logoUrl)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const path = `logos/${tenant.id}-logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('enterprises').upload(path, file, { contentType: file.type, upsert: true })
    if (error) { setUploading(false); alert('Erro ao enviar logo.'); return }
    const { data } = supabase.storage.from('enterprises').getPublicUrl(path)
    setLogoPreview(data.publicUrl)
    setLogoUrl(data.publicUrl)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const document = (form.elements.namedItem('document') as HTMLInputElement).value
    const approvalThresholdVal = (form.elements.namedItem('approvalThreshold') as HTMLInputElement).value
    startTransition(async () => {
      await updateTenantSettings({ name, document, logoUrl, approvalThreshold: approvalThresholdVal })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white p-6">
      {/* Logo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Logo da imobiliária</label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-contain border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-slate-100 text-xs text-slate-400">
              Sem logo
            </div>
          )}
          <label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            {uploading ? 'Enviando…' : 'Trocar logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome da imobiliária <span className="text-red-500">*</span>
        </label>
        <input id="name" name="name" type="text" required defaultValue={tenant.name}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
      </div>

      {/* CNPJ */}
      <div className="space-y-1">
        <label htmlFor="document" className="text-sm font-medium text-slate-700">CNPJ</label>
        <input id="document" name="document" type="text" defaultValue={tenant.document ?? ''}
          placeholder="00.000.000/0000-00"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
      </div>

      {/* Limite para 2ª alçada */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Valor mínimo para 2ª alçada de aprovação (R$)
        </label>
        <input
          id="approvalThreshold" name="approvalThreshold" type="number" min="0" step="1000"
          defaultValue={approvalThreshold ?? ''}
          placeholder="Ex: 500000 — deixe em branco para usar apenas 1 nível"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <p className="text-xs text-slate-400">
          Propostas com valor igual ou acima deste limite precisarão de aprovação do Admin após a Gerência.
        </p>
      </div>

      {/* Slug (somente leitura) */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Identificador (slug)</label>
        <input type="text" readOnly value={tenant.slug}
          className="w-full rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-400" />
        <p className="text-xs text-slate-400">O slug não pode ser alterado após o cadastro.</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending || uploading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Salvo</span>}
      </div>
    </form>
  )
}
