import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

function toCSV(headers: string[], rows: string[][]): string {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { tenantId: true } })
  if (!profile) return new NextResponse('Unauthorized', { status: 401 })

  const period = Number(request.nextUrl.searchParams.get('period') ?? '30')
  const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

  const activities = await prisma.activity.findMany({
    where: { tenantId: profile.tenantId, createdAt: { gte: startDate } },
    include: {
      user: { select: { name: true } },
      lead: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['Tipo', 'Descrição', 'Lead', 'Usuário', 'Data']
  const rows = activities.map((a) => [
    a.type,
    a.description ?? '',
    a.lead?.name ?? '',
    a.user.name,
    a.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  ])

  return new NextResponse(toCSV(headers, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="atividades-${period}d-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
