# @saigontechnology/react-firebase-chat

A web chat UI library backed by the Firebase JS SDK, providing ready-to-use React components for real-time messaging.

## Installation

```sh
npm install @saigontechnology/react-firebase-chat firebase react react-dom
# or
yarn add @saigontechnology/react-firebase-chat firebase react react-dom
```

### Optional peer dependencies

```sh
npm install framer-motion react-hot-toast react-textarea-autosize
```

## Usage

```tsx
import {
  WebChatProvider,
  ChatScreen,
  FirestoreServices,
  UserService,
} from "@saigontechnology/react-firebase-chat";
import "@saigontechnology/react-firebase-chat/styles.css";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

initializeApp({ apiKey: "...", projectId: "..." /* ... */ });

async function setup(uid: string, name: string) {
  await UserService.getInstance().createUserIfNotExists(uid, { name });
  await FirestoreServices.getInstance().configuration({
    userInfo: { id: uid, name },
  });
}

function App() {
  const currentUser = { id: "abc123", name: "John Doe" };
  return (
    <WebChatProvider currentUser={currentUser}>
      <ChatScreen showFileUpload />
    </WebChatProvider>
  );
}
```

## Vite configuration

Vite needs a small plugin to stub React Native imports that leak through transitive dependencies:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

export default defineConfig({ plugins: [react()] });
```

A working example is in [`apps/web-vite/`](../../apps/web-vite/).

## File uploads

Pass a `storageProvider` to `WebChatProvider` to enable file/image uploads:

```tsx
import { CloudinaryStorageProvider } from "@saigontechnology/react-firebase-chat";

const storage = new CloudinaryStorageProvider({
  cloudName: "my-cloud",
  uploadPreset: "my-preset",
  folder: "chat",
});

<WebChatProvider currentUser={currentUser} storageProvider={storage}>
  <ChatScreen showFileUpload />
</WebChatProvider>;
```

## Encryption

```tsx
<WebChatProvider
  currentUser={currentUser}
  encryptionKey="my-secret-key"
  enableEncrypt={true}
>
  <ChatScreen />
</WebChatProvider>
```

## License

MIT
