import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// POST /api/webhooks/erp
// Recebe dados de sincronização do ERP (UAU, Sienge, etc.)
// Header: x-webhook-key: <erpWebhookKey from tenant settings>
//
// Eventos suportados:
//   unit_update   → atualiza status/preço de unidade
//   unit_sold     → marca unidade como vendida
//   unit_reserved → marca unidade como reservada
//   lead_callback → atualiza status de lead
export async function POST(req: NextRequest) {
  let body: {
    event?: string
    tenantSlug?: string
    unit?: { identifier?: string; enterpriseSlug?: string; status?: string; price?: number }
    lead?: { email?: string; phone?: string; status?: string }
    key?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, tenantSlug, key } = body

  if (!tenantSlug || !event) {
    return NextResponse.json({ error: 'tenantSlug and event are required' }, { status: 400 })
  }

  // Busca tenant e valida a chave
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, isActive: true },
    select: { id: true, settings: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const settings = (tenant.settings ?? {}) as Record<string, string>
  if (settings.erpWebhookKey && key !== settings.erpWebhookKey) {
    return NextResponse.json({ error: 'Invalid webhook key' }, { status: 401 })
  }

  const tenantId = tenant.id

  if (event === 'unit_update' || event === 'unit_sold' || event === 'unit_reserved') {
    const { unit: unitData } = body
    if (!unitData?.identifier || !unitData?.enterpriseSlug) {
      return NextResponse.json({ error: 'unit.identifier and unit.enterpriseSlug are required' }, { status: 400 })
    }

    const enterprise = await prisma.enterprise.findFirst({
      where: { tenantId, slug: unitData.enterpriseSlug, deletedAt: null },
      select: { id: true },
    })
    if (!enterprise) {
      return NextResponse.json({ error: 'Enterprise not found' }, { status: 404 })
    }

    const unit = await prisma.unit.findFirst({
      where: { tenantId, enterpriseId: enterprise.id, identifier: unitData.identifier, deletedAt: null },
    })
    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const updateData: { status?: 'available' | 'reserved' | 'sold' | 'unavailable'; currentPrice?: number } = {}

    if (event === 'unit_sold')     updateData.status = 'sold'
    if (event === 'unit_reserved') updateData.status = 'reserved'
    if (unitData.status === 'available') updateData.status = 'available'
    if (typeof unitData.price === 'number') updateData.currentPrice = unitData.price

    await prisma.unit.update({
      where: { id: unit.id },
      data: updateData,
    })

    revalidatePath(`/enterprises/${enterprise.id}`)
    revalidatePath(`/enterprises/${enterprise.id}/espelho`)

    return NextResponse.json({ ok: true, unitId: unit.id })
  }

  if (event === 'lead_callback') {
    const { lead: leadData } = body
    if (!leadData?.email && !leadData?.phone) {
      return NextResponse.json({ error: 'lead.email or lead.phone is required' }, { status: 400 })
    }

    const lead = await prisma.lead.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          ...(leadData.email ? [{ email: leadData.email }] : []),
          ...(leadData.phone ? [{ phone: leadData.phone }] : []),
        ],
      },
    })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (leadData.status) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { lastInteractionAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true, leadId: lead.id })
  }

  return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
}
