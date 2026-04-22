import React, { useEffect, useState } from 'react';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { WebChatProvider, ChatScreen, UserService, CloudinaryStorageProvider } from 'rn-firebase-chat/web';
import type { IUser } from 'rn-firebase-chat/web';

export default function App() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const cloudinaryProvider = new CloudinaryStorageProvider({
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
    folder: import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'chat',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY ?? '',
    apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET ?? '',
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — ensure their Firestore document exists then show the UI.
        const userService = UserService.getInstance();
        await userService.createUserIfNotExists(firebaseUser.uid, { name: 'Anonymous' });
        setCurrentUser({ id: firebaseUser.uid, name: 'Anonymous' });
        setLoading(false);
      } else {
        // No session yet — sign in anonymously; onAuthStateChanged will fire again
        // with the new firebaseUser, so we do NOT set loading=false here.
        signInAnonymously(auth).catch((err) => {
          console.error('Anonymous sign-in failed:', err);
          setLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={styles.center}>Signing in…</div>;
  }

  if (!currentUser) return null;

  return (
    <div style={styles.root}>
      {/* Encryption uses the default key — matches App.web.tsx and the RN example app. */}
      <WebChatProvider currentUser={currentUser} storageProvider={cloudinaryProvider}>
        <div style={styles.chatWrapper}>
          <ChatScreen style={styles.chatScreen} showFileUpload />
        </div>
      </WebChatProvider>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f0f2f5',
  },
  chatWrapper: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    maxWidth: 900,
    width: '100%',
    margin: '0 auto',
    padding: '16px',
  },
  chatScreen: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  },
};
