-- ============================================================
-- IMPORTS (PDF / CSV import sessions)
-- ============================================================
CREATE TYPE import_status AS ENUM ('pending', 'parsed', 'confirmed', 'failed');
CREATE TYPE import_source AS ENUM ('csv', 'pdf_cih');

CREATE TABLE imports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source          import_source NOT NULL,
  status          import_status NOT NULL DEFAULT 'pending',
  storage_path    TEXT,                    -- path in Supabase Storage
  raw_result      JSONB,                   -- parser output before confirmation
  error_message   TEXT,
  transaction_count INT DEFAULT 0,
  duplicate_count   INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_imports_user_id ON imports(user_id);

-- RLS
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imports: user owns rows"
  ON imports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER imports_updated_at
  BEFORE UPDATE ON imports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
