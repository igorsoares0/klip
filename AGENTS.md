<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Klip

Link management and analytics SaaS. The approved spec is `docs/link-management-saas-spec.md`
— read §42 first, which records where the built system deviates from the body and why. The
design handoff is `docs/design_handoff_klip_dashboard/README.md`; its tokens, copy and
spacing are final, and the screens are meant to match it.

Note the prototype in that folder (`Klip Dashboard.dc.html`) **does not render** — it loads a
`support.js` that was never shipped. Read its source, don't try to open it.

## Getting the app running

```
npm run db:up      # Postgres 17 in Docker — the dev database, not Neon
npm run db:seed    # fixtures matching the design
npm run dev
```

Sign in with **`maria@acme.com` / `klip-dev-password`**. The seed rewrites that password on
every run, so it always works. Neon is the production database (spec §26); local development
uses the container.

**Short links do not work at the address the UI shows.** Every screen renders
`klip.to/<slug>`, which is correct in production and unreachable locally — open
`localhost:3000/<slug>` instead. In development the resolver falls back to the shared domain
for any unknown host, which is what makes that work.

**Someone may be running the dev server already.** Check before taking port 3000 or deleting
`.next` — removing the build directory under a live server corrupts its route manifest and
produces failures that look like application bugs. Use another port to verify your own work,
and say which one.

## Prisma

**Pinned to 7.10.0 on purpose.** `prisma@latest` resolves to an 8.x release candidate while
`@prisma/client@latest` is still 7 — installing either unpinned gives you a mismatched pair
and an API that does not exist in our code. Prisma 8 also replaces the query API wholesale.
See `docs/link-management-saas-spec.md` §42.4.

Three things that differ from most Prisma examples:

- **`prisma migrate dev` does not run the generator.** Always `npx prisma generate` after a
  migration or the client will not know about your new columns.
- **`--skip-seed` is not a valid flag** on `migrate dev` in v7.
- **`datasource` carries no `url`** — the connection string lives in `prisma.config.ts`, and
  a driver adapter is mandatory (`PrismaPg`, see `src/lib/db.ts`).

`npm run db:reset` destroys all data. It is a development-only command and Prisma will
refuse to run it for an agent without explicit human consent — ask, don't work around it.

## Where code goes

Domain modules follow spec §33 — `src/auth/`, `src/analytics/`, `src/links/`, `src/projects/`,
`src/qr/`, `src/domains/`, `src/api-keys/`, `src/billing/`, `src/workspaces/`,
`src/entitlements/`, `src/resolver/`, `src/emails/`, `src/shared/`.

- **Reads go in `src/<domain>/queries.ts`, writes in `src/<domain>/actions.ts`** — never
  inline in a `page.tsx`.
- **Every query takes `workspaceId` as an explicit parameter.** Spec §23: never
  `findLink(id)`, always `findLink({ id, workspaceId })`. Making it a required argument is
  what stops cross-tenant leaks from being one forgotten `where` clause away.
- Pages are `async` server components that call a query module and pass typed props down.
  Any route reading the database needs `export const dynamic = "force-dynamic"`, or the
  build will try to prerender it and hit Postgres.

## Authorization

**`requireSession()` in `src/auth/session.ts` is the authorization boundary**, and
`getCurrentWorkspaceId()` wraps it. Because every query and action already takes the
workspace as an argument and gets it from there, a request with no session cannot reach
workspace data.

`src/proxy.ts` also redirects anonymous traffic away from `/dashboard`, but the Next docs are
explicit that proxy is an *optimistic check*, not the boundary — never rely on it alone.
(It lives in `src/`, beside `app/`. At the repo root Next silently ignores it.)

### Server actions

They are reachable by direct POST, not only through our UI. So:

- **Never accept a `workspaceId`, or any owner id, from the caller.** Resolve it inside the
  action.
- **Scope every update and delete by workspace in the `where` clause**, never by id alone. An
  id belonging to another tenant must simply not match.
- Return `ActionResult` from `src/shared/action.ts` rather than throwing, so a form can put
  the message on the field that caused it.
- Uniqueness belongs to the database. Catch `P2002` and translate it — a pre-flight check can
  always lose a race.

## Two directories that look like something they aren't

- **`src/lib/mock/` is seed fixture data, not a data source.** `prisma/seed.ts` imports it so
  the database matches the design. No screen may import from it.
- **`src/generated/` is the Prisma client.** Generated, gitignored, excluded from lint and
  typecheck. Never edit it.

## Styling

Design tokens live in the `@theme` block of `src/app/globals.css` and generate the Tailwind
utilities — `--color-canvas` becomes `bg-canvas`. Use the token, not the hex. Cards use
borders, not shadows, and every button carries `whitespace-nowrap` because the layout is
dense.

## Tests

`vitest.setup.ts` mocks two things every test file inherits: `next/cache`, whose helpers need
a request context the framework only provides at runtime, and `@/auth/config`, which serves a
fixed session. Call `setTestSession(null)` to exercise the unauthenticated path.

`fileParallelism` is off — the integration tests share one Postgres, and two files creating
the same slug would collide. Assert that seed data is *present*, not that nothing else is:
this database is also a working environment where links get created by hand.

## Before you call something done

`npm test` (the integration tests need the database up), `npm run lint`,
`npx tsc --noEmit`, and `npm run build`.

Adding a route means `npx next typegen` before `PageProps<'/your/route'>` will typecheck.
