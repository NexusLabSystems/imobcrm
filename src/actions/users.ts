'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, getProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Role } from '@prisma/client'

export async function inviteUser(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const email = (formData.get('email') as string).trim().toLowerCase()
  const name = (formData.get('name') as string).trim()
  const role = (formData.get('role') as Role) || 'broker'

  if (!email || !name) throw new Error('E-mail e nome são obrigatórios')

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      name,
      role,
      tenant_id: profile.tenantId,
    },
  })

  if (error) throw new Error(`Erro ao convidar: ${error.message}`)

  revalidatePath('/admin/users')
}

export async function updateUserRole(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const userId = formData.get('userId') as string
  const role = formData.get('role') as Role

  if (userId === profile.id) throw new Error('Você não pode alterar seu próprio role')

  await prisma.user.update({
    where: { id: userId, tenantId: profile.tenantId },
    data: { role },
  })

  revalidatePath('/admin/users')
}

export async function toggleUserActive(formData: FormData) {
  const { profile } = await requireRole(['admin', 'manager'])

  const userId = formData.get('userId') as string
  if (userId === profile.id) throw new Error('Você não pode desativar sua própria conta')

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: profile.tenantId },
    select: { isActive: true },
  })
  if (!user) throw new Error('Usuário não encontrado')

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  })

  revalidatePath('/admin/users')
}
