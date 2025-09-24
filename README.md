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

## API Reference

### ChatProvider

The main provider component that wraps your app and provides chat functionality.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userInfo` | `IUserInfo` | Yes | Current user information |
| `enableEncrypt` | `boolean` | No | Enable message encryption (default: false) |
| `blackListWords` | `string[]` | No | Array of words to filter out |
| `encryptionOptions` | `EncryptionOptions` | No | Custom encryption settings |
| `encryptionFuncProps` | `EncryptionFunctions` | No | Custom encryption functions |
| `encryptKey` | `string` | No | Encryption key for messages |
| `prefix` | `string` | No | Prefix for messages |

#### IUserInfo

```typescript
interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}
```

### ListConversationScreen

Displays a list of conversations for the current user.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onPress` | `(data: CustomConversationInfo) => void` | Yes | Callback when conversation is pressed |

### ChatScreen

Main chat interface for messaging.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `memberIds` | `string[]` | Yes | Array of user IDs in the conversation |
| `partners` | `IUserInfo[]` | Yes | Array of partner user information |
| `inputToolbarProps` | `InputToolbarProps` | No | Custom input toolbar configuration |

#### InputToolbarProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `hasCamera` | `boolean` | No | Show camera button (default: false) |
| `hasGallery` | `boolean` | No | Show gallery button (default: false) |
| `onPressCamera` | `() => void` | No | Camera button press handler |
| `onPressGallery` | `() => void` | No | Gallery button press handler |

### TypeScript Interfaces

#### Core Data Types

```typescript
// User profile structure
interface UserProfileProps {
  id: string;
  status: 'online' | 'offline';
  name: string;
  created?: number;
  updated?: number;
  conversations?: CollectionReference<ConversationProps>;
}

// Conversation structure
interface ConversationProps {
  id: string;
  latestMessage?: LatestMessageProps;
  updatedAt: number;
  members: string[];
  name?: string;
  image?: string;
  typing?: { [userId: string]: boolean };
  unRead?: number;
}

// Message structure
interface MessageProps {
  id: string;
  text: string;
  senderId: string;
  readBy: { [userId: string]: boolean };
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  createdAt: Date | number;
}
```

#### Enums

```typescript
enum MessageTypes {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
}

enum MessageStatus {
  sent,
  received,
  seen,
  failed,
}

enum GalleryType {
  MEDIA = 'Media',
  FILE = 'File',
  LINK = 'Link',
}
```

### Encryption Features

The library supports end-to-end encryption for messages.

#### EncryptionOptions

```typescript
interface EncryptionOptions {
  salt?: string;
  iterations?: number;
  keyLength?: number;
}
```

#### EncryptionFunctions

```typescript
interface EncryptionFunctions {
  encryptFunctionProp: (text: string) => Promise<string>;
  decryptFunctionProp: (text: string) => Promise<string>;
  generateKeyFunctionProp: (key: string) => Promise<string>;
}
```

#### Usage with Encryption

```javascript
import { ChatProvider } from 'rn-firebase-chat';

const encryptionOptions = {
  salt: 'your-salt',
  iterations: 10000,
  keyLength: 256,
};

const encryptionFunctions = {
  encryptFunctionProp: async (text) => {
    // Your encryption logic
    return encryptedText;
  },
  decryptFunctionProp: async (text) => {
    // Your decryption logic
    return decryptedText;
  },
  generateKeyFunctionProp: async (key) => {
    // Your key generation logic
    return generatedKey;
  },
};

function App() {
  return (
    <ChatProvider
      userInfo={userInfo}
      enableEncrypt={true}
      encryptionOptions={encryptionOptions}
      encryptionFuncProps={encryptionFunctions}
      encryptKey="your-encryption-key"
    >
      <AppNavigation />
    </ChatProvider>
  );
}
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

#### Gallery Screen

The library includes a gallery screen for viewing media files.

```javascript
import { GalleryScreen } from 'rn-firebase-chat';

// Usage in navigation
<Stack.Screen name="Gallery" component={GalleryScreen} />
```

## User Flow

For detailed user flow documentation including visual diagrams and database operations, see [User Flow Documentation](src/interfaces/firestoreDatabaseStruct.md#user-flow).

## Database Structure

The library uses Firestore with the following structure:

- **conversations**: Root collection containing conversation documents
- **users**: Root collection containing user profile documents
- **messages**: Subcollection under each conversation containing message documents

For detailed database structure, see [Firestore Database Structure](src/interfaces/firestoreDatabaseStruct.md).

## Examples

### Basic Chat Implementation

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatProvider, ListConversationScreen, ChatScreen } from 'rn-firebase-chat';

const Stack = createStackNavigator();

const userInfo = {
  id: 'user123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
};

const App = () => {
  return (
    <ChatProvider userInfo={userInfo}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Conversations" 
            component={ListConversationScreen} 
            options={{ title: 'Chats' }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ChatProvider>
  );
};

export default App;
```

### Advanced Chat with Custom Features

```javascript
import React, { useCallback } from 'react';
import { ChatProvider, ListConversationScreen, ChatScreen } from 'rn-firebase-chat';
import { useCamera } from 'rn-firebase-chat/src/addons/camera';

const CustomListScreen = () => {
  const handleConversationPress = useCallback((conversation) => {
    // Navigate to chat screen with conversation data
    navigation.navigate('Chat', { conversationId: conversation.id });
  }, []);

  return (
    <ListConversationScreen onPress={handleConversationPress} />
  );
};

const CustomChatScreen = ({ route }) => {
  const { conversationId } = route.params;
  const { onPressCamera, onPressGallery } = useCamera();
  
  const partners = [
    {
      id: 'partner123',
      name: 'Jane Smith',
      avatar: 'https://example.com/jane.jpg',
    }
  ];

  return (
    <ChatScreen
      memberIds={[userInfo.id, 'partner123']}
      partners={partners}
      inputToolbarProps={{
        hasCamera: true,
        hasGallery: true,
        onPressCamera,
        onPressGallery,
      }}
    />
  );
};
```

### Chat with Encryption

```javascript
import React from 'react';
import { ChatProvider } from 'rn-firebase-chat';
import CryptoJS from 'crypto-js';

const encryptionFunctions = {
  encryptFunctionProp: async (text) => {
    const encrypted = CryptoJS.AES.encrypt(text, 'your-secret-key').toString();
    return encrypted;
  },
  decryptFunctionProp: async (encryptedText) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, 'your-secret-key');
    return decrypted.toString(CryptoJS.enc.Utf8);
  },
  generateKeyFunctionProp: async (key) => {
    return CryptoJS.SHA256(key).toString();
  },
};

const App = () => {
  return (
    <ChatProvider
      userInfo={userInfo}
      enableEncrypt={true}
      encryptionOptions={{
        salt: 'your-salt',
        iterations: 10000,
        keyLength: 256,
      }}
      encryptionFuncProps={encryptionFunctions}
      encryptKey="your-encryption-key"
      blackListWords={['spam', 'inappropriate']}
    >
      <YourAppContent />
    </ChatProvider>
  );
};
```

### Custom Message Types

```javascript
import React from 'react';
import { ChatScreen } from 'rn-firebase-chat';

const CustomChatScreen = () => {
  const handleSendMessage = (messages) => {
    // Custom message handling
    messages.forEach(message => {
      if (message.type === 'custom') {
        // Handle custom message type
        console.log('Custom message:', message);
      }
    });
  };

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      onSend={handleSendMessage}
    />
  );
};
```

## Security Features

- **Message Encryption**: Optional end-to-end encryption for messages
- **Blacklist Filtering**: Filter out inappropriate words
- **Read Receipts**: Track message read status
- **Typing Indicators**: Real-time typing status
- **Message Status**: Track delivery status (sent, received, seen, failed)

## Troubleshooting

### Common Issues

1. **Firebase Configuration**
   - Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are properly configured
   - Check Firebase project settings and enable Firestore

2. **Permissions**
   - Camera: Add camera permissions for camera functionality
   - Storage: Add storage permissions for media uploads
   - Microphone: Add microphone permissions for voice messages

3. **Dependencies**
   - Ensure all peer dependencies are installed
   - Check React Native version compatibility

### Performance Tips

- Use `react-native-fast-image` for better image performance
- Implement pagination for large conversation lists
- Optimize image sizes before uploading
- Use proper Firestore indexing for queries

## Migration Guide

### From v1.x to v2.x

1. Update import statements:
   ```javascript
   // Old
   import { ChatProvider } from 'rn-firebase-chat';
   
   // New
   import { ChatProvider, ListConversationScreen, ChatScreen } from 'rn-firebase-chat';
   ```

2. Update ChatProvider props:
   ```javascript
   // Old
   <ChatProvider userInfo={userInfo}>
   
   // New
   <ChatProvider 
     userInfo={userInfo}
     enableEncrypt={false}
     blackListWords={[]}
   >
   ```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
