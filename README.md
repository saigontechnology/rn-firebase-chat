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

# Props

## ChatProvider

The `ChatProvider` component is used to manage the chat context and provide configurations for encryption, blacklist words, and other chat-related settings.

## ChatProvider Props

### Required Props

| Prop Name  | Type            | Description                                |
|------------|-----------------|--------------------------------------------|
| `userInfo` | IUserInfo       | Current User information object includes id, name, avatar.                   |
| `children` | React.ReactNode | React children elements.                   |

### Optional Props

| Prop Name            | Type                          | Description                                                           |
|----------------------|-------------------------------|-----------------------------------------------------------------------|
| `enableEncrypt`      | boolean                       | Enables encryption if set to true. Default is false.                  |
| `encryptKey`         | string                        | The key used for encryption. Default is an empty string.              |
| `blackListWords`     | string[]                      | Array of words to be blacklisted.                                     |
| `encryptionOptions`  | EncryptionOptions             | Options for configuring encryption.                                   |
| `encryptionFuncProps`| EncryptionFunctions           | Function properties for custom encryption functions.                  |
| `prefix`             | string                        | Prefix for chat configurations, useful for different environments like dev, stage, and prod. Default is an empty string.           |
## ChatScreen Component

The `ChatScreen` component is used to display chat messages and provides various functionalities such as sending messages, loading conversations, and handling media. This component accepts several props to customize its behavior and appearance.

### Required Props

| Prop Name                | Type                              | Description                                     |
|--------------------------|-----------------------------------|-------------------------------------------------|
| `memberIds`              | string[]                          | Array of member IDs in the chat.                |
| `partners`               | IUserInfo[]                       | Array of user information for chat partners.    |

### Optional Props

| Prop Name                | Type                              | Description                                     |
|--------------------------|-----------------------------------|-------------------------------------------------|
| `style`                  | StyleProp<ViewStyle>              | Custom style for the chat screen container.     |
| `onStartLoad`            | () => void                        | Callback function when loading starts.                   |
| `onLoadEnd`              | () => void                        | Callback function when loading ends.                     |
| `maxPageSize`            | number                            | Maximum number of messages to load per page.    |
| `inputToolbarProps`      | IInputToolbar                     | Props for customizing the input toolbar.        |
| `hasCamera`              | boolean                           | Enables camera functionality if true.           |
| `hasGallery`             | boolean                           | Enables gallery functionality if true.          |
| `customImageVideoBubbleProps` | CustomImageVideoBubbleProps  | Custom props for image and video bubbles.       |
| `onPressCamera`          | () => void                        | Callback function for camera button press.               |
| `customConversationInfo` | CustomConversationInfo            | Custom information for the conversation.        |
| `customContainerStyle`   | StyleProp<ViewStyle>              | Custom style for the message container.         |
| `customTextStyle`        | StyleProp<ViewStyle>              | Custom style for text messages.                 |
| `unReadSentMessage`      | string                            | Custom text unread sent message in Chat.        |
| `unReadSeenMessage`      | string                            | Custom text unread message message in Chat.     |
| `sendMessageNotification`| () => void                        | Callback function to send notification                   |
| `timeoutSendNotify`      | number                            | Timeout for sending notifications (default 3s).  |
| `enableTyping`           | boolean                           | Enables typing indicator if true.               |
| `typingTimeoutSeconds`   | number                            | Timeout for typing indicator (default 3s).                   |
| `messageStatusEnable`    | boolean                           | Enables message status indicators if true.      |
| `customMessageStatus`    | (hasUnread: boolean) => JSX.Element | Custom component for message status.            |
| `iconsCamera`            | IconPaths                         | Paths for various camera icons.                 |

### IInputToolbar

`inputToolbarProps` is an object that allows you to customize the input toolbar. Here are its properties:

| Prop Name                | Type                     | Description                                                      |
|--------------------------|--------------------------|------------------------------------------------------------------|
| `hasCamera`              | boolean                  | Indicates whether the camera option is enabled.                  |
| `hasGallery`             | boolean                  | Indicates whether the gallery option is enabled.                 |
| `onPressCamera`          | (() => void)             | Callback function triggered when the camera icon is pressed.     |
| `onPressGallery`         | (() => void)             | Callback function triggered when the gallery icon is pressed.    |
| `containerStyle`         | StyleProp<ViewStyle>     | Custom style for the toolbar container.                          |
| `composeWrapperStyle`    | StyleProp<ViewStyle>     | Custom style for the compose wrapper.                            |
| `composerTextInputStyle` | StyleProp<ViewStyle>     | Custom style for the composer text input.                        |
| `customViewStyle`        | StyleProp<ViewStyle>     | Custom style for the custom view.                                |
| `cameraIcon`             | string                   | Icon for the camera button.                                      |
| `galleryIcon`            | string                   | Icon for the gallery button.                                     |
| `iconSend`               | string                   | Icon for the send button.                                        |
| `iconStyle`              | StyleProp<ImageStyle>    | Custom style for the icons.                                      |
| `renderLeftCustomView`   | (() => React.ReactNode)  | Function to render a custom view on the left side of the toolbar.|
| `renderRightCustomView`  | (() => React.ReactNode)  | Function to render a custom view on the right side of the toolbar.|

### ListConversationScreen

The `ListConversationScreen` component displays a list of conversations, with optional customization for the list items and a search bar.

| Prop Name                | Type                              | Description                                                      |
|--------------------------|-----------------------------------|------------------------------------------------------------------|
| `hasSearchBar`           | boolean                           | Indicates whether a search bar should be displayed.              |
| `onPress`                | (conversation: ConversationProps) => void | Callback function triggered when a conversation item is pressed. |
| `renderCustomItem`       | ({ item, index }: ListItem) => JSX.Element | Function to render a custom item for the list. Returns a JSX element or null. |
| `conversationItemProps`  |Omit of IConversationItemProps, excluding data and onPress | Properties for customizing conversation items in ConversationItem component |

### GalleryScreen

the `GalleryScreen` component, which supports displaying various types of content such as media, links, and documents.

| Prop Name                | Type                                                      | Description                                                                                     |
|--------------------------|-----------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `renderCustomHeader`     | () => JSX.Element                                         | Function to render a custom header for the gallery modal.                                      |
| `renderCustomMedia`      | ({ item, index }: MediaItem) => JSX.Element | Function to render custom media items, such as images or videos. Returns a JSX element or null. |
| `renderCustomFile`       | () => JSX.Element                                         | Function to render custom file items, such as documents.                                        |
| `renderCustomLink`       | () => JSX.Element                                         | Function to render custom link items.                                                           |
| `iconCloseModal`         | ImageRequireSource                                        | Icon to display for closing the modal.                                                           |
| `customSlider`           | (currentTime: number, duration: number, paused: boolean, videoRef: VideoRef) => React.ReactNode | Custom slider. |
| `headerStyle`            | StyleProp<ViewStyle>                                     | Custom style for the header of the modal.                                                        |
| `tabStyle`               | StyleProp<ViewStyle>                                     | Custom style for the tabs in the modal.                                                         |
| `activeTabStyle`         | StyleProp<ViewStyle>                                     | Custom style for the active tab in the modal.                                                   |
| `tabTextStyle`           | StyleProp<ViewStyle>                                     | Custom style for the tab text.                                                                  |
| `activeTabTextStyle`     | StyleProp<ViewStyle>                                     | Custom style for the text of the active tab.                                                    |
| `tabIndicatorStyle`      | StyleProp<ViewStyle>                                     | Custom style for the tab indicator.                                                             |
| `containerStyle`         | StyleProp<ViewStyle>                                     | Custom style for the main container of the modal.                                                |


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
