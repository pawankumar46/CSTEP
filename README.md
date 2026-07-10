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
│   │   │   ├── analytics/     # Overview + attendance-mode analytics
│   │   │   ├── accommodation/
│   │   │   ├── events/
│   │   │   ├── feedback/
│   │   │   ├── lobby/
│   │   │   ├── medical/
│   │   │   ├── translation/
│   │   │   ├── travel/
│   │   │   ├── users/
│   │   │   ├── video-management/
│   │   │   └── ...
│   │   ├── event-register/    # Event registration flow
│   │   ├── profile/           # Delegate profile & support requests
│   │   ├── register/          # Legacy/alternate registration
│   │   ├── streaming/         # Live stream viewer
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing / home
│   ├── components/
│   │   ├── auth/              # Auth guards
│   │   ├── dashboard/         # Admin dialogs, event cards, lobby & analytics UI
│   │   │   ├── AttendanceModeAnalytics.tsx
│   │   │   ├── EventSelectCard.tsx
│   │   │   └── *AssistanceDialog.tsx
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
│   │   ├── analytics-mappers.ts
│   │   ├── assistance-status.ts
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
| `useHomeDataStore` | Home page upcoming events (registration flag + per-event summary) |

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
| `/feedback` | Multi-day session feedback (all authenticated users) |
| `/streaming` | Live stream (guarded by registration + event phase) |
| `/dashboard` | Role-based dashboard home |
| `/dashboard/lobby` | Manage registrations |
| `/dashboard/sessions` | Event day session scheduler (add / edit / delete / drag) |
| `/dashboard/travel` | Manage travel assistance |
| `/dashboard/medical` | Manage medical assistance |
| `/dashboard/translation` | Manage translation assistance |
| `/dashboard/accommodation` | Manage accommodation assistance |
| `/dashboard/events` | Event list |
| `/dashboard/video-management` | Broadcast sessions |
| `/dashboard/users` | User admin (super admin) |
| `/dashboard/analytics` | Analytics overview |
| `/dashboard/analytics/attendance-mode` | Attendance mode analytics (event + virtual/physical filters, registration list) |
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
const { data } = await apiClient.get("/events/event/upcoming/");

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
| `POST` | `/auth/sign_up/` | User registration (`role`, nested `address`, profile fields) |
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
| `GET` | `/events/event/upcoming/` | Paginated upcoming events (`results[]` with `is_registered` + `summary`) |
| `GET` | `/events/event/?type=upcoming\|live\|past` | Filtered event list |
| `GET` | `/events/event/` | All events |
| `GET` | `/events/event/:id/` | Single event |
| `POST` | `/events/event/` | Create event |
| `PATCH` | `/events/event/:id/` | Update event |
| `DELETE` | `/events/event/:id/` | Delete event |

#### Registrations — `registration.service.ts`, `lobby.service.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/registrations/` | User's registrations |
| `POST` | `/registrations/registration/` | Create registration (user / lobby / admin); `participation_dates` is `string[]`; optional `schedule_items` is `number[]` for multi-session events |
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
| `GET` | `/registrations/registration/?registration__event=&attendance_mode=&page=` | Paginated registrations (lobby, attendance-mode analytics) |
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
| `GET` | `/analytics/dashboard/` | Platform dashboard analytics (role dashboards) |
| `GET` | `/analytics/events/:id/` | Event-scoped analytics (overview page) |

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

1. **Signup** → `POST /auth/sign_up/` with `role: BASE_USER` and nested `address` (`auth-mappers.toLobbySignupPayload` / `toSignupPayload`)
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
| Analytics | `analytics.service.ts`, `analytics-mappers.ts`, `app/dashboard/analytics/`, `AttendanceModeAnalytics.tsx` |
| Streaming | `VideoPlayer.tsx`, `stream-utils.ts`, `streaming/page.tsx` |

---

## Changelog

### 2026-07-10

- **Home hero image:** Landing page hero now uses `public/imge2.jpg` (`/imge2.jpg`) — square aspect with `object-contain` and taller sizing (`28rem` max on desktop) so the CSTEP logo and Indian skyline stay fully visible.
- **Home hero image visibility:** Hero image now uses `object-contain` with no dimming overlays so the CSTEP logo and skyline vectors remain fully visible in light and dark mode.
- **Home hero image card:** Hero image card uses a **2:3 portrait aspect** (matching `Image1.jpg`) at full content height so the image fills the card as one piece with `object-cover` while keeping the CSTEP logo and skyline fully visible; card aligns to the text column on desktop.
- **Home hero typography:** Event title splits before `CONFERENCE` with `leading-none` so multi-line headings have no extra gap; hero text uses tighter spacing to align with the image card.
- **Home hero layout:** Image and event copy centered together as one block (`max-w-6xl mx-auto`); poster beside text with balanced max-width on the copy column.
- **Assistance services disabled:** Travel, medical, translation, and accommodation support commented out in profile, dashboard nav, analytics overview, and post-registration flow (redirects home instead of profile support).
- **Analytics overview:** Removed Food Preferences distribution table from event analytics overview.
- **Attendance mode analytics:** Removed Food Preferences chart/column; added **Sessions** count from `registered_sessions_count` — clicking opens a read-only session details dialog (no approve/reject actions).

### 2026-07-07

- **Home — Contact scroll:** Navbar **Contact** (`#contact`) now scrolls to the “Got any queries?” contact card in the About section (with sticky-header offset); footer no longer uses the `contact` id.
- **Moderator dashboard — Participation Trend:** X-axis labels changed from Week 1–6 to 15-minute time slots starting at **9 AM** (9 AM, 9:15, 9:30, …).
- **Moderator dashboard layout:** Removed Food Requirement table and trend charts from the main dashboard; dashboard now shows **Upcoming**, **Current** (live), and **Past** event sections.
- **Analytics overview:** Registration Trend and Participation Trend charts moved to `/dashboard/analytics`; trends appear **after selecting an event** (with period/mode filters).
- **Lobby — Manage Sessions timeline:** Timeline window is now **9 AM–6 PM** (was 24-hour); removed empty-slot **Open for networking** blocks from the timeline.
- **Attendance mode analytics:** Physical/Virtual registrations table at `/dashboard/analytics/attendance-mode` now supports **Excel/PDF export** (all matching registrations, not just the current page).
- **Live streaming view modes:** `/streaming` player controls offer **Default**, **Theater**, and **Full screen** — theater widens the player, increases height (16:9 scale), and moves live chat below the video (YouTube-style).
- **Live streaming theater sizing:** Tuned theater view dimensions to be slightly smaller for better balance on laptop screens while staying larger than default view.
- **Live streaming theater layout:** Theater mode now uses a balanced grid — wide player on top; event info, current speaker, agenda, and moderator controls on the left; live chat fills the right column with matched height and no wasted space.
- **Hydration warning hardening:** Added `suppressHydrationWarning` to shared form controls (`Input`, `Textarea`, `Button`, `Checkbox`) to avoid noisy extension-injected attribute mismatches (for example `fdprocessedid`) during hydration.
- **Event registration — Step 1:** Event dropdown now loads from `GET /events/event/dropdown/` (`id`, `title`, `scheduled_start`, `scheduled_end`, `schedule_type`) instead of the upcoming events list.
- **Event registration — Step 3:** Participation dates now load from `GET /events/event-days/?event=<id>`; removed **Time of Participation** from the form. For `MULTI_SESSION`, selecting a day fetches `GET /events/schedule-items/dropdown/?day=<dayId>` and shows selectable session cards (multi-select: title, start/end, speaker) before attendance mode; selected ids are sent as `session_ids` on registration submit. For `WHOLE_DAY`, users proceed with only day + attendance mode.
- **Registration session dropdown:** Event registration, Manage Lobby Add Users, and Edit registration now load session options from `GET /events/schedule-items/dropdown/?day=<id>` (Manage Sessions timeline still uses `GET /events/schedule-items/?day=<id>`).
- **Event registration — session cards:** Replaced nested `<button>` + `Checkbox` with a single `role="button"` card and decorative check indicator to fix invalid DOM nesting / hydration warnings.
- **Event registration — API payload:** Registration submit now sends `user`, `event`, `attendance_mode`, and `food_preference`. **MULTI_SESSION** events send `session_ids` (selected schedule items). **WHOLE_DAY** events send `day_ids` (multi-select event days). WHOLE_DAY step 3 UI now supports selecting multiple days.
- **Manage Lobby — registration list:** `GET /registrations/registration/` now filters with `event=<id>` (was `registration__event`). Table/export map the new response fields: `registered_sessions_count`, `attendance_mode`, `food_preference` (replacing participation date/time columns).
- **Manage Lobby — session details:** Moderators/event admins can click a non-zero Sessions count to open a modal that loads `GET /registrations/registration/{id}/` and lists `session_registrations` (title, date, time, track, status).
- **Manage Lobby — session approve/reject:** Sessions in the modal show **Approve** / **Reject** so status can be changed again after a decision (Approve hidden when already accepted; Reject hidden when already rejected). Posts to `/registrations/registration/{registration_id}/sessions/{session_reg_id}/approve/` and `.../reject/`, then refreshes the list.
- **Manage Lobby — session bulk status:** Select multiple sessions in the modal and bulk **Approve** / **Reject** via `PATCH /registrations/sessions/bulk-status/` with `{ ids, status: "APPROVED" | "REJECTED" }`.
- **Manage Lobby — Add Users:** Step 2 registration now matches public event registration — **WHOLE_DAY** multi-selects `day_ids`; **MULTI_SESSION** picks a day then multi-selects sessions as `session_ids`. Removed participation time / legacy `participation_dates` from this flow.
- **Manage Lobby — Edit registration:** Edit dialog now uses the same **WHOLE_DAY** (`day_ids`) / **MULTI_SESSION** (`session_ids`) flow; loads current selections from registration detail and removes participation time / legacy date radios.
- **Manage Lobby — Edit error popup:** Failed registration updates (e.g. 400 “already registered”) show the API error in a popup with an **OK** button instead of an uncaught promise.
- **Manage Lobby — transient errors:** Page-level red error banner auto-dismisses after 5 seconds.
- **Address fields:** All address inputs are required (with trim validation) except **Address line 2 (optional)** — applies to signup and Manage Lobby Add Users.
- **Event registration — API loop fix:** Stopped retrying lobby `GET /registrations/registration/` on **403** (permission denied) via token refresh, which was causing repeated `registration` + `refresh` calls on `/event-register`. Lobby data is now refetched after token refresh only for **staff** on the matching **dashboard** route (registrations only on `/dashboard/lobby`). Session fetch on Step 3 no longer clears selections on every effect run when the day is unchanged.
- **Event registration — session cards:** Removed the left fade overlay on the session carousel and added inner padding so the first card’s border is no longer clipped.
- **Auth token refresh:** `POST /auth/token/refresh/` now runs only on the **25-minute interval** in `AuthProvider`. Removed tab-focus refresh, 401 interceptor refresh, and hydrate-time refresh; a shared throttle skips duplicate refresh calls within the interval.
- **Event registration — food preference removed:** Dropped the Food step from `/event-register` (now 4 steps: Event → Personal Info → Participation → Review). Public registration submit no longer sends `food_preference` in the API payload.
- **Manage Lobby / admin registration — food preference removed:** Add Users and Edit registration no longer collect or send `food_preference`; lobby table and export no longer include a Food column.
- **Manage Sessions — start time picker:** Add/Edit session modal now uses **12-hour AM/PM** selects (hour, minute, period) instead of the browser 24-hour time input.
- **Manage Sessions — time dropdown clipping:** Hour/minute/period dropdowns in the Add/Edit session modal now open upward to avoid being cut off near the modal bottom.
- **Manage Sessions — valid hour options:** Start-time hour options now match the timeline window by period (**AM:** 9,10,11; **PM:** 12,1,2,3,4,5), so users can always pick valid times like 9 AM without hidden scroll.

### 2026-07-04

- **Dashboard stat cards:** Compact metric cards — reduced padding, `text-xs` titles, `text-xl` values; equal-height grids with `auto-rows-fr`.
- **Moderator dashboard:** Food Requirement shown as a date-filtered table with PDF/Excel export (single day or all dates); registration and participation charts retain period/mode filters.
- **Analytics overview:** Distribution insights shown as tables with PDF/Excel export per section (registration, attendance, food, participation dates, travel, translation, streaming details).
- **Session feedback:** Multi-day feedback on `/streaming` — Exit opens a dialog for all users: 4 sessions per day on **19, 20, and 21 Aug**, daily Overall per day, and **ICAS / Overall Event**; submit or skip navigates home. Moderator view at `/dashboard/feedback` shows summary with respondent names/ratings, filterable comment table (with **Clear filters**), and export.
- **Lobby — Manage Sessions:** Event-first day scheduler at `/dashboard/sessions` — up to 3 day tabs, 24-hour timeline (12 AM–11 PM) with networking gaps in empty slots (add / edit / delete / drag); in-memory, no API.
- **Lobby — Manage Sessions days source:** After selecting an event, day tabs now load from `GET /events/event-days/?event=<id>` (uses backend `results[].date/day_number/label`) so scheduler dates match backend event-day records.
- **Lobby — Add Session API:** Add Session now includes **Session Type** (`SESSION`, `BREAKFAST_BREAK`, `TEA_BREAK`, `LUNCH_BREAK`, `DINNER_BREAK`, `NETWORKING_BREAK`, `CUSTOM_BREAK`) and posts to `POST /events/schedule-items/` with backend payload keys (`day`, `item_type`, `title`, `description`, `start_time`, `end_time`) using the selected event-day id.
- **Lobby — Add Session reliability:** Add-to-timeline now validates selected `day` id before posting and shows a clear error if day id cannot be resolved, avoiding silent API skips.
- **Lobby — Post-add refresh:** After `POST /events/schedule-items/`, scheduler now calls `GET /events/schedule-items/?day=<selectedDayId>` and refreshes that day from backend response.
- **Lobby — Day tab default:** On reload/event selection, scheduler now re-initializes with the first backend day tab selected (e.g. 19 Aug).
- **Lobby — Reload day fetch:** On reload and when switching day tabs, scheduler now calls `GET /events/schedule-items/?day=<selectedDayId>` automatically to hydrate timeline from backend.
- **Lobby — Timeline interactions:** Removed drag-to-move on timeline blocks; sessions are now edited via click (Edit modal) and deleted via block action.
- **Lobby — Timeline spacing:** Increased timeline width scale (more pixels per hour) for clearer hour slots and easier visual planning.
- **Lobby — Timeline spacing:** Timeline scale is now `160px/hour` for wider slot visibility.
- **Events permissions:** Moderators can create, edit, and delete events in `/dashboard/events` (same as event admins/super admins).
- **Lobby — Delete session API:** Deleting a session now calls `DELETE /events/schedule-items/{schedule_item_id}/` and re-fetches `GET /events/schedule-items/?day=<selectedDayId>` to keep timeline in sync.
- **Lobby — Edit session API:** Editing a session now calls `PATCH /events/schedule-items/{schedule_item_id}/` (`item_type`, `title`, `description`, `start_time`, `end_time`) and refreshes selected day data via `GET /events/schedule-items/?day=<selectedDayId>`.
- **Lobby — Delete loading state:** While delete API runs, delete actions are disabled and show a spinner (`Deleting...` in modal / spinner on block delete icon).
- **Watch Live tooltip:** Disabled Watch Live now shows clearer hover guidance for upcoming events — “Live feed starts from 19th August (…)”.
- **Watch Live hover fix:** Tooltip now appears reliably for disabled Watch Live by wrapping the disabled button in a hoverable container.
- **Events form:** Create/Edit Event now includes **Event Type** (`Whole Day` / `Multi Session`) and sends it to backend as `schedule_type` (`WHOLE_DAY` / `MULTI_SESSION`).

### 2026-07-03

- **Home page:** ICAS 2026 content on hero and About section (theme, venue, highlights, contact) from [CSTEP ICAS 2026](https://cstep.in/events/india-clean-air-summit-icas-2026/).
- **Home hero countdown:** `EventCountdown` sits inline with Register / Watch Live; counts down to ICAS start (`19 Aug 2026, 5:30 AM IST`).
- **Analytics overview:** Event-scoped analytics at `/dashboard/analytics` — distribution charts replaced with exportable tables (registration status, attendance mode, participation time/dates, food, travel, translation); summary stat cards retained.
- **Dashboard analytics:** Replaced `/analytics/user-summary/` with `GET /analytics/dashboard/`; role dashboards use `dashboard` payload (events/registrations/users by status, top events, viewer stats).
- **Home page:** Removed `/analytics/user-summary/` call; hero registration count now comes from each event's `summary` on `/events/event/upcoming/`.
- **Events API:** `mapApiUpcomingEvent` maps paginated `results[]` with `is_registered` and nested `summary` (`total_registered_users`, `participants_*`).
- **Registration API:** `participation_dates` POST payload is now an array of ISO date strings (`["2025-03-01", "2025-03-02"]`) instead of `{ date }` objects.
- **Analytics — Attendance Mode:** Loads `GET /registrations/registration/` with `registration__event` and `attendance_mode` (`VIRTUAL` / `PHYSICAL`); shows summary stats, status/food charts, and paginated registration table.

### 2026-07-02

- **Accommodation dashboard:** Fixed page crash from Zod `.omit()` on a refined schema; `admin-accommodation.schema.ts` now uses shared `accommodationDetailFields` + `refineAccommodationDates()` (same pattern as travel).
- **Manage assistance tables:** Removed horizontal scrolling on travel, translation, medical, and accommodation dashboards via compact icon actions, responsive columns, and fixed table layout.
- **Video management:** Refreshed broadcast UI with clearer sections, grouped ingest/playback copy actions, improved form layout, and consistent empty/error states (functionality unchanged).

### 2026-06-17

- **Assistance edit dialogs:** Past dates are blocked when editing travel, medical, translation, and accommodation requests in the manage dashboards (HTML `min` on date inputs + Zod validation on edit schemas).
- **Assistance moderation:** Accept / Hold / Reject actions (single and bulk) on lobby and all four assistance dashboards.
- **`src/lib/date-input.ts`:** Shared helpers for today’s minimum selectable date and past-date refinement.

---

## License

Private project — CSTEP internal use.
