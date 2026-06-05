'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Hook: revelar elemento ao entrar na viewport ─────────────────────────────
// getBoundingClientRect é sempre relativo ao viewport, independente do container de scroll.
// Escutamos em window, document, html e body com capture para cobrir qualquer ambiente
// (mobile Safari, container customizado, etc.). setInterval é o fallback final.

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let done = false

    function check() {
      if (done) return
      const rect = el!.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.95) {
        done = true
        setVisible(true)
        cleanup()
      }
    }

    function cleanup() {
      clearInterval(intervalId)
      ;[window, document, document.documentElement, document.body].forEach((t) =>
        t.removeEventListener('scroll', check, true)
      )
    }

    // Escuta scroll em todos os containers possíveis (scroll não faz bubble)
    ;[window, document, document.documentElement, document.body].forEach((t) =>
      t.addEventListener('scroll', check, { passive: true, capture: true })
    )

    // setInterval como fallback — verifica a cada 150ms mesmo sem evento de scroll
    const intervalId = setInterval(check, 150)

    // Verifica imediatamente após o layout ser pintado
    requestAnimationFrame(() => requestAnimationFrame(check))

    return cleanup
  }, [])

  return [ref, visible] as const
}

// ── Wrapper de animação por scroll ───────────────────────────────────────────

function ScrollIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Como funciona',   href: '#como-funciona'   },
    { label: 'Depoimentos',     href: '#depoimentos'     },
  ]

  return (
    <header
      className={`lp-anim-slide-down fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-sm backdrop-blur-md border-b border-slate-200/60'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3A5C]">
            <span className="text-sm font-bold text-white">U</span>
          </div>
          <span className={`text-base font-semibold tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            Urbanix
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex" aria-label="Navegação principal">
          {navLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className={`font-medium transition-colors hover:text-[#1B3A5C] ${scrolled ? 'text-slate-600' : 'text-blue-100 hover:text-white'}`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={`hidden text-sm font-medium transition-colors sm:block ${scrolled ? 'text-slate-700 hover:text-[#1B3A5C]' : 'text-blue-100 hover:text-white'}`}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f2240] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:ring-offset-2"
          >
            Começar grátis
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            className={`ml-1 rounded-lg p-1.5 transition-colors md:hidden ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile: transição CSS pura via max-height */}
      <div
        className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
        style={{
          maxHeight: menuOpen ? '400px' : '0',
          opacity:   menuOpen ? 1       : 0,
          transition: 'max-height 0.28s ease-out, opacity 0.2s ease-out',
        }}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1B3A5C]"
            >
              {label}
            </a>
          ))}
          <div className="mt-2 border-t border-slate-100 pt-2 flex flex-col gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#1B3A5C] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#0f2240]"
            >
              Começar grátis
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

// ── Mockup do dashboard ──────────────────────────────────────────────────────

const leads = [
  { name: 'Ana Lima',    score: 5, status: 'Qualificado',   delay: '0.7s' },
  { name: 'Pedro Costa', score: 4, status: 'Em negociação', delay: '0.8s' },
  { name: 'Maria Silva', score: 4, status: 'Qualificado',   delay: '0.9s' },
  { name: 'João Souza',  score: 2, status: 'Novo',          delay: '1.0s' },
]

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">

      {/* Card flutuante direita */}
      <div
        className="lp-anim-slide-right absolute -right-4 -top-5 z-10 rounded-xl bg-white px-4 py-3 shadow-xl border border-slate-100"
        style={{ animationDelay: '1.0s' }}
      >
        <p className="text-xs text-slate-500">Leads este mês</p>
        <p className="text-xl font-bold text-[#1B3A5C]">
          +34 <span className="text-sm text-emerald-500 font-semibold">↑ 28%</span>
        </p>
      </div>

      {/* Card flutuante esquerda */}
      <div
        className="lp-anim-slide-left absolute -left-4 -bottom-5 z-10 rounded-xl bg-white px-4 py-3 shadow-xl border border-slate-100"
        style={{ animationDelay: '1.1s' }}
      >
        <p className="text-xs text-slate-500">Taxa de conversão</p>
        <p className="text-xl font-bold text-emerald-600">18,4%</p>
      </div>

      {/* Janela principal */}
      <div
        className="lp-anim-scale-in rounded-2xl border border-white/15 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ animationDelay: '0.45s' }}
      >
        {/* Barra de título */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/60 px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          <div className="ml-3 h-4 w-36 rounded-md bg-white/10" />
        </div>

        <div className="p-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Leads',     value: '34', highlight: false },
              { label: 'Propostas', value: '3',  highlight: true  },
              { label: 'Score',     value: '94', highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`rounded-xl p-3 ${highlight ? 'bg-emerald-500/20 ring-1 ring-emerald-400/30' : 'bg-white/10'}`}>
                <p className={`text-lg font-bold ${highlight ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
                <p className="text-xs text-blue-200">{label}</p>
              </div>
            ))}
          </div>

          {/* Lista de leads */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/70 mb-2">Últimos leads</p>
            {leads.map(({ name, score, status, delay }) => (
              <div
                key={name}
                className="lp-anim-fade-up flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
                style={{ animationDelay: delay }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                  {name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{name}</p>
                  <p className="text-xs text-blue-300">{status}</p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: 5 }, (_, j) => (
                    <div key={j} className={`h-1.5 w-3 rounded-full ${j < score ? 'bg-emerald-400' : 'bg-white/15'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mini kanban */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { col: 'Novo',     count: 8, color: 'bg-blue-400/20 border-blue-400/30'      },
              { col: 'Qualif.',  count: 5, color: 'bg-yellow-400/20 border-yellow-400/30'  },
              { col: 'Proposta', count: 3, color: 'bg-emerald-400/20 border-emerald-400/30' },
            ].map(({ col, count, color }) => (
              <div key={col} className={`rounded-lg border px-2 py-2 ${color}`}>
                <p className="text-xs font-semibold text-white/70">{col}</p>
                <p className="text-base font-bold text-white mt-0.5">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-dvh overflow-hidden bg-[#1B3A5C]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-[#1B3A5C] via-[#142d48] to-[#0a1929]" />
        <div className="absolute -top-40 -right-40 h-150 w-150 rounded-full bg-blue-400/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-125 w-125 rounded-full bg-emerald-400/6 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 pb-20 pt-32 sm:px-6 lg:flex-row lg:items-center lg:pt-36">
        <div className="flex-1 text-center lg:text-left">

          <div className="lp-anim-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300" style={{ animationDelay: '0.05s' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Plataforma completa para imobiliárias
          </div>

          <h1 className="lp-anim-fade-up text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.5rem]" style={{ animationDelay: '0.18s' }}>
            O CRM que transforma{' '}
            <span className="bg-linear-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              leads em vendas
            </span>{' '}
            para imobiliárias
          </h1>

          <p className="lp-anim-fade-up mt-5 text-lg leading-relaxed text-blue-100 max-w-xl mx-auto lg:mx-0" style={{ animationDelay: '0.32s' }}>
            Gerencie leads, empreendimentos e propostas em uma plataforma integrada.
            Do primeiro contato à assinatura do contrato — em qualquer dispositivo.
          </p>

          <div className="lp-anim-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start" style={{ animationDelay: '0.46s' }}>
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#1B3A5C] sm:w-auto"
            >
              Começar grátis
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="lp-anim-fade-up mt-5 text-sm text-blue-300" style={{ animationDelay: '0.60s' }}>
            Sem cartão de crédito · Configuração em minutos · Suporte em português
          </p>
        </div>

        <div className="flex-1 w-full">
          <DashboardMockup />
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 60 L1440 60 L1440 0 Q720 60 0 0 Z" fill="#f8fafc" />
        </svg>
      </div>
    </section>
  )
}

// ── Stats ────────────────────────────────────────────────────────────────────

function Stats() {
  const items = [
    { value: '2.500+',  label: 'Imobiliárias ativas'       },
    { value: '180 mil', label: 'Leads gerenciados'          },
    { value: 'R$ 4 bi', label: 'Em propostas geradas'       },
    { value: '98%',     label: 'Satisfação dos clientes'    },
  ]

  return (
    <section className="bg-slate-50 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map(({ value, label }, i) => (
            <ScrollIn key={label} delay={i * 80} className="text-center">
              <p className="text-3xl font-extrabold text-[#1B3A5C] sm:text-4xl">{value}</p>
              <p className="mt-1.5 text-sm font-medium text-slate-500">{label}</p>
            </ScrollIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    title: 'Gestão de Leads',
    description: 'Capture, qualifique e acompanhe cada lead com scoring automático baseado em comportamento e perfil.',
    color: 'bg-blue-50 text-[#1B3A5C]',
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
    title: 'Kanban Pipeline',
    description: 'Funil de vendas visual com drag & drop. Mova leads entre etapas e acompanhe o progresso em tempo real.',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    title: 'Empreendimentos',
    description: 'Catálogo completo com plantas, espelho digital interativo e mapa de disponibilidade por unidade.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    title: 'Propostas Digitais',
    description: 'Gere propostas profissionais em PDF com múltiplas alçadas de aprovação e rastreamento de status.',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    title: 'Business Intelligence',
    description: 'Dashboards com KPIs essenciais: volume de leads, taxa de conversão, ranking de corretores e muito mais.',
    color: 'bg-rose-50 text-rose-700',
  },
  {
    icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
    title: 'Integração Facebook',
    description: 'Capture leads diretamente dos formulários do Facebook Ads via webhook. Zero trabalho manual.',
    color: 'bg-sky-50 text-sky-700',
  },
]

function Features() {
  return (
    <section id="funcionalidades" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollIn className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Funcionalidades</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Tudo que uma imobiliária precisa, em um lugar só
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Desenvolvido por especialistas em vendas imobiliárias, com as ferramentas que os corretores realmente usam.
          </p>
        </ScrollIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, title, description, color }, i) => (
            <ScrollIn key={title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-200">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} mb-5`}>{icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            </ScrollIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Como funciona ────────────────────────────────────────────────────────────

const steps = [
  { num: '01', title: 'Capture seus leads',     description: 'Importe leads via CSV, integre com Facebook Ads ou cadastre manualmente. Todos os canais em um único lugar.',                              highlight: 'Integração Facebook Leads' },
  { num: '02', title: 'Qualifique e distribua', description: 'O scoring automático prioriza os leads com maior potencial. Atribua corretores e configure o funil conforme seu processo.',              highlight: 'Scoring automático'        },
  { num: '03', title: 'Feche mais negócios',    description: 'Acompanhe pelo Kanban, gere propostas profissionais em PDF e obtenha aprovações com múltiplas alçadas — tudo digital.',                 highlight: 'Propostas em PDF'          },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollIn className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Como funciona</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">De zero a resultados em 3 passos</h2>
        </ScrollIn>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 hidden h-px bg-linear-to-r from-transparent via-slate-300 to-transparent md:block" style={{ top: '2.5rem' }} />
          {steps.map(({ num, title, description, highlight }, i) => (
            <ScrollIn key={num} delay={i * 100} className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1B3A5C] text-lg font-extrabold text-white shadow-lg ring-4 ring-slate-50 mb-5">{num}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 mb-3">{description}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {highlight}
              </span>
            </ScrollIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Depoimentos ──────────────────────────────────────────────────────────────

const testimonials = [
  { quote: 'Aumentamos nossa conversão em 40% no primeiro trimestre com o Urbanix. O Kanban e o scoring de leads fizeram toda a diferença.', name: 'Rafaela Mendes',   role: 'Gerente Comercial · Construtora Horizonte', initials: 'RM', color: 'bg-[#1B3A5C]'    },
  { quote: 'A gestão dos empreendimentos ficou muito mais simples. O espelho digital eliminou nossas planilhas de disponibilidade de unidades.', name: 'Carlos Britto',   role: 'Diretor de Vendas · Britto Imóveis',        initials: 'CB', color: 'bg-violet-700' },
  { quote: 'Os dashboards de BI nos deram uma visibilidade que nunca tivemos antes. Agora tomamos decisões baseadas em dados reais.',             name: 'Ana Paula Vieira', role: 'CEO · Grupo Vieira',                        initials: 'AV', color: 'bg-emerald-700'},
]

function Testimonials() {
  return (
    <section id="depoimentos" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollIn className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Depoimentos</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">Quem já usa, não abre mão</h2>
        </ScrollIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(({ quote, name, role, initials: ini, color }, i) => (
            <ScrollIn key={name} delay={i * 80}>
              <div className="h-full flex flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                <div className="mb-4 flex gap-1" aria-label="5 estrelas">
                  {Array.from({ length: 5 }, (_, j) => (
                    <svg key={j} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-slate-600 italic">&ldquo;{quote}&rdquo;</blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>{ini}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-400">{role}</p>
                  </div>
                </div>
              </div>
            </ScrollIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Final ────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="bg-[#1B3A5C] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <ScrollIn>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Comece hoje</p>
          <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">Pronto para vender mais com menos esforço?</h2>
          <p className="mt-4 text-lg text-blue-200">Configure seu time em minutos. Sem contrato de fidelidade, sem surpresas no boleto.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#1B3A5C] sm:w-auto">
              Criar conta grátis
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/login" className="flex w-full items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-auto">
              Já tenho conta
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-300">Sem cartão de crédito · Suporte em português · Dados no Brasil</p>
        </ScrollIn>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear()
  const columns = [
    { title: 'Produto', links: [{ label: 'Funcionalidades', href: '#funcionalidades' }, { label: 'Como funciona', href: '#como-funciona' }, { label: 'Depoimentos', href: '#depoimentos' }] },
    { title: 'Conta',   links: [{ label: 'Entrar', href: '/login' }, { label: 'Criar conta', href: '/register' }, { label: 'Recuperar senha', href: '/forgot-password' }] },
  ]

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3A5C]"><span className="text-sm font-bold text-white">U</span></div>
              <span className="text-base font-semibold tracking-tight text-slate-900">Urbanix</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">A plataforma de CRM feita para imobiliárias brasileiras que querem vender mais com processos mais eficientes.</p>
          </div>
          {columns.map(({ title, links }) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}><a href={href} className="text-sm text-slate-500 transition-colors hover:text-slate-900">{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400">&copy; {year} Urbanix. Todos os direitos reservados.</p>
          <p className="text-xs text-slate-400">Desenvolvido para imobiliárias brasileiras</p>
        </div>
      </div>
    </footer>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
