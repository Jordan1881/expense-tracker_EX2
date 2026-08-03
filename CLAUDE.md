# Expense Tracker — Agent Guide

**This file is the source of truth** for how agents work on this repo. Cursor loads a thin pointer under `.cursor/rules/` that defers here.

## Collaboration (mandatory)

1. **Plan first** — propose a short plan or options before coding.
2. **Wait for approval** — do not enact writes, installs, commits, or deploys until the user explicitly approves (e.g. "go", "approve").
3. **One question at a time** when a decision is needed; always include a **recommended answer**.
4. **Read-only exploration is OK** without approval (read files, run tests to report results).

## Definition of done

A task is done only when:

1. Tests were written first (TDD) and are passing (unit/integration; E2E when the flow is user-facing).
2. Typecheck is clean on touched packages.
3. Behavior matches what the user approved.
4. This `CLAUDE.md` is updated if an architecture or process decision changed.

## Process rules

- Prefer **small vertical slices** (e.g. one API + its tests) over large bangs.
- **No drive-by refactors** — do not rename/move unrelated files while shipping a feature.

## Anti-patterns / hard boundaries

Agents must **not**:

1. Ship feature or API code **without a failing test first** (TDD).
2. Implement **beyond the approved slice** — no “while I’m here” extras.
3. Add **new dependencies** without asking.
4. Change **schema or API contracts** without approval and a `CLAUDE.md` update.
5. Invent **folders or patterns** outside the agreed layout.
6. Weaken **domain rules** — e.g. floats as money source of truth, deleting **Other**, summing totals across currencies, silently adding auth or FX.
7. **Commit or push** unless the user explicitly asks.
8. Silence TypeScript or ESLint to “make it pass” (`any`, blanket `eslint-disable`, skipping checks).

## Product summary

Personal **Expense Tracker**: add expenses, list them, summarize by category (totals broken down by currency), filter by date/category, and manage categories from a panel/slide-over on a **single-page** shell.

### Domain rules

- **Currencies:** `USD` | `ILS` | `EUR` — chosen **per expense**; form default **ILS**.
- **Money storage:** integer **minor units** + currency code (never float as source of truth).
- **Category summary:** per category, **broken down by currency** (no FX conversion in v1).
- **Categories:** user can add/edit; seed Food, Transport, Entertainment, Shopping, Bills, **Other**.
- **Delete category:** force-delete and **reassign expenses to Other**.
- **Other:** system-seeded; **cannot be deleted**.
- **Auth:** none in v1.
- **Language:** English only (UI, README, code, API).

## Stack

| Layer            | Tech                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Monorepo         | npm workspaces (`frontend`, `backend`)                                                     |
| Frontend         | React + Vite + TypeScript + Tailwind                                                       |
| Backend          | Express + TypeScript                                                                       |
| DB               | Prisma + SQLite                                                                            |
| Lint/format      | ESLint + Prettier (root)                                                                   |
| Unit/integration | Vitest (FE: RTL; BE: Supertest)                                                            |
| E2E              | Playwright                                                                                 |
| Shared types     | **No** shared package; **no** Zod — API responses are the contract; mirror types on the FE |

## Layout

```text
expense-tracker/
  frontend/src/
    components/  pages/  hooks/  types/  utils/  constants/  styles/
  backend/src/
    routes/  controllers/  services/  types/
  backend/prisma/
  test/
    frontend-test/   # Vitest + RTL
    backend-test/    # Vitest + Supertest
    e2e/             # Playwright
  CLAUDE.md          # this file (canonical)
  README.md
```

Do not invent parallel top-level folders without approval.

## API (dev)

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- REST prefix: `/api` — e.g. `/api/expenses`, `/api/categories`, `/api/health`
- CORS: allow Vite origin in development

## UI shell (target)

Single page: header · add-expense form · category summary · expense list with filters · **Manage categories** opens a panel/slide-over (not a separate route for MVP).

## TDD

1. Write a **failing** test under the correct `test/` folder.
2. Implement the minimum to pass.
3. Refactor.
4. No feature/API code without tests.

## Common commands

```bash
npm install
npm run dev
npm test
npm run test:frontend
npm run test:backend
npm run test:e2e
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Current scaffold status

Scaffold is in place. Feature endpoints may return `501` until implemented via TDD after user approval.
