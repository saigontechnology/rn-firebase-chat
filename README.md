# rn-firebase-chat

RN Firebase Chat

## Installation

```sh
npm install rn-firebase-chat
```

## Installation

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat
```

## Usage

- Wrap your app with `ChatProvider`

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

- Setup navigation for `ListConversationScreen` and `ChatScreen`

```javascript
export const ChatNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name={RouteKey.ListChatScreen} component={ListChatScreen} />
    <Stack.Screen name={RouteKey.ChatScreen} component={ChatScreen} />
  </Stack.Navigator>
);
```

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

## Addons

Additional features for chat are:

#### Image/Video Picker and Camera

This feature will require additional libraries:

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install react-native-fast-image react-native-video react-native-vision-camera uuid react-native-image-picker --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add react-native-fast-image react-native-video react-native-vision-camera uuid react-native-image-picker
```

Then using our Addons component in ChatScreen

```javascript
import React from 'react'
import {ChatScreen as BaseChatScreen} from 'rn-firebase-chat'
import {CameraView, useCamera} from 'rn-firebase-chat/src/addons/camera'

...

export const ChatScreen: React.FC = () => {
  const {onPressCamera, onPressGallery} = useCamera()
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
    {({onSend}) => (<CameraView onSend={onSend} /> )}
    </BaseChatScreen>
  )
}

```

## Features

#### Leave conversation

- Use `useConversation` hook to get `leaveConversation` function.

```typescript
import {useConversation} from 'rn-firebase-chat';

const {leaveConversation} = useConversation();

const result = await leaveConversation(conversationId, isSilent);
```

| Parameter        | Type      | Description                                                               |
| :--------------- | :-------- | :------------------------------------------------------------------------ |
| `conversationId` | `string`  | **Required**                                                              |
| `isSilent`       | `boolean` | If `true`, send a system message to the conversation to notify the action |

#### Delete conversation
- Use `useConversation` hook to get `deleteConversation` function.

```typescript
import {useConversation} from 'rn-firebase-chat';

const {deleteConversation} = useConversation();

const result = await deleteConversation(conversationId, softDelete);
```
| Parameter        | Type      | Description                                                               |
| :--------------- | :-------- | :------------------------------------------------------------------------ |
| `conversationId` | `string`  | **Required**                                                              |
| `softDelete`     | `boolean` | If `true`, just delete the conversation from user's list. Otherwise, completely delete the conversation from lists of other members as well. Message history will not be cleared on both case but cannot be accessed. |

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
