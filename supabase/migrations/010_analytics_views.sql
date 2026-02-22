-- ============================================================
-- ANALYTICS VIEWS (used by dashboard endpoints)
-- ============================================================

-- Monthly spending by category
CREATE OR REPLACE VIEW v_monthly_by_category AS
SELECT
  t.user_id,
  DATE_TRUNC('month', t.date) AS month,
  c.id   AS category_id,
  c.name AS category_name,
  c.color AS category_color,
  c.icon AS category_icon,
  SUM(CASE WHEN t.type = 'debit'  THEN t.amount ELSE 0 END) AS total_debit,
  SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) AS total_credit,
  COUNT(*) AS transaction_count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
GROUP BY t.user_id, DATE_TRUNC('month', t.date), c.id, c.name, c.color, c.icon;

-- Monthly totals
CREATE OR REPLACE VIEW v_monthly_totals AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END) AS total_debit,
  SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS total_credit,
  COUNT(*) AS transaction_count
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', date);

-- Top merchants
CREATE OR REPLACE VIEW v_top_merchants AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  merchant,
  COUNT(*)       AS transaction_count,
  SUM(amount)    AS total_amount
FROM transactions
WHERE merchant IS NOT NULL AND type = 'debit'
GROUP BY user_id, DATE_TRUNC('month', date), merchant;
