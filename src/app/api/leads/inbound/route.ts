import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveQueueAssignment } from '@/actions/queues'
import { recalculateLeadScore } from '@/lib/leadScore'
import type { LeadSource } from '@prisma/client'

const VALID_SOURCES: LeadSource[] = [
  'website', 'facebook', 'instagram', 'indicacao', 'portais', 'manual', 'importacao',
]

// POST /api/leads/inbound
// Header: x-api-key: <INBOUND_API_KEY from env>
// Body: { name, email?, phone?, source?, enterpriseId?, utmSource?, utmMedium?, utmCampaign? }
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const envKey = process.env.INBOUND_API_KEY

  if (!envKey || apiKey !== envKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, phone, source, enterpriseId, utmSource, utmMedium, utmCampaign } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const tenant = await prisma.tenant.findFirst({ where: { isActive: true }, select: { id: true } })
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 500 })
  }

  const leadSource: LeadSource = VALID_SOURCES.includes(source as LeadSource)
    ? (source as LeadSource)
    : 'manual'

  // Dedup: se email ou telefone já existe, atualiza lastInteractionAt
  if (email || phone) {
    const existing = await prisma.lead.findFirst({
      where: {
        tenantId:  tenant.id,
        deletedAt: null,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })
    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: { lastInteractionAt: new Date() },
      })
      return NextResponse.json({ id: existing.id, deduplicated: true }, { status: 200 })
    }
  }

  // Resolução da fila
  const assignedTo = await resolveQueueAssignment(
    tenant.id,
    leadSource,
    enterpriseId ?? null
  )

  const lead = await prisma.lead.create({
    data: {
      tenantId:     tenant.id,
      name:         name.trim(),
      email:        email || null,
      phone:        phone || null,
      source:       leadSource,
      assignedTo:   assignedTo,
      enterpriseId: enterpriseId || null,
      utmSource:    utmSource || null,
      utmMedium:    utmMedium || null,
      utmCampaign:  utmCampaign || null,
    },
  })

  recalculateLeadScore(lead.id).catch(() => {})

  return NextResponse.json({ id: lead.id, assignedTo }, { status: 201 })
}
