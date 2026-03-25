## Expo Configuration Guide

This guide explains how to configure an Expo app to use `rn-firebase-chat`, including the necessary `plugins` in `app.config.ts` and Firebase configuration files for Android and iOS.

### 1) Install dependencies

Install the library and peer dependencies, plus `expo-build-properties` (required for the `plugins` configuration below):

> **Note** Skip this if you have already installed these libs following main README file.

```sh
yarn add rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-keyboard-controller react-native-video react-native-vision-camera react-native-image-picker expo-build-properties
```

or

```sh
npm install rn-firebase-chat @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/storage randomcolor react-native-aes-crypto react-native-gifted-chat react-native-keyboard-controller react-native-video react-native-vision-camera react-native-image-picker expo-build-properties --save
```

Ensure your Expo project is compatible with the React Native version required by the library.

### 2) Configure `app.config.ts`

Add the following `plugins` to your Expo config. Using `app.config.ts` is recommended so inline comments are supported.

```ts
// app.config.ts
import { ExpoConfig } from 'expo';

const config: ExpoConfig = {
  name: 'YourAppName',
  slug: 'your-app-slug',
  plugins: [
    // ...remaining config
    // <-- Adding these values -->
    '@react-native-firebase/app',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    [
      'react-native-video',
      {
        enableNotificationControls: true,
        androidExtensions: {
          useExoplayerRtsp: false,
          useExoplayerSmoothStreaming: false,
          useExoplayerHls: false,
          useExoplayerDash: false,
        },
      },
    ],
    [
      'react-native-vision-camera',
      {
        cameraPermissionText: '$(PRODUCT_NAME) needs access to your Camera.',
        // optionally, if you want to record audio:
        enableMicrophonePermission: true,
        microphonePermissionText:
          '$(PRODUCT_NAME) needs access to your Microphone.',
      },
    ],
    // <-- Adding these values -->
  ],
};

export default config;
```

Notes:

- `expo-build-properties` is required for `ios.useFrameworks = "static"` to support some native modules.
- `@react-native-firebase/app` config enables Firebase auto-configuration.
- `react-native-video` and `react-native-vision-camera` require native configuration when prebuilding.

### 3) Add Firebase configuration files

Place your Firebase config files in the project directories:

```ts
// inside the same app.config.ts
ios: {
   googleServicesFile: './google-services/ios/GoogleService-Info.plist',
},
android: {
  googleServicesFile: './google-services/android/google-services.json',
},
```

### 4) Prebuild and run

For managed workflow, run prebuild to generate native projects with the configured plugins:

```sh
expo prebuild --clean
```

Then run your app:

```sh
# For development
expo run:ios
expo run:android

# Or using npx
npx expo run:ios
npx expo run:android
```

### 5) Usage with Expo

After setup, you can use all the customization features available in the main library:

```tsx
// App.tsx or your chat screen component
import React from 'react';
import { ChatProvider, ChatScreen } from 'rn-firebase-chat';
import { CameraView, useCamera } from 'rn-firebase-chat/src/addons/camera';

const userInfo = {
  id: 'user123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
};

const partnerInfo = {
  id: 'partner123',
  name: 'Jane Smith',
  avatar: 'https://example.com/jane.jpg',
};

function ChatScreenComponent() {
  const { onPressCamera, onPressGallery } = useCamera();

  return (
    <ChatScreen
      memberIds={[partnerInfo.id]}
      partners={[partnerInfo]}
      messageStatusEnable={true}
      enableTyping={true}
      inputToolbarProps={{
        hasCamera: true,
        hasGallery: true,
        onPressCamera,
        onPressGallery,
      }}
    >
      {({ onSend }) => <CameraView onSend={onSend} />}
    </ChatScreen>
  );
}

export default function App() {
  return (
    <ChatProvider userInfo={userInfo}>
      <ChatScreenComponent />
    </ChatProvider>
  );
}
```

### Notes for Expo Development

- All styling and customization options work the same as in standard React Native projects
- Make sure to test camera and gallery features on physical devices, as they may not work properly in simulators
- Camera and microphone permissions are automatically handled by the plugins configuration
- For development, you may need to clear Metro cache when adding new assets: `expo start --clear`
- If you encounter issues with Firebase, ensure your configuration files are in the correct paths as specified in `app.config.ts`
