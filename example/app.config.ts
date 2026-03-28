import { ExpoConfig } from 'expo/config';

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
    googleServicesFile: './ios/GoogleService-Info.plist',
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
