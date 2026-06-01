-- Trigger existente no Supabase (documentação do que está rodando em produção).
-- NÃO execute novamente — já foi criado manualmente no SQL Editor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, tenant_id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    '08e5913c-15c0-491f-8778-c0a8f7e66911',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
