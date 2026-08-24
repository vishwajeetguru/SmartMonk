# SmartMonk

A comprehensive offline-first transport business management mobile application built with Expo and React Native.

## Features

### Phase 1 (Current)
- **User Authentication** - Local signup/login with AsyncStorage, form validation (email/password)
- **4-Step Onboarding**
  - **Step 1 — Personal:** Avatar (expo-image-picker) + Full name + DOB via range date picker (Year 1925–2015, Month/Day columns, `YYYY-MM-DD` storage, formatted display)
  - **Step 2 — Contact:** Country code with flags modal (🇮🇳 +91, 🇺🇸 +1, etc.) + mobile number
  - **Step 3 — Business:** Business type cards (Truck Owner / Fleet Owner / Transport Contractor / Driver / Other)
  - **Step 4 — Fleet:** Vehicle count (`1` / `2-5` / `6-10` / `10+`) → exact chip selector for ranges or numeric input for `10+` → dynamic `Vehicle 1..N Number/Nickname` inputs
- **Fleet Validation** - Required + unique vehicle numbers (case-insensitive, trimmed, live duplicate detection for both indices)
- **Profile Management** - Circular avatar on Home (no duplicate card) → Edit profile, `useFocusEffect` reload so image shows everywhere
- **Session Persistence** - Secure local session, stay logged in after app restart, splash routing
- **Logout Confirmation** - Confirmation modal before sign out, redirect to splash
- **Offline-First** - Works completely without internet, no API or cloud dependency

### Upcoming Phases
- Vehicle Management
- Driver Tracking
- Trip Records
- Fuel & Expenses
- Payment Tracking
- Monthly Reports
- Dashboard Analytics

## Tech Stack

- **Framework:** Expo SDK 54
- **Language:** TypeScript (strict)
- **Navigation:** Expo Router (file-based, (auth)/(onboarding)/(app) groups)
- **Storage:** @react-native-async-storage/async-storage
- **Animations:** React Native Reanimated + react-native-worklets
- **Icons:** @expo/vector-icons (Ionicons)
- **Image:** expo-image-picker
- **Gestures:** react-native-gesture-handler

## Screens

Splash → Welcome → Login / Sign Up → Profile Setup (4 steps) → Setup Complete → Home → Edit Profile

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
npx expo start
```

### Running the App

1. Install Expo Go on your iOS or Android device
2. Run `npx expo start` in the project directory
3. Scan the QR code with Expo Go
4. Test offline: enable airplane mode, kill and reopen app — session persists

## Project Structure

```
smartmonk/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout with auth/profile check
│   ├── index.tsx                # Splash screen (animated)
│   ├── (auth)/                  # Authentication flow
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (onboarding)/            # Profile setup
│   │   ├── profile-setup.tsx
│   │   └── setup-complete.tsx
│   └── (app)/                   # Main app
│       ├── home.tsx             # Circular avatar → edit profile, logout confirm
│       └── edit-profile.tsx     # Edit all profile fields + image
├── components/
│   ├── ui/                      # AppButton, AppInput, PasswordInput, AppCard, ConfirmationModal, etc.
│   ├── layout/                  # ScreenContainer, KeyboardAvoidingContainer
│   ├── auth/                    # AuthHeader, AuthForm
│   ├── onboarding/              # ProfileAvatar (Image), BusinessTypeSelector, VehicleCountSelector
│   └── illustrations/           # TruckIllustration, RoadAnimation
├── constants/                   # Design tokens: colors, typography, spacing, radius, shadows
├── hooks/                       # useAuth, useProfile, useOnboarding
├── services/
│   ├── storage/                 # storage, authStorage, profileStorage (migrates old profiles)
│   └── auth/                    # localAuth
├── types/                       # auth, profile (Vehicle, COUNTRY_CODES, dob, countryCode, vehicles), navigation
├── utils/                       # validation (step1-4, dob, uniqueness), formatters, generateId (RN safe)
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
- `useFocusEffect` on Home to reload profile after edit, so avatar image updates everywhere
- **DOB range picker** - custom modal with Day/Month/Year columns (100y–10y range, `YYYY-MM-DD`, `daysInMonth` guard) instead of `YYYY-MM-DD` text input; single `dobButton` with calendar icon
- **Vehicle uniqueness** - `validation.step4` + live `updateVehicleNumber` check normalized `toLowerCase().replace(/\s+/g,'')` with `Set`, marks both duplicates; `desiredVehicleN` syncs `vehicles` array length, exact chip for `2-5`/`6-10` and numeric input for `10+`

## License

MIT License

## Author

Vishwajeet Guru - [GitHub](https://github.com/vishwajeetguru)
