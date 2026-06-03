-- Trigger v2: suporte a múltiplos tenants.
-- Substitui o trigger original. Execute no SQL Editor do Supabase.
--
-- Comportamento:
--   • Se raw_user_meta_data.tenant_id estiver presente → usuário convidado,
--     entra no tenant existente com o role informado (padrão: broker).
--   • Se não estiver → primeiro cadastro, cria novo tenant com o nome da empresa
--     (raw_user_meta_data.company_name ou domínio do e-mail) e role admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_role      text;
  v_name      text;
  v_company   text;
  v_slug      text;
BEGIN
  v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::uuid;
  v_role      := COALESCE(NEW.raw_user_meta_data->>'role', 'broker');
  v_name      := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  IF v_tenant_id IS NULL THEN
    -- Novo cadastro: cria tenant
    v_company := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
      split_part(NEW.email, '@', 2)
    );
    v_slug := LOWER(REGEXP_REPLACE(v_company, '[^a-zA-Z0-9]', '-', 'g'));

    INSERT INTO public.tenants (id, name, slug, is_active, settings, created_at, updated_at)
    VALUES (gen_random_uuid(), v_company, v_slug, true, '{}', now(), now())
    RETURNING id INTO v_tenant_id;

    v_role := 'admin'; -- fundador vira admin
  END IF;

  INSERT INTO public.users (id, tenant_id, email, name, role, is_active, created_at, updated_at)
  VALUES (NEW.id, v_tenant_id, NEW.email, v_name, v_role, true, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recria o trigger (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
