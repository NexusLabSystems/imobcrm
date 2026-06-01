-- Setup do bucket de fotos de empreendimentos.
-- Execute no SQL Editor do Supabase.

-- 1. Criar bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('enterprises', 'enterprises', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: usuários autenticados podem fazer upload
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'enterprises');

-- 3. Política: leitura pública
CREATE POLICY "Public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'enterprises');

-- 4. Política: autenticados podem deletar seus próprios uploads
CREATE POLICY "Authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'enterprises');
