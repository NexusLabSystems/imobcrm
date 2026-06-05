import { NextRequest } from 'next/server'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateLeadScore } from '@/lib/leadScore'
import { parse } from 'csv-parse/sync'
import type { LeadSource } from '@prisma/client'

const SOURCE_MAP: Record<string, LeadSource> = {
  website: 'website', facebook: 'facebook', instagram: 'instagram',
  indicacao: 'indicacao', portais: 'portais', manual: 'manual', importacao: 'importacao',
}

const FIELD_MAP: Record<string, string> = {
  nome: 'name', name: 'name',
  email: 'email',
  telefone: 'phone', phone: 'phone', celular: 'phone',
  origem: 'source', source: 'source',
}

const enc = new TextEncoder()

function line(obj: object) {
  return enc.encode(JSON.stringify(obj) + '\n')
}

export async function POST(request: NextRequest) {
  // Autentica — getProfile usa cookies() que funciona em Route Handlers
  let profile: Awaited<ReturnType<typeof getProfile>>['profile']
  try {
    const auth = await getProfile()
    profile = auth.profile
  } catch {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || file.size === 0) {
    return new Response(JSON.stringify({ error: 'Arquivo não enviado' }), { status: 400 })
  }

  let rows: Record<string, string>[]
  try {
    const text = await file.text()
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true })
  } catch {
    return new Response(JSON.stringify({ error: 'CSV inválido ou mal formatado' }), { status: 400 })
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'Arquivo sem linhas de dados' }), { status: 400 })
  }

  const { tenantId, id: userId } = profile

  const stream = new ReadableStream({
    async start(controller) {
      // Envia o total para o cliente saber quantos vêm
      controller.enqueue(line({ type: 'total', total: rows.length }))

      let okCount = 0

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i]

        // Normaliza cabeçalhos para inglês
        const row: Record<string, string> = {}
        for (const [key, val] of Object.entries(raw)) {
          const mapped = FIELD_MAP[key.toLowerCase().trim()]
          if (mapped) row[mapped] = val
        }

        const rowNum = i + 2
        const name = row.name?.trim()

        if (!name) {
          controller.enqueue(line({ type: 'row', row: rowNum, name: '—', status: 'error', message: 'Nome ausente' }))
          continue
        }

        try {
          const lead = await prisma.lead.create({
            data: {
              tenantId,
              assignedTo: userId,          // ← atribui ao usuário logado
              name,
              email: row.email?.trim() || null,
              phone: row.phone?.trim() || null,
              source: SOURCE_MAP[row.source?.toLowerCase().trim() ?? ''] ?? 'importacao',
            },
          })
          recalculateLeadScore(lead.id).catch(() => {})
          okCount++
          controller.enqueue(line({ type: 'row', row: rowNum, name, status: 'ok' }))
        } catch {
          controller.enqueue(line({ type: 'row', row: rowNum, name, status: 'error', message: 'Erro ao salvar' }))
        }
      }

      controller.enqueue(line({ type: 'done', ok: okCount, total: rows.length }))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
