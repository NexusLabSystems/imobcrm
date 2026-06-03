'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

type Factor = { id: string; status: string; factor_type: string }

export default function MfaSetup() {
  const [factors, setFactors]       = useState<Factor[]>([])
  const [enrolling, setEnrolling]   = useState(false)
  const [qrCode, setQrCode]         = useState<string | null>(null)
  const [factorId, setFactorId]     = useState<string | null>(null)
  const [code, setCode]             = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.all ?? [])
  }

  useEffect(() => { loadFactors() }, [])

  const verified = factors.filter((f) => f.status === 'verified')
  const isEnabled = verified.length > 0

  async function startEnroll() {
    setError(null)
    setEnrolling(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) { setError(error?.message ?? 'Erro ao iniciar MFA'); setEnrolling(false); return }
    setQrCode(data.totp.qr_code)
    setFactorId(data.id)
  }

  async function confirmCode() {
    if (!factorId || code.length !== 6) { setError('Código deve ter 6 dígitos'); return }
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      if (error) { setError('Código inválido. Tente novamente.'); return }
      setSuccess('Autenticação em duas etapas ativada!')
      setEnrolling(false)
      setQrCode(null)
      setFactorId(null)
      setCode('')
      loadFactors()
    })
  }

  async function disable(id: string) {
    setError(null)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id })
    if (error) { setError(error.message); return }
    setSuccess('MFA desativado.')
    loadFactors()
  }

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Autenticação em duas etapas (MFA)</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Adiciona uma camada extra de segurança ao seu login usando um aplicativo autenticador.
        </p>
      </div>

      {/* Status atual */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        isEnabled ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'
      }`}>
        <span className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-slate-400'}`} />
        {isEnabled ? 'MFA ativo' : 'MFA inativo'}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      {/* MFA não ativo: fluxo de ativação */}
      {!isEnabled && !enrolling && (
        <button
          onClick={startEnroll}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ativar autenticação em duas etapas
        </button>
      )}

      {/* QR Code */}
      {enrolling && qrCode && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              1. Escaneie o QR Code com o Google Authenticator ou Authy:
            </p>
            <div
              className="inline-block rounded-lg border p-3 bg-white"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              2. Digite o código de 6 dígitos gerado pelo app:
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-32 rounded-md border px-3 py-2 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={confirmCode}
                disabled={isPending || code.length !== 6}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isPending ? 'Verificando…' : 'Confirmar'}
              </button>
              <button
                onClick={() => { setEnrolling(false); setQrCode(null); setCode('') }}
                className="rounded-md border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA ativo: opção de desativar */}
      {isEnabled && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Aplicativos registrados: {verified.length}
          </p>
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span>🔐</span>
                <span>Autenticador TOTP</span>
              </div>
              <button
                onClick={() => disable(f.id)}
                className="text-xs text-red-500 underline hover:text-red-700"
              >
                Remover
              </button>
            </div>
          ))}
          <p className="text-xs text-slate-400">
            Ao remover, o login voltará a exigir apenas e-mail e senha.
          </p>
        </div>
      )}
    </div>
  )
}
