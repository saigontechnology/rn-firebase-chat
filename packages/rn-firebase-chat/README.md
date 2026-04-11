# rn-firebase-chat

A React Native real-time chat library backed by Firebase Firestore, providing ready-to-use UI components, message encryption, typing indicators, and more.

## Installation

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-keyboard-controller --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-keyboard-controller
```

If you're using Expo, please follow the dedicated setup guide to configure `plugins` in your `app.config.ts` and add Firebase files for Android and iOS:

- See: [Expo Configuration Guide](./README.expo.md)

## Usage

### 1. Wrap your app with `ChatProvider`

```javascript
import { ChatProvider } from 'rn-firebase-chat';

const userInfo = {
  id: 'abc123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
};

function App() {
  return (
    <ChatProvider userInfo={userInfo}>
      <AppNavigation />
    </ChatProvider>
  );
}
```

### 2. Set up navigation

```javascript
export const ChatNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name={RouteKey.ListChatScreen} component={ListChatScreen} />
    <Stack.Screen name={RouteKey.ChatScreen} component={ChatScreen} />
  </Stack.Navigator>
);
```

### 3. Conversation list screen

```javascript
import React, { useCallback } from 'react';
import { ListConversationScreen } from 'rn-firebase-chat';
import { navigate } from '../../navigation/NavigationService';
import RouteKey from '../../navigation/RouteKey';

export const ListChatScreen: React.FC = () => {
  const handleItemPress = useCallback((data) => {
    navigate(RouteKey.ChatScreen, data);
  }, []);

  return <ListConversationScreen onPress={handleItemPress} />;
};
```

### 4. Chat screen

```javascript
import React from 'react';
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';

const partnerInfo = {
  id: 'ayz123',
  name: 'Tony',
  avatar: 'https://example.com/tony.jpg',
};

export const ChatScreen: React.FC = () => {
  return (
    <BaseChatScreen memberIds={[partnerInfo.id]} partners={[partnerInfo]} />
  );
};
```

## Features

### Reply to Messages

Swipe a message to the left to quote it as a reply. The reply context appears above the input toolbar. Tapping the quoted preview inside a bubble scrolls to the original message.

This is enabled by default — no extra props required.

### Edit Messages

Long-press one of your own messages that has **not yet been seen** by the other participant to enter edit mode. An editing banner appears above the input showing the original text. Submitting the updated text calls `updateMessage` which patches the Firestore document and sets `isEdited: true` on the message.

This is enabled by default — no extra props required.

> **Note:** Editing is restricted to messages owned by the current user whose `status` is not `seen`.

## Addons

### Image/Video Picker and Camera

This feature requires additional libraries:

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install react-native-video react-native-vision-camera react-native-image-picker --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add react-native-video react-native-vision-camera react-native-image-picker
```

Then use the addon components inside `ChatScreen`:

```javascript
import React from 'react'
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat'
import { CameraView, useCamera } from 'rn-firebase-chat/src/addons/camera'

export const ChatScreen: React.FC = () => {
  const { onPressCamera, onPressGallery } = useCamera()
  return (
    <BaseChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}
      inputToolbarProps={{
        hasCamera: true,
        hasGallery: true,
        onPressCamera,
        onPressGallery,
      }}
    >
      {({ onSend }) => <CameraView onSend={onSend} />}
    </BaseChatScreen>
  )
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
