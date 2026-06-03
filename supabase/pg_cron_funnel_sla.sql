-- ============================================================================
-- Job pg_cron: verifica SLA das etapas do funil (roda diariamente às 08:00)
-- Pré-requisito: extensão pg_cron habilitada e job de reservas já configurado.
-- Execute no SQL Editor do Supabase.
-- ============================================================================
--
-- O que faz:
--   Para cada lead ativo numa etapa que tem max_days configurado:
--   - Se a última interação (ou criação) ultrapassou max_days → cria atividade
--     do tipo 'system' avisando sobre o SLA vencido.
--   - Evita duplicar o aviso: só cria se não houver atividade 'system' de SLA
--     nos últimos 3 dias para aquele lead.
-- ============================================================================

SELECT cron.schedule(
  'funnel-sla-check',
  '0 8 * * *',   -- todos os dias às 08:00
  $$
    INSERT INTO public.activities (
      id, tenant_id, lead_id, user_id, type, description, created_at
    )
    SELECT
      gen_random_uuid(),
      l.tenant_id,
      l.id,
      l.assigned_to,                       -- notifica o corretor responsável
      'system',
      'SLA vencido: lead está na etapa "' || fs.name || '" há mais de '
        || fs.max_days || ' dias sem interação.',
      now()
    FROM public.leads l
    JOIN public.funnel_stages fs ON fs.id = l.funnel_stage_id
    WHERE
      l.deleted_at IS NULL
      AND l.status NOT IN ('converted', 'lost', 'discarded')
      AND fs.max_days IS NOT NULL
      AND l.assigned_to IS NOT NULL
      -- SLA vencido: última interação (ou criação) passou do limite
      AND COALESCE(l.last_interaction_at, l.created_at) < now() - (fs.max_days || ' days')::interval
      -- Evita duplicar o aviso nos últimos 3 dias
      AND NOT EXISTS (
        SELECT 1 FROM public.activities a
        WHERE a.lead_id = l.id
          AND a.type = 'system'
          AND a.description LIKE 'SLA vencido%'
          AND a.created_at > now() - interval '3 days'
      );
  $$
);
