/**
 * Seed: 100 leads de teste realistas
 * Uso: npx tsx scripts/seed-leads.ts
 */

import { PrismaClient, LeadSource, LeadStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ── Dados realistas brasileiros ───────────────────────────────────────────────

const PRIMEIROS = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Fernanda', 'Lucas', 'Juliana',
  'Rafael', 'Amanda', 'Bruno', 'Larissa', 'Gustavo', 'Camila', 'Diego',
  'Beatriz', 'Rodrigo', 'Gabriela', 'Thiago', 'Letícia', 'Felipe', 'Natália',
  'Matheus', 'Priscila', 'Leonardo', 'Mariana', 'André', 'Patricia', 'Eduardo',
  'Vanessa', 'Marcelo', 'Isabela', 'Roberto', 'Renata', 'Alexandre', 'Aline',
  'Daniel', 'Simone', 'Henrique', 'Bruna', 'Paulo', 'Monique', 'Vinícius',
  'Caroline', 'Fábio', 'Daniela', 'Leandro', 'Tatiana', 'Sérgio', 'Raquel',
]

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Lima', 'Pereira', 'Carvalho', 'Melo', 'Ribeiro', 'Costa', 'Martins',
  'Araújo', 'Nascimento', 'Gomes', 'Moura', 'Barbosa', 'Correia', 'Dias',
  'Cardoso', 'Teixeira', 'Nunes', 'Moreira', 'Pinto', 'Mendes', 'Castro',
  'Freitas', 'Monteiro', 'Azevedo', 'Medeiros', 'Nogueira', 'Cunha', 'Ramos',
]

const DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'icloud.com']
const DDDS     = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '92']

function nomeAleatorio() {
  const p = PRIMEIROS[Math.floor(Math.random() * PRIMEIROS.length)]
  const s = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)]
  return `${p} ${s}`
}

function emailDeNome(nome: string, idx: number): string | null {
  if (Math.random() < 0.15) return null  // 15% sem email
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
  const dominio = DOMINIOS[Math.floor(Math.random() * DOMINIOS.length)]
  return `${base}${idx}@${dominio}`
}

function telefoneAleatorio(): string | null {
  if (Math.random() < 0.1) return null  // 10% sem telefone
  const ddd  = DDDS[Math.floor(Math.random() * DDDS.length)]
  const num  = Math.floor(Math.random() * 900_000_000 + 100_000_000)
  return `(${ddd}) 9${String(num).slice(0, 4)}-${String(num).slice(4, 8)}`
}

function diasAtras(dias: number): Date {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
}

// Distribuição ponderada de status (mais realista para CRM)
const STATUS_POOL: LeadStatus[] = [
  'new', 'new', 'new', 'new', 'new', 'new', 'new',           // ~28%
  'in_progress', 'in_progress', 'in_progress', 'in_progress', 'in_progress', 'in_progress', // ~24%
  'qualified', 'qualified', 'qualified', 'qualified', 'qualified', // ~20%
  'converted', 'converted', 'converted', 'converted',          // ~16%
  'lost', 'lost', 'lost',                                      // ~12%
]

const SOURCE_POOL: LeadSource[] = [
  'instagram', 'instagram', 'instagram', 'instagram',
  'facebook', 'facebook', 'facebook',
  'portais', 'portais', 'portais', 'portais',
  'indicacao', 'indicacao', 'indicacao',
  'website', 'website',
  'manual', 'manual',
  'importacao',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Buscando tenant e usuário...')

  const tenant = await prisma.tenant.findFirst({ where: { deletedAt: null } })
  if (!tenant) throw new Error('Nenhum tenant encontrado. Faça login primeiro.')

  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, deletedAt: null, isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!user) throw new Error('Nenhum usuário encontrado no tenant.')

  console.log(`✅ Tenant: "${tenant.name}" | Usuário: "${user.name}"`)
  console.log('📝 Criando 100 leads...\n')

  const leads = []

  for (let i = 1; i <= 100; i++) {
    const nome    = nomeAleatorio()
    const status  = pick(STATUS_POOL)
    const source  = pick(SOURCE_POOL)
    const diasAntes = Math.floor(Math.random() * 90) + 1  // até 90 dias atrás
    const criadoEm  = diasAtras(diasAntes)

    leads.push({
      tenantId:        tenant.id,
      assignedTo:      user.id,
      name:            nome,
      email:           emailDeNome(nome, i),
      phone:           telefoneAleatorio(),
      source,
      status,
      score:           Math.floor(Math.random() * 100),
      tags:            [] as string[],
      metadata:        {},
      createdAt:       criadoEm,
      updatedAt:       criadoEm,
      lastInteractionAt: status !== 'new' ? diasAtras(Math.floor(Math.random() * diasAntes)) : null,
    })
  }

  // Insere em lotes de 20 para não sobrecarregar
  const LOTE = 20
  let criados = 0

  for (let i = 0; i < leads.length; i += LOTE) {
    const lote = leads.slice(i, i + LOTE)
    await prisma.lead.createMany({ data: lote })
    criados += lote.length
    process.stdout.write(`\r  ${criados}/100 leads criados...`)
  }

  console.log('\n')

  // Resumo por status
  const porStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1
    return acc
  }, {})

  const STATUS_LABEL: Record<string, string> = {
    new: 'Novo', in_progress: 'Em andamento', qualified: 'Qualificado',
    converted: 'Convertido', lost: 'Perdido',
  }

  console.log('📊 Resumo:')
  for (const [st, qtd] of Object.entries(porStatus)) {
    const label = STATUS_LABEL[st] ?? st
    const bar   = '█'.repeat(Math.round(qtd / 2))
    console.log(`  ${label.padEnd(14)} ${String(qtd).padStart(3)}  ${bar}`)
  }

  console.log('\n✅ 100 leads criados com sucesso!')
  console.log(`   Tenant: ${tenant.name}`)
  console.log(`   Atribuídos a: ${user.name}`)
}

main()
  .catch((err) => { console.error('\n❌ Erro:', err.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
