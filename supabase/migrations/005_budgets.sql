-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  month       DATE NOT NULL,        -- stored as first day of month e.g. 2025-01-01
  currency    TEXT NOT NULL DEFAULT 'MAD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, month)
);

-- RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets: user owns rows"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
