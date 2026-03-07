<div align="center">

# DRHM.

**A self-hosted personal finance app built for Moroccan banking — track, import, and understand your money.**

[Features](#features) · [Getting Started](#getting-started) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## What is DRHM?

DRHM is an open-source personal finance tracker designed specifically for Morocco. Most finance apps don't support Moroccan banks, currencies, or spending patterns. DRHM does.

Import your CIH or Attijariwafa Bank PDF statements, track spending by category, set budgets, and get insights — all from a clean, self-hosted dashboard that you fully control.

---

## Features

### 📥 Bank Statement Import
- **PDF Import** — Upload your CIH or Attijariwafa Bank monthly statement and all transactions are automatically extracted, categorized, and deduplicated
- **CSV Import** — Import transactions from any spreadsheet with automatic column mapping
- **Smart deduplication** — Re-importing the same statement won't create duplicate transactions
- **Import history** — Full log of every import with transaction counts and status

### 💸 Transaction Management
- View, search, filter, and sort all transactions
- Filter by account, category, type, date range, or keyword
- Edit or delete individual transactions
- Bulk select and delete multiple transactions at once
- Manual transaction entry for cash or untracked spending

### 📊 Dashboard & Insights
- Monthly summary: total spent, total income, net balance
- **Period analysis** — Select a date range (up to 12 months) with presets (Last 3/6/12 months, YTD)
- Period stats: average monthly/daily spend, savings rate, highest/lowest spending months
- Month-by-month breakdown table
- 6-month spending trend chart
- Category breakdown with visual pie chart
- Top merchants by spending
- Smart insights: budget alerts, new merchants, spending changes
- Navigate between months to view historical data

### 🗂 Categories & Auto-Categorization
- Pre-built categories: Groceries, Food & Dining, Transport, Health, Subscriptions, Utilities, ATM & Cash, Transfer, and more
- Automatic categorization on import using merchant name matching
- Custom rules engine — define your own categorization rules based on keywords

### 💰 Budgets
- Set monthly budgets per category
- Real-time progress tracking
- Over-budget alerts on the dashboard

### 🏦 Multi-Account Support
- Create multiple accounts (CIH, Attijariwafa, cash, card, other)
- **Computed balances** — Account balance = initial balance + credits - debits (always accurate)
- Filter transactions by account

### 🌓 Dark & Light Mode
- Full dark mode (default)
- Clean light mode with navy sidebar
- Theme persists across sessions

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- A Supabase project (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/oel-mest/financetracker.git
cd drhm-finance
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run database migrations
Run all SQL files in `/supabase/migrations/` in order via the Supabase SQL Editor.

### 4. Start the app
```bash
docker compose up --build -d
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:2026 |
| Backend  | http://localhost:2027 |
| Parser   | http://localhost:2028 |

### 5. Create your account
Visit `http://localhost:2026`, sign up, and start importing your statements.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Parser    │
│  React/Vite │     │ Node/Express│     │FastAPI/Python│
│  Port 2026  │     │  Port 2027  │     │  Port 2028  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  Postgres   │
                    │  Storage    │
                    └─────────────┘
```

- **Frontend** — React + TypeScript + Tailwind CSS
- **Backend** — Node.js + Express + Supabase client
- **Parser** — Python + FastAPI + openbk (PDF extraction)
- **Database** — PostgreSQL via Supabase with Row Level Security
- **Storage** — Supabase Storage for PDF files

---

## Supported Banks

| Bank | PDF Import | Status |
|------|-----------|--------|
| CIH Bank | ✅ | Supported |
| Attijariwafa Bank (AWB) | ✅ | Supported |
| BMCE / Bank of Africa | 🔜 | Planned |
| Banque Populaire | 🔜 | Planned |
| Al Barid Bank | 🔜 | Planned |

---

## Roadmap

### 🔜 Coming Soon
- [x] **Attijariwafa Bank PDF support** — AWB parser integrated via openbk
- [x] **Period-based dashboard** — Multi-month analysis with date range selector
- [x] **Computed account balances** — Real-time balance from initial + transactions
- [ ] **Multi-currency support** — EUR, USD alongside MAD
- [ ] **Recurring transaction detection** — Auto-flag subscriptions and regular payments
- [ ] **Export to Excel/PDF** — Full statement export with charts
- [ ] **Mobile-responsive UI** — Full mobile support
- [ ] **Shared accounts** — Split expenses with family members

### 🧠 Planned Features
- [ ] **AI spending analysis** — Natural language insights ("You spent 30% more on food this month")
- [ ] **Goal tracking** — Set savings goals and track progress
- [ ] **Net worth tracker** — Assets vs liabilities over time
- [ ] **Transaction notes & attachments** — Attach receipts to transactions
- [ ] **Webhook notifications** — Budget alerts via WhatsApp or email
- [ ] **API access** — Connect third-party tools to your finance data

---

## Contributing

DRHM is open to contributions. Whether you want to add support for a new bank, improve the UI, or fix a bug — all help is welcome.

### How to contribute

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Open a pull request with a clear description

### Priority contributions needed

- 🏦 **Bank parsers** — If you have statements from BMCE, Banque Populaire, or Al Barid Bank and want to help add support, open an issue
- 🌍 **Translations** — Arabic and French UI translations
- 📱 **Mobile UI** — Responsive design improvements
- 🧪 **Tests** — Unit and integration test coverage

### Development setup
```bash
# Frontend (hot reload)
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# Parser
cd parser && pip install -r requirements.txt && uvicorn app.main:app --reload --port 2028
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, Zod |
| Parser | Python 3.11, FastAPI, openbk, tabula-py |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Deployment | Docker Compose |

---

## License

MIT — free to use, modify, and distribute.

---

<div align="center">

Built with ☕ in Morocco · MAD currency · Open source forever

**If DRHM helps you manage your finances, give it a ⭐**

</div>