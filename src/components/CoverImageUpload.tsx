'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setCoverImage } from '@/actions/enterprises'

type Props = {
  enterpriseId: string
  currentUrl: string | null
}

export default function CoverImageUpload({ enterpriseId, currentUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `covers/${enterpriseId}-cover-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('enterprises')
      .upload(path, file, { contentType: file.type, upsert: true })

    if (error) {
      setUploading(false)
      setPreview(currentUrl)
      alert('Erro ao enviar imagem.')
      return
    }

    const { data } = supabase.storage.from('enterprises').getPublicUrl(path)
    setUploading(false)
    startTransition(() => setCoverImage(enterpriseId, data.publicUrl))
  }

  return (
    <div className="group relative">
      {preview ? (
        <img src={preview} alt="Capa" className="h-52 w-full object-cover" />
      ) : (
        <div className="flex h-52 items-center justify-center bg-slate-100 text-sm text-slate-400">
          Sem foto de capa
        </div>
      )}

      {/* Overlay de troca */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading || isPending}
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-wait"
      >
        <span className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow">
          {uploading || isPending ? 'Salvando…' : '📷 Trocar foto de capa'}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
