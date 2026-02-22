-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TYPE transaction_type AS ENUM ('debit', 'credit');

CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  type          transaction_type NOT NULL,
  amount        NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency      TEXT NOT NULL DEFAULT 'MAD',
  description   TEXT NOT NULL,
  merchant      TEXT,                           -- extracted/normalized merchant name
  notes         TEXT,
  tags          TEXT[] DEFAULT '{}',
  date          DATE NOT NULL,
  hash          TEXT,                           -- for duplicate detection
  is_recurring  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date       ON transactions(date DESC);
CREATE INDEX idx_transactions_category   ON transactions(category_id);
CREATE INDEX idx_transactions_merchant   ON transactions(merchant);
CREATE UNIQUE INDEX idx_transactions_hash ON transactions(user_id, hash) WHERE hash IS NOT NULL;

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: user owns rows"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
