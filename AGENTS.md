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

Neon is the production database (spec §26). Local development uses the container.

## Prisma

**Pinned to 7.10.0 on purpose.** `prisma@latest` resolves to an 8.x release candidate while
`@prisma/client@latest` is still 7 — installing either unpinned gives you a mismatched pair
and an API that does not exist in our code. Prisma 8 also replaces the query API wholesale.
See `docs/link-management-saas-spec.md` §42.

Three things that differ from most Prisma examples:

- **`prisma migrate dev` does not run the generator.** Always `npx prisma generate` after a
  migration or the client will not know about your new columns.
- **`--skip-seed` is not a valid flag** on `migrate dev` in v7.
- **`datasource` carries no `url`** — the connection string lives in `prisma.config.ts`, and
  a driver adapter is mandatory (`PrismaPg`, see `src/lib/db.ts`).

`npm run db:reset` destroys all data. It is a development-only command and Prisma will
refuse to run it for an agent without explicit human consent — ask, don't work around it.

## Where code goes

Domain modules follow spec §33 — `src/analytics/`, `src/links/`, `src/projects/`, `src/qr/`,
`src/domains/`, `src/api-keys/`, `src/billing/`, `src/workspaces/`, `src/entitlements/`,
`src/shared/`.

- **Database queries belong in `src/<domain>/queries.ts`, never inline in a `page.tsx`.**
- **Every query takes `workspaceId` as an explicit parameter.** Spec §23: never
  `findLink(id)`, always `findLink({ id, workspaceId })`. Making it a required argument is
  what stops cross-tenant leaks from being one forgotten `where` clause away.
- Pages are `async` server components that call a query module and pass typed props down.
  Any route reading the database needs `export const dynamic = "force-dynamic"`, or the
  build will try to prerender it and hit Postgres.
- `src/workspaces/current.ts` is the only place the workspace id is hardcoded. It goes away
  with Auth.js — don't add a second one.

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

## Before you call something done

`npm test` (the integration tests need the database up), `npm run lint`,
`npx tsc --noEmit`, and `npm run build`.
