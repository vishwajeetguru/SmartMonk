# SmartMonk

A comprehensive offline-first transport business management mobile application built with Expo and React Native — now with **online API** via `smartmonk-backend`.

## Features

### Phase 1 (Current)
- **User Authentication** - API `POST /auth/signup` + `POST /auth/login` (`types/auth.ts:10`, `utils/validation.ts:106`, `hooks/useAuth.ts:1` with `services/api/auth.ts:1` + JWT `tokenStorage`), footer `Text` link to prevent clipping, `crypto.getRandomValues` replaced by `generateId()`
- **4-Step Onboarding** (`app/(onboarding)/profile-setup.tsx:1` with reusable `components/ui/DatePicker.tsx:1`)
  - **Step 1 — Personal:** Avatar + Full name + **DOB via reusable DatePicker** (range picker Day/Month/Year, 100y–10y, `YYYY-MM-DD`, `daysInMonth` guard, helper text `We use this...` with `spacing.xl` bottom padding)
  - **Step 2 — Contact:** Country code flags modal + mobile
  - **Step 3 — Business:** Business type cards
  - **Step 4 — Fleet:** Vehicle count → exact chip or numeric → dynamic `Vehicle 1..N` inputs, live duplicate detection, saved nicknames shown when editing profile
- **Welcome** - Monk (`assets/images/monk.png`) + `TruckIllustration` stacked cross-fade, random on focus + 3.5s auto-toggle, dots + tap hint
- **Bottom Navigation** - Floating pill (6 tabs: Home, Suppliers, Pumps, Trips, Drivers, Profile) with spring scale + fade, icons `home`/`cube`/`flame`/`navigate`/`people`/`person-circle`, `edit-profile` hidden (`href:null` + filter), Sign Out moved from Home to **Profile Account** card
- **Suppliers / Pumps / Trips / Drivers** - **API CRUD** (`services/api/suppliers.ts:1`, `pumps.ts:1`, `trips.ts:1`, `drivers.ts:1` via `http://192.168.1.6:3000/api/v1` / `EXPO_PUBLIC_API_URL`), `userId` scoped by JWT, `useFocusEffect` reload, edit/delete via `ConfirmationModal` (now `padding xxl`, `gap base`, `minHeight 52`), `SuccessModal` animation, `KeyboardAvoidingView` + inline dropdowns (no nested `Modal` bug)
  - **Suppliers:** name*, contact* (mobile), **material** (linked to Trips), address
  - **Pumps:** name*, contact*, location*
  - **Trips:** **Truck** single-pill vs dropdown (`GET /api/v1/profile/vehicles` → `profile.vehicles`), **Trip Date** reusable `DatePicker` `inline` (`MM/DD/YYYY`, 5y ago to 5y future), **Material** (from Suppliers’ materials), **Material Price** (numbers-only), **Supplier Name** (from Suppliers), **Client Name**, **Trips Count** `-/+`, **Location**, **Financial Details** card (`Total Value/Profit/Total Expense` ₹), **Payment Status** (`Pending/Paid/Partial`)
  - **Drivers:** fullName*, contact* (mobile), bloodGroup (8-chip grid `A+ A- B+ B- AB+ AB- O+ O-` via inline dropdown), aadhar (12d), licence* (8-20 alphanum), address, salary, assignedVehicle (from `profile.vehicles`), duplicate checks, tap card → Driver Profile modal
- **Profile** - Circular avatar, `useFocusEffect` reload, **fleet vehicle inputs** show saved numbers when count changes, Save `paddingBottom 140` so not hidden behind pill, Account Sign Out card
- **Session & Splash** - `app/_layout.tsx:1` + `app/index.tsx:1` now `useAuth` `isAuthenticated/isProfileComplete` from API (not `AsyncStorage` session), splash 2s animation then route
- **App Icon** - `assets/icons/appIcon.png` (1.8MB) as `expo.icon` + `android.adaptiveIcon`
- **Reusable DatePicker** - `components/ui/DatePicker.tsx:1` (`label/value/onChange/minYear/maxYear/displayFormat/inline`) with Day/Month/Year columns, `inline` for forms inside modals — used in Onboarding DOB and Trips Date
- **Offline → Online** - `services/storage/*` kept as fallback, primary is API; `services/api/client.ts:1` handles `401` refresh, `tokenStorage`

### Upcoming Phases
- Advanced Vehicle Management
- Fuel & Expenses Analytics
- Payment Tracking
- Monthly Reports

## Tech Stack

- **Framework:** Expo SDK 54
- **Language:** TypeScript (strict)
- **Navigation:** Expo Router (Tabs + Stack)
- **Storage:** @react-native-async-storage/async-storage (fallback) + `services/api/*` (primary)
- **Backend:** Node 20 + Express 4 + Prisma 5 + PostgreSQL 15 (`E:\Projects\Mobile Applications\smartmonk-backend`, `prisma/schema.prisma:78` `enum BloodGroup`, `GET /api/v1/profile/vehicles` etc., Swagger `http://localhost:3000/api/docs`)
- **Animations:** React Native Reanimated + react-native-worklets
- **Icons:** @expo/vector-icons (Ionicons)
- **Image:** expo-image-picker
- **Gestures:** react-native-gesture-handler

## Screens

Splash → Welcome (Monk/Truck) → Login / Sign Up (API) → Profile Setup (4 steps, DOB DatePicker) → Setup Complete → Home → Suppliers / Pumps / Trips (DatePicker inline) / Drivers (blood group inline) / Profile (Bottom Tabs) → Edit Profile (hidden)

## Getting Started

### Prerequisites

- Node.js (v18+), npm, Expo Go (SDK 54), PostgreSQL (for backend)

### Installation

```bash
# 1. Backend
cd "E:\Projects\Mobile Applications\smartmonk-backend"
npm install
# set DATABASE_URL in .env, then
npx prisma migrate dev
npm run dev # -> http://localhost:3000/api/docs

# 2. Mobile
cd "E:\Projects\Mobile Applications\smartmonk"
npm install --legacy-peer-deps
# set EXPO_PUBLIC_API_URL in .env (e.g. http://192.168.1.6:3000/api/v1 for device)
npx expo start --clear
```

### Running the App

1. Start backend `npm run dev` (verify `GET /health` ok)
2. Start Expo `npx expo start --clear`, scan QR
3. Signup creates `POST /api/v1/auth/signup` user, login stores JWT, all CRUD hits `smartmonk-backend`

## Project Structure

```
smartmonk/
├── app/                          # Expo Router
│   ├── _layout.tsx              # Root with useAuth (API)
│   ├── index.tsx                # Splash (useAuth isAuthenticated/isProfileComplete)
│   ├── (auth)/welcome.tsx        # Monk + Truck DatePicker-shared
│   ├── (onboarding)/profile-setup.tsx # 4-step with DatePicker
│   └── (app)/ (Tabs)
│       ├── _layout.tsx          # 6 tabs + BottomTabBar
│       ├── home.tsx             # No Sign Out, ScrollView
│       ├── suppliers.tsx        # API CRUD with material
│       ├── pumps.tsx            # API CRUD
│       ├── trips.tsx            # Truck inline, DatePicker inline, material/supplier inline, financials
│       ├── drivers.tsx          # Blood 8-chip inline, vehicle inline, profile modal
│       ├── profile.tsx          # Fleet inputs + Sign Out card
│       └── edit-profile.tsx
├── components/ui/               # AppButton, AppInput, DatePicker (reusable), ConfirmationModal (padding xxl), SuccessModal, etc.
├── services/api/                # client.ts, config.ts (LAN fallback), tokenStorage.ts, auth.ts, profile.ts, suppliers.ts, pumps.ts, trips.ts, drivers.ts
├── services/storage/            # fallback storage (migrates)
├── types/                       # auth, profile, supplier (material), pump, trip (truck/material/supplier/client/financials), driver (BLOOD_GROUPS)
├── utils/validation.ts          # step1-4, dob, mobile, aadhar, licence, uniqueness
└── backendSupport.md            # Single source of truth for API contract
```

## Design System

- **Colors** #2563EB etc., **Typography**, **Spacing**, **Radius**, **Shadows** — centralized, no hardcoding

## Key Decisions

- `generateId()` vs `uuid` (RN `crypto` fix), `Text` link vs `AppButton ghost` (clipping), `useFocusEffect` reload, DOB `100y-10y` with `daysInMonth`, Welcome Monk cross-fade, Bottom pill `href:null` filter, `KeyboardAvoidingView` + inline dropdowns (fix nested Modal click bug), `ConfirmationModal` `padding xxl`, CRUD via `services/api/*` with `401` refresh, `DatePicker` reusable (`inline` prop) for DOB + Trip, `profile.vehicles` via `GET /api/v1/profile/vehicles` for truck dropdown, `BloodGroup` enum `prisma/schema.prisma:78` (`A+` etc. via `@map`), Financial Details card bordered.

## License

MIT

## Author

Vishwajeet Guru - [GitHub](https://github.com/vishwajeetguru)
