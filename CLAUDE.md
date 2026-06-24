# PureView Dashboard — pureview-Ebissan

Business operations dashboard for a window cleaning & screen repair service. Built with Nuxt 4, Supabase auth, and @lucide/vue icons.

## Commands

```bash
npm run dev          # Dev server at http://127.0.0.1:3000
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Unit tests (watch mode)
npm run test:run     # Unit tests (single run — use in CI)
```

## Stack

- **Nuxt 4** (Vue 3, SSR/SPA, `compatibilityDate: '2025-07-15'`)
- **@nuxtjs/supabase v2** — auth, session management, auto-imported composables
- **Chart.js v4** — dashboard charts (donut, line, bar), imported in `pages/index.vue`
- **Font Awesome 6.4** (CDN) + **DM Sans / DM Mono** (Google Fonts) — loaded via `nuxt.config.ts` head
- **@lucide/vue** — icons on the secondary CRUD pages
- **Vitest + happy-dom** — unit tests (pure utility logic only, no Nuxt runtime mocking)

## Dashboard = source of truth

`crystal_clear_dashboard.html` (project root) is the **visual source of truth** for the
dashboard (`/`). `pages/index.vue` is a faithful 1:1 port of it — same layout, fonts,
Font Awesome icons, Chart.js charts, navy/blue palette, 6 stat cards, donut + trend +
weekly-donut + monthly-bar charts, the 8 modals, and the bottom action bar. The design
system lives verbatim at the top of `assets/css/main.css`. **When changing the dashboard,
keep it matching that HTML file.**

Every value is wired to Supabase:
- Stat cards / financial summary / donut / trend / monthly bar → derived from completed
  `appointments` (revenue by service), `payments`, `expenses`, `clients`, `recurring_services`
  via `useDashboard().fetchDashboard(from, to, year)`.
- "% vs last period" → a second `useDashboard()` instance fetches the previous period.
- Upcoming appointments, feedback, goals, and the activity feed all read live data.
- The 8 modals insert real rows (appointment, client, expense, quote, feedback, goal targets).
  "Edit Financials" records completed appointments + an expense (a real ledger entry, additive).
- **One exception:** the Weekly Customer Goal *target* is stored in `localStorage`
  (`cc_weekly_goal`) because the schema has no column for it; "acquired" is real (clients
  added in the last 7 days).

## Environment

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=your-anon-key
```

The `@nuxtjs/supabase v2` module also accepts `SUPABASE_PUBLISHABLE_KEY` (the new `sb_publishable_...` key format is supported).

## RLS: every insert must stamp `user_id`

All tables are RLS-protected with `WITH CHECK (user_id = auth.uid())`. So **every `.insert()`
in a composable must set `user_id`** — we do it inline:
`.insert({ ...payload, user_id: useSupabaseUser().value?.id })`. Forgetting this gives
`new row violates row-level security policy`. `supabase/20260624_user_id_defaults.sql` also
defaults the column to `auth.uid()` as a DB-level backstop. When adding a new table/insert,
follow the same pattern.

## Reports → PDF (`/reports`)

`pages/reports.vue` is a designed, print-optimized report (letterhead from `settings`, KPI grid,
revenue-by-service, revenue-by-month bars, expenses-by-category). The **Export PDF** button calls
`window.print()`; an `@media print` block in `main.css` hides the sidebar/topbar/bottom-bar and
formats it as a clean A4 document (vector text, not a screenshot). Bars are CSS (not Chart.js) so
they print crisply.

## Database Setup

**Apply the migration manually** — the Supabase MCP is linked to a different account and cannot reach this project.

1. Open your Supabase project → SQL Editor
2. Paste and run: `supabase/migrations/20260624000000_initial_schema.sql`
3. That script creates all 14 tables, RLS policies (every table scoped to `auth.uid()`), updated_at triggers, and a `handle_new_user` trigger that auto-creates a Settings row and 2 default Services for every new signup.

## Auth Flow

- `@nuxtjs/supabase` built-in `auth-redirect` plugin handles global auth guard when `redirect: true` in `nuxt.config.ts`.
- Unauthenticated users on any protected route → `/login`
- `pages/login.vue` uses a page-level middleware (`definePageMeta`) to redirect already-authenticated users back to `/`.
- `pages/confirm.vue` is the OAuth callback landing page required by the module config.
- No signup page — all users are created manually via Supabase dashboard.

## Key File Map

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Supabase module config, types path |
| `app.vue` | `<NuxtLayout>` + global toast teleport |
| `layouts/default.vue` | Sidebar, nav, user card, logout — shared across all protected pages |
| `pages/login.vue` | Login page (`layout: false`) |
| `pages/confirm.vue` | Supabase auth callback |
| `pages/index.vue` | Dashboard — real Supabase data via `useDashboard`, `useAppointments`, `useFeedback` |
| `composables/useAuth.ts` | `userEmail`, `userInitial`, `logout()` |
| `composables/useToast.ts` | Global toast via `useState` |
| `composables/useDashboard.ts` | Aggregated monthly stats |
| `composables/useClients.ts` | CRUD for clients |
| `composables/useAppointments.ts` | CRUD + `fetchUpcoming` for appointments |
| `composables/useInvoices.ts` | CRUD + `nextNumber()` for invoices |
| `composables/useQuotes.ts` | CRUD + `nextNumber()` for quotes |
| `composables/usePayments.ts` | CRUD for payments |
| `composables/useServices.ts` | CRUD for services |
| `composables/useRecurring.ts` | CRUD for recurring services |
| `composables/useExpenses.ts` | CRUD for expenses |
| `composables/useGoals.ts` | CRUD + `fetchCurrent()` for goals |
| `composables/useTasks.ts` | CRUD + `complete/uncomplete` for tasks |
| `composables/useFeedback.ts` | CRUD + `avgRating` for customer feedback |
| `composables/useTeam.ts` | CRUD + `toggle()` for team members |
| `composables/useSettings.ts` | Fetch + `save()` for settings (one row per user) |
| `utils/auth.ts` | `validateLoginForm`, `getAuthRedirect` — pure, testable |
| `utils/toast.ts` | `formatToastMessage` — pure, testable |
| `types/database.types.ts` | Full TypeScript types for all 14 tables |
| `supabase/migrations/` | SQL migration file to apply manually |
| `assets/css/main.css` | All styles — no CSS framework dependency |

## Skeleton loaders (shimmer)

Reusable, auto-imported components in `components/`:
- `<Skeleton w h radius circle block />` — the shimmer atom
- `<SkeletonTable :rows :cols />` — for list/table pages
- `<SkeletonCards :count />` — for the client/team card grids
- `<SkeletonForm :fields />` — for detail/edit/settings forms

Shimmer CSS (`.skeleton`, `@keyframes shimmer`, `.skeleton-overlay`) lives in `main.css`
and respects `prefers-reduced-motion`.

**Show skeletons only during real async work** — never on instant client-side tab/filter
switches (that would just flicker). Pattern:
- List pages: `<SkeletonTable v-if="loading" .../>` then `v-else-if="!items.length"` empty,
  then `v-else` the data. The composable `loading` ref also flips true on post-save refetch,
  so skeletons reappear there automatically.
- Dashboard (`pages/index.vue`): a `firstLoad` ref drives the initial skeletons; `dashLoading`
  (period switch / after-save refetch) re-skeletons the stat cards, charts, financial table,
  weekly + monthly. Charts keep their `<canvas>` mounted and lay a `.skeleton-overlay` on top
  (so Chart.js never loses its sized canvas). Appointments/feedback/activity use their own
  loading flags.

## Page Structure

All pages use `layouts/default.vue` automatically. Each page renders two siblings inside the layout's `<slot>`:

```vue
<template>
  <header class="topbar">…</header>
  <section class="content">…</section>
</template>
```

Pages that should bypass the layout (login, confirm) use `definePageMeta({ layout: false })`.

## Pages Built

| Route | File | Description |
|-------|------|-------------|
| `/` | `pages/index.vue` | Dashboard with live stats |
| `/login` | `pages/login.vue` | Login only, no signup |
| `/confirm` | `pages/confirm.vue` | Auth callback |
| `/calendar` | `pages/calendar.vue` | Monthly calendar view |
| `/appointments` | `pages/appointments/index.vue` | List + filter |
| `/appointments/new` | `pages/appointments/new.vue` | Booking form |
| `/appointments/:id` | `pages/appointments/[id].vue` | Edit + delete |
| `/clients` | `pages/clients/index.vue` | Card grid |
| `/clients/new` | `pages/clients/new.vue` | New client form |
| `/clients/:id` | `pages/clients/[id].vue` | Edit + archive |
| `/invoices` | `pages/invoices/index.vue` | List + mark paid |
| `/invoices/new` | `pages/invoices/new.vue` | Line item editor |
| `/invoices/:id` | `pages/invoices/[id].vue` | Detail + status actions |
| `/quotes` | `pages/quotes/index.vue` | List + accept/decline |
| `/quotes/new` | `pages/quotes/new.vue` | Line item editor |
| `/payments` | `pages/payments.vue` | List + record form |
| `/recurring` | `pages/recurring.vue` | List + add form |
| `/financials` | `pages/financials.vue` | Revenue/expense summary |
| `/goals` | `pages/goals.vue` | Period goal CRUD |
| `/tasks` | `pages/tasks.vue` | Todo list with priorities |
| `/feedback` | `pages/feedback.vue` | Customer reviews |
| `/team` | `pages/team.vue` | Team member management |
| `/settings` | `pages/settings.vue` | Business settings form |

## Sidebar Injection Pattern

The sidebar toggle is provided via Vue `provide/inject`:

```ts
// layouts/default.vue
provide('toggleSidebar', toggleSidebar)

// any page
const toggleSidebar = inject<() => void>('toggleSidebar', () => {})
```

## CSS Architecture

Single file at `assets/css/main.css`. Key classes:

- `.dashboard-shell` — grid: 270px sidebar + 1fr main panel
- `.sidebar` — dark gradient sidebar, fixed on mobile (slides in)
- `.main-panel` — right content area (provided by layout, not pages)
- `.topbar` — 96px flex header with title and actions
- `.content` — padded content area
- `.form-card` + `.form-grid` — white card with 2-column grid for forms
- `.data-table-wrap` + `.data-table` — scrollable table
- `.toolbar` + `.search-box` + `.filter-tabs` — search + filter bar
- `.primary-action` — blue gradient button
- `.outline-action` — bordered secondary button
- `.danger-action` — red bordered button
- `.pill` + `.status` — badge/tag variants
- `.client-card` + `.client-grid` — card grid for entities
- `.empty-state` + `.loading-state` + `.error-state` — feedback states

## Tests

```bash
npm run test:run
# 15 tests, 2 files — all pass
```

Tests cover `validateLoginForm` (6 cases), `getAuthRedirect` (5 cases), and `formatToastMessage` (4 cases). These are pure utility functions — no Nuxt or Supabase mocking required.

## Adding a New Page

1. Create `pages/<name>.vue`
2. Start with the standard topbar/content structure
3. Import the relevant composable(s) (e.g. `useClients`)
4. All composables are auto-imported — no explicit import needed
5. Inject the sidebar toggle: `const toggleSidebar = inject<() => void>('toggleSidebar', () => {})`
6. The default layout wraps automatically; use `definePageMeta({ layout: false })` only for auth pages
