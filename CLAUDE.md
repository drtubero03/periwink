# CLAUDE.md — Periwink

## Project Overview

**Periwink** is a privacy-first community platform for women navigating perimenopause and menopause. It combines community discussion, symptom tracking, and citizen science in a space designed to feel calm, intelligent, and emotionally real.

**Live URLs:**
- Landing page: https://www.yourperiwink.com (GitHub Pages from `docs/`)
- App (Cloud Run): _pending GCP deployment_
- Repo: https://github.com/drtubero03/periwink

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + CSS custom properties in `globals.css`
- **ORM**: Prisma with PostgreSQL
- **Auth**: NextAuth.js v5 (beta) with JWT strategy, credentials provider
- **Email**: Resend (`hello@yourperiwink.com`), notifications to `adrian@yourperiwink.com`
- **Landing Page**: Static HTML in `docs/` served via GitHub Pages + custom domain
- **Node**: >=20

### GCP Infrastructure
- **Compute**: Cloud Run (containerized via Dockerfile, standalone Next.js output)
- **Database**: Cloud SQL (PostgreSQL 15, private networking via VPC connector)
- **Secrets**: Secret Manager (`periwink-database-url`, `periwink-nextauth-secret`, `periwink-resend-api-key`)
- **Container Registry**: Artifact Registry (`us-east1-docker.pkg.dev`)
- **CI/CD**: Cloud Build (`cloudbuild.yaml` — build image + deploy to Cloud Run on push to `main`)
- **Networking**: Serverless VPC connector for Cloud Run → Cloud SQL

---

## Project Structure

```
periwink/
  docs/
    index.html                       — Landing page (GitHub Pages / yourperiwink.com)
    CNAME                            — Custom domain config
    *.png                            — Brand images (silhouette, waves, feather, floral)
  infra/
    setup-gcp.sh                     — One-time GCP infrastructure provisioning script
  prisma/
    schema.prisma                    — Full database schema (source of truth)
    seed.ts                          — Rich demo data (12 users, 51 posts, 145 comments, 275 reactions)
  src/
    app/
      page.tsx                       — Root route, renders LandingPage component
      layout.tsx                     — Root layout with ambient glows
      globals.css                    — Design tokens as CSS variables + Tailwind
      admin/
        page.tsx                     — Admin dashboard (client component, token-authed)
      app/
        layout.tsx                   — App shell (header + bottom nav)
        page.tsx                     — Home feed (Server Component, fetches from DB)
        rooms/                       — Room list + detail pages
        stories/                     — Featured/pinned posts
        checkin/                     — Guided symptom check-in form
        circles/                     — Live circles (coming soon)
        profile/                     — User profile
        onboarding/                  — 3-step reflective onboarding
      api/
        auth/[...nextauth]/route.ts  — NextAuth handler
        auth/signup/route.ts         — User registration
        signup/route.ts              — Quick email capture
        signup/community/route.ts    — Community signup
        signup/founding/route.ts     — Founding member application
        posts/route.ts               — GET/POST community posts
        rooms/route.ts               — GET rooms
        symptoms/route.ts            — GET/POST symptom logs
        insights/route.ts            — GET citizen science aggregates
        admin/*                      — Admin API routes (protected by X-Admin-Token header)
    components/
      LandingPage.tsx                — React landing page (at /)
      AppHeader.tsx                  — Sticky frosted-glass header
      AppNav.tsx                     — Fixed bottom nav
      GrowingMessage.tsx             — Graceful lock modal + LockedButton wrapper
      PostCard.tsx                   — Post display with reactions
      ReactionBar.tsx                — Reaction display
      Avatar.tsx                     — Deterministic gradient avatar
    lib/
      auth.ts                        — NextAuth config (credentials + JWT)
      admin-auth.ts                  — Admin route auth helper
      prisma.ts                      — Prisma singleton client
      queries.ts                     — Centralized Prisma queries for Server Components
      demo-helpers.ts                — timeAgo, avatarHue, avatarGradient utilities
      design.ts                      — Design system constants
      email.ts                       — Resend email templates
  Dockerfile                         — Multi-stage build for Cloud Run
  .dockerignore                      — Docker build exclusions
  cloudbuild.yaml                    — Cloud Build CI/CD pipeline
  railway.toml                       — Legacy Railway config (kept for reference)
```

---

## Key Commands

```bash
# Local development
npm install              # Install dependencies (runs prisma generate)
npm run dev              # Start dev server
npm run build            # prisma generate && next build
npm run db:push          # Push schema to database
npm run db:seed          # Seed demo data

# Docker (local testing)
docker build -t periwink .
docker run -p 8080:8080 --env-file .env periwink

# GCP infrastructure (one-time)
export PROJECT_ID=your-project-id
bash infra/setup-gcp.sh

# GCP deploy (manual, or auto via Cloud Build on push to main)
gcloud builds submit --config=cloudbuild.yaml --substitutions=SHORT_SHA=manual
```

---

## Environment Variables

| Variable | Description | Where |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Local: `.env`, GCP: Secret Manager |
| `NEXTAUTH_SECRET` | JWT signing secret | Local: `.env`, GCP: Secret Manager |
| `NEXTAUTH_URL` | App base URL | Local: `.env`, GCP: Cloud Run env |
| `RESEND_API_KEY` | Resend transactional email API key | Local: `.env`, GCP: Secret Manager |
| `ADMIN_SECRET` | Password for admin dashboard + API | Local: `.env`, GCP: Secret Manager |

---

## Admin Authentication

Admin routes (`/api/admin/*`) are protected by server-side middleware:
- Requests must include `X-Admin-Token` header or `?token=` query parameter
- Token is validated against `ADMIN_SECRET` env var
- The admin dashboard (`/admin`) prompts for the password and stores it in sessionStorage
- All dashboard API calls include the token via the `adminFetch` helper

---

## Database Schema Overview

The Prisma schema (`prisma/schema.prisma`) is the source of truth:

- **Auth & Identity**: User, Account, Session, VerificationToken
- **Profile & Privacy**: Profile (pseudonym-first, optional demographics), PrivacySettings
- **Community**: Room (8 seeded), Post, Comment (threaded), Reaction (HEART/HUG/SAME/HELPFUL/BOOKMARK), RoomFollow
- **Moderation**: RoomModerator, RoomBan, ModerationAction, Report
- **Symptom Tracking**: SymptomLog (25 symptom types, severity 1-5), TreatmentLog, UserMedication, UserSupplement
- **Citizen Science**: CitizenScienceConsent (granular opt-ins), ConsentRecord (immutable audit trail)
- **Pre-launch**: CommunitySignup, FoundingMemberApplication
- **Post-launch**: FounderApplication (linked to user accounts)
- **Notifications**: polymorphic notification system

All IDs use `cuid()`. Soft deletes via `deletedAt`. Tables use `@@map` for snake_case names.

---

## Architecture Patterns

### App Pages (Server Components)
Pages under `/app/*` use Server Components that query Prisma directly via `src/lib/queries.ts`. No API routes needed for page rendering.

### Graceful Lock Pattern
Every interactive element triggers a `GrowingMessage` modal with warm, on-brand copy. Uses `LockedButton` wrapper component.

### Landing Page (GitHub Pages)
`docs/index.html` is a self-contained static page. Forms POST to the Cloud Run production API. Custom domain via `docs/CNAME`.

### CORS
Middleware restricts CORS to known origins: `www.yourperiwink.com`, `yourperiwink.com`, `localhost:3000`. The `X-Admin-Token` header is explicitly allowed.

---

## Design System

### Colors (CSS variables in globals.css + TypeScript in design.ts)
- **Primary**: dusty plum `#6E5A7E`
- **Secondary**: lavender `#B7A8C9`, periwinkle `#8C92FF`
- **Backgrounds**: warm ivory `#F7F3EE`, card `#FDFBF8`
- **Accents**: muted rose `#C99AA5`, soft glow `#D7CCFF`
- **Text**: ink `#2B2433`, secondary `#6B6575`, tertiary `#9B94A3`

### Typography
- **Headings**: Cormorant Garamond (weight 300-400)
- **Body**: DM Sans (weight 300)

---

## Brand Voice

- Warm, empathetic, validating
- Second-person ("you're not alone")
- Narrative, emotionally specific — not generic wellness copy
- Privacy-focused messaging
- No medical claims — peer support framing

---

## Deployment

### GCP Cloud Run (App)
- Docker image built via Cloud Build on push to `main`
- Image stored in Artifact Registry
- Cloud Run pulls secrets from Secret Manager at runtime
- Cloud SQL connected via VPC connector (private networking)
- `cloudbuild.yaml` defines the full build → deploy pipeline
- Region: `us-east1`

### GitHub Pages (Landing Page)
- Serves from `docs/` folder on `main` branch
- Custom domain: `www.yourperiwink.com` via `docs/CNAME`
- DNS: CNAME `www` → `zelidav.github.io` (configured in GoDaddy)

### Legacy: Railway
- `railway.toml` kept for reference
- Previous deployment at `periwink-production-a893.up.railway.app`

---

## Development Notes

- Path aliases: `@/*` maps to `./src/*`
- Build config: TypeScript and ESLint errors ignored during builds (`next.config.ts`)
- Prisma client: singleton pattern in `src/lib/prisma.ts`
- Dynamic pages use `export const dynamic = "force-dynamic"` to avoid build-time DB queries
- Next.js 15 dynamic params are Promises: `const { slug } = await params;`
