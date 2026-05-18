# Getting Started — Web Example App

This guide walks through running the Vite + React web example app.

## Prerequisites

- Node.js >= 16
- pnpm (monorepo package manager)
- A Firebase project with Firestore enabled and a **Web app** registered

## 1. Install dependencies

From the **monorepo root**:

```bash
pnpm install
```

## 2. Configure environment variables

Copy the example env file and fill in your Firebase web config:

```bash
cp apps/web-vite/.env.example apps/web-vite/.env
```

Get your Firebase config values from **Firebase Console > Project Settings > Your apps > Web app**, then add them to `.env` with the `VITE_FIREBASE_` prefix:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3. Run the dev server

From the **monorepo root**:

```bash
pnpm example:web
```

## Storage Provider Add-ons

The library supports two media upload integrations. Pass a `storageProvider` to `WebChatProvider` to enable file/image uploads.

### Cloudinary

Add Cloudinary config to your `.env` file with the `VITE_CLOUDINARY_` prefix (see `.env.example`), then:

```tsx
import { CloudinaryStorageProvider } from '@saigontechnology/react-firebase-chat';

const cloudinaryProvider = new CloudinaryStorageProvider({
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
  folder: import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'chat',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY ?? '',
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET ?? '',
});

<WebChatProvider currentUser={currentUser} storageProvider={cloudinaryProvider}>
  {/* ... */}
</WebChatProvider>
```

### Firebase Storage

Uses the pre-integrated Firebase Storage service — no extra config needed:

```tsx
import { FirebaseStorageProvider } from '@saigontechnology/react-firebase-chat';

const firebaseStorageProvider = new FirebaseStorageProvider();

<WebChatProvider currentUser={currentUser} storageProvider={firebaseStorageProvider}>
  {/* ... */}
</WebChatProvider>
```
