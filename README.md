# Diaspora direct-pay / value-in-kind platform

- **Concept:** Lets diaspora Kenyans pay a specific bill directly — school fees, electricity, water, a grocery order — for family back home, instead of sending cash that may get spent on something else.
- **Origin:** This exact model is already proven across West and Southern Africa: GhanaMart lets the US-based Ghanaian diaspora buy groceries and pay utility bills directly; Zimbabwe has multiple competing players (Mukuru Groceries from major remittance company Mukuru, Fresh in a Box, and Thumela eKhaya in partnership with Econet's Vaya Technology); Togo has KABA.
- **Evidence of demand:** Kenya's diaspora remittance market is roughly $2.7–4 billion a year and is the country's largest single foreign-exchange earner; WorldRemit's own research found education and medical expenses are among the top uses of that money — precisely the categories a direct-pay product would target.
- **Kenya landscape:** Despite the market size, Kenya's diaspora remittance space is dominated entirely by pure cash-transfer rails — WorldRemit, SimbaPay (partnered with Co-operative Bank), and M-Pesa-linked transfers. No Kenya-specific "pay directly for groceries/bills/fees" product was found, even though the same trust and misuse-of-cash problem that motivated the Ghanaian and Zimbabwean products clearly exists here too.
- **Opportunity:** A near-direct transplant of an already-proven regional model into the one major diaspora market that doesn't have it yet.
- **Target customers:** Kenya's diaspora (3M+ people abroad) wanting certainty that money reaches its intended purpose, and the receiving family members.
- **Revenue model:** A small transaction/service fee per bill payment or grocery order — priced to undercut the effective cost/risk of sending cash.
- **Difficulty:** Medium — bill-pay integrations (utilities, school M-Pesa paybills) are fairly standard; expanding into physical grocery delivery adds real logistics complexity, so it's best sequenced in.
- **Scalability:** High — the same product pattern is already validated in three other African diaspora corridors, so replication risk is low.
- **Risks:** Requires trust-building with both the diaspora payer and the receiving household; competing against the sheer convenience of "just send M-Pesa"; utility/school billing integrations take real partnership work.
- **MVP:** Launch with school-fees and utility-bill direct payment only — no physical-goods logistics yet — piloted with diaspora customers in one country (e.g., the UK) paying into one Kenyan county.

## Deep dive

Customers are diaspora Kenyans (start with one country, e.g., the UK or US) paying school fees or utility bills for family back home, plus the receiving households who need to register which bills to enable. Price a flat or small percentage service fee per transaction, undercutting the effective cost of cash misuse rather than competing head-on with WorldRemit's transfer fees. MVP: integrate with one or two major utility paybills and a handful of partner schools' fee-payment systems, tested with a small group of diaspora customers sending to one Kenyan county. First steps: talk to 20–30 diaspora Kenyans directly about what they currently send money for and where they worry it doesn't arrive as intended — this will tell you which single bill category to launch with.

---

Source: `PROJECTS.md` (Online Business Models: Proven Abroad, Underdeveloped in Kenya).


---

## Stack & dev

Scaffolded as a Next.js 16 + Drizzle (Postgres) app, matching the stack used in `odpc-compliance-saas`. The schema in `src/db/schema.ts` is the current source of truth for the data model; UI, auth and payment integrations are not yet wired up.

```
npm install
# point .env at a Postgres instance, see .env.example
npm run db:generate   # drizzle-kit: emit SQL migrations from the schema
npm run db:migrate    # apply migrations from ./drizzle
npm run db:seed       # optional: seed the database (no default data yet)
npm run dev           # Next.js dev server on :3000
```

What is here:
- `src/db/schema.ts` — Drizzle Postgres schema specific to this domain
- `src/db/index.ts` — pooled `pg` + Drizzle client
- `drizzle.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/globals.css`, `.gitignore`, `.env.example`

What is still a stub:
- Auth (sessions, password reset, email verify) — copy and adapt the `lib/session.ts`, `lib/password.ts`, `lib/email-verification.ts` set from `odpc-compliance-saas`.
- Payments (M-Pesa Daraja / Paystack / card) — stack-specific, add per project.
- `scripts/migrate.ts`, `scripts/seed.ts` — minimal Drizzle/Postgres helpers wired to the `db:*` scripts.

Minimal Next.js App Router files are included:
- `src/app/layout.tsx` — root layout with global styles and metadata
- `src/app/page.tsx` — placeholder landing page

## Deploying

Railway deploys this service from `master`. `.railway/railway.ts` is the source
of truth for the environment: apply it with `railway config apply`. It builds
with Railpack, runs `npm run db:migrate` before each deploy, and checks
`/api/health` (which queries Postgres, not just the app process) before
routing traffic to the new version.

Set secrets on Railway itself, never in the repository:

```
railway variables --service diaspora-direct-pay --set APP_URL=https://<your-public-host>
```

`DATABASE_URL` is injected from the Postgres service declared in `railway.ts`.

To run the same shape locally: `docker compose up --wait db`, then put
`DATABASE_URL=postgres://app:app@localhost:5432/app` in `.env`, run
`npm run db:migrate` and `npm run dev`. `docker compose down` keeps the data
volume; add `-v` to remove it.

For a self-hosted container deployment, `docker build -t diaspora-direct-pay .` produces a
production image that applies migrations and then starts the app. Its
`HEALTHCHECK` uses the same `/api/health` endpoint.
