import React, { useState } from 'react';
import { WebChatProvider, ChatScreen } from 'rn-firebase-chat/web';
import type { IUser } from 'rn-firebase-chat/web';

// Two demo users so you can open two tabs and chat between them.
const DEMO_USERS: IUser[] = [
  { id: 'user-alice', name: 'Alice', avatar: undefined },
  { id: 'user-bob', name: 'Bob', avatar: undefined },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<IUser>(DEMO_USERS[0]!);
  const partner = DEMO_USERS.find((u) => u.id !== currentUser.id)!;

  return (
    <div style={styles.root}>
      {/* User switcher — simulates opening the app as a different person */}
      <div style={styles.toolbar}>
        <span style={styles.label}>Signed in as:</span>
        {DEMO_USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => setCurrentUser(user)}
            style={{
              ...styles.userBtn,
              ...(user.id === currentUser.id ? styles.userBtnActive : {}),
            }}
          >
            {user.name}
          </button>
        ))}
      </div>

      <WebChatProvider
        currentUser={currentUser}
        // Disable encryption for the demo so you can read Firestore docs directly.
        // Set enableEncrypt={true} and supply an encryptionKey for production.
        enableEncrypt={false}
      >
        <div style={styles.chatWrapper}>
          <ChatScreen
            // Drive a deterministic conversation between the two demo users.
            partners={[partner]}
            style={styles.chatScreen}
          />
        </div>
      </WebChatProvider>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f0f2f5',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginRight: 4,
  },
  userBtn: {
    padding: '4px 14px',
    borderRadius: 20,
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  userBtnActive: {
    background: '#1877f2',
    color: '#fff',
    border: '1px solid #1877f2',
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
