'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Utilitários ──────────────────────────────────────────────────────────────

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

function parseAuthError(msg: string): string {
  if (msg.includes('rate') || msg.includes('too many'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (msg.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.'
}

const URL_ERRORS: Record<string, string> = {
  link_expirado: 'O link de confirmação expirou. Tente fazer login novamente.',
  link_invalido: 'Link inválido. Tente fazer login normalmente.',
  perfil:        'Conta sem perfil configurado. Entre em contato com o suporte.',
}

const FEATURES = [
  'Gestão de leads e pipeline de vendas',
  'Funil Kanban com atualização em tempo real',
  'Propostas e aprovações em múltiplas alçadas',
]

// ── Página ───────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError && URL_ERRORS[urlError]) setError(URL_ERRORS[urlError])
  }, [])

  function validate(): string | null {
    if (!email.trim())        return 'Informe seu e-mail.'
    if (!password.trim())     return 'Informe sua senha.'
    if (password.length < 6)  return 'A senha deve ter pelo menos 6 caracteres.'
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
      if (error) { setError(parseAuthError(error.message)); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading((prev) => { if (prev) setTimeout(() => setLoading(false), 100); return prev })
    }
  }

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-[#1B3A5C]">

      {/* ── Fundo: gradiente + grid (igual ao hero da landing) ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-[#1B3A5C] via-[#142d48] to-[#0a1929]" />
        <div className="absolute -top-40 -right-40 h-125 w-125 rounded-full bg-blue-400/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-100 w-100 rounded-full bg-emerald-400/6 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── Painel esquerdo (desktop) ── */}
      <aside
        aria-hidden="true"
        className="relative hidden lg:flex lg:w-115 lg:flex-col lg:justify-between lg:px-14 lg:py-12"
      >
        <Link href="/" className="lp-anim-slide-down flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <span className="text-lg font-bold text-white">U</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Urbanix</span>
        </Link>

        <div className="lp-anim-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Plataforma imobiliária completa
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            O CRM feito para<br />imobiliárias que<br />
            <span className="bg-linear-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              querem vender mais.
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-200">
            Gerencie leads, propostas e empreendimentos em um só lugar — de qualquer dispositivo.
          </p>

          <ul className="mt-8 space-y-3">
            {FEATURES.map((label, i) => (
              <li
                key={label}
                className="lp-anim-fade-up flex items-center gap-3 text-sm text-blue-100"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 ring-1 ring-emerald-400/30">
                  <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="lp-anim-fade-up text-xs text-blue-400" style={{ animationDelay: '0.6s' }}>
          © {new Date().getFullYear()} Urbanix · Todos os direitos reservados
        </p>
      </aside>

      {/* ── Painel direito: formulário ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">

        {/* Logo mobile */}
        <Link
          href="/"
          className="lp-anim-slide-down mb-8 flex items-center gap-2.5 lg:hidden"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <span className="text-base font-bold text-white">U</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Urbanix</span>
        </Link>

        {/* Card de login */}
        <div
          className="lp-anim-fade-up w-full max-w-sm"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-10 shadow-2xl backdrop-blur-xl sm:px-8">

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Entrar</h1>
              <p className="mt-1 text-sm text-blue-300">Acesse sua conta para continuar</p>
            </div>

            <form onSubmit={handleLogin} noValidate className="space-y-5">

              {/* E-mail */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-blue-100">
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
                  className="block w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-3 text-sm text-white placeholder:text-blue-400 transition-colors touch-manipulation focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                    Senha
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus:outline-none"
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
                    className="block w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-3 pr-11 text-sm text-white placeholder:text-blue-400 transition-colors touch-manipulation focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-blue-400 transition-colors hover:text-blue-200 focus:outline-none"
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
                  className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Spinner />}
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-blue-300">
              Ainda não tem conta?{' '}
              <a href="/register" className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                Criar agora
              </a>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-blue-400">
            <Link href="/" className="transition-colors hover:text-blue-200">
              ← Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
