'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Role } from '@prisma/client'

type Props = {
  profile: { name: string; role: Role }
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const BASE_LINKS = [
  { href: '/dashboard',   label: 'Início' },
  { href: '/leads',       label: 'Leads' },
  { href: '/kanban',      label: 'Kanban' },
  { href: '/enterprises', label: 'Empreendimentos' },
  { href: '/proposals',   label: 'Propostas' },
]

export default function Nav({ profile }: Props) {
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'
  const [open, setOpen] = useState(false)
  const links = [...BASE_LINKS, ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : [])]

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1B3A5C]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <span className="text-sm font-bold text-white">I</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-white">ImobCRM</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Direita */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30 text-[10px] font-bold text-emerald-300">
              {initials(profile.name)}
            </div>
            <span className="max-w-[110px] truncate text-sm text-blue-200">
              {profile.name.split(' ')[0]}
            </span>
          </div>

          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white">
              Sair
            </button>
          </form>

          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-200 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        style={{
          maxHeight: open ? '400px' : '0',
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <nav className="flex flex-col gap-0.5 border-t border-white/10 px-4 pb-4 pt-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30 text-[10px] font-bold text-emerald-300">
              {initials(profile.name)}
            </div>
            <span className="flex-1 truncate text-sm text-blue-200">{profile.name}</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
