# Paymetric

A compensation explorer and comparison tool for tech roles across top companies.

---

## Purpose

Paymetric lets users explore, compare, and submit compensation data (salary, stock, bonus) for engineering and tech roles. Built as a 16-hour MVP for an internship engineering assignment.

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Framework   | Next.js 15 (App Router)               |
| Language    | TypeScript (strict)                   |
| Styling     | TailwindCSS                           |
| ORM         | Prisma                                |
| Database    | PostgreSQL (Neon)                     |
| Validation  | Zod                                   |
| Icons       | lucide-react                          |
| Charts      | Recharts                              |
| Deployment  | Vercel                                |

---

## Project Structure

```
paymetric/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── companies/
│   │   └── page.tsx            # Company listing
│   ├── compensation/
│   │   └── page.tsx            # Compensation explorer
│   ├── compare/
│   │   └── page.tsx            # Compensation comparison
│   └── api/
│       ├── compensation/
│       │   └── route.ts        # GET (list), POST (submit)
│       └── companies/
│           └── route.ts        # GET (list companies)
│
├── components/
│   ├── ui/                     # Shared UI primitives
│   ├── compensation/           # Compensation feature components
│   ├── companies/              # Company feature components
│   └── comparison/             # Comparison feature components
│
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── validations/
│   │   └── compensation.ts     # Zod schemas
│   └── utils/
│       ├── errors.ts           # API error handler
│       └── format.ts           # Formatting utilities
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script (empty at init)
│
├── types/
│   └── index.ts                # Shared TypeScript types
│
├── .env.example                # Environment variable template
├── .env                        # Local env vars (git-ignored)
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (Neon recommended)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in your DATABASE_URL
```

### 3. Database setup

```bash
# Generate Prisma client
npm run db:generate

# Apply schema to database (development)
npm run db:migrate

# OR push schema without migration history (faster for prototyping)
npm run db:push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable              | Description                              | Required |
|-----------------------|------------------------------------------|----------|
| `DATABASE_URL`        | PostgreSQL connection string (Neon)      | ✅       |
| `NEXT_PUBLIC_APP_URL` | Public base URL (e.g. http://localhost:3000) | ✅   |

---

## Database Commands

| Command             | Description                                     |
|---------------------|-------------------------------------------------|
| `npm run db:generate` | Generate Prisma client from schema            |
| `npm run db:push`    | Push schema changes to DB (no migration file)  |
| `npm run db:migrate` | Create and apply a migration                   |
| `npm run db:studio`  | Open Prisma Studio                             |
| `npm run db:seed`    | Run the seed script                            |

---

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel dashboard.
3. Add environment variables (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`).
4. Deploy — Vercel auto-detects Next.js.

> **Note**: After deploying, run `npx prisma migrate deploy` or `npx prisma db push` against your production Neon DB.

---

## Notes

- `DATABASE_URL` must point to a Neon (or other PostgreSQL) database.
- The Prisma client is instantiated as a singleton in `lib/prisma.ts` to prevent connection pool exhaustion in development.
- API routes use centralized error handling via `lib/utils/errors.ts`.
