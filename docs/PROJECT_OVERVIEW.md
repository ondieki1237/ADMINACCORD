## ACCORD Admin Panel — Project Overview

This document summarizes the repository structure, routing, key components, data & auth flows, and immediate notes/next steps to help you understand how the pages work.

### Quick facts
- Framework: Next.js (App Router). See `package.json`.
- React + TypeScript. Many files use the client directive (`"use client"`).
- React Query used for client-side caching (`components/QueryProvider.tsx`).
- API base URL: `https://app.codewithseth.co.ke/api` (defined in `lib/auth.ts` and `lib/api.ts`).

## Routing and top-level layout
- Root layout: `app/layout.tsx` — provides fonts, meta, `QueryProvider` and `@vercel/analytics`.
- Root page: `app/page.tsx` — acts as the app's landing / main container. It handles authentication state and renders either the auth forms or the main app pages using a small client-side router (mobile-style): `dashboard`, `visits`, `trails`, `follow-ups`, `profile`.

Client-side navigation on the root page is controlled by state `currentPage` and the `MobileNav` component (`components/layout/mobile-nav.tsx`). Swiping gestures and the mobile nav change that state.

## App routes of interest
- `app/dashboard/*` - main admin pages. Each route renders a corresponding component from `components/dashboard/`:
  - `app/dashboard/advanced-analytics/page.tsx` → `components/dashboard/advanced-analytics`
  - `app/dashboard/sales-heatmap/page.tsx` → `components/dashboard/sales-heatmap` (dynamically imported with `ssr: false`)
  - `app/dashboard/user-manager/page.tsx` → `components/dashboard/user-manager`
  - `app/dashboard/follow-ups/page.tsx` → `components/visits/follow-up-manager`
  - `app/dashboard/planners/page.tsx` → `components/dashboard/planners`

Other important components used by the root page:
- `components/auth/login-form.tsx` and `components/auth/register-form.tsx` — handle login & registration flows and call `authService`.
- `components/profile/user-profile.tsx` — shows profile information and logout.

## Core client-side services
- `lib/auth.ts` — `AuthService` class and exported `authService` instance:
  - Stores `accessToken`, `refreshToken`, and `currentUser` in-memory and in `localStorage`.
  - `login` and `register` call `/auth/login` and `/auth/register` respectively and expect `json.data.user` and `json.data.tokens` in the response.
  - `getCurrentUser()` calls `/auth/me` using the stored access token.
  - `logout()` posts the refresh token to `/auth/logout` then clears tokens and local storage.

- `lib/api.ts` — `apiService` used across dashboard components:
  - Centralized `makeRequest(endpoint, options)` that attaches Bearer tokens when available.
  - Implements an automatic refresh attempt when a request returns 401 by POSTing to `/auth/refresh`, then retries the request.
  - Provides typed helper methods: `getDashboardOverview`, `getVisits`, `getTrails`, `getFollowUps`, `createVisit`, etc.

Note: Some components still use `fetch(...)` directly against the API (for example in `components/dashboard/dashboard-overview.tsx`), mixing direct fetch calls and `apiService`. Consolidation is recommended.

## Data & UI patterns
- React Query (`@tanstack/react-query`) wraps the app via `QueryProvider`. Many components use `useQuery` for data fetching and caching.
- Components often read tokens directly from `localStorage` (e.g., `localStorage.getItem('accessToken')`) instead of using `authService.getAccessToken()`.
- Some components use optimistic UI patterns (React Query) and client-only rendering (`"use client"`), while other dashboard routes are regular server/client hybrid pages.

## Notable client components
- `components/dashboard/dashboard-overview.tsx` — large dashboard page that:
  - Uses several `useQuery` hooks to fetch overview, performance, trails, heatmap, etc.
  - Also uses direct `fetch` calls to `/api/visits` and `/api/dashboard/all-trails`.
  - Offers exports (CSV/JSON/Excel) that bundle data into a Blob for download.
  - Uses `lib/permissions` helpers (`hasAdminAccess`, `canViewHeatmap`) to conditionally show UI.

- `components/layout/mobile-nav.tsx` — mobile sheet and bottom nav. Calls `authService.logout()` and triggers `window.location.reload()` after logout.

- `components/auth/*` — simple forms that call `authService.login()` and `authService.register()` and then call the parent `onSuccess()` callback to update the UI.

## Observations & potential issues
1. Mixed API usage: both `apiService` and ad-hoc `fetch` are used. This can cause inconsistent token handling or duplicated retry logic.
2. Token parsing assumptions: `AuthService.login()` expects `json.data.user` and `json.data.tokens`. Ensure backend responses match that shape; otherwise `login()` will throw.
3. `apiService.makeRequest` references `authService.getRefreshToken` and `authService.setTokens` as optional calls (`&&` checks). These exist, but be mindful when refactoring.
4. Client/server boundaries: many components are client-only. The `app/` router supports server components but the app is mostly client-driven.

## How pages work (high-level flow)
1. App loads `app/layout.tsx` which wraps children in `QueryProvider`.
2. `app/page.tsx` checks `authService.isAuthenticated()` and shows `LoginForm`/`RegisterForm` if not authenticated.
3. After login, `authService.setTokens()` and `authService.setCurrentUser()` store tokens and user in `localStorage` and memory; parent `HomePage` flips `isAuthenticated` which shows the app.
4. Dashboard and other pages call `apiService` or direct `fetch` to load data. React Query caches results and components render charts/tables.

## How to run locally (recommended)
1. Install dependencies (pnpm preferred since `pnpm-lock.yaml` exists):

```bash
pnpm install
pnpm dev
```

Or with npm/yarn:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Quick next steps & recommended improvements
1. Consolidate API usage: migrate all ad-hoc `fetch` calls to `apiService` (single place for token handling & retries).
2. Standardize token access by always using `authService.getAccessToken()` instead of `localStorage.getItem(...)`.
3. Add TypeScript typings for API responses and surface them in `lib/api.ts` to improve developer ergonomics.
4. Add a small integration test for login -> fetch protected dashboard data (can be a jest/playwright test).
5. Audit `lib/permissions` and ensure role checks are consistently applied across pages.

## Files referenced while producing this summary
- `app/layout.tsx`, `app/page.tsx`
- `app/dashboard/*/page.tsx`
- `components/QueryProvider.tsx`, `components/auth/*`, `components/dashboard/dashboard-overview.tsx`, `components/layout/mobile-nav.tsx`, `components/profile/user-profile.tsx`
- `lib/auth.ts`, `lib/api.ts`, `lib/constants.ts`

---

If you want, I can now:
- expand the per-page section into individual detailed pages (one file per page with data dependencies and call graph), or
- start consolidating API calls into `apiService` and convert remaining `fetch` usages.

Tell me which of these you'd like next and I'll continue.
