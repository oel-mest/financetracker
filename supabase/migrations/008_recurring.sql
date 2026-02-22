-- ============================================================
-- RECURRING / SUBSCRIPTION PATTERNS
-- ============================================================
CREATE TYPE recurrence_frequency AS ENUM ('weekly', 'monthly', 'yearly');

CREATE TABLE recurring_patterns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant      TEXT NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  frequency     recurrence_frequency NOT NULL,
  average_amount NUMERIC(14, 2),
  last_seen     DATE,
  transaction_count INT DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, merchant, frequency)
);

-- RLS
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring: user owns rows"
  ON recurring_patterns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER recurring_updated_at
  BEFORE UPDATE ON recurring_patterns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
