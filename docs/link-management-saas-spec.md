# Spec-Driven Development — Link Management & Analytics SaaS

**Status:** Approved  
**Version:** 1.1  
**Date:** 2026-09-08 · **Amended:** 2026-09-09

> Sections 1–41 are the approved v1.0 text. **§42 records where the implementation
> deliberately departs from them and is authoritative where the two disagree** — read it
> before implementing anything described below, particularly the data model in §8.

---

## 1. Product Overview

A SaaS platform inspired by LinkDrip for creating, managing, tracking, and optimizing short/branded links.

The product focuses on:

- Short links
- Branded/custom domains
- Click analytics
- UTM builder
- QR Codes
- Projects and folders
- Basic marketing/conversion features prepared for future versions
- API
- Lifetime Deal (LTD) billing during product validation

### Product principle

> Short Link → Tracking → Optimization → Conversion

The first release should prioritize a fast, reliable link-shortening and analytics experience rather than reproducing every advanced feature of LinkDrip.

---

# 2. Goals

## Primary goals

1. Allow users to create short links quickly.
2. Redirect visitors with low latency.
3. Track useful click/visitor information.
4. Organize links into projects/folders.
5. Generate QR Codes from short links.
6. Support custom domains.
7. Provide a clean analytics dashboard.
8. Monetize initially through a Paddle Lifetime Deal.
9. Keep infrastructure inexpensive and simple.
10. Keep the architecture ready for future teams, subscriptions, smart routing, CTAs, experiments, and API usage.

## Non-goals for MVP

Do not initially implement:

- AI features
- ClickHouse
- Kafka
- Kubernetes
- Microservices
- Elasticsearch
- Complex event sourcing
- Advanced retargeting
- Full A/B testing
- Complex CTA campaigns
- Sophisticated team administration
- Multiple billing models

---

# 3. Technology Stack

## Frontend / Application

- Next.js
- TypeScript
- React
- Tailwind CSS

## Authentication

- Auth.js
- Google OAuth
- Email + password credentials

Passwords must never be stored in plaintext.

Use a secure password hashing algorithm such as Argon2id or bcrypt.

## Database

- Neon PostgreSQL
- Prisma ORM

## Payments

- Paddle
- Initial commercial model: Lifetime Deal

The data model must remain compatible with future subscriptions.

## Infrastructure

- Hetzner
- Docker
- Cloudflare recommended for DNS/TLS and edge protection

## Optional future infrastructure

- Redis
- Background worker
- Queue system

Redis should not be required for the MVP.

---

# 4. Architecture

```text
                         INTERNET
                            |
                            v
                        Cloudflare
                            |
              +-------------+-------------+
              |                           |
              v                           v
         Dashboard/API               Short Links
              |                           |
              v                           v
           Next.js                  Link Resolver
              |                           |
       +------+-------+                   |
       |              |                   v
     Auth.js        Prisma             Redirect
       |              |
       |              v
       |             Neon
       |
       +---- Google
       |
       +---- Email/Password

                       Paddle
                          |
                          v
                    LTD Transaction
                          |
                          v
                     Entitlement
```

---

# 5. Multi-Tenancy Strategy

The application should use **logical multi-tenancy through workspaces**, without implementing complex enterprise multi-tenancy.

## Model

```text
User
  |
  v
Workspace
  |
  +-- Projects
  +-- Folders
  +-- Links
  +-- LinkClicks
  +-- QR Codes
  +-- Custom Domains
  +-- Entitlements
```

Every customer-owned resource should contain `workspaceId`.

## MVP behavior

Each user automatically receives one default workspace during onboarding.

The user does not need to understand the workspace concept initially.

Example:

```text
User
  |
  +-- Personal Workspace
        |
        +-- Links
        +-- Projects
        +-- QR Codes
```

Future versions may support multiple workspaces and team members without requiring a fundamental database redesign.

---

# 6. Authentication

## Supported methods

### Google

Use Auth.js Google OAuth.

### Email/password

Users can register and authenticate using:

```text
email
password
```

Passwords must be securely hashed.

## Authentication requirements

- Protected dashboard routes
- Authenticated API routes
- Secure sessions
- Logout
- Account creation
- Login
- Password validation
- Password reset flow should be added before public launch if credentials authentication is enabled

## Onboarding

After successful registration:

```text
Create User
   |
   v
Create default Workspace
   |
   v
Create Workspace Membership
   |
   v
Open Dashboard
```

---

# 7. Core Domain Model

Initial entities:

```text
User
Account
Session

Workspace
WorkspaceMember

Project
Folder

Link
LinkClick

QRCode
CustomDomain

ApiKey

Entitlement
```

Future entities:

```text
CTA
CTAEvent
Pixel
Experiment
ExperimentVariant
RoutingRule
```

---

# 8. Database Specification

## User

Responsibilities:

- Store application user identity.
- Connect authentication accounts.
- Own workspace memberships.

Important fields:

```text
id
name
email
emailVerified
image
createdAt
updatedAt
```

---

## Workspace

Responsibilities:

- Tenant boundary for application data.
- Billing/entitlement owner.
- Resource ownership boundary.

Important fields:

```text
id
name
slug
createdAt
updatedAt
```

---

## WorkspaceMember

Responsibilities:

- Connect users to workspaces.
- Prepare the product for future collaboration.

Initial role:

```text
OWNER
```

Future roles:

```text
ADMIN
MEMBER
VIEWER
```

---

## Project

Used to organize links.

Fields:

```text
id
workspaceId
name
description
createdAt
updatedAt
```

---

## Folder

Used for additional organization inside a project.

Fields:

```text
id
workspaceId
projectId
name
createdAt
updatedAt
```

---

## Link

Core application entity.

Fields:

```text
id
workspaceId
projectId
folderId

slug
destinationUrl

title
description
ogImage

utmSource
utmMedium
utmCampaign
utmTerm
utmContent

status

createdAt
updatedAt
```

Possible status values:

```text
ACTIVE
PAUSED
ARCHIVED
```

Constraints:

- `slug` must be unique within its domain context.
- Destination URL must be validated.
- Workspace ownership must always be verified.
- Slugs should reject dangerous/reserved paths.

---

# 9. Link Resolver

The link resolver is the most performance-sensitive part of the system.

Request:

```text
GET https://go.example.com/abc123
```

Flow:

```text
Request
  |
  v
Resolve hostname + slug
  |
  v
Find Link
  |
  +---- inactive/not found --> 404/410
  |
  v
Record analytics event
  |
  v
HTTP 302 redirect
```

## Important requirements

- Redirect should be fast.
- Do not perform unnecessary application work before redirect.
- Do not expose internal database identifiers.
- Validate link status.
- Support custom domains.
- Resolve destination safely.
- Avoid open redirect vulnerabilities outside the explicitly configured destination URL.

## Future optimization

```text
Request
  |
  v
Redis
  |
  +-- HIT --> Redirect
  |
  +-- MISS --> Neon
                  |
                  v
                Redis
                  |
                  v
               Redirect
```

Redis is not required for V1.

---

# 10. Analytics

Each click should generate an analytics event.

Initial information:

```text
linkId
timestamp

ipHash
country
region
city

referrer

deviceType
browser
browserVersion
os
userAgent
```

## Privacy

Do not permanently store raw IP addresses unless there is a justified legal/operational requirement.

Prefer:

```text
IP
 |
 v
Hash / GeoIP processing
 |
 +--> country
 +--> region
 +--> city
 |
 v
Discard raw IP
```

The analytics design must comply with applicable privacy requirements.

---

# 11. Analytics Dashboard

Dashboard should provide:

## Overview

```text
Total clicks
Unique visitors
Top links
Top countries
Top referrers
Top devices
```

## Time series

Support:

```text
Today
7 days
30 days
90 days
Custom range
```

## Geographic analytics

```text
Country
Region
City
```

## Device analytics

```text
Desktop
Mobile
Tablet
```

## Browser analytics

```text
Chrome
Safari
Edge
Firefox
Other
```

## Operating systems

```text
Windows
macOS
Linux
Android
iOS
Other
```

## Referrers

Examples:

```text
Google
Instagram
Facebook
Direct
YouTube
Other
```

---

# 12. Analytics Data Strategy

MVP:

```text
Neon PostgreSQL
    |
    +-- application tables
    |
    +-- link_clicks
```

Do not introduce a specialized analytics database initially.

When traffic becomes significant:

```text
Next.js
   |
   v
Queue
   |
   v
Worker
   |
   v
Analytics storage
```

Potential future technologies:

- Redis
- PostgreSQL partitioning
- ClickHouse if genuinely required

Do not prematurely introduce ClickHouse.

---

# 13. UTM Builder

Link creation should provide optional UTM parameters:

```text
UTM Source
UTM Medium
UTM Campaign
UTM Term
UTM Content
```

Example:

```text
Destination:

https://example.com/product

Source:
instagram

Medium:
social

Campaign:
summer-sale

Content:
video-01
```

Generated destination:

```text
https://example.com/product
?utm_source=instagram
&utm_medium=social
&utm_campaign=summer-sale
&utm_content=video-01
```

The user should be able to preview the resulting URL before creating the link.

---

# 14. Projects and Folders

Users should be able to:

- Create projects
- Rename projects
- Delete/archive projects
- Create folders
- Rename folders
- Move links
- Filter links
- Search links

Example:

```text
Project: Summer Campaign

├── Instagram
│   ├── video-01
│   ├── video-02
│   └── story
│
├── Facebook
│   └── campaign-01
│
└── Influencers
    ├── creator-a
    └── creator-b
```

---

# 15. QR Codes

Each QR Code should point to the short link rather than directly to the destination.

```text
QR
 |
 v
https://go.example.com/abc
 |
 v
Destination
```

This means the destination can change without requiring a new QR Code.

## MVP features

- Generate QR Code
- Preview QR Code
- Download PNG
- Download SVG
- Basic customization

Future customization:

```text
Foreground
Background
Logo
Pattern
Corner style
```

---

# 16. Custom Domains

Users should eventually be able to connect:

```text
go.mybrand.com
```

and create:

```text
https://go.mybrand.com/summer
```

## Domain verification

Recommended flow:

```text
User enters domain
       |
       v
Generate verification token
       |
       v
User adds DNS record
       |
       v
Verify DNS
       |
       v
Domain ACTIVE
```

Use DNS/CNAME configuration appropriate to the deployment architecture.

## Important

The domain resolver must distinguish:

```text
hostname + slug
```

rather than only:

```text
slug
```

This allows multiple customers to use the same slug on different domains.

---

# 17. API

Prepare a versioned API:

```text
/api/v1
```

Initial endpoints:

```text
POST   /api/v1/links
GET    /api/v1/links
GET    /api/v1/links/:id
PATCH  /api/v1/links/:id
DELETE /api/v1/links/:id

GET    /api/v1/links/:id/analytics
```

Example:

```http
POST /api/v1/links
```

Request:

```json
{
  "destinationUrl": "https://example.com",
  "slug": "summer"
}
```

Response:

```json
{
  "id": "link_123",
  "url": "https://go.example.com/summer"
}
```

Authentication should use API keys.

API keys must be stored securely and never returned after initial creation.

---

# 18. Billing

## Initial model

Paddle Lifetime Deal.

The first commercial release should avoid complicated recurring subscription logic.

Conceptually:

```text
Paddle
  |
  v
Transaction
  |
  v
Webhook
  |
  v
Entitlement
  |
  v
Workspace access
```

## Entitlement

Fields:

```text
id
workspaceId

plan
status

paddleCustomerId
paddleTransactionId
paddleSubscriptionId

expiresAt

createdAt
updatedAt
```

For LTD:

```text
plan = LIFETIME
status = ACTIVE
expiresAt = null
```

Keep `paddleSubscriptionId` nullable for future recurring plans.

## Security

The application must never trust the frontend to determine paid status.

Billing state must be synchronized from Paddle webhooks.

---

# 19. LTD Entitlements

Example initial entitlement:

```text
LIFETIME

Unlimited short links
Unlimited projects
Unlimited folders
QR Codes
Analytics
UTM builder
```

Optional infrastructure protection:

```text
Tracked clicks per month:
100,000
```

The exact limit should be configurable rather than hard-coded.

Create a centralized entitlement service:

```text
canCreateLink(workspace)
canCreateQRCode(workspace)
canUseCustomDomain(workspace)
canUseApi(workspace)
canTrackClick(workspace)
```

This makes future pricing changes easy.

---

# 20. Dashboard UX

Primary navigation:

```text
Dashboard

Links
Projects
Analytics
QR Codes
Domains
API

Settings
Billing
```

## Dashboard

Show:

```text
Total Clicks
Unique Visitors
Active Links
Top Link
```

Then:

```text
Clicks over time
```

and:

```text
Top links
Top countries
Top referrers
Devices
```

---

# 21. Link Creation UX

Primary CTA:

```text
+ Create Link
```

Form:

```text
Destination URL
Short domain
Custom slug
Title

UTM Parameters

Project
Folder
```

Example:

```text
Destination
https://example.com/product

Short URL
https://go.example.com/summer

[Create Link]
```

After creation:

```text
Link created

https://go.example.com/summer

[Copy]
[QR Code]
[Analytics]
```

---

# 22. Link Management

Link list columns:

```text
Link
Destination
Clicks
Project
Created
Status
Actions
```

Actions:

```text
Copy
Edit
Analytics
QR Code
Pause
Archive
Delete
```

Provide:

- Search
- Filtering
- Sorting
- Pagination

---

# 23. Security Requirements

The application must implement:

- Authentication on protected resources.
- Workspace authorization.
- Server-side ownership checks.
- Input validation.
- URL validation.
- API key hashing.
- Secure password hashing.
- CSRF-safe authentication flows where applicable.
- Rate limiting on authentication endpoints.
- Rate limiting on public link creation/API endpoints.
- Protection against malicious destination URLs where appropriate.
- Protection against slug/path abuse.
- Secure Paddle webhook verification.
- No secrets exposed to client-side code.

Every resource query must enforce workspace ownership.

Example:

```text
Never:

findLink(id)

Prefer:

findLink({
  id,
  workspaceId
})
```

---

# 24. Abuse Prevention

Because the service is a public redirect platform, abuse prevention is important.

Implement progressively:

### MVP

- Rate limit link creation.
- Rate limit API.
- Rate limit authentication.
- Basic destination URL validation.
- Ability to disable links.
- Abuse reporting mechanism.

### Future

- Malicious URL detection.
- Automated abuse scoring.
- Domain reputation checks.
- CAPTCHA when necessary.
- Automated link suspension.

---

# 25. SEO

Marketing website should contain:

```text
/
 /features
 /pricing
 /about
 /blog
 /login
 /register
```

Dashboard should generally not be indexed.

Short links should not be treated as normal SEO pages.

---

# 26. Infrastructure

## Initial deployment

One Hetzner server is sufficient for the application layer.

Example:

```text
Hetzner VPS

Docker
├── Next.js
└── Worker (future)
```

Database:

```text
Neon PostgreSQL
```

DNS/TLS:

```text
Cloudflare
```

Billing:

```text
Paddle
```

## MVP infrastructure principle

Keep infrastructure boring.

Do not introduce:

```text
Kubernetes
Microservices
Kafka
Multiple application servers
Specialized analytics databases
```

until real traffic requires them.

---

# 27. Future Redis Architecture

When needed:

```text
                    Next.js
                       |
             +---------+---------+
             |                   |
             v                   v
          Redis              PostgreSQL
             |
       +-----+------+
       |            |
       v            v
 Link Cache     Analytics Queue
                    |
                    v
                  Worker
                    |
                    v
                PostgreSQL
```

Redis responsibilities:

- Link resolution cache
- Domain resolution cache
- Rate limiting
- Analytics queue
- Temporary state

---

# 28. Future Smart Routing

Prepare the Link model so it can evolve into:

```text
Link
 |
 +-- Destination
 |
 +-- Routing Rules
       |
       +-- Country
       +-- Device
       +-- Language
       +-- Time
       +-- Percentage
```

Example:

```text
iOS
  -> App Store

Android
  -> Google Play

Desktop
  -> Website
```

Do not implement the full routing engine in V1.

---

# 29. Future A/B Testing

Future structure:

```text
Experiment
 |
 +-- Variant A
 |
 +-- Variant B
 |
 +-- Variant C
```

Example:

```text
50% -> Landing A
50% -> Landing B
```

Analytics should eventually support:

```text
Visitors
Clicks
Conversions
Conversion rate
```

---

# 30. Future CTA System

Potential future features:

```text
CTA
├── Banner
├── Popup
├── Button
├── Form
└── Greeting
```

Possible configuration:

```text
Title
Description
Button text
Button URL
Position
Delay
Frequency
Appearance
```

Do not implement the complete CTA system in MVP.

---

# 31. Future Pixels / Conversion Tracking

Potential integrations:

```text
Meta Pixel
Google Analytics
Google Tag Manager
Custom events
```

Future event model:

```text
LinkClick
    |
    v
Landing
    |
    v
Conversion
```

---

# 32. Application Routes

Recommended structure:

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── features/
│   ├── pricing/
│   └── about/
│
├── (auth)/
│   ├── login/
│   ├── register/
│   └── reset-password/
│
├── dashboard/
│   ├── page.tsx
│   ├── links/
│   ├── projects/
│   ├── analytics/
│   ├── qr-codes/
│   ├── domains/
│   ├── api/
│   ├── billing/
│   └── settings/
│
├── api/
│   ├── links/
│   ├── analytics/
│   ├── qr/
│   ├── domains/
│   ├── api-keys/
│   └── webhooks/
│
└── resolver/
```

The exact route structure may change according to Next.js conventions and custom-domain requirements.

---

# 33. Service Architecture

Keep the application modular without creating microservices.

Recommended internal modules:

```text
src/
├── auth/
├── billing/
├── workspaces/
├── links/
├── analytics/
├── qr/
├── domains/
├── api-keys/
├── entitlements/
└── shared/
```

Each module should contain its own:

```text
validation
business logic
database operations
authorization
```

The redirect resolver should remain isolated from dashboard logic.

---

# 34. Authorization Rules

Every workspace resource must follow:

```text
Authenticated user
        |
        v
Workspace membership
        |
        v
Resource ownership
        |
        v
Action allowed
```

Example:

```text
User A
  |
  X
  |
Link belonging to Workspace B
```

must always return:

```text
404 or 403
```

without leaking resource information.

---

# 35. Observability

MVP should provide:

- Application logs
- Error tracking
- Basic request monitoring
- Database monitoring
- Paddle webhook logs
- Link resolver error logs

Track important operational metrics:

```text
Redirect latency
Redirect errors
404 links
Database latency
API errors
Webhook failures
```

---

# 36. Testing Strategy

## Unit tests

Test:

- Slug generation
- URL validation
- UTM generation
- Entitlements
- Authorization
- Analytics parsing
- Billing state transitions

## Integration tests

Test:

```text
User registration
Google authentication
Workspace creation
Link creation
Link resolution
Analytics recording
QR creation
Paddle webhook
API authentication
Custom domain verification
```

## E2E tests

Critical flows:

```text
Register
  -> Create Link
  -> Visit Link
  -> Check Analytics
```

and:

```text
Purchase LTD
  -> Paddle webhook
  -> Entitlement active
  -> Premium functionality available
```

---

# 37. Development Phases

## Phase 1 — Foundation

Implement:

- Next.js
- TypeScript
- Tailwind
- Prisma
- Neon
- Auth.js
- Google login
- Email/password
- User model
- Workspace model
- Workspace membership
- Basic dashboard

Acceptance:

```text
User can register/login
User receives default workspace
User can access protected dashboard
```

---

## Phase 2 — Core Links

Implement:

- Link model
- Create link
- Edit link
- Delete/archive link
- Slug generation
- Custom slug
- Link resolver
- 302 redirects
- Link status

Acceptance:

```text
User creates:

https://go.example.com/abc

Visitor accesses it

Visitor is redirected to destination.
```

---

## Phase 3 — Organization

Implement:

- Projects
- Folders
- Search
- Filtering
- Sorting
- Pagination

Acceptance:

```text
User can organize hundreds/thousands of links.
```

---

## Phase 4 — Analytics

Implement:

- LinkClick
- Click counting
- Unique visitor estimation
- Referrer
- Country
- Device
- Browser
- OS
- Time-series dashboard

Acceptance:

```text
Visitor clicks link
       |
       v
Analytics event
       |
       v
Dashboard reflects click
```

---

## Phase 5 — UTM + QR

Implement:

- UTM builder
- URL preview
- QR generation
- PNG export
- SVG export

Acceptance:

```text
QR -> Short URL -> Destination
```

Changing destination must not invalidate the QR.

---

## Phase 6 — Billing

Implement:

- Paddle checkout
- Paddle webhook
- Transaction verification
- Entitlement
- LTD activation
- Billing dashboard

Acceptance:

```text
Purchase
   |
   v
Paddle
   |
   v
Webhook
   |
   v
Entitlement ACTIVE
```

---

## Phase 7 — Custom Domains

Implement:

- Domain registration
- DNS verification
- Domain status
- Hostname + slug resolver
- HTTPS/TLS architecture
- Domain management UI

Acceptance:

```text
go.customer.com/sale
        |
        v
Correct workspace link
        |
        v
Destination
```

---

## Phase 8 — API

Implement:

- API keys
- REST API
- Link CRUD
- Analytics endpoint
- Rate limiting
- API documentation

---

# 38. MVP Definition of Done

The MVP is ready for public validation when a user can:

```text
1. Register with Google or email/password
2. Access a personal workspace
3. Create a short link
4. Customize the slug
5. Add UTM parameters
6. Copy the short link
7. Visit the link
8. Be redirected successfully
9. See click analytics
10. Organize links
11. Generate a QR Code
12. Purchase the LTD
13. Have entitlement activated automatically
```

The system must also:

```text
- enforce workspace isolation
- protect API endpoints
- validate URLs
- handle disabled links
- verify Paddle webhooks
- avoid storing raw IPs unnecessarily
- provide basic abuse controls
```

---

# 39. Product Roadmap After MVP

## V1.1

```text
Custom Domains
API
Team members
Better analytics
```

## V1.2

```text
Smart routing
Device routing
Geo routing
Link rotation
```

## V2

```text
CTA
Pixels
Conversion tracking
A/B testing
Campaigns
```

## V3

```text
Advanced automation
Retargeting
Enterprise workspaces
Advanced team permissions
Advanced API
```

---

# 40. Architectural Principles

1. **Keep the MVP simple.**
2. **Workspace is the tenant boundary.**
3. **Every customer-owned resource requires workspace authorization.**
4. **The redirect path is performance-critical.**
5. **Analytics must not block redirects.**
6. **Neon PostgreSQL is sufficient initially.**
7. **Do not introduce Redis until there is a concrete need.**
8. **Do not introduce ClickHouse until PostgreSQL demonstrably becomes insufficient.**
9. **Billing state comes from Paddle webhooks, not the frontend.**
10. **Entitlements must be centralized.**
11. **The database should be designed for future teams without implementing teams in V1.**
12. **Prefer modular monolith architecture over microservices.**
13. **Optimize for low operational cost during validation.**
14. **Keep future subscriptions compatible with the LTD billing model.**
15. **Treat abuse prevention as a core requirement of a public URL redirect service.**

---

# 41. Final Architecture

```text
                         USER
                          |
                          v
                    Cloudflare
                          |
              +-----------+-----------+
              |                       |
              v                       v
         Next.js App            Link Resolver
              |                       |
       +------+-------+               |
       |              |               v
    Auth.js         Prisma         Redirect
       |              |
       |              v
       |             Neon
       |
       +---- Google
       |
       +---- Email/Password

                          |
                          v
                       Paddle
                          |
                          v
                     Entitlement
```

Future scale:

```text
                         Cloudflare
                              |
                   +----------+----------+
                   |                     |
                   v                     v
                Next.js             Link Resolver
                   |                     |
                   |                  Redis
                   |                     |
                   |              +------+------+
                   |              |             |
                   v              v             v
                 Neon          Cache        Analytics Queue
                                               |
                                               v
                                            Worker
                                               |
                                               v
                                              Neon
```

The initial implementation should remain a **modular monolith using Next.js + Prisma + Neon**, deployed on Hetzner, with Auth.js for authentication and Paddle for the LTD. Redis and specialized analytics infrastructure are intentionally deferred until actual traffic justifies them.

---

# 42. Implementation Amendments

**Amended:** 2026-09-09 · **Spec version:** 1.1

Sections 1–41 are the approved v1.0 specification and are left as written. This section
records where the implementation deliberately departs from them, and why. **Where the two
disagree, this section is authoritative.**

## 42.1 Data model

The entity field lists in §8 could not be implemented as written.

### `Link.domainId` — required

§8 (line 427) requires `slug` to be "unique within its domain context" and §16 requires the
resolver to match on `hostname + slug`. The `Link` field list has no domain reference, which
makes both rules impossible to express. The implementation adds `domainId` with
`@@unique([domainId, slug])`. This composite key is the resolver's lookup key.

### `LinkClick.workspaceId` — denormalized

§5 (line 173) states every customer-owned resource must contain `workspaceId`; the §10 event
payload omits it. Without the column, every workspace-level aggregate joins through `Link`.
It is stored on the click row.

### `Link.clickCount` — denormalized counter

§22 puts a `Clicks` column on the link list and §11 sorts by it, while §12 describes only a
raw `link_clicks` table. Computing that column by aggregation is one scan per row per page
load. The counter is incremented on redirect; the raw table remains the source for
breakdowns and time series.

Deferred: no daily rollup table. Add one when scans of the raw table become slow — not
before (§40 principle 8 applied to Postgres itself).

### `LinkClick.isBot`

The spec describes no bot or crawler filtering anywhere. For a public redirect service this
is a genuine gap: link unfurlers inflate click counts. The column exists and every aggregate
already excludes bot traffic; detection lands with the resolver.

### `LinkClick.viaQr`

§15 makes QR codes a headline feature but no field distinguishes a scan from a direct click,
so "scan share" is not derivable. The resolver sets the flag.

### `Folder.parentId`

§8 models `Folder` as flat. §14 and the design handoff both show a two-level tree. Added as
a self-relation.

### UI-driven fields

`Project.color` (the accent dot), `Workspace.hashVisitorIps` / `storeCityGeo` /
`respectDoNotTrack` (the §23 privacy commitments, made per-workspace settings on the
Settings screen), and `ApiKey.scope` / `keyPrefix` / `last4` (scope pill and masked display;
`hashedKey` remains the only stored secret, per §17).

## 42.2 Dashboard metrics

§20 lists `Top Link` as the fourth KPI; the design handoff shows `Avg. redirect`. Neither is
implemented as specified.

**`Avg. redirect` is not a click-table metric.** §35 already places "Redirect latency" under
observability. Storing a duration on every click row would be the wrong column in the wrong
place. The fourth card shows **QR scans**, derived from `viaQr`.

## 42.3 Indexes

§8 specifies no indexes. The ones that matter:

```text
Link       @@unique([domainId, slug])       resolver lookup
Link       @@index([workspaceId, status])   link list
Link       @@index([workspaceId, clickCount]) sort by clicks
LinkClick  @@index([linkId, timestamp])     link detail time series
LinkClick  @@index([workspaceId, timestamp]) workspace time series
```

## 42.4 Stack

**Prisma is pinned to 7.10.0.** At implementation time `prisma@latest` resolved to
`8.0.0-rc.13` while `@prisma/client@latest` was still `7.10.0`; no `prisma@8.0.0` existed.
Prisma 8 also replaces the query API entirely
(`db.orm.public.Link.where({...}).all()`). Revisit once 8 is generally available — the schema
is largely portable, the query layer is not.

Prisma 7 requires a **driver adapter** (`@prisma/adapter-pg`, TCP — correct for the
long-running Hetzner container of §26) and moves the connection string out of the schema into
`prisma.config.ts`.

**Development uses Postgres in Docker**, not Neon. Neon remains the production database.

## 42.5 Structure

- §33's module list gains `projects/` (projects and folders do not belong in `links/`).
- §32's `dashboard/` sits inside an `(app)` route group, so the authenticated shell can be a
  layout without appearing in the URL. `(marketing)` is not built — the design handoff covers
  the authenticated product only.
- Retention and pruning of `link_clicks` remain unspecified; no policy is implemented.
