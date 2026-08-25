# SmartMonk

A comprehensive offline-first transport business management mobile application built with Expo and React Native.

## Features

### Phase 1 (Current)
- **User Authentication** - Local signup/login with AsyncStorage, form validation (email/password), footer `Text` link to prevent clipping
- **4-Step Onboarding**
  - **Step 1 — Personal:** Avatar (expo-image-picker) + Full name + DOB via range date picker (Year 100y–10y, Month/Day columns, `YYYY-MM-DD` storage, `daysInMonth` guard)
  - **Step 2 — Contact:** Country code with flags modal (🇮🇳 +91, 🇺🇸 +1, etc.) + mobile number
  - **Step 3 — Business:** Business type cards (Truck Owner / Fleet Owner / Transport Contractor / Driver / Other)
  - **Step 4 — Fleet:** Vehicle count (`1` / `2-5` / `6-10` / `10+`) → exact chip for ranges or numeric for `10+` → dynamic `Vehicle 1..N Number/Nickname` inputs with live duplicate detection
- **Welcome** - Monk image (`assets/images/monk.png`) + `TruckIllustration` stacked cross-fade, random on focus + auto-toggle 3.5s, dots + tap hint
- **Bottom Navigation** - Floating pill bar (6 tabs: Home, Suppliers, Pumps, Trips, Drivers, Profile) with spring scale + fade, icons `home`/`cube`/`flame`/`navigate`/`people`/`person-circle`, `edit-profile` hidden (`href:null`)
- **Suppliers / Pumps / Trips / Drivers** - Offline CRUD (AsyncStorage, `userId` scoped, `useFocusEffect` reload), add 1+ and list, edit (pencil) + delete (trash) via `ConfirmationModal`, `SuccessModal` animation after save, duplicate checks, `KeyboardAvoidingView` so inputs not covered
  - **Suppliers:** name*, contact* (mobile validation, duplicate contact/name), **material** (e.g. Cement/Steel, linked to Trips), address
  - **Pumps:** name*, contact* (mobile), location* (duplicate name/contact)
  - **Trips:** **Select Truck** (dropdown from `profile.vehicles` — single shows pill, multi shows picker), **Trip Date** range picker (`MM/DD/YYYY` like 08/25/2026), **Material** (dropdown from Suppliers’ materials), **Material Price** (numbers-only), **Supplier Name** (dropdown from Suppliers), **Client Name** (manual), **Trips Count** (`-/+` 1..n), **Location**, **Financial Details** card (Total Value/Profit/Total Expense ₹, bordered as per Figma), **Payment Status** (`Pending/Paid/Partial`), `SuccessModal`
  - **Drivers:** fullName*, contact* (mobile), bloodGroup (8-chip grid `A+ A- B+ B- AB+ AB- O+ O-`), aadhar (12 digits), licence* (8-20 alphanum, letters+digits), address, salary, assignedVehicle (dropdown from fleet — all `profile.vehicles` fetched), duplicate contact/aadhar/licence, `ConfirmationModal`/`SuccessModal`, tap card → Driver Profile modal
- **Profile Management** - Circular avatar on Home (no duplicate card) → Profile tab, `useFocusEffect` reload, Save Changes (`paddingBottom 140` so not hidden behind pill), Account section with Sign Out card (`log-out-outline` red) + `ConfirmationModal` → splash
- **Session Persistence** - Secure local session, stay logged in after app restart, splash routing
- **App Icon** - `assets/icons/appIcon.png` (1.8MB) as `expo.icon` + `android.adaptiveIcon`
- **Offline-First** - Works completely without internet, no API or cloud dependency

### Upcoming Phases
- Advanced Vehicle Management
- Fuel & Expenses Analytics
- Payment Tracking
- Monthly Reports

## Tech Stack

- **Framework:** Expo SDK 54
- **Language:** TypeScript (strict)
- **Navigation:** Expo Router (file-based, (auth)/(onboarding)/(app) groups, Tabs + Stack)
- **Storage:** @react-native-async-storage/async-storage
- **Animations:** React Native Reanimated + react-native-worklets
- **Icons:** @expo/vector-icons (Ionicons)
- **Image:** expo-image-picker
- **Gestures:** react-native-gesture-handler

## Screens

Splash → Welcome (Monk/Truck random) → Login / Sign Up → Profile Setup (4 steps) → Setup Complete → Home → Suppliers / Pumps / Trips / Drivers / Profile (Bottom Tabs) → Edit Profile (hidden, via Home avatar)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone (SDK 54)

### Installation

```bash
# Clone the repository
git clone https://github.com/vishwajeetguru/SmartMonk.git

# Navigate to project directory
cd SmartMonk

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npx expo start --clear
```

### Running the App

1. Install Expo Go on your iOS or Android device
2. Run `npx expo start --clear` in the project directory
3. Scan the QR code with Expo Go
4. Test offline: enable airplane mode, kill and reopen app — session persists
5. Replace `assets/images/monk.png` placeholder (currently copy of icon) with the baby-monk image for Welcome

## Project Structure

```
smartmonk/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout with auth/profile check
│   ├── index.tsx                # Splash screen (animated)
│   ├── (auth)/                  # Authentication flow
│   │   ├── welcome.tsx          # Monk + Truck cross-fade, random + 3.5s toggle
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (onboarding)/            # Profile setup
│   │   ├── profile-setup.tsx    # 4-step wizard with DOB picker + fleet
│   │   └── setup-complete.tsx
│   └── (app)/                   # Main app (Tabs)
│       ├── _layout.tsx          # Tabs with BottomTabBar (6 tabs)
│       ├── home.tsx             # Circular avatar → Profile, ScrollView
│       ├── suppliers.tsx        # CRUD with material, Confirmation/SuccessModal + KeyboardAvoiding
│       ├── pumps.tsx
│       ├── trips.tsx            # Truck single/multi, date MM/DD/YYYY, material/supplier/client, counts, financials, payment status
│       ├── drivers.tsx          # Blood group 8-chip grid + vehicle assign + driver profile modal
│       ├── profile.tsx          # Profile tab with Sign Out card
│       └── edit-profile.tsx     # Hidden stack screen (home avatar deep link)
├── components/
│   ├── ui/                      # AppButton, AppInput, PasswordInput, AppCard, ConfirmationModal, SuccessModal, etc.
│   ├── layout/                  # ScreenContainer, KeyboardAvoidingContainer, BottomTabBar (pill, spring)
│   ├── auth/                    # AuthHeader, AuthForm
│   ├── onboarding/              # ProfileAvatar (Image), BusinessTypeSelector, VehicleCountSelector
│   └── illustrations/           # TruckIllustration, RoadAnimation
├── constants/                   # Design tokens: colors, typography, spacing, radius, shadows
├── hooks/                       # useAuth, useProfile, useOnboarding
├── services/
│   ├── storage/                 # storage, authStorage, profileStorage (migrates), supplierStorage, pumpStorage, tripStorage, driverStorage
│   └── auth/                    # localAuth
├── types/                       # auth, profile (Vehicle, COUNTRY_CODES, dob, countryCode, vehicles), supplier, pump, trip, driver (BLOOD_GROUPS), navigation
├── utils/                       # validation (step1-4, dob, mobile, aadhar, licence, uniqueness, duplicateCheck), formatters, generateId (RN safe)
├── assets/
│   ├── icons/appIcon.png        # App icon (1.8MB)
│   ├── images/monk.png          # Welcome monk (replace placeholder)
│   └── ...                      # android icons, favicon, splash
└── theme/                       # theme index
```

## Design System

Centralized tokens — no hardcoded values in screens:

- **Colors** - primary #2563EB, textPrimary #0F172A, border, error, success, etc.
- **Typography** - headingLarge/Medium/Small, body, bodySmall, label, button
- **Spacing** - xxs 2 / xs 4 / sm 8 / md 12 / base 16 / lg 20 / xl 24 / xxl 32
- **Radius** - xs 4 / sm 8 / md 12 / lg 16 / xl 20 / full 9999
- **Shadows** - small/medium/large with elevation

## Key Decisions

- `generateId()` (timestamp+random) instead of `uuid` to avoid `crypto.getRandomValues` error in React Native Expo Go
- `Text` link instead of `AppButton ghost` for footer “Already have an account? Sign In” to prevent clipping (`flexWrap: wrap`)
- `useFocusEffect` on Home/Profile/Drivers to reload profile after edit, so avatar/vehicles update everywhere
- **DOB range picker** - custom modal with Day/Month/Year columns (100y–10y range, `YYYY-MM-DD`, `daysInMonth` guard) instead of text input; single `dobButton` with calendar icon
- **Vehicle uniqueness** - `validation.step4` + live `updateVehicleNumber` check normalized `toLowerCase().replace(/\s+/g,'')` with `Set`, marks both duplicates; `desiredVehicleN` syncs `vehicles` array length, exact chip for `2-5`/`6-10` and numeric input for `10+`
- **Welcome Monk** - `assets/images/monk.png` + `TruckIllustration` stacked, `monkOpacity`/`carOpacity` cross-fade, random on `useFocusEffect` + 3.5s interval, dots + tap hint
- **Bottom Nav** - custom `BottomTabBar` pill (spring scale, fade, active `primary` pill + dot), 6 tabs, `edit-profile` hidden via `href:null` + filter, icons `cube`/`flame`/`navigate`/`people`/`person-circle`
- **Keyboard** - `KeyboardAvoidingView` (`padding` iOS / `height` Android) + `ScrollView keyboardShouldPersistTaps` in all add/edit sheets so inputs not covered
- **CRUD** - `supplierStorage`/`pumpStorage`/`tripStorage`/`driverStorage` with `update`/`remove`, duplicate checks (contact/aadhar/licence), `ConfirmationModal` for delete, `SuccessModal` animation after add/update
- **Suppliers → Trips** - supplier `material` (Cement/Steel), Trips **Material** dropdown from unique `suppliers.material` set, **Supplier Name** dropdown from `suppliers` (name+material)
- **Trips** - **Truck** single-pill vs dropdown (`profile.vehicles` length 1 vs >1), **Date** `MM/DD/YYYY` picker, **Trips Count** `-/+`, **Financial Details** bordered card (Total Value/Profit/Total Expense ₹), **Payment Status** `Pending/Paid/Partial` dot picker
- **Profile Sign Out** - moved from Home to Profile Account section as destructive card (`log-out-outline` red, `ConfirmationModal`), `scrollContent paddingBottom 140` so Save not hidden behind pill

## License

MIT License

## Author

Vishwajeet Guru - [GitHub](https://github.com/vishwajeetguru)
