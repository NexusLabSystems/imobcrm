'use client'

import { useState } from 'react'
import { saveFacebookSettings } from '@/actions/integrations'

type Props = {
  tenantId: string
  initialSettings: Record<string, string>
}

export default function IntegrationsForm({ tenantId, initialSettings }: Props) {
  const [saved, setSaved] = useState(false)
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/facebook/${tenantId}`
    : `/api/webhooks/facebook/${tenantId}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await saveFacebookSettings(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Facebook Lead Ads */}
      <div className="rounded-xl border bg-white p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">f</div>
          <div>
            <h2 className="font-semibold text-slate-900">Facebook Lead Ads</h2>
            <p className="text-xs text-slate-500">Captura automática de leads dos formulários do Facebook</p>
          </div>
        </div>

        {/* URL do Webhook */}
        <div className="rounded-lg bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-medium text-slate-600">URL do Webhook (use no Meta Developer Portal)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border bg-white px-3 py-2 text-xs font-mono text-slate-700 overflow-x-auto">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="shrink-0 rounded-md border px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Copiar
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Verify Token</label>
            <input
              name="facebookVerifyToken"
              type="text"
              defaultValue={initialSettings.facebookVerifyToken ?? ''}
              placeholder="Crie um token secreto qualquer (ex: imobcrm-fb-2024)"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-slate-400">Use o mesmo token ao configurar o webhook no Meta Developer Portal.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Page Access Token</label>
            <input
              name="facebookPageAccessToken"
              type="password"
              defaultValue={initialSettings.facebookPageAccessToken ?? ''}
              placeholder="Token de acesso da sua Página do Facebook"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-slate-400">
              Gere em: Meta Developer Portal → seu App → Ferramentas → Graph API Explorer → selecione a Página → gerar token de longa duração.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Salvar configuração
            </button>
            {saved && <span className="text-sm text-green-600">✓ Salvo</span>}
          </div>
        </form>

        {/* Instruções */}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-slate-600">Passo a passo de configuração</summary>
          <ol className="mt-3 space-y-2 pl-4 text-slate-600 list-decimal">
            <li>Acesse <strong>developers.facebook.com</strong> e crie um App do tipo "Business".</li>
            <li>Adicione o produto <strong>Webhooks</strong> ao app.</li>
            <li>Configure o webhook para o objeto <strong>Page</strong>, evento <strong>leadgen</strong>.</li>
            <li>Cole a URL do webhook acima e o Verify Token que você definiu.</li>
            <li>Gere um Page Access Token de longa duração e cole no campo acima.</li>
            <li>Assine a página ao webhook para começar a receber leads.</li>
          </ol>
        </details>
      </div>
    </div>
  )
}
