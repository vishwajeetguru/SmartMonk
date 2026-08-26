# SmartMonk

A comprehensive transport business management mobile application built with Expo and React Native, backed by the `smartmonk-backend` REST API.

## Features

### Authentication & Onboarding
- **Auth (API)** — `POST /auth/signup` + `POST /auth/login` with JWT access/refresh tokens stored **encrypted** via `expo-secure-store`
- **Single auth source of truth** — `AuthProvider` context (`hooks/useAuth.ts`) wraps the root layout; splash + root navigator share one auth state (no duplicate redirect race)
- **4-Step Onboarding** — Avatar + Full name + **DOB** (reusable `DatePicker`), Country code + mobile, Business type, Fleet (vehicle count → dynamic `Vehicle 1..N` with live duplicate detection)

### Core Screens (Tabs)
- **Home / Trips / Expense / Reminder / More** bottom navigation, with `Suppliers`, `Pumps`, `Drivers`, `Profile`, `Reports`, `Payments`, `Settings`, `Edit Profile` inside the More sheet
- **Trips** — truck/material/supplier/client/financials (Revenue/Expense/Profit) + status, grouped list (Today/Yesterday), header stats, search + filter
- **Drivers** — photo, blood group (8-chip grid), aadhar, licence, salary, assigned vehicle, status (Active/On Trip/Inactive)
- **Suppliers / Pumps (Fuel stations)** — CRUD with search + filter and stats
- **Profile** — avatar, business type, fleet vehicles, GST, Sign Out

### Share & Copy
- Every card's `⋮` menu supports **Share on WhatsApp** and **Copy details** (with a "Copied to clipboard" toast) for Trips, Drivers, Suppliers and Pumps

## Tech Stack

- **Framework:** Expo SDK 54
- **Language:** TypeScript (strict)
- **Navigation:** Expo Router (Tabs + Stack)
- **State:** React Context (`AuthProvider`, `ThemeProvider`, `LanguageProvider`)
- **Secure storage:** `expo-secure-store` (tokens, passwords)
- **IDs:** `expo-crypto` / `uuid` (secure, not `Math.random`)
- **Backend:** Node 20 + Express 4 + Prisma 5 + PostgreSQL (`smartmonk-backend`)
- **Animations:** React Native Reanimated
- **Icons:** @expo/vector-icons (Ionicons)
- **Image:** expo-image-picker
- **Clipboard / share:** expo-clipboard + expo-linking

## Reusable Components

- `components/ui/AppButton`, `AppInput`, `PasswordInput`, `AppText`, `AppCard`, `IconButton`, `LoadingIndicator`, `ErrorMessage`
- `components/ui/ConfirmationModal`, `SuccessModal`, `DatePicker`
- `components/ui/ScreenHeader` — title + subtitle + "Add …" action button
- `components/ui/StatCard` + `StatsGrid` — 2×2 stat cards
- `components/ui/SearchFilterBar` — search input + filter button + bottom-sheet filter (shows active filter chip with close icon)
- `components/ui/ActionMenu` — bottom-sheet menu (edit / share / copy / delete)
- `components/layout/ScreenContainer`, `KeyboardAvoidingContainer`, `BottomTabBar`, `MoreSheet`
- `utils/share.ts` — `copyToClipboard` / `shareOnWhatsApp`

## Getting Started

### Prerequisites
- Node.js (v18+), npm, Expo Go (SDK 54), PostgreSQL (for backend)

### Installation

```bash
# 1. Backend
cd smartmonk-backend
npm install
# set DATABASE_URL in .env, then:
npx prisma migrate dev
npm run dev            # -> http://localhost:3000/api/docs

# 2. Mobile
cd smartmonk
npm install --legacy-peer-deps
# set EXPO_PUBLIC_API_URL in .env (copy .env.example):
#   EXPO_PUBLIC_API_URL=https://api.smartmonk.app/api/v1
#   (dev device: http://192.168.1.6:3000/api/v1)
npx expo start --clear
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Backend base URL. **Must be `https` in production** (`http` is only used as a dev-only fallback). |
| `ROUTER9_API_KEY` | OpenCode provider key (set in shell, never commit). |

`.env` and `opencode.json` are gitignored.

## Project Structure

```
smartmonk/
├── app/                        # Expo Router
│   ├── _layout.tsx             # Root: Auth/Theme/Language providers + splash guard
│   ├── index.tsx               # Animated splash (routing driven by _layout only)
│   ├── (auth)/                 # welcome, login, signup
│   ├── (onboarding)/           # profile-setup (4 steps), setup-complete
│   └── (app)/                  # Tabs: home, trips, expense, reminder, more + hidden (suppliers, pumps, drivers, profile, reports, payments, settings, edit-profile)
├── components/
│   ├── ui/                     # reusable App* + ScreenHeader, StatCard, SearchFilterBar, ActionMenu
│   ├── layout/                 # ScreenContainer, BottomTabBar, MoreSheet
│   ├── auth/ onboarding/ illustrations/
├── hooks/                      # useAuth (context), useProfile, useOnboarding
├── services/
│   ├── api/                    # client, config, tokenStorage (SecureStore), auth, profile, trips, suppliers, pumps, drivers
│   └── storage/                # legacy fallback (SecureStore for passwords)
├── theme/ i18n/ constants/ types/ utils/
└── .env.example                # env template (safe to commit)
```

## Security

- Access/refresh tokens and driver/account passwords stored in **`expo-secure-store`** (encrypted at rest), with legacy AsyncStorage migration
- API base URL requires **HTTPS in production**; no internal IP leaked in production logs
- Secure IDs via `expo-crypto.randomUUID` / `uuid` (no `Math.random` collisions)
- Secrets (`opencode.json`, `.env`) are gitignored; keys referenced via env vars

## Key Decisions

- `AuthProvider` + `useAuth()` context is the single source of truth; `app/index.tsx` no longer duplicates routing
- Consistent 16px (`spacing.base`) horizontal layout padding across all screens (no double padding)
- Reusable `SearchFilterBar` (search + filter sheet + active-filter chip), `ScreenHeader`, `StatCard/StatsGrid`, `ActionMenu` shared by Trips, Drivers, Suppliers, Pumps
- WhatsApp share via `https://wa.me/?text=…` and copy via `expo-clipboard`, with a toast confirmation

## License

MIT

## Author

Vishwajeet Guru - [GitHub](https://github.com/vishwajeetguru)
