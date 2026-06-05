'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function createPaymentTable(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const enterpriseId = (formData.get('enterpriseId') as string) || null
  const name         = (formData.get('name') as string).trim()
  const description  = (formData.get('description') as string).trim() || null
  const downPaymentPct = parseFloat(formData.get('downPaymentPct') as string)
  const installments   = parseInt(formData.get('installments') as string, 10)
  const interestRate   = parseFloat(formData.get('interestRate') as string)
  const indexer        = (formData.get('indexer') as string) || null

  if (!name) throw new Error('Nome é obrigatório')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).paymentTable.create({
    data: {
      tenantId: profile.tenantId,
      enterpriseId,
      name,
      description,
      downPaymentPct,
      installments,
      interestRate,
      indexer,
    },
  })

  if (enterpriseId) {
    revalidatePath(`/enterprises/${enterpriseId}/tabelas`)
    redirect(`/enterprises/${enterpriseId}/tabelas`)
  } else {
    revalidatePath('/admin/tabelas')
    redirect('/admin/tabelas')
  }
}

export async function updatePaymentTable(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const id             = formData.get('id') as string
  const enterpriseId   = (formData.get('enterpriseId') as string) || null
  const name           = (formData.get('name') as string).trim()
  const description    = (formData.get('description') as string).trim() || null
  const downPaymentPct = parseFloat(formData.get('downPaymentPct') as string)
  const installments   = parseInt(formData.get('installments') as string, 10)
  const interestRate   = parseFloat(formData.get('interestRate') as string)
  const indexer        = (formData.get('indexer') as string) || null
  const isActive       = formData.get('isActive') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).paymentTable.update({
    where: { id, tenantId: profile.tenantId },
    data: { name, description, downPaymentPct, installments, interestRate, indexer, isActive },
  })

  if (enterpriseId) {
    revalidatePath(`/enterprises/${enterpriseId}/tabelas`)
  }
  revalidatePath('/admin/tabelas')
}

export async function deletePaymentTable(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const id           = formData.get('id') as string
  const enterpriseId = (formData.get('enterpriseId') as string) || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).paymentTable.update({
    where: { id, tenantId: profile.tenantId },
    data: { deletedAt: new Date() },
  })

  if (enterpriseId) {
    revalidatePath(`/enterprises/${enterpriseId}/tabelas`)
    redirect(`/enterprises/${enterpriseId}/tabelas`)
  } else {
    revalidatePath('/admin/tabelas')
    redirect('/admin/tabelas')
  }
}
