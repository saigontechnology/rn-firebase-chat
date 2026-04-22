import React from 'react';
import ReactDOM from 'react-dom/client';
import { FirebaseConfig, initializeFirebase } from 'rn-firebase-chat/web';
import App from './App';
import 'rn-firebase-chat/styles';
import './index.css';

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
};

// Initialize Firebase once before the React tree mounts so that UserService
// (which calls getFirebaseFirestore() synchronously in its constructor) never
// sees an uninitialized app. Auth and Firestore access happen inside App.
initializeFirebase(firebaseConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
