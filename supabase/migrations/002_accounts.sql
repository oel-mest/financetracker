-- ============================================================
-- ACCOUNTS
-- ============================================================
CREATE TYPE account_type AS ENUM ('cash', 'card', 'cih');

CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        account_type NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'MAD',
  balance     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  color       TEXT,                        -- hex color for UI
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts: user owns rows"
  ON accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
