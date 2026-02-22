# Supabase Database Setup

## How to run

Run each file **in order** in the Supabase SQL Editor:
(Dashboard → SQL Editor → New query → paste → Run)

| File | Description |
|------|-------------|
| `001_extensions.sql` | Enable uuid-ossp + pgcrypto |
| `002_accounts.sql` | Accounts table + RLS |
| `003_categories.sql` | Categories table + RLS + default seed data |
| `004_transactions.sql` | Transactions table + RLS + indexes |
| `005_budgets.sql` | Budgets table + RLS |
| `006_rules.sql` | Auto-categorization rules + RLS + default keyword seed |
| `007_imports.sql` | Import sessions table + RLS |
| `008_recurring.sql` | Recurring patterns table + RLS |
| `009_storage.sql` | Storage bucket `imports` + RLS policies |
| `010_analytics_views.sql` | Dashboard views (monthly totals, category breakdown, top merchants) |

## Notes

- `003_categories.sql` must run **before** `006_rules.sql` (rules reference category IDs)
- `002_accounts.sql` must run **before** `004_transactions.sql`
- Storage RLS uses `{user_id}/{filename}` path convention — backend must upload to `imports/{user_id}/filename.pdf`
- Default categories and rules have `user_id = NULL` and `is_default = TRUE`
- Users can add their own categories/rules on top of defaults
