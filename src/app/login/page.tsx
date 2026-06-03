'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

// Fix #7 — removido campo icon (emoji, nunca usado)
const FEATURES = [
  'Gestão de leads e pipeline de vendas',
  'Funil Kanban com atualização em tempo real',
  'Propostas, reservas e aprovações em múltiplas alçadas',
]

// Fix #9 — mensagens de erro específicas por código Supabase
function parseAuthError(msg: string): string {
  if (msg.includes('rate') || msg.includes('too many'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (msg.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.'
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  // Fix #4 — validação client-side antes de chamar a API
  function validate(): string | null {
    if (!email.trim())    return 'Informe seu e-mail.'
    if (!password.trim()) return 'Informe sua senha.'
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    return null
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setError(parseAuthError(error.message))
        return
      }
      // Fix #3 — não resetar loading aqui; a navegação vai desmontar o componente
      router.push('/')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      // Fix #3 — garante reset do loading em qualquer caso (exceto navegação bem-sucedida)
      setLoading((prev) => { if (prev) setTimeout(() => setLoading(false), 100); return prev })
    }
  }

  return (
    <div className="flex min-h-dvh">

      {/* ── Painel de marca (desktop) ──────────────────────────────
          Fix #2: painel é aria-hidden para não confundir leitores de tela
          (h2 decorativo — h1 real está no formulário)
      */}
      <aside
        aria-hidden="true"
        className="hidden lg:flex lg:w-[480px] lg:flex-col lg:justify-between lg:p-12 bg-linear-to-br from-[#1B3A5C] to-[#0f2240]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <span className="text-lg font-bold text-white" aria-hidden="true">I</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">ImobCRM</span>
        </div>

        <div>
          {/* Fix #2: h2 só existe dentro de <aside aria-hidden> — não polui outline de acessibilidade */}
          <h2 className="text-3xl font-bold leading-tight text-white">
            O CRM feito para<br />imobiliárias que<br />querem vender mais.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-200">
            Gerencie leads, propostas e empreendimentos em um só lugar — de qualquer dispositivo.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((label) => (
              <li key={label} className="flex items-center gap-3 text-sm text-blue-100">
                <svg className="h-5 w-5 shrink-0 text-emerald-400" fill="none" stroke="currentColor"
                  strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-blue-300">
          © {new Date().getFullYear()} ImobCRM · Todos os direitos reservados
        </p>
      </aside>

      {/* ── Painel do formulário ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-8">

        {/* Logo mobile */}
        <div className="mb-8 flex items-center gap-2 lg:hidden" aria-hidden="true">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B3A5C]">
            <span className="text-base font-bold text-white">I</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">ImobCRM</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Fix #6: px-6 no mobile, px-8 a partir de sm */}
          <div className="rounded-2xl bg-white px-6 py-10 shadow-sm ring-1 ring-slate-200 sm:px-8">

            <div className="mb-8">
              {/* Fix #2: único h1 real da página */}
              <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
              <p className="mt-1 text-sm text-slate-500">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleLogin} noValidate className="space-y-5">

              {/* E-mail */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  // Fix #10: touch-action manipulation
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors touch-manipulation focus:border-[#1B3A5C] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Senha
                  </label>
                  {/* Fix #1: link "Esqueceu a senha?" */}
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium text-[#1B3A5C] transition-colors hover:text-[#0f2240] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 rounded"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors touch-manipulation focus:border-[#1B3A5C] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40"
                  >
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Botão
                  Fix #5 + #8: cor via classe Tailwind em vez de style inline →
                  transição suave funciona corretamente
              */}
              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  loading ? 'bg-[#2d5a8e]' : 'bg-[#1B3A5C] hover:bg-[#0f2240]'
                }`}
              >
                {loading && <Spinner />}
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Ainda não tem conta?{' '}
              <a
                href="/register"
                className="font-semibold text-[#1B3A5C] transition-colors hover:text-[#0f2240]"
              >
                Criar agora
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
