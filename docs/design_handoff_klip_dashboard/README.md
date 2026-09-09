# Handoff: Klip — Link Management & Analytics Dashboard

## Overview

Klip is a link-management SaaS (short links, branded domains, click analytics, UTM builder, QR codes, projects/folders, API, Paddle Lifetime Deal). This package covers the **authenticated product**: auth, onboarding, and eight dashboard screens, plus their empty, loading and error states.

Target stack per the product spec: **Next.js + TypeScript + React + Tailwind CSS**, Prisma/Neon, Auth.js, Paddle. The full product spec ships alongside this README as `product-spec.md`.

## About the Design Files

`Klip Dashboard.dc.html` is a **design reference created in HTML** — a clickable prototype showing intended look and behavior. It is **not production code to copy**. The task is to recreate these designs in the target codebase using its established patterns (React components, Tailwind config, routing). Inline styles in the prototype exist for prototyping reasons only; in the real app they become Tailwind classes and a token config.

Open the file directly in a browser. A floating **"Prototype"** pill (bottom-right) opens a dock with two switches: **Flow** (Auth / Onboarding / App) and **Data state** (Data / Empty / Loading). Neither exists in the real product — it is prototype-only scaffolding.

## Fidelity

**High fidelity.** Colors, type, spacing, radii, states and copy are final. Recreate pixel-accurately. The one deliberate placeholder: QR previews are generated pseudo-random square grids — use a real QR library (`qrcode` / `qr-code-styling`).

Not covered in this package: mobile layouts (deliberately out of scope — desktop-first product), dark theme, delete-confirmation modal, the row `⋯` action menu in its open state, bulk selection, and the QR customizer panel.

---

## Design Tokens

### Color

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F5F4F1` | App background |
| `surface` | `#FFFFFF` | Cards, sidebar, header inputs |
| `surface-sunken` | `#FAFAF8` | Table header row, drawer footer, preview blocks |
| `surface-muted` | `#F2F1EE` | Active nav item, chips, favicon squares |
| `surface-track` | `#F0EFEC` | Progress-bar tracks |
| `ink` | `#15151A` | Primary text, primary buttons, dark panels |
| `ink-hover` | `#2C2C34` | Primary button hover |
| `ink-secondary` | `#4A4A52` | Form labels, chip text |
| `muted` | `#75757F` | Secondary text |
| `muted-soft` | `#8A8A93` | Table column headers |
| `faint` | `#A3A3AC` | Tertiary text, placeholders, icon rests |
| `disabled-bg` | `#DDDCD8` | Disabled button / off toggle track |
| `disabled-fg` | `#96959B` | Disabled button label |
| `accent` | `#3B2FE8` | Links, focus ring, primary data series, avatar |
| `accent-hover` | `#2A1FC4` | Link hover, chart bar hover |
| `accent-soft` | `#DAD8FA` | Secondary chart series (unique visitors) |
| `accent-tint` | `#EEEBFF` | Accent chip backgrounds |
| `lime` | `#C9FF3C` | Logo mark, workspace avatar, highlights on dark |
| `positive` | `#167A5B` / bg `#E6F4EE` | Success, "Active", positive delta |
| `warning` | `#956212` / bg `#FDF3E3` | "Paused", "Pending DNS" |
| `danger` | `#C2452D` / bg `#FBEDE9` | Errors, revoke, danger zone |
| `border` | `rgba(20,20,26,.08)` | Card borders |
| `border-strong` | `rgba(20,20,26,.10)` | Inputs, secondary buttons |
| `border-hover` | `rgba(20,20,26,.22–.28)` | Hovered inputs/buttons |
| `divider` | `rgba(20,20,26,.055)` | Table row separators |

Project accent dots: `#3B2FE8`, `#C2452D`, `#167A5B`, `#956212`, `#5B4BD6`, `#75757F`.

### Typography

- UI: **Instrument Sans** (400/500/600/700), Google Fonts.
- Numerals, slugs, URLs, code, keyboard hints: **JetBrains Mono** (400/500/600).
- `-webkit-font-smoothing: antialiased` on the app root.

| Role | Size / weight / tracking |
|---|---|
| Page title (h1) | 24px / 700 / -0.025em |
| Auth h1 | 26px / 700 / -0.03em |
| Big metric | 26px mono / 700 / -0.03em |
| Detail metric | 24px mono / 700 / -0.03em |
| Card title | 14px / 600 |
| Panel title | 13.5px / 600 |
| Body | 13.5px / 400, line-height 1.6 |
| Table cell | 12.5px |
| Form label | 12.5px / 500 |
| Secondary / meta | 12px / 400 |
| Caption | 11.5px |
| Column header | 11px / 600 / 0.04em / uppercase |
| Eyebrow | 10–11px / 600 / 0.05–0.07em / uppercase |

### Spacing, radius, shadow, motion

- Spacing scale in use: 2, 4, 6, 8, 10, 14, 18, 20, 22, 26 px. Card padding `16–18px 18–20px`; page padding `26px 24px 60px`.
- Grid gap between cards: `14px`. Section gap: `18–22px`.
- Radius: `5px` kbd · `6–7px` small controls · `8–9px` buttons/nav · `10px` inputs · `11px` inner blocks · `12–14px` cards · `16px` onboarding card · `18px` empty-state icon · `99px` pills/toggles/avatars.
- Shadows: cards use borders, not shadows. Drawer `-18px 0 50px rgba(20,20,26,.14)`; toast `0 14px 34px rgba(20,20,26,.28)`; floating dock `0 6px 18px–0 12px 34px rgba(20,20,26,.12–.16)`; active segmented tab `0 1px 2px rgba(20,20,26,.08)`.
- Focus ring (all inputs): `border-color:#3B2FE8; box-shadow: 0 0 0 3px rgba(59,47,232,.10)`. Error variant: `#C2452D` + `rgba(194,69,45,.09)`.
- Motion: `klipIn` (opacity 0→1, translateY 6px→0) 0.22s ease on screen change, 0.16–0.2s on popovers; `klipSlide` (translateX 24px→0) 0.2s ease for the drawer; sidebar width transition 0.18s ease; toggle knob 0.15s. Skeleton shimmer: 1.1s linear infinite, `linear-gradient(90deg,#EFEEEA 25%,#F7F6F3 50%,#EFEEEA 75%)` with `background-size:320px 100%`.

---

## App Shell (all dashboard screens)

**Sidebar** — collapsible, `236px` expanded / `68px` collapsed, white, `border-right: 1px solid rgba(20,20,26,.08)`, `position:sticky; top:0; height:100vh`.
- Brand row, 60px tall, bottom border: 26px `#15151A` rounded-9px square holding the lime link glyph, then "Klip" 15px/700.
- Nav list, `12px 10px`, `2px` gaps. Item: `8px 10px`, radius 9, 13.5px, icon 16px stroke 1.5 + label. Rest `#75757F` transparent; hover `#F2F1EE`; active `#F2F1EE` + `#15151A` + 600.
- Order: Dashboard · Links · Projects · Analytics · QR Codes · Domains · API · Billing · Settings.
- Footer: usage card (`#F5F4F1`, radius 10) — "Tracked clicks" / `84.4k / 100k`, 5px accent progress bar at 84%, "Lifetime plan · resets Oct 1" — then a **Collapse** button. When collapsed, only icons and the collapse button render (labels hidden, `title` attribute carries the name).

**Header** — 60px, sticky, `rgba(245,244,241,.86)` + `backdrop-filter: blur(10px)`, bottom border. Left→right: workspace chip (`flex:none`, lime 20px avatar "A", "Acme Growth" 13px/600 nowrap, chevron); search input (`flex:1 1 160px; min-width:110px; max-width:400px`, 34px, radius 9, left search icon at 11px, **right padding 50px** to clear the `⌘K` mono badge at `right:9px`); flex spacer; primary **Create link** button (34px, `#15151A`, radius 9, plus icon, `white-space:nowrap`); 30px `#3B2FE8` avatar "MR" (`flex:none`).

> Every button in this design carries `white-space: nowrap` — the layout is dense and labels must not wrap inside fixed-height controls.

---

## Screens

### 1. Auth (`/login`, `/register`)

Two-column grid `repeat(auto-fit, minmax(360px,1fr))`, full viewport.

**Left** (max-width 520px, centered, padding `48px 40px`): brand row → h1 → sub → **Continue with Google** (42px, white, 1px border, radius 11, official 4-color G mark) → "or" divider → form → switch line → legal note (11.5px `#A3A3AC`).

- Register: Name, Email, Password (+ 4-segment strength meter, three `#167A5B` bars + one `#DDDCD8`, label "Strong" 11px/600 green), CTA "Create account", switch "Already have an account? **Sign in**".
- Login: Email, Password with inline "Forgot?" link, CTA "Sign in", switch "New to Klip? **Create one**".
- Inputs 40px, radius 10.
- Copy: register title "Create your account" / sub "One workspace, unlimited links. No credit card until you decide on the lifetime deal." Login title "Welcome back" / sub "Sign in to your workspace." Legal: "By continuing you agree to the Terms and Privacy Policy. We hash visitor IPs and never sell click data."

**Right** (`#15151A`, padding `48px 44px`, centered column, 28px gaps): lime mono eyebrow `SHORT LINK → TRACKING → OPTIMIZATION`; 28px/700/-0.03em headline "Every link you share, measured down to the city and the device."; three stats (`38ms` Median redirect · `100k` Clicks / month · `$89` One-time) in a `minmax(120px,1fr)` grid; a testimonial above a `rgba(255,255,255,.12)` top border.

Submitting either form → Onboarding step 1.

### 2. Onboarding (`/onboarding`)

Centered column, max-width 560px, `40px 24px 60px`. Brand row on top. Three-segment progress bar (4px, `#15151A` when reached else `rgba(20,20,26,.12)`) with labels **Workspace / First link / Done** (11.5px, current step 600, unreached `#A3A3AC`). Card: white, radius 16, padding 28.

- **Step 1** — "Name your workspace" + "Everything — links, projects, analytics — lives inside a workspace. You can rename it later." Workspace-name input; live hint "Your links will look like `klip.to/{firstWord}-launch`"; then "What are you shortening links for?" as pill chips (radius 99, `7px 13px`): Creator / influencer · Marketing team · Agency · Developer. Selected = filled `#15151A`.
- **Step 2** — "Create your first link". Destination URL input; short-link input as a single 40px bordered row with a static `klip.to/` mono prefix and a borderless mono slug input.
- **Step 3** — centered success: 56px `#E6F4EE` circle with green check, "You're live", copy line, then a `#FAFAF8` row with the mono short URL + **Copy**.
- Footer of card: "Skip for now" (ghost) ↔ primary CTA "Continue" / "Create link" / "Go to dashboard". Skip and final CTA both land on the dashboard.

### 3. Dashboard (`/dashboard`)

Max-width 1240px. Title "Overview", sub "Everything happening across 248 active links." Right-aligned range segmented control (white, radius 10, 3px padding): Today · 7 days · 30 days · 90 days · Custom; active = `#15151A` filled pill.

1. **Stat cards** — `repeat(auto-fit, minmax(200px,1fr))`. Each: label 12px muted; value 26px mono/700; delta pill (green `#E6F4EE`/`#167A5B`, red `#FBEDE9`/`#C2452D`); sub-caption 11.5px `#A3A3AC`. Values: Total clicks `84,392` +12.4% "vs. 75,081 previous period" · Unique visitors `61,208` +9.1% "72.5% of total clicks" · Active links `248` +18 "12 paused · 31 archived" · Avg. redirect `38ms` -4ms "p95 · 112ms".
2. **Clicks over time** — card with title, sub "{range} · hover a bar for detail", legend (accent = Clicks, `#DAD8FA` = Unique). 170px tall bar row, 30 bars, `gap:3px`, each a column: clicks segment (radius `3px 3px 0 0`, hover `#2A1FC4`) stacked over the unique segment (radius `0 0 3px 3px`), `title` tooltip "N clicks · N unique". Mono axis labels below.
3. **Bottom row** — `repeat(auto-fit, minmax(320px,1fr))`:
   - **Top links** card: header + "View all →" link; rows are full-width buttons (hover `#F7F6F3`, negative margins so the hover bleeds to the card padding) with mono slug + destination, a 110px `#15151A` progress bar, right-aligned mono click count. Click → link analytics.
   - **Breakdown** card: segmented tabs Countries / Referrers / Devices inside a `#F5F4F1` track; five rows of label + mono value + 5px accent bar.
   - **Fastest growing** card: `#15151A`, lime accent — `klip.to/creator-drop`, `4,821`, "+312% vs. last week", "Mostly Instagram traffic from Brazil."

### 4. Links (`/dashboard/links`)

Title "Links", sub "248 active · 12 paused · 31 archived".

Toolbar: filter input (`flex:1; min-width:220px`, 36px) + three dropdown buttons (`Project: All`, `Status: Active`, `Sort: Clicks`) — label muted, value 600, chevron.

Table card: **wrapper `overflow-x:auto`; header row and every data row share `min-width:920px`** and the grid `minmax(0,1.5fr) minmax(0,1.4fr) 90px 140px 96px 90px 40px` with `gap:14px`. This is required — without it the two fluid columns collapse and text collides at narrow widths.

- Header row: `#FAFAF8`, 11px uppercase `#8A8A93` — Link · Destination · Clicks (right) · Project · Created · Status · (actions).
- Row (`13px 18px`, hover `#FAFAF8`): 26px `#F2F1EE` favicon square; mono slug button (hover `#3B2FE8`) over an 11px title; destination truncated; mono click count right-aligned; project chip (pill `#F2F1EE`, 6px colored dot, **`max-width:100%; white-space:nowrap; text-overflow:ellipsis`**); relative created date; status pill (Active green / Paused amber / Archived grey); `⋯` icon button.
- Footer: "Showing 9 of 248 links" + Previous (disabled look) / Next.
- Row click on the slug → link analytics.

### 5. Link analytics (`/dashboard/links/[id]`)

Back link "← Back to links". Header: mono h1 `klip.to/summer-sale` + Active pill; sub shows the resolved destination with UTMs. Actions right: Copy · QR code · Edit · Pause (34px outline buttons).

Four stat cards (`minmax(180px,1fr)`): Total clicks `12,904` · Unique visitors `9,318` · Top country `🇧🇷 BR` · Scan share (QR) `18%`.

Chart card "Clicks · last 30 days": 150px, single-tone `#15151A` bars, radius 3, hover `#3B2FE8`.

Four breakdown panels (`repeat(auto-fit, minmax(280px,1fr))`), each 5 rows of label + mono value + 5px bar, one accent per panel: **Countries** `#3B2FE8` · **Referrers** `#15151A` · **Devices & OS** `#167A5B` · **Browsers** `#956212`.

### 6. Projects (`/dashboard/projects`)

`repeat(auto-fit, minmax(300px,1fr))`, `align-items:start`.

Left: card grid `repeat(auto-fill, minmax(230px,1fr))`. Card = 28px tinted rounded square with a folder glyph in the project color + relative timestamp, name 14.5px/600, description, then a top-bordered footer with mono counts ("86 links · 41,204 clicks"). Hover raises the border. Last cell is a dashed **+ New project** tile (min-height 150px, hover turns accent).

Right: folder-tree panel for "Summer Campaign" — rows at two indent levels (14px / 34px), mono marker (`▸` group, `·` leaf), name, mono count, hover `#F7F6F3`.

### 7. QR Codes (`/dashboard/qr-codes`)

Sub: "Every code points to the short link — change the destination anytime without reprinting."

Grid `repeat(auto-fill, minmax(240px,1fr))`. Card: `#FAFAF8` radius-11 preview holding the QR (13×13 grid of 7px cells, 1px gaps in the prototype — replace with a real QR renderer), then mono short URL, "N scans · {date}", then three equal buttons **PNG · SVG · Style**.

### 8. Domains (`/dashboard/domains`)

Max-width 900px. List card rows: mono hostname + note, mono link count, status pill (Active / Pending DNS / Error). Data: `klip.to` "Default shared domain" 248 Active · `go.acme.com` "Verified Mar 14 · TLS issued" 96 Active · `go.northwind.io` "Waiting for CNAME record" 0 Pending DNS.

Verification card: title "Verify `go.northwind.io`", explainer, then a `#15151A` radius-11 block with a `70px 1fr` mono grid — TYPE `CNAME`, NAME `go`, VALUE `edge.klip.to` (value in lime; keys at 45% white). Buttons: **Check DNS** (primary) · Copy record.

### 9. API (`/dashboard/api`)

Title "API", sub "Create links programmatically. Keys are scoped to this workspace." Primary **Create API key**.

**Reveal-once card** (appears after creating; accent border + `0 0 0 3px rgba(59,47,232,.07)`): "Copy your key now" / "This is the only time it will be shown. Store it in your server environment." + `#15151A` block with the lime mono key and a Copy button. Backend must store only a hash.

Key list rows: name 13.5px/600 over a masked mono key (`klip_live_••••••••••••4f2a`), last-used text, scope pill (Full access = accent tint, Links only = grey, Read only = green), **Revoke** in danger red (hover `#FBEDE9`).

Quick-start card: "Rate limit: 60 req/min per key" + a dark `<pre>` with the cURL example and JSON response, then endpoint chips — `POST /v1/links` (green) · `GET /v1/links` · `GET /v1/links/:id` · `PATCH /v1/links/:id` (amber) · `DELETE /v1/links/:id` (red) · `GET /v1/links/:id/analytics`.

### 10. Billing (`/dashboard/billing`)

Hero card `#15151A` radius 16: lime outlined pill "LIFETIME · ACTIVE", "Klip Pro LTD" 26px/700, "Purchased Mar 12, 2026 via Paddle · $89 one-time"; right side a usage meter "Tracked clicks this month 84,392 / 100,000", 6px lime bar at 84%, "Resets Oct 1 · need more? Add a click pack."

Two cards below: **What's included** (green check rows: unlimited short links, unlimited projects & folders, QR codes PNG+SVG, full click analytics, UTM builder, 3 custom domains) and **Receipts** (date · mono amount · PDF link; second row "— / LTD · no renewal").

### 11. Settings (`/dashboard/settings`)

Max-width 760px. Three cards:
1. **Workspace** — Name, Slug (mono), Default short domain (select).
2. **Privacy & tracking** — three toggle rows (38×22 track, 18px knob, on = `#3B2FE8`, off = `#DDDCD8`, 0.15s transform): "Hash visitor IPs" (on) · "Store city-level geo" (on) · "Respect Do Not Track" (off).
3. **Danger zone** — `rgba(194,69,45,.28)` border, red title, warning "Deleting the workspace removes all links immediately — existing short URLs will start returning 410.", outlined red **Delete workspace**.

### 12. Create-link drawer (overlay, all screens)

Right-side sheet, 520px (`max-width:100%`), full height, `klipSlide` in, backdrop `rgba(20,20,26,.32)` + 2px blur (click closes). z-index 60; toast 80.

- Header: "Create link" + "Short link → tracking → optimization" + close button.
- Body (scrollable, 22px, 18px gaps): Destination URL · a `150px 1fr` row of Domain (select) + Slug (mono input with an inset **Random** button at `right:5px`) · **Preview block** (`#FAFAF8`): uppercase "PREVIEW", mono `klip.to/{slug}`, and the live `→` destination with UTMs appended · Title · **UTM parameters** collapsible (header button shows "Hide" / "5 available"; open reveals a 2-column grid — Source, Medium, Campaign spanning both, Term, Content, all mono 34px) · Project + Folder selects.
- Footer (`#FAFAF8`): "Generate QR code" checkbox (accent-color) left; Cancel + **Create link** right.
- Submit → drawer closes, toast appears bottom-center: `#15151A` pill, lime check, "Link created · **klip.to/{slug}**", Copy + Analytics buttons; auto-dismiss after 4.5s; Analytics navigates to the link detail.

---

## Interactions & Behavior

- **Navigation** — sidebar switches screens; top-links rows and link-table slugs open link analytics; toast "Analytics" does the same; "View all →" goes to Links.
- **Sidebar collapse** — toggles 236↔68px with a 0.18s width transition; labels unmount, `title` tooltips take over.
- **Range control** — re-seeds the time series (prototype uses a seeded PRNG; real app refetches).
- **Breakdown tabs** — swap the five rows in place, no layout shift.
- **Drawer** — Escape/backdrop/Cancel close it; the URL preview recomputes on every keystroke of destination, slug and UTM fields.
- **Slug field** — input is normalized on the fly: lowercased, whitespace → hyphens.

### Form validation (create link)

| Rule | Message |
|---|---|
| Destination must match `^https?://[^\s.]+\.[^\s]{2,}` | "Enter a full URL including https://" |
| Slug in reserved list (`api`, `login`, `admin`, `dashboard`, `settings`) | "That path is reserved by Klip." |
| Slug already taken (server check) | "klip.to/{slug} is already in use — try {slug}-2." |
| Slug not `^[a-z0-9-]+$` | "Use lowercase letters, numbers and hyphens only." |
| Valid, non-empty slug | Green check + "Available" |

Errors render below the field in 11.5px `#C2452D` with a 13px alert glyph; the field border and ring turn red. While invalid the submit button is `#DDDCD8` / `#96959B` / `cursor:not-allowed`. Empty fields show no error until touched.

### Loading states

Skeletons only (no spinners): shimmering `#EFEEEA→#F7F6F3` blocks matching final geometry. Dashboard = title + sub bars, 4 stat cards (label/value/sub bars), chart card with 30 varying-height bars. Links = title bars + 8 rows (26px square, two text bars, count, two pills).

### Empty states

- **Dashboard** — centered, max-width 640: 64px white rounded-18 tile with the accent link glyph, "No clicks yet", "Create your first link and share it — analytics start filling in within seconds of the first redirect.", buttons **Create your first link** + Import from CSV, then three numbered cards (01 Shorten / 02 Share / 03 Optimize) with one-line descriptions.
- **Links** — dashed-border panel: mono `klip.to/`**your-slug** (slug in accent), "Your first short link takes about 10 seconds", explainer, **Create link**.

---

## State Management

Prototype state (map to server state + local UI state in the real app):

| Key | Values | Notes |
|---|---|---|
| `view` | `auth` \| `onboarding` \| `app` | Real app: routes/middleware, not state |
| `authMode` | `register` \| `login` | Route in the real app |
| `step` | 1–3 | Onboarding wizard |
| `screen` | dashboard, links, analytics, projects, qr, domains, api, billing, settings | Real app: routes |
| `expanded` | boolean | Sidebar; persist per user |
| `range` | 24h, 7d, 30d, 90d, custom | Drives the analytics query |
| `tab` | countries, referrers, devices | Dashboard breakdown |
| `dataState` | data, empty, loading | **Prototype only** — real app derives from query status + row count |
| `drawerOpen`, `utmOpen`, `toast` | boolean | Toast auto-clears after 4500ms |
| `dest`, `slug`, `utm{source,medium,campaign,term,content}` | strings | Drives the live preview |
| `wsName`, `useCase` | strings | Onboarding |
| `newKey` | string | Reveal-once API key, cleared on navigation |
| `dockOpen` | boolean | **Prototype only** |

Data needs per screen: aggregate metrics + time series with a comparison window; top links; breakdowns by country/referrer/device/browser/OS; paginated link list with search/filter/sort; project and folder trees with counts; QR list with scan counts; domain list with verification status; API key list (metadata only, never the secret); entitlement + usage from Paddle webhooks.

---

## Assets

No binary assets. Everything is inline SVG (nav icons, chevrons, checks, alerts, the Google G, the logo glyph) or type. Fonts: Instrument Sans + JetBrains Mono via Google Fonts — self-host with `next/font` in production. Flag glyphs are emoji; swap for a flag icon set if you need consistent rendering. Favicon squares in the links table use decorative glyphs (`◈ ◇ ◆`) as placeholders — replace with real favicons fetched from the destination host.

## Files

- `Klip Dashboard.dc.html` — the full clickable prototype (all screens and states).
- `product-spec.md` — the original product/architecture spec this design implements (see §20–22 for dashboard UX requirements).
