-- ============================================================
-- SUPABASE STORAGE BUCKET
-- Run this in the Supabase SQL editor OR use the dashboard
-- ============================================================

-- Create the PDF/receipts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imports',
  'imports',
  FALSE,
  20971520,   -- 20MB max per file
  ARRAY['application/pdf', 'text/csv', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage: users can only access their own folder (imports/{user_id}/*)
CREATE POLICY "storage: user upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage: user read own folder"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage: user delete own folder"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
