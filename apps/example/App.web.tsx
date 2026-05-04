import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import '@saigontechnology/react-firebase-chat/styles.css';
import { initializeFirebase, IUser, UserService, WebChatProvider, ChatScreen } from '@saigontechnology/react-firebase-chat';
import { CloudinaryStorageProvider } from '@saigontechnology/chat-storage-providers';

// Inject Material Icons font for icon buttons
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
  document.head.appendChild(link);
}

const expoConfig = Constants.expoConfig ?? Constants.manifest;
const extra = expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey:
    extra.firebaseApiKey ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    '',
  authDomain:
    extra.firebaseAuthDomain ||
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    '',
  projectId:
    extra.firebaseProjectId ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    '',
  storageBucket:
    extra.firebaseStorageBucket ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    '',
  messagingSenderId:
    extra.firebaseMessagingSenderId ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    '',
  appId:
    extra.firebaseAppId ||
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    '',
};

initializeFirebase(firebaseConfig);

export default function App() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const cloudinaryProvider = new CloudinaryStorageProvider({
    cloudName: extra.cloudinaryCloudName || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: extra.cloudinaryUploadPreset || process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
    folder: extra.cloudinaryFolder || process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER || 'chat',
    apiKey: extra.cloudinaryApiKey || process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',
    apiSecret: extra.cloudinaryApiSecret || process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || '',
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userService = UserService.getInstance();
        await userService.createUserIfNotExists(firebaseUser.uid, { name: 'Anonymous' });
        setCurrentUser({ id: firebaseUser.uid, name: 'Anonymous' });
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', minWidth: '100vw' }}>
        Signing in...
      </div>
    );
  }

  return (
    <>
      <style>{`
        html, body, #root, #root > div {
          width: 100%;
          min-width: 100vw;
          height: 100%;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        body {
          background: #f5f7fb;
        }
      `}</style>
      <div style={{ width: '100%', minWidth: '100vw', minHeight: '100vh', overflow: 'hidden' }}>
        {currentUser ? (
          <WebChatProvider currentUser={currentUser} storageProvider={cloudinaryProvider}>
            <ChatScreen currentUser={currentUser} showFileUpload/>
          </WebChatProvider>
        ) : null}
      </div>
    </>
  );
}
