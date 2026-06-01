'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createEnterprise } from '@/actions/enterprises'
import type { EnterpriseType } from '@prisma/client'

const TYPE_LABEL: Record<EnterpriseType, string> = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
  loteamento: 'Loteamento',
  comercial: 'Comercial',
  misto: 'Misto',
}

export default function EnterpriseForm() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
    const type = (form.elements.namedItem('type') as HTMLSelectElement).value as EnterpriseType
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value

    if (!name) { setError('Nome é obrigatório'); return }

    startTransition(async () => {
      let coverImageUrl: string | null = null

      if (file) {
        const supabase = createClient()
        const ext = file.name.split('.').pop()
        const path = `covers/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('enterprises')
          .upload(path, file, { contentType: file.type })

        if (uploadError) {
          setError('Erro ao enviar imagem. Verifique se o bucket foi criado.')
          return
        }

        const { data } = supabase.storage.from('enterprises').getPublicUrl(path)
        coverImageUrl = data.publicUrl
      }

      await createEnterprise({ name, type, description, coverImageUrl })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          name="name" type="text" required
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Tipo</label>
        <select
          name="type"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {Object.entries(TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Descrição</label>
        <textarea
          name="description" rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Foto de capa</label>
        <input
          type="file" accept="image/*" onChange={handleFile}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {preview && (
          <img src={preview} alt="preview" className="mt-2 h-40 w-full rounded-lg object-cover" />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? 'Salvando…' : 'Salvar empreendimento'}
        </button>
        <a
          href="/enterprises"
          className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
