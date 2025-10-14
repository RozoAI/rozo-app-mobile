<h1 align="center">
  <img alt="logo" src="https://rewards.rozo.ai/logo-square.png" width="124px" style="border-radius:10px"/><br/> Rozo App
</h1>

## About

Rozo App is a modern mobile application that combines a Point-of-Sale system with embedded wallets.
It’s designed to make it easy for merchants and users to handle payments, deposits, and withdrawals — all in one place.

[Web](https://github.com/rozoai/rozo-app) [Mobile](https://github.com/rozoai/rozo-app-mobile)
## Features

🔐 Embedded Wallets – Powered by the **Privy SDK**, so every user has a secure digital wallet built in.

🛒 POS System – Simple and fast checkout experience for merchants and customers.

💰 Deposit & Withdraw – Seamlessly move funds in and out of the app.

🌍 Multi-Platform – Works on iOS, Android, and Web.

🔑 Secure Login – Protect your account with modern authentication.

🌐 Multi-language Support – Accessible to users in different regions.

## Screenshots

| Sign In                                                                                                                            | Balance                                                                                                                            | Orders                                                                                                                             | POS                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| <img width="430" height="932" alt="image" src="https://github.com/user-attachments/assets/518130ee-88d4-4043-b4a5-308a92816f97" /> | <img width="430" height="932" alt="image" src="https://github.com/user-attachments/assets/33e434fb-1d71-4bee-a7de-b580f00522c1" /> | <img width="430" height="932" alt="image" src="https://github.com/user-attachments/assets/9717dbd5-03fe-4d77-a706-7c9cb8fc4233" /> | <img width="430" height="932" alt="image" src="https://github.com/user-attachments/assets/47598596-543d-4649-a1b9-b53113379b17" /> |

## Setup

### Requirements

- [React Native dev environment](https://reactnative.dev/docs/environment-setup)
- [Node.js LTS release](https://nodejs.org/en/)
- [Git](https://git-scm.com/)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall), required only for macOS or Linux users
- [Bun](https://bun.sh/docs/installation)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

Clone the repo to your machine and install dependencies:

```sh
git clone https://github.com/RozoAI/rozo-app-mobile

cd ./rozo-app-mobile

bun install
```

## Usage

### Development

Start the development server:

```sh
bun start
```

Run on iOS:

```sh
bun ios
```

Run on Android:

```sh
bun android
```

### Environment Variables

The app supports different environments:

- Development: `bun start`
- Staging: `bun start:staging`
- Production: `bun start:production`

## Stack

- **Framework**: [Expo](https://expo.dev/)
- **UI**: [React Native](https://reactnative.dev/) with [Gluestack](https://gluestack.io/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest) with React Query Kit
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Storage**: [React Native MMKV](https://github.com/mrousavy/react-native-mmkv)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) via [Gluestack](https://gluestack.io/)

## Folder Structure

```
app/                # Expo Router file-based routing
  │   ├── (app)/         # App screens (protected routes)
  │   └── features/      # Feature-specific components
  ├── components/        # Shared components
  │   ├── samples/       # Example components
  │   └── ui/            # Core UI components (buttons, inputs, etc.)
  ├── hooks/             # Custom React hooks
  ├── lib/               # Shared utilities
  ├── modules/           # Feature modules
  │   ├── auth/          # Authentication logic
  │   └── i18n/          # Internationalization
  ├── resources/         # External resources
  │   └── api/           # API clients and services
  ├── styles/            # Global styles
  └── translations/      # Translation files
```
