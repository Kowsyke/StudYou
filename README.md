# StudYou

A personalised, trackable roadmap for international students applying to study in the UK. StudYou walks a student through every official step, from English testing to the visa to arrival and settling in, with transparent costs and deadlines, replacing unreliable and sometimes fraudulent agencies with self service.

Built for CMS22204 Full Stack Application Development (Level 5), Ravensbourne University London.

> Disclaimer: StudYou provides guidance and signposting only. It is not legal or immigration advice. Always confirm details on official sources such as gov.uk.

## Contents

1. [Why StudYou exists](#why-studyou-exists)
2. [What it does](#what-it-does)
3. [Tech stack](#tech-stack)
4. [Getting started](#getting-started)
5. [Project structure](#project-structure)
6. [Data model](#data-model)
7. [API reference](#api-reference)
8. [The two engines](#the-two-engines)
9. [Testing](#testing)
10. [Roadmap](#roadmap)

## Why StudYou exists

International students are routinely exploited by agencies that charge for guidance the UK government and universities publish for free, sometimes fraudulently (documented cases exist). Even legitimate agencies take commissions and hide the true total cost of studying abroad. Students lack one trustworthy, transparent place that shows every official step, rule and cost. StudYou is that place.

## What it does

StudYou is built on three pillars.

### 1. Personal journey

- A short onboarding (intake date, course level, budget, origin country) generates a five stage roadmap: Prepare, Apply, Visa, Pre departure, Arrive and settle
- Each stage holds real tasks (IELTS, UCAS, CAS, Immigration Health Surcharge, TB test, financial proof, eVisa, GP registration, bank account, National Insurance number and more) that the student ticks off
- Every task carries its cost, a recommended target date and a link to the official source

### 2. Knowledge base

- Admin curated requirements, rules and costs stored as data, never hardcoded
- Every entry carries a last updated timestamp and an official source URL
- Searchable, filterable by category (visa, health, finance, housing, documents, arrival) and sortable by cost, deadline or last update

### 3. Insight

- Student dashboard: percent complete, live budget tracker in GBP and home currency, upcoming deadlines with overdue flags
- Admin dashboard: completion rates and drop off analytics across stages
- Command palette: press Ctrl K (or Cmd K on Mac) to jump to any task, stage, resource or page
- Settings: students can change their budget, intake date and home country at any time; an intake date change recalculates every target date through the deadline engine after an explicit confirmation

Auth uses JWT with bcrypt and two roles (student and admin) enforced at the API layer with middleware, not just hidden in the UI. The API is hardened with rate limited auth routes, security headers on every response, a central error handler that never leaks internals, and zod validation on every body, parameter and query string.

## Tech stack

- Runtime: Bun (Node compatible, native TypeScript, fast startup and I/O)
- Backend: Hono, a lightweight high performance web framework, versioned REST under /api/v1
- Frontend: React 19, Vite, TypeScript
- Styling: TailwindCSS v4 design tokens, shadcn style components, Framer Motion transitions, cmdk command palette
- State: Zustand for client state, TanStack Query v5 for server state
- Database: PostgreSQL with Drizzle ORM (type safe, SQL transparent) and generated migrations
- Auth: JWT and bcrypt, role based access control
- Charts: recharts
- Tooling: Biome (lint and format), Vitest (unit), Playwright (end to end), pnpm workspaces, Docker

A Tauri v2 desktop shell is planned for v0.5. The frontend is a plain Vite SPA, so wrapping it later is a packaging step, not a rewrite.

## Getting started

Prerequisites: [Bun](https://bun.sh), [pnpm](https://pnpm.io) and [Docker](https://www.docker.com).

1. Copy the environment template and set a strong secret:

   ```sh
   cp .env.example .env
   ```

2. First time setup. This starts PostgreSQL and pgAdmin in Docker, installs dependencies, applies migrations and seeds the UK roadmap:

   ```sh
   pnpm bootstrap
   ```

3. Boot the app:

   ```sh
   pnpm dev
   ```

   The API runs on http://localhost:3005 and the client on http://localhost:5173.

Seeded demo accounts (development only):

- Student: student@studyou.app / StudentPass123
- Admin: admin@studyou.app / AdminPass123

Other commands:

- `pnpm test` runs the engine unit tests (Vitest) and the server unit tests (bun test)
- `pnpm test:e2e` runs the Playwright suite (needs the seeded database)
- `pnpm lint` runs Biome across the workspace
- `pnpm db:studio` opens Drizzle Studio
- `pnpm build` builds every package

## Project structure

```
apps/client       React frontend (Vite, React 19, Tailwind v4)
apps/server       Bun plus Hono API with JWT auth and RBAC middleware
packages/db       Drizzle schema, migrations and UK seed data
packages/engine   Budget and deadline engines (pure, unit tested)
packages/types    Shared TypeScript domain types
docker/           Docker Compose for PostgreSQL and pgAdmin
e2e/              Playwright end to end tests
```

The monorepo shares one set of domain types between frontend and backend, so an API change that breaks the client fails at compile time.

## Data model

The schema is country agnostic by design: every domain table (stages, task_templates, resources, journeys) carries a country_id, so adding a second country later is data entry, not a rewrite. The MVP ships UK data only.

- countries: destinations and origins with their currency
- categories: visa, health, finance, housing, documents, arrival
- stages: the five journey stages per country
- task_templates: the master roadmap per country, each with a cost in pence, a cost type (mandatory, optional, none), a days before intake offset, an official source URL and a last updated stamp
- journeys: one per student, holding intake date, course level and budget
- journey_tasks: the student copy of each template with status and a computed target date
- resources: the knowledge base, each entry with an optional cost and deadline, an official source URL and a last updated stamp
- exchange_rates: GBP conversion rates for home currency display
- users: student or admin role, bcrypt password hash, optional origin country

All money is stored and computed as integer pence to avoid floating point errors.

## API reference

All responses use a shared envelope from packages/types: `ApiResponse<T> = { success, data?, error? }`. All request bodies and query strings are validated with zod on the server.

Auth:

- POST /api/v1/auth/register (public, always creates a student)
- POST /api/v1/auth/login (public)
- GET /api/v1/auth/me (authenticated)

Journey:

- GET /api/v1/journey (student, returns the full overview: stages, tasks, percent complete, budget, upcoming deadlines)
- POST /api/v1/journey (student, generates the roadmap from the intake date)
- PATCH /api/v1/journey/tasks/:id (student, own tasks only, returns the recomputed overview)
- PATCH /api/v1/journey/settings (student, own journey only; updates budget, intake date or home country and, when the intake date changes, replans every target date through the deadline engine in one transaction, returning the recomputed overview)

Knowledge base:

- GET /api/v1/resources?search=&category=&sort=&order= (authenticated)
- POST /api/v1/resources (admin only)
- PUT /api/v1/resources/:id (admin only)
- DELETE /api/v1/resources/:id (admin only)

Analytics and reference data:

- GET /api/v1/admin/analytics (admin only)
- GET /api/v1/meta/countries, /api/v1/meta/categories, /api/v1/meta/stages (public reference data)

RBAC is enforced with server middleware (verify the JWT, then require the role). A student calling an admin route receives 403 regardless of what the UI shows.

Hardening on every route:

- Login and register are rate limited per client IP (fixed window, in memory) and answer 429 with a Retry-After header when exceeded
- Every response carries security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Strict-Transport-Security and friends) via Hono secure headers
- A central error handler logs full details server side and returns only a safe ApiResponse envelope, never a stack trace, SQL or file path
- Passwords must be 8 to 72 characters with at least one letter and one number, validated with zod on the server and mirrored live on the register form

## The two engines

The real logic lives in packages/engine as pure, framework free modules.

- Budget engine: aggregates every mandatory and optional cost on a journey into a live running total, tracks spent (completed tasks) and remaining, flags when the projected total exceeds the student budget, and converts totals to the home currency using seeded exchange rates
- Deadline engine: works backwards from the intake date to a recommended target date for every milestone (a task with an offset of 75 lands 75 days before intake; negative offsets land after arrival, like registering with a GP two weeks in), and surfaces the next deadlines with overdue detection

Because both are pure functions they are unit tested in isolation and reused by the server and the seed script.

## Testing

- Unit (Vitest): the budget and deadline engines, including the settings recompute behaviour of the deadline planner
- Unit (bun test): server helpers, covering the password policy schema and the rate limiter (limits, per IP and per path isolation, window reset, Retry-After)
- End to end (Playwright), four specs against the real stack and seeded database:
  - Vertical slice: a student signs in, ticks a task and the dashboard updates live
  - Admin flow: an admin creates a resource, sees it in the library, edits it and deletes it
  - RBAC: no token gets 401, a student token on an admin route gets 403, a garbled token gets 401
  - Resource library: search narrows results, the category filter isolates a category, sorting by cost orders correctly both ways

## Roadmap

- v0.5: Tauri v2 desktop shell producing native Windows and Mac installers
- Later: more destination countries (data entry thanks to the country agnostic schema), live FX rates, notifications for approaching deadlines

## Author

University coursework project by Kowshick Ahmed Abir (k.abir@students.rave.ac.uk). Costs and rules in the seed data are indicative, carry their official source URL and a last updated date, and must be verified against the linked source before relying on them.
