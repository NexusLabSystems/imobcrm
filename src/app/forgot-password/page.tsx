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

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Informe seu e-mail.'); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      })
      // Não revelamos se o e-mail existe ou não — sempre mostramos sucesso
      if (error && !error.message.includes('rate')) {
        setSent(true) // exibe sucesso de qualquer forma (segurança)
      } else if (error?.message.includes('rate')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh">

      {/* Painel de marca (desktop) */}
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
            Recuperar acesso<br />é simples e rápido.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-200">
            Enviaremos um link de redefinição para o seu e-mail cadastrado. O link expira em 24 horas.
          </p>
        </div>

        <p className="text-xs text-blue-300">
          © {new Date().getFullYear()} ImobCRM · Todos os direitos reservados
        </p>
      </aside>

      {/* Painel do formulário */}
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

            {sent ? (
              /* Estado de sucesso */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-900">Verifique seu e-mail</h1>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Se esse e-mail estiver cadastrado, você receberá um link de redefinição em breve.
                  Verifique também a pasta de spam.
                </p>
                <a
                  href="/login"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#1B3A5C] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f2240] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2"
                >
                  Voltar ao login
                </a>
              </div>
            ) : (
              /* Formulário */
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900">Esqueceu a senha?</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Digite seu e-mail e enviaremos um link para redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 touch-manipulation transition-colors focus:border-[#1B3A5C] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
                    />
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
                    {loading ? 'Enviando…' : 'Enviar link de redefinição'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Lembrou a senha?{' '}
                  <a href="/login"
                    className="font-semibold text-[#1B3A5C] transition-colors hover:text-[#0f2240]">
                    Voltar ao login
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
