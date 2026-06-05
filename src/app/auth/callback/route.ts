import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalido`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=link_expirado`)
  }

  const user = data.user

  // Garante que o perfil exista no banco (fallback caso o trigger Supabase tenha falhado)
  const existing = await prisma.user.findUnique({ where: { id: user.id } })

  if (!existing) {
    const metadata = user.user_metadata ?? {}
    const companyName =
      (metadata.company_name as string | undefined)?.trim() ||
      user.email?.split('@')[1] ||
      'Minha Imobiliária'
    const name =
      (metadata.name as string | undefined)?.trim() ||
      user.email?.split('@')[0] ||
      'Administrador'
    const rawSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const slug = `${rawSlug}-${Date.now()}`

    try {
      const tenant = await prisma.tenant.create({
        data: { name: companyName, slug, isActive: true, settings: {} },
      })
      await prisma.user.create({
        data: {
          id: user.id,
          tenantId: tenant.id,
          email: user.email!,
          name,
          role: 'admin',
          isActive: true,
        },
      })
    } catch {
      // Trigger pode ter criado o perfil em paralelo — ignorar conflito
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
