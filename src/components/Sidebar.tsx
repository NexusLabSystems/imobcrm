'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@prisma/client'

type Profile = { name: string; role: Role }

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador', manager: 'Gerente', coordinator: 'Coordenador',
  broker: 'Corretor', partner: 'Parceiro',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function IcoHome() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function IcoUsers() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IcoKanban() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
}
function IcoBuilding() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
}
function IcoDocument() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}
function IcoChart() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}
function IcoCalendar() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}
function IcoLogout() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}
function IcoMenu() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
}
function IcoClose() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
}

const MAIN_LINKS = [
  { href: '/dashboard',   label: 'Início',          Icon: IcoHome     },
  { href: '/leads',       label: 'Leads',           Icon: IcoUsers    },
  { href: '/kanban',      label: 'Kanban',          Icon: IcoKanban   },
  { href: '/enterprises', label: 'Empreendimentos', Icon: IcoBuilding },
  { href: '/proposals',   label: 'Propostas',       Icon: IcoDocument },
  { href: '/agenda',      label: 'Agenda',          Icon: IcoCalendar },
]

function NavLink({ href, label, Icon, pathname }: {
  href: string; label: string; Icon: () => React.ReactElement; pathname: string
}) {
  const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-700 font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-normal'
      }`}
    >
      <span className={active ? 'text-emerald-600' : 'text-slate-400'}>
        <Icon />
      </span>
      {label}
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
      )}
    </Link>
  )
}

function SidebarContent({ profile, pathname, isAdmin, onClose }: {
  profile: Profile; pathname: string; isAdmin: boolean; onClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">

      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200 px-4">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 shadow-sm shadow-emerald-500/30">
            <span className="text-xs font-bold text-white">I</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">ImobCRM</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <IcoClose />
          </button>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {MAIN_LINKS.map(({ href, label, Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} pathname={pathname} />
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="my-4 border-t border-slate-200" />
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Gestão
            </p>
            <div className="space-y-0.5">
              <NavLink href="/admin"        label="Painel Admin"  Icon={IcoChart}    pathname={pathname} />
              <NavLink href="/admin/bi"     label="BI"            Icon={IcoChart}    pathname={pathname} />
              <NavLink href="/admin/filas"  label="Filas"         Icon={IcoUsers}    pathname={pathname} />
            </div>
          </>
        )}
      </nav>

      {/* Usuário */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {initials(profile.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800 leading-none mb-0.5">
              {profile.name}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              title="Sair"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <IcoLogout />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop: sidebar fixa */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent profile={profile} pathname={pathname} isAdmin={isAdmin} />
      </aside>

      {/* Mobile: top bar */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 shadow-sm shadow-emerald-500/30">
            <span className="text-xs font-bold text-white">I</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">ImobCRM</span>
        </Link>
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <IcoMenu />
        </button>
      </header>

      {/* Mobile: drawer */}
      <div
        className="fixed inset-0 z-50 lg:hidden"
        style={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
      >
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: mobileOpen ? 1 : 0 }}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white transition-transform duration-300"
          style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <SidebarContent
            profile={profile}
            pathname={pathname}
            isAdmin={isAdmin}
            onClose={() => setMobileOpen(false)}
          />
        </aside>
      </div>
    </>
  )
}
