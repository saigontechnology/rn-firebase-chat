# Getting Started — Mobile Example App

This guide walks through running the example app on iOS and Android.

## Prerequisites

- Node.js >= 16
- pnpm (monorepo package manager)
- Xcode (iOS) / Android Studio (Android)
- A Firebase project with Firestore enabled

## 1. Install dependencies

From the **monorepo root**:

```bash
pnpm install
```

## 2. Configure environment variables

Copy the example env file and fill in your Firebase project values:

```bash
cp apps/example/.env.example apps/example/.env
```

Edit `apps/example/.env` with your Firebase web config (API key, project ID, etc.). See `.env.example` for all available options.

## 3. Add Firebase service files

Download your service files from the [Firebase Console](https://console.firebase.google.com/) using the package name `com.sts.demo.chatapp` (or update `app.config.ts` to match your own), then place them at:

| Platform | File | Path |
|---|---|---|
| iOS | `GoogleService-Info.plist` | `apps/example/ios/rnfirebasechatexample/` |
| Android | `google-services.json` | `apps/example/android/app/` |

These paths are configured in `apps/example/app.config.ts`.

## 4. Generate native projects

Run Expo prebuild to generate the `ios/` and `android/` directories:

```bash
pnpm example prebuild
```

## 5. Run on iOS

Install CocoaPods dependencies, then build and launch:

```bash
cd apps/example/ios && pod install && cd ../../..
pnpm example ios
```

> If you see an xcconfig error after a fresh checkout, it means `pod install` hasn't been run yet.

## 6. Run on Android

No extra native setup is needed — just run:

```bash
pnpm example android
```

Ensure an emulator is running or a device is connected before launching.
