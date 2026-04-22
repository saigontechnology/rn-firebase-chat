import React from 'react';
import ReactDOM from 'react-dom/client';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { initializeFirebase } from 'rn-firebase-chat/web';
import App from './App';
import firebaseConfig from './firebaseConfig';
// Library stylesheet — no react-native deps, pure CSS
import 'rn-firebase-chat/styles';
import './index.css';

// Initialize Firebase before the React tree mounts.
// ChatProvider's useEffect runs after the first render, but UserService
// calls getFirebaseFirestore() synchronously in its constructor — so Firebase
// must already be initialized when the provider renders.
initializeFirebase(firebaseConfig);

// Firestore security rules check request.auth != null.
// Sign in anonymously so every Firestore read/write carries a valid auth token.
// In a real app you would use your own sign-in flow (email, Google, etc.) here.
signInAnonymously(getAuth()).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((err) => {
  console.error('Anonymous sign-in failed:', err);
});
