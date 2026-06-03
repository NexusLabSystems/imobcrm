import { createClient } from '@supabase/supabase-js'

// Cliente com service role — só usar server-side (Server Actions, Route Handlers)
// Nunca importar em Client Components ou expor ao navegador.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
