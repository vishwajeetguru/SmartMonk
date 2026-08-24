# SmartMonk

A comprehensive offline-first transport business management mobile application built with Expo and React Native.

## Features

### Phase 1 (Current)
- **User Authentication** - Local signup/login with AsyncStorage
- **Profile Setup** - Business type, vehicle count, GST number
- **Session Persistence** - Stay logged in after app restart
- **Offline-First** - Works completely without internet

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
- **Language:** TypeScript
- **Navigation:** Expo Router
- **Storage:** AsyncStorage
- **Animations:** React Native Reanimated
- **Icons:** Expo Vector Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone

### Installation

```bash
# Clone the repository
git clone https://github.com/vishwajeetguru/SmartMonk.git

# Navigate to project directory
cd SmartMonk

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

1. Install Expo Go on your iOS or Android device
2. Run `npx expo start` in the project directory
3. Scan the QR code with Expo Go

## Project Structure

```
smartmonk/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout with auth check
│   ├── index.tsx                # Splash screen
│   ├── (auth)/                  # Authentication flow
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (onboarding)/            # Profile setup
│   │   ├── profile-setup.tsx
│   │   └── setup-complete.tsx
│   └── (app)/                   # Main app
│       └── home.tsx
├── components/                  # Reusable UI components
│   ├── ui/                      # AppButton, AppInput, etc.
│   ├── layout/                  # Screen containers
│   ├── auth/                    # Auth components
│   ├── onboarding/              # Profile components
│   └── illustrations/           # Visual elements
├── constants/                   # Design tokens
├── hooks/                       # Custom React hooks
├── services/                    # Storage services
├── types/                       # TypeScript types
└── utils/                       # Utility functions
```

## Design System

The app uses a centralized design system with:

- **Colors** - Primary, secondary, text, and status colors
- **Typography** - Heading, body, and label styles
- **Spacing** - Consistent spacing scale (4px base)
- **Radius** - Border radius tokens
- **Shadows** - Elevation styles

## License

MIT License

## Author

Vishwajeet Guru - [GitHub](https://github.com/vishwajeetguru)
