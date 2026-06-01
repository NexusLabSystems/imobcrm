'use server'

import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActivityType } from '@prisma/client'

export async function createActivity(formData: FormData) {
  const { profile } = await getProfile()

  const leadId = formData.get('leadId') as string
  const type = (formData.get('type') as ActivityType) || 'note'
  const description = (formData.get('description') as string)?.trim()

  if (!description) throw new Error('Descrição é obrigatória')

  await prisma.activity.create({
    data: {
      tenantId: profile.tenantId,
      leadId,
      userId: profile.id,
      type,
      description,
    },
  })

  revalidatePath(`/leads/${leadId}`)
}
