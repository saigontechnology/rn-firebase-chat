# rn-firebase-chat

A comprehensive React Native chat library built with Firebase, featuring real-time messaging, media sharing, encryption, and customizable UI components.

## ✨ Features

### 🔥 **Core Chat Functionality**
- **Real-time Messaging** - Instant messaging with Firebase Firestore
- **Message Status Tracking** - Sent, received, seen, and failed status indicators
- **Typing Indicators** - Real-time typing status with customizable timeouts
- **Message Pagination** - Efficient loading of message history with configurable page sizes
- **Conversation Management** - Automatic conversation creation and management

### 📱 **Media & Content Sharing**
- **Camera Integration** - Built-in camera with photo and video capture
  - Front/back camera switching
  - Flash control
  - Video recording with timer
  - Custom camera icons and styling
- **Gallery Support** - Media gallery with three categories:
  - **Media Tab** - Images and videos with thumbnail previews
  - **Files Tab** - Document sharing (customizable)
  - **Links Tab** - Shared links (customizable)
- **Video Player** - Full-featured video player with:
  - Play/pause controls
  - Seek functionality
  - Custom slider support
  - Duration display
- **Image Viewer** - Full-screen image viewing with zoom capabilities

### 🔒 **Security & Privacy**
- **Message Encryption** - Optional AES encryption for secure conversations
- **Custom Encryption Functions** - Support for custom encryption implementations
- **Content Filtering** - Blacklist words with regex pattern support
- **Environment Separation** - Prefix support for dev/staging/production environments

### 🎨 **Customization & Theming**
- **Highly Customizable UI** - Every component can be styled
- **Custom Message Bubbles** - Support for custom message bubble designs
- **Input Toolbar Customization** - Fully customizable input area with:
  - Custom icons and buttons
  - Left and right custom views
  - Configurable camera and gallery buttons
- **Theme Support** - Built for theme providers and dark mode
- **Responsive Design** - Adaptive layouts for tablets and different screen sizes

### 🛠 **Developer Experience**
- **TypeScript Support** - Full TypeScript definitions and interfaces
- **React Hooks** - Custom hooks for chat state management and typing indicators
- **Flexible Architecture** - Modular components that can be used independently
- **Extensive Props** - Comprehensive prop interfaces for maximum flexibility
- **Custom Renderers** - Support for custom item renderers in lists and galleries

### 🔧 **Advanced Features**
- **Performance Optimization** - Efficient message loading and memory management
- **Error Handling** - Built-in error handling for network and encryption failures
- **Firebase Storage Integration** - Automatic media file uploads to Firebase Storage
- **User Profile Management** - Automatic user profile creation and management
- **Real-time Updates** - Live conversation and message updates
- **Search Functionality** - Built-in conversation search capabilities

## 📦 Installation

### Prerequisites

Before installing `rn-firebase-chat`, ensure you have the following dependencies in your React Native project:

#### Core Dependencies
```sh
# Using npm
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-fast-image react-native-video uuid

# Using Yarn
yarn add @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-fast-image react-native-video uuid
```

#### Camera Dependencies (Optional - for camera features)
```sh
# Using npm
npm install react-native-vision-camera

# Using Yarn
yarn add react-native-vision-camera
```

> **📋 Note:** Camera functionality requires `react-native-vision-camera`. If you don't need camera features, you can skip this dependency and set `hasCamera={false}` in your ChatScreen props.

### Install the Library

```sh
# Using npm
npm install rn-firebase-chat

# Using Yarn
yarn add rn-firebase-chat
```

## 🚀 Quick Start

### 1. Setup Firebase Configuration

Make sure you have Firebase configured in your React Native project. Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) files to your project.
> **ℹ️ Note:** For detailed Firebase setup instructions, refer to the [official React Native Firebase documentation](https://rnfirebase.io/#installation-for-react-native-cli-non-expo-projects).


### 2. Wrap Your App with ChatProvider

```javascript
import React from 'react';
import { ChatProvider } from 'rn-firebase-chat';

// Note: The `userInfo` object should represent the currently logged-in user in your app.
// Make sure to set these values after user authentication (e.g., after login).
const userInfo = {
  id: 'user123', // The unique ID of the logged-in user
  name: 'John Doe', // The display name of the logged-in user
  avatar: 'https://example.com/avatar.jpg' // The avatar URL of the logged-in user
};

function App() {
  return (
    <ChatProvider userInfo={userInfo}>
      <AppNavigation />
    </ChatProvider>
  );
}

export default App;
```

### 3. Setup Navigation

Create a navigation structure for your chat screens:

```javascript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ListConversationScreen, ChatScreen } from 'rn-firebase-chat';

const Stack = createStackNavigator();

export const ChatNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Conversations"
      component={ListChatScreen}
      options={{ title: 'Messages' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);
```

### 4. Create Your Chat Screens

#### List Conversations Screen

```javascript
import React, { useCallback } from 'react';
import { ListConversationScreen } from 'rn-firebase-chat';
import { useNavigation } from '@react-navigation/native';

export const ListChatScreen = () => {
  const navigation = useNavigation();

  const handleConversationPress = useCallback((conversation) => {
    navigation.navigate('Chat', {
      memberIds: conversation.memberIds,
      partners: conversation.partners
    });
  }, [navigation]);

  return (
    <ListConversationScreen 
      onPress={handleConversationPress}
      hasSearchBar={true}
    />
  );
};
```

#### Individual Chat Screen

```javascript
import React from 'react';
import { ChatScreen } from 'rn-firebase-chat';

export const ChatScreen = ({ route }) => {
  const { memberIds, partners } = route.params;

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      // Core Features
      hasCamera={true}
      hasGallery={true}
      enableTyping={true}
      messageStatusEnable={true}
      
      // Performance Configuration
      maxPageSize={25}
      typingTimeoutSeconds={3}
      timeoutSendNotify={2}
      
      // Event Handlers
      onStartLoad={() => console.log('Loading messages...')}
      onLoadEnd={() => console.log('Messages loaded')}
      sendMessageNotification={() => console.log('New message notification')}
      
      // Custom Styling
      customContainerStyle={{
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
      }}
      customTextStyle={{
        fontSize: 16,
        color: '#333333',
      }}
      
      // Input Toolbar Customization
      inputToolbarProps={{
        hasCamera: true,
        hasGallery: true,
        containerStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
        },
        composerTextInputStyle: {
          backgroundColor: '#f5f5f5',
          borderRadius: 20,
          paddingHorizontal: 15,
        }
      }}
    />
  );
};
```

## 📚 Documentation

For comprehensive documentation, see the full [Documentation](doc/README.md) here:

- **[Props Reference](doc/PROPS_REFERENCE.md)** - Complete API documentation with all props and interfaces
- **[Advanced Configuration](doc/ADVANCED_CONFIGURATION.md)** - Encryption, environment setup, and performance optimization
- **[Custom Styling](doc/CUSTOM_STYLING.md)** - Theme customization, component styling, and design patterns

### 📋 **Component Overview**

| Component | Description | Key Features |
|-----------|-------------|--------------|
| **`ChatProvider`** | Main provider for chat context and configuration | Encryption, blacklist filtering, environment prefixes |
| **`ChatScreen`** | Complete chat interface with messaging and media | Real-time messaging, camera, gallery, typing indicators, message status |
| **`ListConversationScreen`** | Conversation list with search functionality | Search bar, custom item renderers, conversation management |
| **`GalleryScreen`** | Media gallery with tabbed interface | Media/Files/Links tabs, custom renderers, full-screen viewing |

### 🔧 **Available Hooks**

| Hook | Purpose | Usage |
|------|---------|-------|
| **`useChatContext`** | Access chat context and state | Get user info, chat state, dispatch actions |
| **`useChatSelector`** | Select specific chat state data | Efficiently select and subscribe to state changes |
| **`useTypingIndicator`** | Manage typing indicator behavior | Handle typing start/stop with customizable timeouts |

### 📦 **Exported Utilities**

| Category | Available Utilities |
|----------|-------------------|
| **Date Formatting** | Time formatting, timestamp utilities |
| **Encryption** | AES encryption, key generation, custom encryption support |
| **Message Formatting** | Text formatting, blacklist filtering, message sanitization |
| **Media Handling** | File type detection, media validation, path utilities |
| **Color Utilities** | Color generation, theme helpers |

### 📨 **Supported Message Types**

| Type | Description | Features |
|------|-------------|----------|
| **Text Messages** | Standard text messaging | Encryption support, blacklist filtering, typing indicators |
| **Image Messages** | Photo sharing and viewing | Camera capture, gallery selection, full-screen viewing |
| **Video Messages** | Video sharing and playback | Video recording, thumbnail previews, custom video player |
| **Voice Messages** | Audio message support | Ready for voice message integration |

### 📱 **Platform Support**

- ✅ **iOS** - Full feature support including camera and media
- ✅ **Android** - Full feature support including camera and media
- 🔧 **React Native CLI** - Fully supported
- 🔧 **Expo** - Supported with custom development build (camera features require custom build)



## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to:

- Report bugs
- Suggest new features
- Submit pull requests
- Set up the development environment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
