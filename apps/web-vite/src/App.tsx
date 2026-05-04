import React, { useEffect, useState } from 'react';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  WebChatProvider,
  ChatScreen,
  FirestoreServices,
  UserService,
  CloudinaryStorageProvider,
  type IUser,
} from '@saigontechnology/react-firebase-chat';

const cloudinaryProvider = new CloudinaryStorageProvider({
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
  folder: import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'chat',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY ?? '',
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET ?? '',
});

export default function App() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { uid } = firebaseUser;
        const userInfo: IUser = { id: uid, name: firebaseUser.displayName ?? 'Anonymous' };

        // Ensure Firestore user document exists.
        await UserService.getInstance().createUserIfNotExists(uid, {
          name: userInfo.name ?? 'Anonymous',
        });

        // Configure shared FirestoreServices with the signed-in user.
        await FirestoreServices.getInstance().configuration({
          userInfo: { id: uid, name: userInfo.name ?? 'Anonymous', avatar: firebaseUser.photoURL ?? '' },
          prefix: import.meta.env.VITE_FIREBASE_PREFIX ?? '',
        });

        setCurrentUser(userInfo);
      } else {
        signInAnonymously(auth).catch((err) =>
          console.error('Anonymous sign-in failed:', err)
        );
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={styles.center}>Signing in…</div>;
  }

  if (!currentUser) return null;

  return (
    <div style={styles.root}>
      <WebChatProvider
        currentUser={currentUser}
        storageProvider={cloudinaryProvider}
        encryptionKey={import.meta.env.VITE_ENCRYPTION_KEY}
        enableEncrypt={import.meta.env.VITE_ENABLE_ENCRYPT !== 'false'}
        prefix={import.meta.env.VITE_FIREBASE_PREFIX ?? ''}
      >
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
