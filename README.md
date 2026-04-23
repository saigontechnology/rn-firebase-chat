# rn-firebase-chat

A real-time Firebase chat monorepo providing ready-to-use UI components for both **React Native** and **Web**.

## Packages

| Package                                                                    | Description                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`rn-firebase-chat`](./packages/rn-firebase-chat)                          | React Native chat UI backed by `@react-native-firebase`  |
| [`@saigontechnology/react-firebase-chat`](./packages/react-firebase-chat)  | Web chat UI backed by the Firebase JS SDK                |
| [`@saigontechnology/firebase-chat-shared`](./packages/shared)              | Shared business logic (FirestoreServices, useChatScreen) |
| [`@saigontechnology/chat-storage-providers`](./packages/storage-providers) | Firebase Storage + Cloudinary adapters                   |

---

## React Native

### Installation

```sh
npm install rn-firebase-chat
# or
yarn add rn-firebase-chat
```

### Peer dependencies

```sh
npm install \
  @react-native-firebase/app \
  @react-native-firebase/firestore \
  react-native-gifted-chat \
  react-native-keyboard-controller \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-aes-crypto
```

Optional (file upload, camera, video):

```sh
npm install @react-native-firebase/storage react-native-image-picker react-native-vision-camera
```

> If you're using Expo, see the [Expo Configuration Guide](./packages/rn-firebase-chat/README.expo.md).

### Usage

```tsx
import { ChatProvider } from "rn-firebase-chat";

function App() {
  return (
    <ChatProvider
      userInfo={{
        id: "abc123",
        name: "John Doe",
        avatar: "https://example.com/avatar.jpg",
      }}
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

```tsx
import { ListConversationScreen } from "rn-firebase-chat";

export const ListChatScreen = () => {
  const handleItemPress = useCallback((data) => {
    navigate("Chat", data);
  }, []);
  return <ListConversationScreen onPress={handleItemPress} />;
};
```

```tsx
import { ChatScreen as BaseChatScreen } from "rn-firebase-chat";

const partner = {
  id: "xyz123",
  name: "Tony",
  avatar: "https://example.com/tony.jpg",
};

export const ChatScreen = () => (
  <BaseChatScreen memberIds={[partner.id]} partners={[partner]} />
);
```

---

## Web

### Installation

```sh
npm install @saigontechnology/react-firebase-chat
# or
yarn add @saigontechnology/react-firebase-chat
```

### Peer dependencies

```sh
npm install firebase react react-dom
```

Optional (animations, toasts, auto-sizing textarea):

```sh
npm install framer-motion react-hot-toast react-textarea-autosize
```

### Usage

```tsx
import {
  WebChatProvider,
  ChatScreen,
} from "@saigontechnology/react-firebase-chat";
import "@saigontechnology/react-firebase-chat/styles.css";
import { initializeFirebase } from "@saigontechnology/react-firebase-chat";

initializeFirebase({ apiKey: "...", projectId: "..." /* ... */ });

function App() {
  const currentUser = { id: "abc123", name: "John Doe" };
  return (
    <WebChatProvider currentUser={currentUser}>
      <ChatScreen />
    </WebChatProvider>
  );
}
```

See [`apps/web-vite/`](./apps/web-vite/) for a working example.

## Features

- Real-time messaging via Firestore `onSnapshot`
- Lazy conversation creation — Firestore document created on first send
- Typing indicators with configurable timeout
- Read receipts (`sent` → `received` → `seen`)
- Reply to messages with scroll-to-original
- Edit unseen messages
- Optional AES message encryption
- File / image / video upload (Firebase Storage or Cloudinary)
- Conversation name sync — each user writes their own display name into `names[userId]`
- Bad-word filtering via configurable word list

## Contributing

See the [contributing guide](./packages/rn-firebase-chat/CONTRIBUTING.md).

## License

MIT
