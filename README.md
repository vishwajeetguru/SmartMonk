# SmartMonk

A comprehensive offline-first transport business management mobile application built with Expo and React Native.

## Features

### Phase 1 (Current)
- **User Authentication** - Local signup/login with AsyncStorage, form validation
- **Profile Setup** - Business type, vehicle count, GST number, location
- **Profile Management** - Edit profile from circular avatar on Home, image picker with live preview
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

Splash → Welcome → Login / Sign Up → Profile Setup → Setup Complete → Home → Edit Profile

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
│   ├── storage/                 # storage, authStorage, profileStorage (AsyncStorage)
│   └── auth/                    # localAuth
├── types/                       # auth, profile, navigation
├── utils/                       # validation, formatters, generateId (React Native safe)
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

## License

MIT License

## Author

Vishwajeet Guru - [GitHub](https://github.com/vishwajeetguru)
