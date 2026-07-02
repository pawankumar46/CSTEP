# CSTEP — Event Management Platform

CSTEP is a **Next.js** web application for conference and event operations: delegate registration, lobby management, travel/medical/translation/accommodation assistance, live streaming, analytics, and admin dashboards. The frontend talks to a **Django REST API** backend.

---

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [User roles & routes](#user-roles--routes)
- [API integration](#api-integration)
  - [How requests are made](#how-requests-are-made)
  - [Django backend endpoints](#django-backend-endpoints)
  - [Next.js API routes (proxies)](#nextjs-api-routes-proxies)
  - [Status value mapping](#status-value-mapping)
- [Key workflows](#key-workflows)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Changelog](#changelog)

---

## Overview

| Area | Description |
|------|-------------|
| **Public site** | Landing page, event info, sign up / login, event registration |
| **Live streaming** | `/streaming` — video player with optional side banners; Google Drive or HLS sources |
| **Profile** | Delegates request travel, medical, translation, and accommodation support |
| **Dashboard** | Role-based admin tools for lobby, assistance requests (accept / hold / reject), events, users, analytics |
| **Video management** | Broadcast session setup and stream URL management (event administrators) |

The app uses **Zustand** for client state, **React Hook Form + Zod** for forms, **TanStack Table** for data grids, and **Axios** (`apiClient`) for authenticated backend calls.

---

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, Radix UI primitives
- **State:** Zustand
- **Forms / validation:** react-hook-form, Zod
- **HTTP:** Axios with JWT interceptors and token refresh
- **Streaming:** hls.js, Google Drive embed / proxied video
- **Export:** jsPDF, xlsx

---

## Getting started

### Prerequisites

- Node.js 20+
- npm
- Running Django API (see `NEXT_PUBLIC_API_URL`)

### Install & run

```bash
npm install
cp .env.example .env.local   # then edit values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

### Clear Next.js cache (if routes break in dev)

```bash
npm run clean
npm run dev
```

---

## Environment variables

Create `.env.local` from `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Django API base URL (e.g. `*******`) |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public frontend URL for share links and redirects |
| `NEXT_PUBLIC_LIVE_STREAM_URL` | Optional | Live stream source (Google Drive preview, `.mp4`, or `.m3u8`) |
| `NEXT_PUBLIC_LIVE_STREAM_FILE_ID` | Optional | Google Drive file ID fallback |
| `NEXT_PUBLIC_STREAM_LEFT_BANNER_URL` | Optional | Left banner image on streaming page |
| `NEXT_PUBLIC_STREAM_RIGHT_BANNER_URL` | Optional | Right banner image on streaming page |
| `NEXT_PUBLIC_BRAND_LOGO_DARK_SRC` | Optional | Dark theme logo path |

`next.config.ts` forwards these into the client bundle at build time. After changing any `NEXT_PUBLIC_*` variable in production, **redeploy** so the build picks them up.

---

## Project structure

```
c-step/
├── public/                    # Static assets (logos, banner images)
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── (auth)/            # login, signup, otp, forgot-password
│   │   ├── api/               # Server-side proxy routes
│   │   │   ├── broadcast-sessions/
│   │   │   └── stream/        # Google Drive video proxy
│   │   ├── dashboard/         # Admin dashboard pages
│   │   ├── event-register/    # Event registration flow
│   │   ├── profile/           # Delegate profile & support requests
│   │   ├── register/          # Legacy/alternate registration
│   │   ├── streaming/         # Live stream viewer
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing / home
│   ├── components/
│   │   ├── auth/              # Auth guards
│   │   ├── dashboard/         # Admin dialogs, event cards, lobby UI
│   │   ├── forms/             # Multi-step form shell
│   │   ├── layout/            # Navbar, sidebar, dashboard shell
│   │   ├── profile/           # Profile support forms
│   │   ├── providers/         # Auth, theme providers
│   │   ├── shared/            # DataTable, ExportMenu, guards, etc.
│   │   ├── streaming/         # VideoPlayer, StreamAccessGuard
│   │   └── ui/                # shadcn-style UI primitives
│   ├── features/
│   │   ├── dashboard/         # Role dashboards + Zod schemas (admin-*)
│   │   ├── profile/           # Profile Zod schemas
│   │   └── registration/      # Registration Zod schemas
│   ├── hooks/                 # useRoleGuard, useEventRegistration, etc.
│   ├── lib/                   # Utilities, mappers, env, API client
│   │   ├── api-client.ts      # Axios instance + JWT interceptors
│   │   ├── auth-mappers.ts    # Auth request/response mapping
│   │   ├── registration-mappers.ts
│   │   ├── event-support-mappers.ts
│   │   ├── event-mappers.ts
│   │   ├── broadcast-mappers.ts
│   │   ├── stream-utils.ts    # Stream URL parsing (Drive, HLS, mp4)
│   │   ├── date-input.ts      # Date input min values & past-date validation
│   │   └── env.ts             # Public env readers
│   ├── mock/                  # Fallback mock data (dev / API errors)
│   ├── services/              # API service layer (calls Django or proxies)
│   ├── store/                 # Zustand stores
│   └── types/                 # Shared TypeScript types
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Architecture

### Data flow

```
Page / Component
    → Zustand store (optional)
        → service/*.ts
            → apiClient (Axios) → Django REST API
            → fetch("/api/...")  → Next.js route → Django / external
```

- **Pages** (`src/app/`) are route entry points; most dashboard logic lives in page components or `features/dashboard/`.
- **Services** (`src/services/`) encapsulate HTTP calls and error handling. UI should not call `apiClient` directly except in rare cases.
- **Mappers** (`src/lib/*-mappers.ts`) convert between Django snake_case / enum values and app-friendly types.
- **Stores** (`src/store/`) hold UI state, cached lists, loading flags, and orchestrate service calls.

### Zustand stores

| Store | Purpose |
|-------|---------|
| `useAuthStore` | User session, JWT tokens, login/logout |
| `useEventStore` | Events list, CRUD for admins |
| `useRegistrationStore` | User registration state |
| `useLobbyStore` | Lobby registrations + all assistance types (travel, medical, translation, accommodation) |
| `useEventSupportStore` | Profile event-support form state |
| `useUserStore` | User management (super admin) |
| `useAnalyticsStore` | Dashboard analytics |
| `useFeedbackStore` | Feedback (mock-backed) |
| `useRecordingStore` | Recordings (mock-backed) |
| `useHomeDataStore` | Home page event data |

---

## User roles & routes

| Role | Access |
|------|--------|
| `base_user` | Register, profile, streaming (when registered & live) |
| `moderator` | Dashboard lobby + assistance management (accept / hold / reject) |
| `event_administrator` | Above + events, video management, analytics |
| `super_administrator` | Above + user management |

### Main routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login`, `/signup`, `/otp` | Authentication |
| `/event-register` | Multi-step event registration |
| `/profile` | Delegate profile & assistance requests |
| `/streaming` | Live stream (guarded by registration + event phase) |
| `/dashboard` | Role-based dashboard home |
| `/dashboard/lobby` | Manage registrations |
| `/dashboard/travel` | Manage travel assistance |
| `/dashboard/medical` | Manage medical assistance |
| `/dashboard/translation` | Manage translation assistance |
| `/dashboard/accommodation` | Manage accommodation assistance |
| `/dashboard/events` | Event list |
| `/dashboard/video-management` | Broadcast sessions |
| `/dashboard/users` | User admin (super admin) |
| `/dashboard/analytics` | Analytics |
| `/dashboard/feedback` | Feedback |
| `/dashboard/recordings` | Recordings |

Route guards: `RouteGuard`, `StreamAccessGuard`, `EventRegisterGuard` in `src/components/`.

---

## API integration

### How requests are made

**1. Django API (primary)** — `src/lib/api-client.ts`

```ts
import { apiClient } from "@/lib/api-client";

// GET with auth header (Bearer JWT) attached automatically
const { data } = await apiClient.get("/events/upcoming/");

// POST
await apiClient.post("/registrations/registration/", payload);
```

- Base URL: `NEXT_PUBLIC_API_URL` via `getApiBaseUrl()` in `src/lib/env.ts`
- **Authorization:** `Bearer <access_token>` from `auth-session`
- **Token refresh:** On 401/403, client retries once via `POST /auth/token/refresh/`
- **Timeout:** 30 seconds

**2. Next.js API routes (proxies)** — used where server-side access or CORS is needed:

| Client call | Next route | Purpose |
|-------------|------------|---------|
| `fetch("/api/broadcast-sessions")` | `app/api/broadcast-sessions/route.ts` | List/create broadcast sessions |
| `fetch("/api/broadcast-sessions/:id/url?target=...")` | `app/api/broadcast-sessions/[id]/url/route.ts` | Resolve HLS/RTMP URLs |
| `GET /api/stream/video?fileId=...` | `app/api/stream/video/route.ts` | Proxy Google Drive video for `<video>` tag |
| `GET /api/stream/resolve` | `app/api/stream/resolve/route.ts` | Resolve stream metadata |

---

### Django backend endpoints

All paths are relative to `NEXT_PUBLIC_API_URL`. Services live in `src/services/`.

#### Authentication — `auth.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/sign_up/` | User registration |
| `POST` | `/auth/login/` | Login → access + refresh tokens |
| `POST` | `/auth/verify-otp/` | OTP verification |
| `POST` | `/auth/forgot_password/` | Password reset request |
| `POST` | `/auth/logout/` | Logout (refresh token in body) |
| `POST` | `/auth/token/refresh/` | Refresh access token |
| `GET` | `/auth/me/` | Current user profile |
| `GET` | `/auth/users/` | Paginated user list (admin) |
| `DELETE` | `/auth/users/:id/` | Delete user |

#### Events — `event.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events/upcoming/` | Upcoming events with registration flag |
| `GET` | `/events/?type=upcoming\|live\|past` | Filtered event list |
| `GET` | `/events/` | All events |
| `GET` | `/events/:id/` | Single event |
| `POST` | `/events/` | Create event |
| `PATCH` | `/events/:id/` | Update event |
| `DELETE` | `/events/:id/` | Delete event |

#### Registrations — `registration.service.ts`, `lobby.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/registrations/` | User's registrations |
| `POST` | `/registrations/registration/` | Create registration (user / lobby / admin) |
| `PUT` | `/registrations/registration/:id/` | Update registration |
| `PATCH` | `/registrations/registration/bulk-status/` | Bulk status: `{ ids, status }` |
| `PATCH` | `/registrations/:id/` | Update registration preferences |

**Delegate support requests (profile):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/registrations/request-travel/` | Request travel support |
| `POST` | `/registrations/request-medical/` | Request medical support |
| `POST` | `/registrations/request-translation/` | Request translation support |
| `POST` | `/registrations/accommodation-assistance/` | Request accommodation |

#### Assistance management (lobby dashboard) — `lobby.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/registrations/registration/?event=&page=` | Lobby registrations (paginated) |
| `GET` | `/registrations/travel-assistance/?event=&page=` | Travel rows |
| `GET` | `/registrations/medical-assistance/?event=&page=` | Medical rows |
| `GET` | `/registrations/translation-assistance/?event=&page=` | Translation rows |
| `GET` | `/registrations/accommodation-assistance/?event=&page=` | Accommodation rows |
| `POST` | `/registrations/travel-assistance/` | Admin add travel |
| `POST` | `/registrations/medical-assistance/` | Admin add medical |
| `POST` | `/registrations/translation-assistance/` | Admin add translation |
| `POST` | `/registrations/accommodation-assistance/` | Admin add accommodation |
| `PUT` | `/registrations/travel-assistance/:id/` | Edit travel |
| `PUT` | `/registrations/medical-assistance/:id/` | Edit medical |
| `PUT` | `/registrations/translation-assistance/:id/` | Edit translation |
| `PUT` | `/registrations/accommodation-assistance/:id/` | Edit accommodation |
| `PATCH` | `/registrations/travel-assistance/bulk-status/` | Bulk accept / hold / reject |
| `PATCH` | `/registrations/medical-assistance/bulk-status/` | Bulk accept / hold / reject |
| `PATCH` | `/registrations/translation-assistance/bulk-status/` | Bulk accept / hold / reject |
| `PATCH` | `/registrations/accommodation-assistance/bulk-status/` | Bulk accept / hold / reject |

#### Analytics — `analytics.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/user-summary/` | Dashboard analytics summary |

#### Broadcast (via Next proxy) — `broadcast.service.ts`

Client calls Next.js routes; server forwards to Django with the user's `Authorization` header.

| Client | Description |
|--------|-------------|
| `GET /api/broadcast-sessions` | List broadcast sessions |
| `POST /api/broadcast-sessions` | Create session |
| `GET /api/broadcast-sessions/:id/url?target=playback.hls` | Get stream URL (HLS, RTMP, etc.) |

---

### Status value mapping

App UI statuses map to Django enums in `src/lib/registration-mappers.ts`:

| App (`RegistrationStatus` / assistance) | API |
|----------------------------------------|-----|
| `pending` | `PENDING` |
| `accepted` | `ACCEPTED` |
| `rejected` | `REJECTED` |
| `on_hold` | `HELD` |

Lobby and all assistance dashboards support **Accept**, **Hold**, and **Reject** (single row and bulk).

---

## Key workflows

### 1. User registration

1. Sign up → `POST /auth/sign_up/`
2. Login → `POST /auth/login/`
3. Event register → `POST /registrations/registration/`
4. Optional profile support → `POST /registrations/request-*`

### 2. Lobby: add user (two-step wizard)

1. **Signup** → `POST /auth/sign_up/` with `role: BASE_USER` (`auth-mappers.toLobbySignupPayload`)
2. **Register for event** → `POST /registrations/registration/` with `user` id (`registration-mappers.toLobbyRegistrationApiPayload`)

Implemented in `AddLobbyUsersDialog`, `lobby.service.ts`, `useLobbyStore`.

### 3. Live streaming

1. Stream URL from env (`NEXT_PUBLIC_LIVE_STREAM_URL`) or active broadcast HLS via `resolveLivePlaybackUrl()`
2. `VideoPlayer` tries proxied Drive video (`/api/stream/video`) first, falls back to iframe embed
3. `StreamAccessGuard` enforces auth + registration + live event phase

### 4. Assistance moderation

Moderators select rows in DataTable → **Accept** / **Hold** / **Reject** → `PATCH .../bulk-status/` with mapped API status.

**Editing assistance requests** (travel, medical, translation, accommodation): date fields in the edit dialogs cannot be set to a past date. The date picker uses `min={today}` via `getTodayDateInputMin()` in `src/lib/date-input.ts`, and edit Zod schemas (`*-edit` in `features/dashboard/admin-*.schema.ts`) reject past dates on submit. Accommodation **to date** must also be on or after **from date**.

Dashboard assistance schemas use shared field objects plus a `superRefine` callback — do not chain `.omit()` or `.merge()` on schemas that already have refinements (see `admin-travel.schema.ts` and `admin-accommodation.schema.ts`).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run clean` | Delete `.next` cache |

---

## Deployment

Typical deployment target: **Vercel** (frontend) + **Django** (API).

1. Set all `NEXT_PUBLIC_*` variables in the hosting dashboard.
2. Redeploy after env changes.
3. Ensure Django CORS allows your frontend origin.
4. For streaming, confirm Google Drive file is shared as **“Anyone with the link”** if using Drive embed.

---

## Related files for new contributors

| Task | Start here |
|------|------------|
| New API endpoint | `src/services/`, then mapper in `src/lib/` |
| New dashboard page | `src/app/dashboard/`, schema in `features/dashboard/` |
| Auth changes | `auth.service.ts`, `auth-mappers.ts`, `useAuthStore.ts` |
| Registration payload | `registration-mappers.ts`, `registration.service.ts` |
| Assistance forms | `event-support-mappers.ts`, `lobby.service.ts`, `date-input.ts`, `features/dashboard/admin-*.schema.ts` |
| Streaming | `VideoPlayer.tsx`, `stream-utils.ts`, `streaming/page.tsx` |

---

## Changelog

### 2026-07-02

- **Accommodation dashboard:** Fixed page crash from Zod `.omit()` on a refined schema; `admin-accommodation.schema.ts` now uses shared `accommodationDetailFields` + `refineAccommodationDates()` (same pattern as travel).

### 2026-06-17

- **Assistance edit dialogs:** Past dates are blocked when editing travel, medical, translation, and accommodation requests in the manage dashboards (HTML `min` on date inputs + Zod validation on edit schemas).
- **Assistance moderation:** Accept / Hold / Reject actions (single and bulk) on lobby and all four assistance dashboards.
- **`src/lib/date-input.ts`:** Shared helpers for today’s minimum selectable date and past-date refinement.

---

## License

Private project — CSTEP internal use.
