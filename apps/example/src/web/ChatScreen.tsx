import React, { useState } from 'react';
import { IUser, ChatScreen as LibChatScreen, WebChatProvider } from 'rn-firebase-chat/web';

interface Props {
  currentUser: IUser;
}

export default function ChatScreen({ currentUser }: Props) {
  const [conversationId, setConversationId] = useState<string>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId.trim()) return;
    const ids = [currentUser.id, recipientId.trim()].sort();
    const convId = conversationId.trim() || ids.join('_');
    setActiveConversation(convId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', minWidth: '100vw', overflow: 'hidden', background: '#f5f7fb' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee', background: '#fff', zIndex: 1 }}>
        <span style={{ fontWeight: 600 }}>Your ID: <code style={{ background: '#f3f3f3', padding: '2px 6px', borderRadius: 4, userSelect: 'all' }}>{currentUser.id}</code></span>
      </header>

      {!activeConversation ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, background: '#f5f5f5' }}>
          <form onSubmit={handleStart} style={{ background: '#fff', padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>
            <h3 style={{ margin: 0 }}>Start a conversation</h3>
            <input
              placeholder="Recipient user ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <input
              placeholder="Conversation ID (optional)"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, background: '#111', color: '#fff', border: 0, cursor: 'pointer' }}>
              Open Chat
            </button>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setActiveConversation(null)} style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 18 }}>←</button>
            <span style={{ fontWeight: 500 }}>Conversation: {activeConversation}</span>
          </div>
          <WebChatProvider currentUser={currentUser}>
            <LibChatScreen
              conversationId={activeConversation}
              partners={[{ id: recipientId.trim(), name: recipientId.trim() }]}
            />
          </WebChatProvider>
        </div>
      )}
    </div>
  );
}
