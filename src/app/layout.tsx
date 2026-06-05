import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import PushSubscribe from '@/components/PushSubscribe'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Urbanix',
  description: 'CRM imobiliário — gestão de leads, funil e vendas',
  themeColor: '#1B3A5C',
  viewport: { width: 'device-width', initialScale: 1, viewportFit: 'cover' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Urbanix' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <PushSubscribe />
        {children}
      </body>
    </html>
  )
}
