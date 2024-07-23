# rn-firebase-chat

RN Firebase Chat

## Installation

```sh
npm install rn-firebase-chat
```

## Installation

- Using [npm](https://www.npmjs.com/#getting-started):

```sh
npm install rn-firebase-chat@git+https://github.com/saigontechnology/rn-firebase-chat.git @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-vision-camera@4.2.1 react-native-image-picker react-native-fast-image --save
```

- Using [Yarn](https://yarnpkg.com/):

```sh
yarn add rn-firebase-chat@git+https://github.com/saigontechnology/rn-firebase-chat.git @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-vision-camera@4.2.1 react-native-image-picker react-native-fast-image
```

## Usage

- Wrap your app with `ChatProvider`

```javascript
import { ChatProvider } from 'rn-firebase-chat';

const userInfo = {
  id: 'Flash',
  name: 'Flash',
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
  const handleItemPress = useCallback((data: object | undefined) => {
    navigate(RouteKey.ChatScreen, data);
  }, []);

  return <ListConversationScreen onPress={handleItemPress} />;
};
```

```javascript
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatScreen as BaseChatScreen } from 'rn-firebase-chat';

const userInfo = {
  avatar: 'https://shorturl.at/I1BZZ',
  id: 'Vibe',
  name: 'Vibe',
};
const partnerInfo = {
  id: 'Flash',
  name: 'Flash',
  avatar: 'https://shorturl.at/ejilU',
};

export const ChatScreen: React.FC = () => {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <BaseChatScreen
        partners={[userInfo, partnerInfo]}
        memberIds={[userInfo.id, partnerInfo.id]}
        renderLoadEarlier={() => {
          return <ActivityIndicator style={styles.loadEarlier} />;
        }}
        hasCamera
        hasGallery
        renderAvatar={() => (
          <FastImage
            source={{ uri: partnerInfo.avatar }}
            resizeMode={FastImage.resizeMode.cover}
            style={styles.avatar}
          />
        )}
        messagesContainerStyle={styles.messageContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadEarlier: {
    marginVertical: 20,
  },
  avatar: {
    width: 28,
    aspectRatio: 1,
    borderRadius: 14,
  },
  messageContainer: { paddingBottom: 10 },
});
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
