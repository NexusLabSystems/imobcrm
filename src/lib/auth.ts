import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true, tenantId: true, email: true },
  })

  if (!profile) redirect('/login')

  return { user, profile }
}

export async function requireRole(allowed: Role[]) {
  const { user, profile } = await getProfile()
  if (!allowed.includes(profile.role)) redirect('/')
  return { user, profile }
}
