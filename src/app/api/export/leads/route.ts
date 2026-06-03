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

  const leads = await prisma.lead.findMany({
    where: { tenantId: profile.tenantId, deletedAt: null, createdAt: { gte: startDate } },
    include: {
      assignee: { select: { name: true } },
      funnelStage: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['Nome', 'E-mail', 'Telefone', 'Origem', 'Status', 'Score', 'Etapa do funil', 'Responsável', 'Criado em']
  const rows = leads.map((l) => [
    l.name,
    l.email ?? '',
    l.phone ?? '',
    l.source,
    l.status,
    String(l.score),
    l.funnelStage?.name ?? '',
    l.assignee?.name ?? '',
    l.createdAt.toLocaleDateString('pt-BR'),
  ])

  return new NextResponse(toCSV(headers, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${period}d-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
