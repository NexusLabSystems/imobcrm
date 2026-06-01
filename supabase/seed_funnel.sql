-- Funil padrão + etapas — execute UMA VEZ no SQL Editor do Supabase.
-- Habilite também Realtime na tabela leads:
--   Supabase Dashboard → Database → Replication → leads ✓

INSERT INTO public.funnels (id, tenant_id, name, is_default, created_at, updated_at)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  '08e5913c-15c0-491f-8778-c0a8f7e66911',
  'Funil Padrão',
  true,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.funnel_stages (id, funnel_id, name, color, "order", probability_weight, required_fields, created_at, updated_at)
VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Novo Contato',  '#3B82F6', 1, 10, '[]', now(), now()),
  ('a1b2c3d4-0002-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Qualificação',  '#F59E0B', 2, 25, '[]', now(), now()),
  ('a1b2c3d4-0003-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Proposta',      '#8B5CF6', 3, 50, '[]', now(), now()),
  ('a1b2c3d4-0004-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Negociação',    '#EC4899', 4, 75, '[]', now(), now()),
  ('a1b2c3d4-0005-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Fechamento',    '#10B981', 5, 90, '[]', now(), now())
ON CONFLICT (id) DO NOTHING;
