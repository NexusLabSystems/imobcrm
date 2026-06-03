import { prisma } from '@/lib/prisma'

// Pontuação máxima por fator:
// Perfil completo  : 20 pts  (phone +10, email +10)
// Origem           : 10 pts
// Atividades       : 20 pts
// Etapa do funil   : 20 pts  (probability_weight / 5)
// Recência         : 30 pts

const SOURCE_SCORE: Record<string, number> = {
  indicacao:  10,
  manual:      8,
  website:     6,
  portais:     5,
  facebook:    4,
  instagram:   4,
  importacao:  2,
}

function recencyScore(lastInteractionAt: Date | null, createdAt: Date): number {
  const ref = lastInteractionAt ?? createdAt
  const diffDays = (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays <= 1)   return 30
  if (diffDays <= 7)   return 22
  if (diffDays <= 30)  return 12
  if (diffDays <= 90)  return 5
  return 0
}

function activityScore(count: number): number {
  if (count === 0) return 0
  if (count <= 2)  return 10
  if (count <= 5)  return 15
  return 20
}

export async function recalculateLeadScore(leadId: string): Promise<number> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      source: true,
      email: true,
      phone: true,
      lastInteractionAt: true,
      createdAt: true,
      funnelStage: { select: { probabilityWeight: true } },
      _count: { select: { activities: true } },
    },
  })

  if (!lead) return 0

  const profile  = (lead.phone ? 10 : 0) + (lead.email ? 10 : 0)
  const source   = SOURCE_SCORE[lead.source] ?? 4
  const activity = activityScore(lead._count.activities)
  const funnel   = Math.round((lead.funnelStage?.probabilityWeight ?? 0) / 5)
  const recency  = recencyScore(lead.lastInteractionAt, lead.createdAt)

  const score = Math.min(100, profile + source + activity + funnel + recency)

  await prisma.lead.update({ where: { id: leadId }, data: { score } })

  return score
}
