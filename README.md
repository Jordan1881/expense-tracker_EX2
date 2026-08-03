# Expense Tracker

Personal expense tracker monorepo (React + Express + Prisma/SQLite).

## Features (target)

- Add expenses (amount, category, date, optional note, per-expense currency)
- List expenses with date/category filters
- Category summary with totals broken down by currency (USD / ILS / EUR)
- Manage categories (add/edit; delete reassigns to protected **Other**)

## Requirements

- Node.js 20+
- npm 9+ (workspaces)

## Setup

```bash
npm install
cp backend/.env.example backend/.env   # if needed
npm run db:generate --workspace=backend
npm run db:migrate --workspace=backend
npm run db:seed --workspace=backend
```

## Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Test

```bash
npm test                 # frontend + backend unit/integration
npm run test:frontend
npm run test:backend
npm run test:e2e         # Playwright (starts both servers)
```

## Lint & format

```bash
npm run lint
npm run format
npm run format:check
```

## Agent guide

See [`CLAUDE.md`](./CLAUDE.md) for architecture, domain rules, TDD, and collaboration policy.
