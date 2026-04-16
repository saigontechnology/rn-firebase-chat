import { ExpoConfig } from 'expo/config';
import dotenv from 'dotenv';

dotenv.config();

const config: ExpoConfig = {
  name: 'rn-firebase-chat-example',
  slug: 'rn-firebase-chat-example',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sts.demo.chatapp',
    googleServicesFile: './ios/rnfirebasechatexample/GoogleService-Info.plist',
  },
  android: {
    package: 'com.sts.demo.chatapp',
    googleServicesFile: './android/app/google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#E6F4FE',
    },
  },
  extra: {
    firebaseApiKey:
      process.env.FIREBASE_API_KEY ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    firebaseAuthDomain:
      process.env.FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    firebaseProjectId:
      process.env.FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    firebaseStorageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    firebaseMessagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    firebaseAppId:
      process.env.FIREBASE_APP_ID ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  plugins: [
    '@react-native-firebase/app',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          buildReactNativeFromSource: true,
        },
      },
    ],
  ],
};

export default config;
