## Goal
Convert the existing multi-tenant doctor platform from query-param routing (`?doctor=slug`) to clean slug URLs (`/dr-ahmed-ali`), while preserving all existing functionality (data isolation, dashboard, booking, auth).

The backend already has solid multi-tenancy: `doctors` table with slugs, `doctor_id` FK across all tenant tables, RLS policies via `get_doctor_id_for_user()` and `is_superadmin()`, and a `get_doctor_by_slug()` function. The main missing piece is the **public routing layer**.

## What changes

### 1. Routing structure (App.tsx)
Switch public pages to be nested under `/:slug`:

```text
/                              → Landing / doctor directory (or redirect)
/:slug                         → Doctor home (Index)
/:slug/about                   → About
/:slug/services                → Services
/:slug/clinics                 → Clinics
/:slug/contact                 → Contact
/:slug/book                    → Book
/:slug/my-appointments         → Patient's appointments
/auth                          → Login / signup
/dashboard, /admin/*           → Doctor admin (unchanged, uses logged-in user's doctor_id)
```

Reserved top-level paths (`auth`, `dashboard`, `admin`, `api`, `assets`) are excluded from slug matching so they never collide with a doctor slug.

### 2. DoctorContext
- Read slug from `useParams()` (`:slug`) instead of `useSearchParams("doctor")`.
- Keep the existing fallback chain: URL slug → logged-in user's doctor → `default`.
- Keep sessionStorage persistence for cross-tab continuity.
- Validate slug via existing `get_doctor_by_slug` RPC; if slug doesn't exist, render a NotFound state (not silent fallback) so SEO 404s work correctly.

### 3. useDoctorSlug helper
Replace `?doctor=slug` builder with a slug-prefix builder:
- `buildPath("/book")` → `/dr-ahmed-ali/book`
- For logged-in doctors viewing their own site, still emit prefixed URLs (they're public, canonical, SEO-friendly).

All `<Link>` / `navigate()` calls already use `buildPath`, so this single change propagates everywhere.

### 4. Slug auto-generation
Add a Postgres trigger on `doctors` that:
- Generates slug from email/name if not provided (lowercase, hyphenated, strip non-alnum).
- On conflict, appends `-2`, `-3`, … until unique.

Existing slugs are preserved.

### 5. Backward compatibility
- Old `?doctor=slug` links keep working: a small redirect effect in `App.tsx` detects the query param on `/` and 301-redirects to `/:slug`.
- `public/404.html` (already preserves query+path) continues to work for Vercel/static hosts.

### 6. SEO
- Each doctor page sets `<title>`, `<meta description>`, and canonical `<link>` based on the doctor profile and current path.
- Add JSON-LD `Person` / `MedicalBusiness` schema on the doctor home.

### 7. Auth flow
- After login, redirect to `/dashboard` (unchanged).
- Doctor signup remains super-admin-only (per existing memory).

## What does NOT change
- Database schema for tenancy (already correct).
- RLS policies (already correct).
- Booking flow internals, admin dashboard pages, realtime subscriptions.
- Auth provider, Google OAuth, password reset.

## Technical notes
- Reserved-path guard: `<Route path="/:slug/*" element={<DoctorSite />} />` with the `DoctorSite` component checking `slug` against a reserved list and rendering `<NotFound />` if matched.
- `DoctorProvider` must live **inside** the route that has `:slug`, OR (simpler) keep it at root and have it read `useMatch("/:slug/*")`. I'll use the `useMatch` approach to avoid rewriting the provider tree.
- Migration is **schema-only** (new trigger + function); no data backfill needed since all existing doctors already have slugs.

## Deliverables
1. Migration: `generate_unique_slug()` function + `BEFORE INSERT` trigger on `doctors`.
2. `src/App.tsx` — new route structure with `/:slug/*`.
3. `src/contexts/DoctorContext.tsx` — read slug from path via `useMatch`.
4. `src/hooks/useDoctorSlug.ts` — `buildPath` emits `/slug/path`.
5. Tiny `LegacyDoctorRedirect` component to convert `?doctor=x` → `/x`.
6. SEO meta tags on public pages.
