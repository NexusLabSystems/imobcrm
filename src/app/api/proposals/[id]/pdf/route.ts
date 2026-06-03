import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ProposalPDF } from '@/components/ProposalPDF'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verifica autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Busca perfil do usuário
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tenantId: true },
  })
  if (!profile) return new NextResponse('Unauthorized', { status: 401 })

  // Busca proposta com todos os dados necessários
  const proposal = await prisma.proposal.findFirst({
    where: { id, tenantId: profile.tenantId, deletedAt: null },
    include: {
      enterprise: { select: { name: true } },
      unit: {
        select: {
          identifier: true, typology: true, floor: true,
          areaPrivate: true, bedrooms: true,
        },
      },
      lead: { select: { name: true } },
      approvals: {
        where: { action: 'approved' },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true } } },
      },
      tenant: { select: { name: true, document: true, logoUrl: true } },
    },
  })

  if (!proposal) return new NextResponse('Not found', { status: 404 })

  // Serializa os dados para o componente PDF
  const data = {
    id: proposal.id,
    proposedValue: Number(proposal.proposedValue),
    downPayment: proposal.downPayment ? Number(proposal.downPayment) : null,
    installments: proposal.installments,
    financingType: proposal.financingType,
    notes: proposal.notes,
    status: proposal.status,
    approvalLevel: proposal.approvalLevel,
    createdAt: proposal.createdAt,
    enterprise: proposal.enterprise,
    unit: {
      ...proposal.unit,
      areaPrivate: proposal.unit.areaPrivate ? Number(proposal.unit.areaPrivate) : null,
    },
    lead: proposal.lead,
    approvals: proposal.approvals.map((a) => ({
      ...a,
      createdAt: a.createdAt,
    })),
    tenant: proposal.tenant,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(ProposalPDF, { proposal: data }) as any)

  const filename = `proposta-${proposal.enterprise.name.replace(/\s+/g, '-').toLowerCase()}-${proposal.unit.identifier}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
