-- Tenant padrão do MVP — JÁ EXECUTADO, apenas documentação.
-- id:   08e5913c-15c0-491f-8778-c0a8f7e66911
-- name: Imobiliaria Teste

INSERT INTO public.tenants (id, name, slug, is_active, settings, created_at, updated_at)
VALUES (
  '08e5913c-15c0-491f-8778-c0a8f7e66911',
  'Imobiliaria Teste',
  'imobiliaria-teste',
  true,
  '{}',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
