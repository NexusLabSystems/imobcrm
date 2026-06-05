'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateLeadScore } from '@/lib/leadScore'
import { encrypt } from '@/lib/crypto'
import { sendPushToAdmins } from '@/actions/push'
import type { LeadSource, LeadStatus } from '@prisma/client'
import { parse } from 'csv-parse/sync'

export async function createLead(formData: FormData) {
  const { profile } = await getProfile()

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('Nome é obrigatório')

  const lead = await prisma.lead.create({
    data: {
      tenantId: profile.tenantId,
      assignedTo: profile.role === 'broker' ? profile.id : null,
      name,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      source: (formData.get('source') as LeadSource) || 'manual',
    },
  })

  recalculateLeadScore(lead.id).catch(() => {})

  sendPushToAdmins(
    { title: 'Novo lead', body: `${name} foi cadastrado`, url: `/leads/${lead.id}` },
    profile.tenantId
  ).catch(() => {})

  redirect(`/leads/${lead.id}`)
}

export async function updateLeadStatus(formData: FormData) {
  const { profile } = await getProfile()
  const leadId = formData.get('leadId') as string

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { status: formData.get('status') as LeadStatus },
  })

  revalidatePath(`/leads/${leadId}`)
}

export async function moveLeadToStage(formData: FormData) {
  const { profile } = await getProfile()

  const leadId   = formData.get('leadId') as string
  const stageId  = (formData.get('stageId') as string) || null
  const funnelId = (formData.get('funnelId') as string) || null

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { funnelStageId: stageId, funnelId: stageId ? funnelId : null, lastInteractionAt: new Date() },
  })

  recalculateLeadScore(leadId).catch(() => {})
}

export async function updateLeadCpf(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const cpf    = (formData.get('cpf') as string)?.replace(/\D/g, '').trim()

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { cpf: cpf ? encrypt(cpf) : null },
  })

  revalidatePath(`/leads/${leadId}`)
}

export async function updateLeadInfo(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const name   = (formData.get('name') as string)?.trim()
  const email  = (formData.get('email') as string)?.trim() || null
  const phone  = (formData.get('phone') as string)?.trim() || null

  if (!name) throw new Error('Nome é obrigatório')

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { name, email, phone },
  })

  revalidatePath(`/leads/${leadId}`)
}

export async function assignLead(formData: FormData) {
  const { profile } = await getProfile()
  const leadId = formData.get('leadId') as string

  await prisma.lead.update({
    where: { id: leadId, tenantId: profile.tenantId },
    data: { assignedTo: (formData.get('assignedTo') as string) || null },
  })

  revalidatePath(`/leads/${leadId}`)
}

// ── CSV Import ────────────────────────────────────────────────────────────────

const SOURCE_MAP: Record<string, LeadSource> = {
  website: 'website', facebook: 'facebook', instagram: 'instagram',
  indicacao: 'indicacao', portais: 'portais', manual: 'manual', importacao: 'importacao',
}

type ImportResult = { row: number; name: string; status: 'ok' | 'error'; message?: string }

export async function importLeadsFromCSV(formData: FormData): Promise<ImportResult[]> {
  const { profile } = await getProfile()

  const file = formData.get('file') as File
  if (!file || file.size === 0) throw new Error('Arquivo não enviado')

  const text = await file.text()
  let rows: Record<string, string>[]

  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true })
  } catch {
    throw new Error('Arquivo CSV inválido ou mal formatado')
  }

  const FIELD_MAP: Record<string, string> = {
    nome: 'name', name: 'name',
    email: 'email',
    telefone: 'phone', phone: 'phone', celular: 'phone',
    origem: 'source', source: 'source',
  }

  const results: ImportResult[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    // Normaliza os cabeçalhos para inglês
    const row: Record<string, string> = {}
    for (const [key, val] of Object.entries(raw)) {
      const normalized = FIELD_MAP[key.toLowerCase().trim()]
      if (normalized) row[normalized] = val
    }

    const name = row.name?.trim()
    if (!name) {
      results.push({ row: i + 2, name: '—', status: 'error', message: 'Nome ausente' })
      continue
    }

    try {
      const lead = await prisma.lead.create({
        data: {
          tenantId: profile.tenantId,
          name,
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          source: SOURCE_MAP[row.source?.toLowerCase().trim() ?? ''] ?? 'importacao',
        },
      })
      recalculateLeadScore(lead.id).catch(() => {})
      results.push({ row: i + 2, name, status: 'ok' })
    } catch {
      results.push({ row: i + 2, name, status: 'error', message: 'Erro ao criar lead' })
    }
  }

  if (results.some((r) => r.status === 'ok')) revalidatePath('/leads')

  return results
}
