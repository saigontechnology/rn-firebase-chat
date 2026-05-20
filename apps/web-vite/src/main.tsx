import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  type FirebaseConfig,
  initializeFirebase,
  getFirebaseFirestore,
  getFirebaseApp,
  FirestoreServices,
  WebCryptoProvider,
  createWebFirestoreClient,
  WebFirebaseStorageProvider,
} from '@saigontechnology/react-firebase-chat';
import App from './App';
import '@saigontechnology/react-firebase-chat/styles.css';
import './index.css';

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

// Initialize Firebase before the React tree mounts.
initializeFirebase(firebaseConfig);

// Wire the shared FirestoreServices with the web Firestore adapter + Web Crypto.
const firestoreServices = FirestoreServices.getInstance();
firestoreServices.setFirestoreClient(createWebFirestoreClient(getFirebaseFirestore()));
firestoreServices.setCryptoProvider(new WebCryptoProvider());

// Wire Firebase Storage for file uploads.
firestoreServices.setStorageProvider(new WebFirebaseStorageProvider(getFirebaseApp()));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
