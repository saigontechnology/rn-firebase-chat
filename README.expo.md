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

If you use EAS Build, ensure you have initialized your project for the new architecture as needed by your RN/Expo version.

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
        microphonePermissionText: '$(PRODUCT_NAME) needs access to your Microphone.',
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
- `buildReactNativeFromSource: true` is required to fix Firebase build issues with non-modular headers.

### 3) Add Firebase configuration files

Place your Firebase config files in the native project directories:

- Android: put `google-services.json` in `android/app/google-services.json`
- iOS: put `GoogleService-Info.plist` in `ios/GoogleService-Info.plist`

If you are using EAS Build and prefer referencing paths via config, you can also set:

```ts
// inside the same app.config.ts
ios: {
  googleServicesFile: './ios/GoogleService-Info.plist',
},
android: {
  googleServicesFile: './android/app/google-services.json',
},
```

### 4) Troubleshooting

#### Firebase Build Error: "include of non-modular header inside framework module"

If you encounter this error during iOS build:

```
❌  (/path/to/node_modules/@react-native-firebase/app/ios/RNFBApp/RCTConvert+FIRApp.h:19:9)

  17 | 
  18 | #import <FirebaseCore/FirebaseCore.h>
> 19 | #import <React/RCTConvert.h>
     |         ^ include of non-modular header inside framework module 'RNFBApp.RCTConvert_FIRApp': '/path/to/ios/Pods/Headers/Public/React-Core/React/RCTConvert.h' [-Werror,-Wnon-modular-include-in-framework-module]
```

**Solution:** Add `buildReactNativeFromSource: true` to your `expo-build-properties` configuration:

```ts
[
  'expo-build-properties',
  {
    ios: {
      useFrameworks: 'static',
      buildReactNativeFromSource: true, // Add this line
    },
  },
],
```

This forces React Native to build from source, resolving the modular header conflict with Firebase.

### 5) Prebuild and run

If you are using the managed workflow, run prebuild to generate native projects with the configured plugins:

```sh
expo prebuild --clean
```

Then build and run with your preferred workflow (EAS Build or local builds).


