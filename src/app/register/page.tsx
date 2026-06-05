'use client'

import { useState } from 'react'
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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula',      ok: /[A-Z]/.test(password) },
    { label: 'Número',               ok: /\d/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const bar =
    score === 0 ? 'w-0' :
    score === 1 ? 'w-1/3 bg-red-400' :
    score === 2 ? 'w-2/3 bg-yellow-400' :
    'w-full bg-emerald-500'

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${bar}`} />
      </div>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-400' : 'text-blue-400'}`}>
            <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
              {c.ok
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const BENEFITS = [
  { text: 'Isolamento total de dados por imobiliária' },
  { text: 'Convide sua equipe com perfis personalizados' },
  { text: 'Acesse de qualquer dispositivo como PWA' },
]

// ── Página ───────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const supabase = createClient()

  const [companyName, setCompanyName] = useState('')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  function validate(): string | null {
    if (!companyName.trim())      return 'Informe o nome da imobiliária.'
    if (!name.trim())             return 'Informe seu nome.'
    if (!email.trim())            return 'Informe seu e-mail.'
    if (password.length < 8)      return 'A senha deve ter pelo menos 8 caracteres.'
    if (!/[A-Z]/.test(password))  return 'Inclua pelo menos uma letra maiúscula na senha.'
    if (!/\d/.test(password))     return 'Inclua pelo menos um número na senha.'
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim(), company_name: companyName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(
          error.message.includes('already registered')
            ? 'Este e-mail já está cadastrado. Tente fazer login.'
            : error.message
        )
        return
      }

      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-3 text-sm text-white placeholder:text-blue-400 touch-manipulation transition-colors focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20'

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-[#1B3A5C]">

      {/* ── Fundo ── */}
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
            <span className="text-lg font-bold text-white">I</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">ImobCRM</span>
        </Link>

        <div className="lp-anim-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Cadastro gratuito
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            Crie sua conta e<br />comece a vender mais{' '}
            <span className="bg-linear-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              em minutos.
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-200">
            Cada imobiliária tem seu próprio espaço isolado, seguro e pronto para uso.
          </p>

          <ul className="mt-8 space-y-3">
            {BENEFITS.map(({ text }, i) => (
              <li
                key={text}
                className="lp-anim-fade-up flex items-center gap-3 text-sm text-blue-100"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 ring-1 ring-emerald-400/30">
                  <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="lp-anim-fade-up text-xs text-blue-400" style={{ animationDelay: '0.6s' }}>
          © {new Date().getFullYear()} ImobCRM · Todos os direitos reservados
        </p>
      </aside>

      {/* ── Painel direito: formulário ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">

        {/* Logo mobile */}
        <Link href="/" className="lp-anim-slide-down mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <span className="text-base font-bold text-white">I</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">ImobCRM</span>
        </Link>

        <div className="lp-anim-fade-up w-full max-w-sm" style={{ animationDelay: '0.1s' }}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-10 shadow-2xl backdrop-blur-xl sm:px-8">

            {success ? (
              /* ── Estado de sucesso ── */
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 ring-1 ring-emerald-400/30">
                  <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">Confirme seu e-mail</h1>
                <p className="mt-3 text-sm leading-relaxed text-blue-200">
                  Enviamos um link de confirmação para{' '}
                  <span className="font-semibold text-white">{email}</span>.
                  Clique no link para ativar sua conta.
                </p>
                <p className="mt-2 text-xs text-blue-400">
                  Verifique também a pasta de spam.
                </p>
                <a
                  href="/login"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Ir para o login
                </a>
              </div>
            ) : (
              /* ── Formulário ── */
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white">Criar conta</h1>
                  <p className="mt-1 text-sm text-blue-300">
                    Cada imobiliária tem seu próprio espaço isolado.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  <div className="space-y-1.5">
                    <label htmlFor="companyName" className="block text-sm font-medium text-blue-100">
                      Nome da imobiliária
                    </label>
                    <input
                      id="companyName" name="companyName" type="text"
                      autoComplete="organization" required
                      value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Imobiliária Costa"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-sm font-medium text-blue-100">
                      Seu nome
                    </label>
                    <input
                      id="name" name="name" type="text"
                      autoComplete="name" required
                      value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Nome completo"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                      E-mail
                    </label>
                    <input
                      id="email" name="email" type="email"
                      autoComplete="email" inputMode="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        id="password" name="password"
                        type={showPwd ? 'text' : 'password'}
                        autoComplete="new-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className={`${inputClass} pr-11`}
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
                    <PasswordStrength password={password} />
                  </div>

                  {error && (
                    <div role="alert" aria-live="polite"
                      className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-300">
                      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading && <Spinner />}
                    {loading ? 'Criando conta…' : 'Criar conta'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-blue-300">
                  Já tem conta?{' '}
                  <a href="/login" className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                    Entrar
                  </a>
                </p>
              </>
            )}
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
