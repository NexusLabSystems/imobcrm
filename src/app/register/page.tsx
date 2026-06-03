'use client'

import { useState } from 'react'
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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula',      ok: /[A-Z]/.test(password) },
    { label: 'Número',               ok: /\d/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const bar   = score === 0 ? 'w-0' : score === 1 ? 'w-1/3 bg-red-400' : score === 2 ? 'w-2/3 bg-yellow-400' : 'w-full bg-emerald-500'

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${bar}`} />
      </div>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
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
  'Isolamento total de dados por imobiliária',
  'Convide sua equipe com roles personalizados',
  'Acesse de qualquer dispositivo como PWA',
]

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
    if (!companyName.trim()) return 'Informe o nome da imobiliária.'
    if (!name.trim())        return 'Informe seu nome.'
    if (!email.trim())       return 'Informe seu e-mail.'
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
    if (!/[A-Z]/.test(password)) return 'Inclua pelo menos uma letra maiúscula na senha.'
    if (!/\d/.test(password))    return 'Inclua pelo menos um número na senha.'
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
        options: { data: { name: name.trim(), company_name: companyName.trim() } },
      })

      if (error) {
        if (error.message.includes('already registered'))
          setError('Este e-mail já está cadastrado. Tente fazer login.')
        else
          setError(error.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 touch-manipulation transition-colors focus:border-[#1B3A5C] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"

  return (
    <div className="flex min-h-dvh">

      {/* ── Painel de marca (desktop) ─────────────────────────────── */}
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
          <h2 className="text-3xl font-bold leading-tight text-white">
            Crie sua conta<br />e comece a vender<br />mais em minutos.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-200">
            Cada imobiliária tem seu próprio espaço isolado, seguro e pronto para uso.
          </p>

          <ul className="mt-8 space-y-3">
            {BENEFITS.map((label) => (
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
          <div className="rounded-2xl bg-white px-6 py-10 shadow-sm ring-1 ring-slate-200 sm:px-8">

            {success ? (
              /* ── Estado de sucesso ── */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-900">Confirme seu e-mail</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Enviamos um link de confirmação para{' '}
                  <span className="font-medium text-slate-700">{email}</span>.
                  Clique no link para ativar sua conta.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Verifique também a pasta de spam.
                </p>
                <a
                  href="/login"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#1B3A5C] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2240] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2"
                >
                  Ir para o login
                </a>
              </div>
            ) : (
              /* ── Formulário ── */
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Cada imobiliária tem seu próprio espaço isolado.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  <div className="space-y-1.5">
                    <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
                      Nome da imobiliária <span className="text-red-500" aria-hidden="true">*</span>
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
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                      Seu nome <span className="text-red-500" aria-hidden="true">*</span>
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
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                      E-mail <span className="text-red-500" aria-hidden="true">*</span>
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
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Senha <span className="text-red-500" aria-hidden="true">*</span>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40"
                      >
                        <EyeIcon open={showPwd} />
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  {error && (
                    <div role="alert" aria-live="polite"
                      className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
                      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      loading ? 'bg-[#2d5a8e]' : 'bg-[#1B3A5C] hover:bg-[#0f2240]'
                    }`}
                  >
                    {loading && <Spinner />}
                    {loading ? 'Criando conta…' : 'Criar conta'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Já tem conta?{' '}
                  <a href="/login"
                    className="font-semibold text-[#1B3A5C] transition-colors hover:text-[#0f2240]">
                    Entrar
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
