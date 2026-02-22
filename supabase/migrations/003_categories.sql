-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = default/system category
  name        TEXT NOT NULL,
  icon        TEXT,        -- emoji or icon name
  color       TEXT,        -- hex color
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Users can read system (default) categories AND their own
CREATE POLICY "categories: read own + defaults"
  ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "categories: insert own"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories: update own"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "categories: delete own"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = FALSE);

-- ============================================================
-- SEED DEFAULT CATEGORIES (system-wide, user_id = NULL)
-- ============================================================
INSERT INTO categories (id, user_id, name, icon, color, is_default) VALUES
  (uuid_generate_v4(), NULL, 'Food & Dining',       '🍽️',  '#F97316', TRUE),
  (uuid_generate_v4(), NULL, 'Groceries',            '🛒',  '#84CC16', TRUE),
  (uuid_generate_v4(), NULL, 'Transport',            '🚗',  '#3B82F6', TRUE),
  (uuid_generate_v4(), NULL, 'Shopping',             '🛍️',  '#EC4899', TRUE),
  (uuid_generate_v4(), NULL, 'Health & Pharmacy',   '💊',  '#EF4444', TRUE),
  (uuid_generate_v4(), NULL, 'Utilities & Bills',   '💡',  '#EAB308', TRUE),
  (uuid_generate_v4(), NULL, 'Rent & Housing',      '🏠',  '#8B5CF6', TRUE),
  (uuid_generate_v4(), NULL, 'Entertainment',       '🎬',  '#06B6D4', TRUE),
  (uuid_generate_v4(), NULL, 'Education',           '📚',  '#10B981', TRUE),
  (uuid_generate_v4(), NULL, 'Salary & Income',     '💰',  '#22C55E', TRUE),
  (uuid_generate_v4(), NULL, 'Transfer',            '🔄',  '#94A3B8', TRUE),
  (uuid_generate_v4(), NULL, 'ATM & Cash',          '🏧',  '#64748B', TRUE),
  (uuid_generate_v4(), NULL, 'Subscriptions',       '📱',  '#A855F7', TRUE),
  (uuid_generate_v4(), NULL, 'Café & Coffee',       '☕',  '#D97706', TRUE),
  (uuid_generate_v4(), NULL, 'Other',               '📌',  '#6B7280', TRUE);
