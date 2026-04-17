# rn-firebase-chat

A real-time chat library for React Native backed by Firebase Firestore, built on `react-native-gifted-chat`.

## Installation

```sh
npm install rn-firebase-chat
# or
yarn add rn-firebase-chat
```

### React Native peer dependencies

```sh
npm install \
  @react-native-firebase/app \
  @react-native-firebase/firestore \
  react-native-gifted-chat \
  react-native-keyboard-controller \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-worklets \
  react-native-aes-crypto \
```

Optional (file upload, camera, video):

```sh
npm install react-native-image-picker react-native-vision-camera react-native-video
# Firebase Storage is required only when using file upload
npm install @react-native-firebase/storage
```

> If you're using Expo, follow the [Expo Configuration Guide](./README.expo.md) to configure plugins and add Firebase files for Android/iOS.

---

## React Native usage

### 1. Wrap your app with `ChatProvider`

```tsx
import { ChatProvider } from 'rn-firebase-chat';

function App() {
  return (
    <ChatProvider
      userInfo={{ id: 'abc123', name: 'John Doe', avatar: 'https://example.com/avatar.jpg' }}
    >
      <AppNavigation />
    </ChatProvider>
  );
}
```

### 2. Set up navigation

```tsx
export const ChatNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="ConversationList" component={ListChatScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);
```

### 3. Render the screens

```tsx
import { ListConversationScreen } from 'rn-firebase-chat';

export const ListChatScreen = () => {
  const handleItemPress = useCallback((data) => {
    navigate('Chat', data);
  }, []);

  return <ListConversationScreen onPress={handleItemPress} />;
};
```

```tsx
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';

const partner = { id: 'xyz123', name: 'Tony', avatar: 'https://example.com/tony.jpg' };

export const ChatScreen = () => (
  <BaseChatScreen memberIds={[partner.id]} partners={[partner]} />
);
```

### Camera & gallery addon (optional)

```tsx
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';
import { CameraView, useCamera } from 'rn-firebase-chat/src/addons/camera';

export const ChatScreen = () => {
  const { onPressCamera, onPressGallery } = useCamera();
  return (
    <BaseChatScreen
      memberIds={[partner.id]}
      partners={[partner]}
      inputToolbarProps={{ hasCamera: true, hasGallery: true, onPressCamera, onPressGallery }}
    >
      {({ onSend }) => <CameraView onSend={onSend} />}
    </BaseChatScreen>
  );
};
```
---

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
