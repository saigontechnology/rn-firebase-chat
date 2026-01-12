# rn-firebase-chat

A comprehensive React Native Firebase chat library with built-in support for real-time messaging, media sharing, encryption, and more.

## Table of Contents

- [Installation](#installation)
- [Firebase Setup](#firebase-setup)
- [Usage](#usage)
- [Important Code Notes](#important-code-notes)
- [Addons](#addons)
- [Contributing](#contributing)

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

## Firebase Setup

Before using `rn-firebase-chat`, you need to set up a Firebase project. You can do this in two ways:

### Option 1: Manual Setup via Firebase Console

Follow these step-by-step instructions to set up Firebase manually:

#### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter your project name (e.g., "My Chat App")
4. (Optional) Enable Google Analytics for your project
5. Click **"Create project"** and wait for the setup to complete
6. Click **"Continue"** when the project is ready

#### Step 2: Enable Firestore Database

1. In your Firebase project dashboard, click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose a starting mode:
   - **Production mode**: Start with security rules (recommended)
   - **Test mode**: Allows all reads/writes (use only for development)
4. Select a Firestore location (choose the region closest to your users)
5. Click **"Enable"**

#### Step 3: Configure Firestore Security Rules

1. In Firestore Database, go to the **"Rules"** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Conversations for each user
      match /conversations/{conversationId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId;
        
        // Messages within conversations
        match /messages/{messageId} {
          allow read: if request.auth != null && request.auth.uid == userId;
          allow write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

3. Click **"Publish"**

#### Step 4: Enable Firebase Storage

1. In your Firebase project dashboard, click on **"Storage"** in the left sidebar
2. Click **"Get started"**
3. Review the security rules and click **"Next"**
4. Select a storage location (same as your Firestore location is recommended)
5. Click **"Done"**

#### Step 5: Configure Storage Security Rules

1. In Storage, go to the **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat_media/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

#### Step 6: Add Your App to Firebase

**For iOS:**

1. In project settings, click the iOS icon (or **"Add app"** if it's your first app)
2. Enter your iOS bundle ID (found in Xcode under `General` → `Bundle Identifier`)
3. (Optional) Enter app nickname and App Store ID
4. Click **"Register app"**
5. Download `GoogleService-Info.plist`
6. Add the file to your iOS project in Xcode (drag and drop into your project)
7. Follow the SDK setup instructions (usually already done by `@react-native-firebase/app`)
8. Click **"Continue to console"**

**For Android:**

1. In project settings, click the Android icon (or **"Add app"**)
2. Enter your Android package name (found in `android/app/build.gradle` as `applicationId`)
3. (Optional) Enter app nickname
4. (Optional) Enter debug signing certificate SHA-1 (for testing)
5. Click **"Register app"**
6. Download `google-services.json`
7. Place the file in `android/app/google-services.json`
8. Follow the SDK setup instructions (add Google Services plugin to gradle files)
9. Click **"Continue to console"**

#### Step 7: (Optional) Enable Authentication

While `rn-firebase-chat` works without Firebase Authentication, it's highly recommended for production:

1. Click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable your preferred authentication methods:
   - Email/Password
   - Google
   - Phone
   - Anonymous (useful for testing)
   - Others as needed
5. Configure each method according to your requirements

#### Step 8: Verify Setup

1. Go to **"Project settings"** (gear icon in the left sidebar)
2. Scroll to **"Your apps"** section
3. Verify that both iOS and Android apps are listed (if you're building for both platforms)
4. Make sure configuration files are downloaded and placed correctly

### Option 2: Setup via Firebase MCP (Model Context Protocol)

If you have Firebase MCP integrated with your development environment (like Cursor AI), you can use it to assist with Firebase setup:

#### Prerequisites

1. Install and configure Firebase MCP server (see [MCP Integration Guide](https://firebase.google.com/docs/ai-assistance/mcp-server))
2. Ensure Cursor AI or your IDE has access to Firebase MCP tools

#### Using Firebase MCP

You can ask your AI assistant to help with Firebase configuration:

**Example prompts:**

```
"Use Firebase MCP to create Firestore security rules for rn-firebase-chat"

"Help me set up Firebase Storage rules for chat media using Firebase MCP"

"Generate Firebase configuration for a chat application using MCP"
```

The MCP can help you:
- Generate security rules for Firestore and Storage
- Create Firebase configuration files
- Set up authentication rules
- Configure database indexes
- Optimize security rules for your use case

**Note**: While MCP can assist with configuration, you still need to:
1. Create the Firebase project manually in Firebase Console
2. Enable Firestore and Storage services
3. Download configuration files (`GoogleService-Info.plist` and `google-services.json`)
4. Apply the generated rules in Firebase Console

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

## Important Code Notes

### 1. Understanding `memberIds` in ChatScreen

**Important**: The `memberIds` prop in `ChatScreen` should **NOT** include the current user's ID.

- `memberIds`: Array of partner/other user IDs only (excludes current user)
- The current user's information is automatically retrieved from `ChatProvider`

**Example:**

```javascript
// ✅ CORRECT - Only includes partner's ID
const currentUser = { id: 'user123', name: 'John', avatar: '...' };
const partner = { id: 'user456', name: 'Jane', avatar: '...' };

<ChatProvider userInfo={currentUser}>
  <ChatScreen 
    memberIds={['user456']} // Only partner's ID
    partners={[partner]} 
  />
</ChatProvider>

// ❌ WRONG - Don't include current user's ID
<ChatScreen 
  memberIds={['user123', 'user456']} // Don't include 'user123'
  partners={[currentUser, partner]} 
/>
```

**Why?** The library automatically creates conversation members by combining the current user ID (from `ChatProvider`) with the `memberIds` you provide. See the source code:

```typescript
// Internal behavior in createConversation
members: [this.userId, ...memberIds]  // Current user ID is added automatically
```

### 2. Accessing Chat State and Dispatch

The `ChatProvider` exposes `chatState` and `chatDispatch` through the `useChat` hook from `rn-firebase-chat`.

**Access chat context in your components:**

```javascript
import { useChat } from 'rn-firebase-chat';

function MyComponent() {
  const { chatState, chatDispatch, userInfo, firestoreServices } = useChat();
  
  // Access conversation list
  const conversations = chatState?.conversations || [];
  
  // Access current conversation
  const currentConversation = chatState?.conversation;
  
  // Dispatch actions
  // (use action creators from 'rn-firebase-chat')
  
  return (
    // Your component JSX
  );
}
```

**Available from `useChat` hook:**

- `chatState`: Current state containing conversations and messages
  - `chatState.conversations`: List of all conversations
  - `chatState.conversation`: Currently active conversation
- `chatDispatch`: Function to dispatch actions to update state
- `userInfo`: Current user information from ChatProvider
- `firestoreServices`: Firebase service instance for custom operations
- All other props passed to `ChatProvider`

**Using `useChatSelector` for optimized access:**

```javascript
import { useChatSelector, getConversation } from 'rn-firebase-chat';

function MyComponent() {
  // Only re-renders when the selected state changes
  const currentConversation = useChatSelector(getConversation);
  
  return (
    // Your component JSX
  );
}
```

**Other available selectors:**
```javascript
import { getListConversation, getConversation } from 'rn-firebase-chat';

// Get all conversations
const conversations = useChatSelector(getListConversation);

// Get current active conversation
const conversation = useChatSelector(getConversation);
```

### 3. Group Chat vs One-on-One Chat

**One-on-One Chat:**
```javascript
<ChatScreen 
  memberIds={['partnerId']} 
  partners={[{ id: 'partnerId', name: 'Partner', avatar: '...' }]} 
/>
```

**Group Chat:**
```javascript
<ChatScreen 
  memberIds={['user1', 'user2', 'user3']} 
  partners={[
    { id: 'user1', name: 'User 1', avatar: '...' },
    { id: 'user2', name: 'User 2', avatar: '...' },
    { id: 'user3', name: 'User 3', avatar: '...' }
  ]}
  customConversationInfo={{
    name: 'Group Name',
    image: 'group-avatar-url',
    isGroup: true
  }}
/>
```

### 4. Message Encryption

If you want to enable end-to-end encryption:

```javascript
<ChatProvider 
  userInfo={currentUser}
  enableEncrypt={true}
  encryptKey="your-secure-encryption-key"
  encryptionOptions={{
    algorithm: 'aes-256-cbc'
  }}
>
  {/* Your app */}
</ChatProvider>
```

**Note**: Make sure to securely store and manage encryption keys. Lost keys mean lost message history.

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

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)