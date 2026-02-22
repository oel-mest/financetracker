-- ============================================================
-- AUTO-CATEGORIZATION RULES
-- ============================================================
CREATE TABLE categorization_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system default rule
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  keyword     TEXT NOT NULL,          -- matched against merchant/description (case-insensitive)
  priority    INT NOT NULL DEFAULT 0, -- higher = checked first
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_user_id ON categorization_rules(user_id);

-- RLS
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rules: read own + defaults"
  ON categorization_rules FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "rules: insert own"
  ON categorization_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rules: update own"
  ON categorization_rules FOR UPDATE
  USING (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "rules: delete own"
  ON categorization_rules FOR DELETE
  USING (auth.uid() = user_id AND is_default = FALSE);

-- ============================================================
-- SEED DEFAULT RULES
-- ============================================================
DO $$
DECLARE
  cat_food        UUID;
  cat_groceries   UUID;
  cat_transport   UUID;
  cat_shopping    UUID;
  cat_health      UUID;
  cat_utilities   UUID;
  cat_rent        UUID;
  cat_entertain   UUID;
  cat_education   UUID;
  cat_subs        UUID;
  cat_cafe        UUID;
  cat_atm         UUID;
  cat_transfer    UUID;
BEGIN
  SELECT id INTO cat_food      FROM categories WHERE name = 'Food & Dining'    AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_groceries FROM categories WHERE name = 'Groceries'        AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_transport FROM categories WHERE name = 'Transport'        AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_shopping  FROM categories WHERE name = 'Shopping'         AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_health    FROM categories WHERE name = 'Health & Pharmacy' AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_utilities FROM categories WHERE name = 'Utilities & Bills' AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_rent      FROM categories WHERE name = 'Rent & Housing'   AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_entertain FROM categories WHERE name = 'Entertainment'    AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_education FROM categories WHERE name = 'Education'        AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_subs      FROM categories WHERE name = 'Subscriptions'    AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_cafe      FROM categories WHERE name = 'Café & Coffee'    AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_atm       FROM categories WHERE name = 'ATM & Cash'       AND is_default = TRUE LIMIT 1;
  SELECT id INTO cat_transfer  FROM categories WHERE name = 'Transfer'         AND is_default = TRUE LIMIT 1;

  INSERT INTO categorization_rules (user_id, category_id, keyword, is_default, priority) VALUES
    -- Food & Dining
    (NULL, cat_food, 'glovo',         TRUE, 10),
    (NULL, cat_food, 'jumia food',    TRUE, 10),
    (NULL, cat_food, 'restaurant',    TRUE, 5),
    (NULL, cat_food, 'pizza',         TRUE, 5),
    (NULL, cat_food, 'burger',        TRUE, 5),
    (NULL, cat_food, 'snack',         TRUE, 5),
    (NULL, cat_food, 'sandwitch',     TRUE, 5),
    -- Groceries
    (NULL, cat_groceries, 'marjane',  TRUE, 10),
    (NULL, cat_groceries, 'carrefour',TRUE, 10),
    (NULL, cat_groceries, 'acima',    TRUE, 10),
    (NULL, cat_groceries, 'label vie',TRUE, 10),
    (NULL, cat_groceries, 'supermarche', TRUE, 5),
    (NULL, cat_groceries, 'epicerie', TRUE, 5),
    -- Transport
    (NULL, cat_transport, 'uber',     TRUE, 10),
    (NULL, cat_transport, 'careem',   TRUE, 10),
    (NULL, cat_transport, 'indriver', TRUE, 10),
    (NULL, cat_transport, 'taxi',     TRUE, 5),
    (NULL, cat_transport, 'autoroute',TRUE, 5),
    (NULL, cat_transport, 'peage',    TRUE, 5),
    (NULL, cat_transport, 'station', TRUE, 5),
    (NULL, cat_transport, 'essence',  TRUE, 5),
    -- Shopping
    (NULL, cat_shopping, 'jumia',     TRUE, 10),
    (NULL, cat_shopping, 'amazon',    TRUE, 10),
    (NULL, cat_shopping, 'zara',      TRUE, 10),
    (NULL, cat_shopping, 'h&m',       TRUE, 10),
    (NULL, cat_shopping, 'shein',     TRUE, 10),
    -- Health
    (NULL, cat_health, 'pharmacie',   TRUE, 10),
    (NULL, cat_health, 'pharmacy',    TRUE, 10),
    (NULL, cat_health, 'clinique',    TRUE, 10),
    (NULL, cat_health, 'hopital',     TRUE, 10),
    (NULL, cat_health, 'docteur',     TRUE, 5),
    (NULL, cat_health, 'labo',        TRUE, 5),
    -- Utilities
    (NULL, cat_utilities, 'amendis',  TRUE, 10),
    (NULL, cat_utilities, 'radeef',   TRUE, 10),
    (NULL, cat_utilities, 'lydec',    TRUE, 10),
    (NULL, cat_utilities, 'onee',     TRUE, 10),
    (NULL, cat_utilities, 'iam',      TRUE, 10),
    (NULL, cat_utilities, 'orange',   TRUE, 10),
    (NULL, cat_utilities, 'inwi',     TRUE, 10),
    -- Rent
    (NULL, cat_rent, 'loyer',         TRUE, 10),
    (NULL, cat_rent, 'syndic',        TRUE, 10),
    -- Entertainment
    (NULL, cat_entertain, 'netflix',  TRUE, 10),
    (NULL, cat_entertain, 'cinema',   TRUE, 10),
    (NULL, cat_entertain, 'spotify',  TRUE, 10),
    (NULL, cat_entertain, 'youtube',  TRUE, 10),
    (NULL, cat_entertain, 'twitch',   TRUE, 10),
    -- Education
    (NULL, cat_education, 'universite', TRUE, 10),
    (NULL, cat_education, 'ecole',    TRUE, 5),
    (NULL, cat_education, 'formation',TRUE, 5),
    (NULL, cat_education, 'udemy',    TRUE, 10),
    (NULL, cat_education, 'coursera', TRUE, 10),
    -- Subscriptions
    (NULL, cat_subs, 'abonnement',    TRUE, 10),
    (NULL, cat_subs, 'subscription',  TRUE, 10),
    (NULL, cat_subs, 'apple',         TRUE, 5),
    (NULL, cat_subs, 'google',        TRUE, 5),
    -- Café
    (NULL, cat_cafe, 'cafe',          TRUE, 10),
    (NULL, cat_cafe, 'starbucks',     TRUE, 10),
    (NULL, cat_cafe, 'coffee',        TRUE, 10),
    -- ATM
    (NULL, cat_atm, 'retrait',        TRUE, 10),
    (NULL, cat_atm, 'atm',            TRUE, 10),
    (NULL, cat_atm, 'dab',            TRUE, 10),
    -- Transfer
    (NULL, cat_transfer, 'virement',  TRUE, 10),
    (NULL, cat_transfer, 'transfer',  TRUE, 10),
    (NULL, cat_transfer, 'wafacash',  TRUE, 10),
    (NULL, cat_transfer, 'western union', TRUE, 10),
    (NULL, cat_transfer, 'cashplus',  TRUE, 10);
END $$;
