import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateLeadScore } from '@/lib/leadScore'

// GET — verificação do webhook pelo Facebook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  const { searchParams } = request.nextUrl

  const mode      = searchParams.get('hub.mode')
  const challenge = searchParams.get('hub.challenge')
  const token     = searchParams.get('hub.verify_token')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })

  const settings = (tenant?.settings ?? {}) as Record<string, string>
  const verifyToken = settings.facebookVerifyToken

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// POST — recebe novo lead do Facebook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })
  if (!tenant) return new NextResponse('Not found', { status: 404 })

  const settings = (tenant.settings ?? {}) as Record<string, string>
  const pageAccessToken = settings.facebookPageAccessToken

  let body: { entry?: Array<{ changes?: Array<{ field: string; value: { leadgen_id: string } }> }> }
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  const changes = body.entry?.flatMap((e) => e.changes ?? []) ?? []

  for (const change of changes) {
    if (change.field !== 'leadgen') continue

    const leadgenId = change.value.leadgen_id
    if (!leadgenId || !pageAccessToken) continue

    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${pageAccessToken}`
      )
      const data = await res.json() as {
        field_data?: Array<{ name: string; values: string[] }>
      }

      const fields: Record<string, string> = {}
      for (const f of data.field_data ?? []) {
        fields[f.name] = f.values[0] ?? ''
      }

      const name = fields.full_name || fields.name || fields.first_name || 'Lead Facebook'
      const email = fields.email || null
      const phone = fields.phone_number || fields.phone || null

      const lead = await prisma.lead.create({
        data: {
          tenantId,
          name,
          email,
          phone,
          source: 'facebook',
        },
      })

      recalculateLeadScore(lead.id).catch(() => {})
    } catch {
      // Segue para o próximo evento
    }
  }

  return new NextResponse('OK', { status: 200 })
}
