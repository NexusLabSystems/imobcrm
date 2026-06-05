'use client'

import { useState } from 'react'
import {
  saveFacebookSettings,
  saveWhatsAppSettings,
  saveClickSignSettings,
  saveErpSettings,
} from '@/actions/integrations'

type Props = {
  tenantId: string
  initialSettings: Record<string, string>
}

function Section({ title, icon, sub, children }: {
  title: string; icon: React.ReactNode; sub: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ saved }: { saved: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
      >
        Salvar
      </button>
      {saved && <span className="text-sm text-emerald-600 font-medium">✓ Salvo</span>}
    </div>
  )
}

function Field({ label, name, type = 'text', placeholder, hint, defaultValue }: {
  label: string; name: string; type?: string; placeholder?: string; hint?: string; defaultValue?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
      />
      {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
  )
}

export default function IntegrationsForm({ tenantId, initialSettings: s }: Props) {
  const [savedFb, setSavedFb]   = useState(false)
  const [savedWa, setSavedWa]   = useState(false)
  const [savedCs, setSavedCs]   = useState(false)
  const [savedErp, setSavedErp] = useState(false)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/facebook/${tenantId}`
    : `/api/webhooks/facebook/${tenantId}`

  const inboundUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/leads/inbound`
    : `/api/leads/inbound`

  async function withSave(action: (fd: FormData) => Promise<void>, fd: FormData, setSaved: (v: boolean) => void) {
    await action(fd)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">

      {/* API Pública */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">API pública de captura</p>
        <div className="rounded-lg bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-medium text-slate-600">Endpoint (POST) — para portais, landing pages, formulários</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border bg-white px-3 py-2 text-xs font-mono text-slate-700 overflow-x-auto">
              {inboundUrl}
            </code>
            <button type="button" onClick={() => navigator.clipboard.writeText(inboundUrl)}
              className="shrink-0 rounded-md border px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100">Copiar</button>
          </div>
          <p className="text-xs text-slate-400">
            Header obrigatório: <code className="font-mono bg-slate-100 px-1 rounded">x-api-key: INBOUND_API_KEY</code> (defina no .env).<br />
            Corpo JSON: <code className="font-mono bg-slate-100 px-1 rounded">{"{ name, email, phone, source, enterpriseId, utmSource, utmMedium, utmCampaign }"}</code>
          </p>
        </div>
      </div>

      {/* Facebook Lead Ads */}
      <Section
        title="Facebook Lead Ads"
        sub="Captura automática de leads dos formulários do Facebook"
        icon={<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">f</div>}
      >
        <div className="rounded-lg bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-medium text-slate-600">URL do Webhook</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border bg-white px-3 py-2 text-xs font-mono text-slate-700 overflow-x-auto">{webhookUrl}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="shrink-0 rounded-md border px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100">Copiar</button>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); withSave(saveFacebookSettings, new FormData(e.currentTarget), setSavedFb) }} className="space-y-4">
          <Field label="Verify Token" name="facebookVerifyToken" defaultValue={s.facebookVerifyToken}
            placeholder="imobcrm-fb-2024" hint="Token secreto usado ao configurar o webhook no Meta Developer Portal." />
          <Field label="Page Access Token" name="facebookPageAccessToken" type="password" defaultValue={s.facebookPageAccessToken}
            placeholder="Token de acesso de longa duração" hint="Gerado no Graph API Explorer do Meta Developer Portal." />
          <SaveButton saved={savedFb} />
        </form>
      </Section>

      {/* WhatsApp — Z-API */}
      <Section
        title="WhatsApp (Z-API)"
        sub="Envio programático de mensagens via WhatsApp"
        icon={
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.784.474 3.453 1.301 4.9L2 22l5.234-1.295A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.065-1.112l-.29-.173-3.1.768.785-3.026-.19-.31A7.964 7.964 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8zm4.41-5.855c-.243-.122-1.437-.708-1.659-.789-.222-.08-.383-.121-.544.122-.16.243-.624.789-.765.951-.14.162-.282.182-.524.06-.243-.121-1.024-.377-1.95-1.203-.72-.643-1.207-1.435-1.349-1.678-.14-.243-.015-.374.107-.495.109-.108.243-.283.364-.424.122-.14.162-.243.243-.404.08-.162.04-.304-.02-.426-.062-.121-.544-1.314-.745-1.798-.197-.473-.397-.41-.544-.418l-.465-.008c-.162 0-.425.06-.648.304-.223.243-.85.83-.85 2.026 0 1.195.87 2.35.99 2.511.122.162 1.713 2.614 4.148 3.665.58.25 1.032.4 1.385.512.582.185 1.112.159 1.53.097.466-.07 1.437-.587 1.64-1.154.202-.567.202-1.053.14-1.154-.06-.1-.222-.162-.465-.283z"/></svg>
          </div>
        }
      >
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-700">
            Sem chaves configuradas, o CRM gera links <code className="font-mono">wa.me</code> para abrir no WhatsApp. Configure o Z-API para envio programático.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); withSave(saveWhatsAppSettings, new FormData(e.currentTarget), setSavedWa) }} className="space-y-4">
          <Field label="Instance ID" name="zapiInstanceId" defaultValue={s.zapiInstanceId}
            placeholder="Ex: 3DFB2..." hint="Encontrado no painel do Z-API após criar uma instância." />
          <Field label="Token" name="zapiToken" type="password" defaultValue={s.zapiToken}
            placeholder="Token da instância Z-API" />
          <Field label="Client Token" name="zapiClientToken" type="password" defaultValue={s.zapiClientToken}
            placeholder="Client Token da sua conta Z-API" />
          <SaveButton saved={savedWa} />
        </form>
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-slate-600">Como configurar o Z-API</summary>
          <ol className="mt-2 space-y-1 pl-4 text-slate-500 list-decimal">
            <li>Acesse <strong>z-api.io</strong> e crie uma conta.</li>
            <li>Crie uma instância e conecte escaneando o QR Code do WhatsApp Web.</li>
            <li>Copie o Instance ID, Token e Client Token do painel.</li>
          </ol>
        </details>
      </Section>

      {/* ClickSign */}
      <Section
        title="Assinatura eletrônica (ClickSign)"
        sub="Envio de documentos para assinatura digital"
        icon={
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white text-sm font-bold">CS</div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); withSave(saveClickSignSettings, new FormData(e.currentTarget), setSavedCs) }} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Ambiente</label>
            <select name="clicksignEnv" defaultValue={s.clicksignEnv || 'sandbox'}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20">
              <option value="sandbox">Sandbox (testes)</option>
              <option value="production">Produção</option>
            </select>
          </div>
          <Field label="API Key" name="clicksignApiKey" type="password" defaultValue={s.clicksignApiKey}
            placeholder="Sua chave de API do ClickSign" hint="Gerada em Configurações → Integrações no painel ClickSign." />
          <SaveButton saved={savedCs} />
        </form>
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-slate-600">Como configurar o ClickSign</summary>
          <ol className="mt-2 space-y-1 pl-4 text-slate-500 list-decimal">
            <li>Acesse <strong>app.clicksign.com</strong> e faça login.</li>
            <li>Vá em <strong>Configurações → Integrações → API</strong>.</li>
            <li>Gere uma Access Token e cole acima.</li>
            <li>Use Sandbox para testes antes de ir para produção.</li>
          </ol>
        </details>
      </Section>

      {/* ERP */}
      <Section
        title="Integração ERP (UAU / Sienge)"
        sub="Sincronização com ERP imobiliário"
        icon={
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-white text-sm font-bold">ERP</div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); withSave(saveErpSettings, new FormData(e.currentTarget), setSavedErp) }} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">ERP</label>
            <select name="erpType" defaultValue={s.erpType || ''}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20">
              <option value="">Selecione o ERP</option>
              <option value="uau">UAU (Globaltec)</option>
              <option value="sienge">Sienge (Softplan)</option>
              <option value="other">Outro (API customizada)</option>
            </select>
          </div>
          <Field label="URL da API" name="erpApiUrl" defaultValue={s.erpApiUrl}
            placeholder="https://api.seuserp.com.br" hint="URL base da API REST do ERP." />
          <Field label="API Key / Token" name="erpApiKey" type="password" defaultValue={s.erpApiKey}
            placeholder="Token de autenticação" />
          <Field label="Webhook Secret" name="erpWebhookKey" type="password" defaultValue={s.erpWebhookKey}
            placeholder="Chave para validar webhooks recebidos do ERP" hint="Usado no endpoint /api/webhooks/erp para validar a origem." />
          <SaveButton saved={savedErp} />
        </form>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-600 mb-2">Endpoint para receber dados do ERP</p>
          <code className="text-xs font-mono text-slate-700">POST /api/webhooks/erp</code>
          <p className="mt-1 text-[10px] text-slate-400">
            O ERP pode enviar atualizações de unidades, reservas e contratos para este endpoint.
            Documente o payload esperado de acordo com a API do seu ERP.
          </p>
        </div>
      </Section>

    </div>
  )
}
