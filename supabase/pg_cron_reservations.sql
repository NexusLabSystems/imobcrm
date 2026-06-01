-- Job pg_cron: expira reservas vencidas a cada 15 minutos.
-- Pré-requisito: extensão pg_cron habilitada.
--   Supabase Dashboard → Database → Extensions → pg_cron → Enable
-- Execute este script no SQL Editor após habilitar a extensão.

SELECT cron.schedule(
  'expire-reservations',
  '*/15 * * * *',
  $$
    -- 1. Marca reservas como expiradas
    UPDATE public.reservations
    SET status = 'expired', updated_at = now()
    WHERE status = 'active' AND expires_at < now();

    -- 2. Libera as unidades cujas reservas expiraram
    UPDATE public.units u
    SET
      status        = 'available',
      reserved_by   = NULL,
      reserved_until = NULL,
      updated_at    = now()
    WHERE u.status = 'reserved'
      AND NOT EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.unit_id = u.id AND r.status = 'active'
      );
  $$
);
