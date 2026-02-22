# DRHM — Personal Finance App

A personal finance tracker built for Moroccan banking (CIH Bank PDF import, MAD currency).

## Stack
- **Frontend**: React + TypeScript + Tailwind + Recharts — port 2026
- **Backend**: Node.js + Express + TypeScript — port 2027
- **Parser**: Python + FastAPI + openbk — port 2028
- **Database**: Supabase (Postgres + Auth + Storage)

## Quick start

### 1. Environment
```bash
cp .env.example .env
# Fill in your Supabase URL and keys
```

### 2. Run database migrations
Open Supabase SQL Editor and run all files in `supabase/migrations/` in order:
```
001_extensions.sql
002_accounts.sql
003_categories.sql
004_transactions.sql
005_budgets.sql
006_rules.sql
007_imports.sql
008_recurring.sql
009_storage.sql
010_analytics_views.sql
```

### 3. Start (development — hot reload)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 4. Start (production)
```bash
docker compose up --build
```

Services:
- Frontend → http://localhost:2026
- Backend  → http://localhost:2027
- Parser   → http://localhost:2028

## Project structure
```
financeapp/
├── frontend/          React app
├── backend/           Express API
├── parser/            Python PDF parser
├── supabase/
│   └── migrations/    SQL migrations (run in Supabase dashboard)
├── docker-compose.yml          Production
├── docker-compose.dev.yml      Dev overrides (hot reload)
└── .env.example
```

## CIH Bank PDF Import
The parser uses [openbk](https://pypi.org/project/openbk/) + Java (tabula).
Java is bundled in the parser Docker image automatically.
When importing, select the year of the statement manually — CIH PDFs only include DD/MM dates.

## Ports
| Service  | Port |
|----------|------|
| Frontend | 2026 |
| Backend  | 2027 |
| Parser   | 2028 |
