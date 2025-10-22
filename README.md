# rn-firebase-chat

RN Firebase Chat

## Installation

```sh
npm install rn-firebase-chat
```

## Installation

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-gesture-handler react-native-keyboard-controller --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-gesture-handler react-native-keyboard-controller
```

If you're using Expo, please follow the dedicated setup guide to configure `plugins` in your `app.config.ts` and add Firebase files for Android and iOS:

- See: [Expo Configuration Guide](./README.expo.md)

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
    <BaseChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}
      messageStatusEnable={true}
      enableTyping={true}
    />
  );
};
```

## Customization

The ChatScreen component provides extensive customization options for styling and behavior:

### Input Toolbar Customization

```javascript
export const ChatScreen: React.FC = () => {
  return (
    <BaseChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}
    />
  );
};
```

### Message Status Customization

```javascript
export const ChatScreen: React.FC = () => {
  const customMessageStatus = (hasUnread: boolean) => (
    <View style={{ backgroundColor: hasUnread ? '#ff6b6b' : '#51cf66', borderRadius: 8, padding: 4 }}>
      <Text style={{ color: 'white', fontSize: 10 }}>
        {hasUnread ? '✓' : '✓✓'}
      </Text>
    </View>
  );

  return (
    <BaseChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}
      messageStatusEnable={true}
      unReadSentMessage="Delivered"
      unReadSeenMessage="Read"
      customMessageStatus={customMessageStatus}
    />
  );
};
```

### Bubble Customization

````javascript
export const ChatScreen: React.FC = () => {
  return (
    <BaseChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}4
    />
  );
};
`

### Typing Indicator

```javascript
export const ChatScreen: React.FC = () => {
  return (
    <BaseChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}
      enableTyping={true}
      typingTimeoutSeconds={3}
    />
  );
};
````

## Addons

Additional features for chat are:

#### Image/Video Picker and Camera

This feature will require additional libraries:

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install react-native-video react-native-vision-camera react-native-image-picker --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add react-native-video react-native-vision-camera react-native-image-picker
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

## API Reference

### ChatScreen Props

| Prop                          | Type                                        | Default      | Description                                         |
| ----------------------------- | ------------------------------------------- | ------------ | --------------------------------------------------- |
| `memberIds`                   | `string[]`                                  | **Required** | Array of user IDs participating in the conversation |
| `partners`                    | `IUserInfo[]`                               | **Required** | Array of partner user information                   |
| `style`                       | `StyleProp<ViewStyle>`                      | `undefined`  | Custom style for the main container                 |
| `onStartLoad`                 | `() => void`                                | `undefined`  | Callback when loading starts                        |
| `onLoadEnd`                   | `() => void`                                | `undefined`  | Callback when loading ends                          |
| `maxPageSize`                 | `number`                                    | `20`         | Maximum number of messages to load per page         |
| `inputToolbarProps`           | `IInputToolbar`                             | `undefined`  | Props for customizing the input toolbar             |
| `customConversationInfo`      | `CustomConversationInfo`                    | `undefined`  | Custom conversation information                     |
| `customImageVideoBubbleProps` | `CustomImageVideoBubbleProps`               | `undefined`  | Props for customizing image/video bubbles           |
| `customContainerStyle`        | `StyleProp<ViewStyle>`                      | `undefined`  | Custom style for message containers                 |
| `customTextStyle`             | `StyleProp<ViewStyle>`                      | `undefined`  | Custom style for message text                       |
| `unReadSentMessage`           | `string`                                    | `"Sent"`     | Text to display for unread sent messages            |
| `unReadSeenMessage`           | `string`                                    | `"Seen"`     | Text to display for read messages                   |
| `sendMessageNotification`     | `() => void`                                | `undefined`  | Callback for sending push notifications             |
| `timeoutSendNotify`           | `number`                                    | `5000`       | Timeout before sending notification (ms)            |
| `enableTyping`                | `boolean`                                   | `true`       | Enable typing indicator functionality               |
| `typingTimeoutSeconds`        | `number`                                    | `3`          | Timeout for typing indicator (seconds)              |
| `messageStatusEnable`         | `boolean`                                   | `true`       | Enable message status indicators                    |
| `customMessageStatus`         | `(hasUnread: boolean) => React.JSX.Element` | `undefined`  | Custom message status component                     |

### InputToolbar Props

| Prop                     | Type                                      | Default       | Description                      |
| ------------------------ | ----------------------------------------- | ------------- | -------------------------------- |
| `hasCamera`              | `boolean`                                 | `false`       | Show camera button               |
| `hasGallery`             | `boolean`                                 | `false`       | Show gallery button              |
| `onPressCamera`          | `() => void`                              | `undefined`   | Camera button press handler      |
| `onPressGallery`         | `() => Promise<ImagePickerValue \| void>` | `undefined`   | Gallery button press handler     |
| `containerStyle`         | `StyleProp<ViewStyle>`                    | `undefined`   | Style for the main container     |
| `composeWrapperStyle`    | `StyleProp<ViewStyle>`                    | `undefined`   | Style for the text input wrapper |
| `composerTextInputStyle` | `StyleProp<ViewStyle>`                    | `undefined`   | Style for the text input         |
| `customViewStyle`        | `StyleProp<ViewStyle>`                    | `undefined`   | Style for custom views           |
| `cameraIcon`             | `string`                                  | Built-in icon | Custom camera icon               |
| `galleryIcon`            | `string`                                  | Built-in icon | Custom gallery icon              |
| `iconSend`               | `string`                                  | Built-in icon | Custom send icon                 |
| `iconStyle`              | `StyleProp<ImageStyle>`                   | `undefined`   | Style for all icons              |
| `renderLeftCustomView`   | `() => React.ReactNode`                   | `undefined`   | Custom component on the left     |
| `renderRightCustomView`  | `() => React.ReactNode`                   | `undefined`   | Custom component on the right    |
| `composerTextInputProps` | `Partial<TextInputProps>`                 | `undefined`   | Additional TextInput props       |

### MessageStatus Props

| Prop                   | Type                                        | Default      | Description                   |
| ---------------------- | ------------------------------------------- | ------------ | ----------------------------- |
| `userUnreadMessage`    | `boolean`                                   | **Required** | Whether the message is unread |
| `customContainerStyle` | `StyleProp<ViewStyle>`                      | `undefined`  | Custom container style        |
| `customTextStyle`      | `StyleProp<TextStyle>`                      | `undefined`  | Custom text style             |
| `unReadSentMessage`    | `string`                                    | `"Sent"`     | Text for unread messages      |
| `unReadSeenMessage`    | `string`                                    | `"Seen"`     | Text for read messages        |
| `customMessageStatus`  | `(hasUnread: boolean) => React.JSX.Element` | `undefined`  | Custom status component       |

### CustomBubble Props

| Prop                          | Type                                        | Default      | Description                      |
| ----------------------------- | ------------------------------------------- | ------------ | -------------------------------- |
| `bubbleMessage`               | `BubbleProps<MessageProps>`                 | **Required** | Bubble message props             |
| `position`                    | `'left' \| 'right'`                         | **Required** | Bubble position                  |
| `customImageVideoBubbleProps` | `CustomImageVideoBubbleProps`               | `undefined`  | Image/video bubble customization |
| `onSelectedMessage`           | `(message: MessageProps) => void`           | **Required** | Message selection handler        |
| `userUnreadMessage`           | `boolean`                                   | **Required** | Whether message is unread        |
| `customContainerStyle`        | `StyleProp<ViewStyle>`                      | `undefined`  | Custom container style           |
| `customTextStyle`             | `StyleProp<ViewStyle>`                      | `undefined`  | Custom text style                |
| `unReadSentMessage`           | `string`                                    | `undefined`  | Unread message text              |
| `unReadSeenMessage`           | `string`                                    | `undefined`  | Read message text                |
| `messageStatusEnable`         | `boolean`                                   | **Required** | Enable message status            |
| `customMessageStatus`         | `(hasUnread: boolean) => React.JSX.Element` | `undefined`  | Custom status component          |
| `customBubbleWrapperStyle`    | `StyleProp<ViewStyle>`                      | `undefined`  | Custom bubble wrapper style      |

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
