-- ============================================================================
-- RLS (Row Level Security) — ImobCRM
-- Execute no SQL Editor do Supabase.
-- Prisma usa service role (bypassa RLS). As políticas protegem acesso
-- direto via Supabase SDK com JWT de usuário autenticado.
-- ============================================================================

-- Função auxiliar: retorna o tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- TENANTS
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_own" ON public.tenants
  FOR ALL TO authenticated
  USING (id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_tenant" ON public.users
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- FUNNELS
-- ----------------------------------------------------------------------------
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnels_tenant" ON public.funnels
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- FUNNEL_STAGES (sem tenant_id direto — passa por funnels)
-- ----------------------------------------------------------------------------
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnel_stages_tenant" ON public.funnel_stages
  FOR ALL TO authenticated
  USING (
    funnel_id IN (
      SELECT id FROM public.funnels
      WHERE tenant_id = public.get_current_tenant_id()
    )
  );

-- ----------------------------------------------------------------------------
-- LEADS
-- ----------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_tenant" ON public.leads
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- CLIENTS
-- ----------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_tenant" ON public.clients
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- ENTERPRISES
-- ----------------------------------------------------------------------------
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enterprises_tenant" ON public.enterprises
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- BLOCKS
-- ----------------------------------------------------------------------------
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_tenant" ON public.blocks
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- UNITS
-- ----------------------------------------------------------------------------
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_tenant" ON public.units
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- UNIT_PRICE_HISTORY
-- ----------------------------------------------------------------------------
ALTER TABLE public.unit_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_price_history_tenant" ON public.unit_price_history
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- PROPOSALS
-- ----------------------------------------------------------------------------
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_tenant" ON public.proposals
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- RESERVATIONS
-- ----------------------------------------------------------------------------
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_tenant" ON public.reservations
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- ACTIVITIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_tenant" ON public.activities
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_tenant" ON public.notifications
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());

-- ----------------------------------------------------------------------------
-- AUDIT_LOGS
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_tenant" ON public.audit_logs
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());
