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
bun start                 # Start Expo dev server
bun start:dev             # Start with dev client
bun start:clear           # Start with cleared cache
```

Run on specific platforms:

```sh
bun ios                   # Run on iOS simulator/device
bun android               # Run on Android emulator/device
bun web                   # Run on web browser
```

### Building & Deployment

The app supports three build environments: **Development**, **Preview** (Internal Testing), and **Production**.

#### Development Builds (with Dev Client)

```sh
bun build:dev:android     # Build for Android
bun build:dev:ios         # Build for iOS
bun build:dev:all         # Build for both platforms
```

#### Preview Builds (Internal Testing)

```sh
bun build:preview:android # Build APK for Android testing
bun build:preview:ios     # Build for iOS TestFlight (internal)
bun build:preview:all     # Build for both platforms
```

#### Production Builds (App Store Release)

```sh
bun build:prod:android    # Build for Google Play Store
bun build:prod:ios        # Build for Apple App Store
bun build:prod:all        # Build for both platforms
```

#### Submit to App Stores

```sh
bun submit:android        # Submit to Google Play Store
bun submit:ios            # Submit to Apple App Store
bun submit:all            # Submit to both stores
```

#### Over-The-Air (OTA) Updates

```sh
bun update:preview "Your update message"    # Send preview updates
bun update:prod "Your update message"       # Send production updates
```

### Version Management

The app version is automatically managed from `package.json`. Update the version using npm:

```sh
npm version patch         # 1.0.5 → 1.0.6 (bug fixes)
npm version minor         # 1.0.5 → 1.1.0 (new features)
npm version major         # 1.0.5 → 2.0.0 (breaking changes)
```

This automatically updates:

- `expo.version`
- `android.versionCode` (calculated as `MAJOR * 10000 + MINOR * 100 + PATCH`)
- `ios.buildNumber` (same as versionCode)

### Typical Release Workflow

```sh
# 1. Update version
npm version patch

# 2. Build for production
bun build:prod:all

# 3. Wait for build completion, then submit
bun submit:all

# 4. (Optional) Send OTA update for minor fixes
bun update:prod "Fixed critical bug"
```

📚 **For detailed build documentation, see [BUILD.md](./BUILD.md)**

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

```txt
rozo-app-mobile/
├── app/                    # Expo Router file-based routing
│   ├── (main)/            # Main app screens (protected routes)
│   │   ├── balance.tsx    # Balance screen
│   │   ├── orders.tsx     # Orders screen
│   │   ├── pos.tsx        # Point of Sale screen
│   │   ├── settings.tsx   # Settings screen
│   │   └── transactions.tsx # Transactions screen
│   ├── login.tsx          # Login screen
│   └── _layout.tsx        # Root layout
├── components/             # Shared components
│   ├── screens/           # Screen-specific components
│   ├── svg/               # SVG components
│   └── ui/                # Core UI components (buttons, inputs, etc.)
├── features/              # Feature modules
│   ├── balance/           # Balance feature
│   ├── orders/            # Orders feature
│   ├── payment/           # Payment feature
│   ├── settings/          # Settings feature
│   └── transactions/      # Transactions feature
├── hooks/                 # Custom React hooks
├── libs/                  # Shared utilities and constants
├── modules/               # Core modules
│   ├── axios/             # API client setup
│   ├── i18n/              # Internationalization
│   └── pusher/            # Real-time updates
├── providers/             # React Context providers
│   ├── app.provider.tsx   # App-wide provider
│   ├── auth.provider.tsx  # Authentication provider
│   ├── merchant.provider.tsx # Merchant data provider
│   ├── query.provider.tsx # React Query provider
│   └── wallet.provider.tsx # Wallet provider
├── resources/             # External resources
│   ├── api/               # API endpoints and queries
│   └── schema/            # Zod validation schemas
└── translations/          # Translation files (en, es, fr, etc.)
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the code style and conventions
4. **Test thoroughly**: Test on both iOS and Android
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add comments for complex logic
- Keep components small and focused

## Documentation

For detailed documentation on specific features:

- **[Route Protection System](./docs/README.md)** - Flexible route protection with multiple layers
- **[Build & Deployment](./docs/BUILD.md)** - Comprehensive build and deployment guide

## Support

For support and questions:

- Open an [issue](https://github.com/rozoai/rozo-app-mobile/issues)
- Check the [docs folder](./docs/) for feature-specific documentation
- See [BUILD.md](./docs/BUILD.md) for detailed build instructions

## License

This project is licensed under the terms specified in the repository.

---

Made with ❤️ by the Rozo team
