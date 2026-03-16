# Firebase Firestore Chat Structure

## Overview

```
Firestore Database
├── users/                              # Users collection
│   └── {userId}/                       # User document
│       └── conversations/              # Subcollection: user's conversations
│           └── {conversationId}/       # Conversation document (user-specific view)
│
└── conversations/                      # Shared conversations collection
    └── {conversationId}/               # Conversation shared data
        └── messages/                   # Subcollection: messages
            └── {messageId}/            # Message document
```

---

## Collections & Documents

### 1. `users/{userId}/conversations/{conversationId}`

Each user has their own view of conversations (for personalized name/image in 1-on-1 chats).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Conversation ID (document ID) |
| `name` | `string?` | Display name (partner's name for 1-on-1, group name for groups) |
| `image` | `string?` | Display image URL |
| `members` | `string[]` | Array of member user IDs |
| `updatedAt` | `number` | Timestamp (milliseconds) |
| `unRead` | `number` | Unread message count for this user |
| `latestMessage` | `object?` | Latest message preview (see below) |
| `typing` | `object?` | Typing indicators map |

**latestMessage object:**

| Field | Type | Description |
|-------|------|-------------|
| `senderId` | `string` | Who sent the message |
| `name` | `string` | Sender's display name |
| `text` | `string` | Message text (or description for media) |
| `type` | `'text' \| 'image' \| 'video'?` | Message type |
| `path` | `string?` | Media URL (if applicable) |
| `extension` | `string?` | File extension (if applicable) |
| `status` | `number?` | 0=sent, 1=received, 2=seen, 3=failed |
| `readBy` | `{ [userId: string]: boolean }` | Who has read this message |

**Example document:**

```json
{
  "name": "John Doe",
  "image": "https://example.com/avatar.jpg",
  "members": ["user1", "user2"],
  "updatedAt": 1706400000000,
  "unRead": 2,
  "latestMessage": {
    "senderId": "user2",
    "name": "John Doe",
    "text": "Hello!",
    "type": "text",
    "status": 0,
    "readBy": {
      "user2": true
    }
  },
  "typing": {
    "user2": false
  }
}
```

---

### 2. `conversations/{conversationId}`

Shared conversation data for real-time status tracking.

| Field | Type | Description |
|-------|------|-------------|
| `unRead` | `{ [userId: string]: string }` | Maps userId → lastReadMessageId |
| `typing` | `{ [userId: string]: boolean }` | Maps userId → isTyping |

**Example document:**

```json
{
  "unRead": {
    "user1": "msg_abc123",
    "user2": "msg_abc120"
  },
  "typing": {
    "user1": false,
    "user2": true
  }
}
```

---

### 3. `conversations/{conversationId}/messages/{messageId}`

Individual messages in a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Message ID (document ID) |
| `text` | `string` | Message content |
| `senderId` | `string` | Sender's user ID |
| `createdAt` | `number` | Timestamp (milliseconds) |
| `type` | `'text' \| 'image' \| 'video' \| 'voice'?` | Message type |
| `path` | `string?` | Media URL (for image/video/voice) |
| `extension` | `string?` | File extension |
| `status` | `number?` | MessageStatus enum value |
| `readBy` | `{ [userId: string]: boolean }` | Read receipts |

**Example document:**

```json
{
  "text": "Hello, how are you?",
  "senderId": "user1",
  "createdAt": 1706400000000,
  "type": "text",
  "status": 2,
  "readBy": {
    "user1": true,
    "user2": true
  }
}
```

**Example media message:**

```json
{
  "text": "",
  "senderId": "user1",
  "createdAt": 1706400000000,
  "type": "image",
  "path": "https://firebasestorage.googleapis.com/...",
  "extension": "jpg",
  "status": 2,
  "readBy": {
    "user1": true,
    "user2": true
  }
}
```

---

## Enums

### Message Types

```typescript
enum MessageTypes {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
}
```

### Message Status

```typescript
enum MessageStatus {
  sent = 0,
  received = 1,
  seen = 2,
  failed = 3,
}
```

### Collection Names

```typescript
enum FireStoreCollection {
  users = 'users',
  messages = 'messages',
  conversations = 'conversations',
}
```

---

## Data Flow

### Creating a Conversation

```
1. Create doc: users/{creatorId}/conversations/{newConversationId}
   - name: partner's name (1-on-1) or group name
   - image: partner's avatar (1-on-1) or group image
   - members: [creatorId, ...partnerIds]

2. Create doc: users/{partnerId}/conversations/{newConversationId}
   - For 1-on-1: partner sees creator's name/avatar
   - For groups: all members see same name/image
```

### Sending a Message

```
1. Add doc: conversations/{conversationId}/messages/{newMessageId}
   - text, senderId, createdAt, type, etc.

2. Update: conversations/{conversationId}
   - unRead[senderId] = newMessageId

3. Update: users/{senderId}/conversations/{conversationId}
   - latestMessage = new message data
   - unRead = 0

4. Update: users/{partnerId}/conversations/{conversationId}
   - latestMessage = new message data
   - unRead = unRead + 1
```

### Reading a Message

```
1. Update: conversations/{conversationId}
   - unRead[readerId] = messageId

2. Update: users/{readerId}/conversations/{conversationId}
   - unRead = 0
```

### Typing Indicator

```
1. Update: conversations/{conversationId}
   - typing[userId] = true/false
```

---

## Message Status Logic

The message status (Sent/Seen) is determined by comparing `unRead` entries in the shared conversation document:

```typescript
// In conversations/{conversationId}
unRead: {
  "user1": "msg123",  // user1 has read up to msg123
  "user2": "msg120"   // user2 has read up to msg120
}

// To check if the current user's latest message is "Seen" by all:
const latestMessageID = unRead[currentUserId];
const hasUnreadMessages = memberIds.some(
  (memberId) => unRead[memberId] !== latestMessageID
);

// hasUnreadMessages = true  → Show "Sent"
// hasUnreadMessages = false → Show "Seen"
```

---

## Firebase Storage Structure

Media files are stored in Firebase Storage:

```
Firebase Storage
└── {conversationId}/
    └── {timestamp}_{random}.{extension}
```

**Example path:** `conv_abc123/1706400000000_x7k9m.jpg`

---

## Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only access their own conversations list
    match /users/{userId}/conversations/{conversationId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Conversation members can access shared conversation data
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;

      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
      }
    }
  }
}
```

**More restrictive rules (production):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/conversations/{conversationId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /conversations/{conversationId} {
      // Only allow if user is a member
      allow read, write: if request.auth.uid in resource.data.members
                         || exists(/databases/$(database)/documents/users/$(request.auth.uid)/conversations/$(conversationId));

      match /messages/{messageId} {
        allow read, write: if exists(/databases/$(database)/documents/users/$(request.auth.uid)/conversations/$(conversationId));
      }
    }
  }
}
```

---

## TypeScript Interfaces

```typescript
// Base entity with ID
interface BaseEntity {
  id: string;
}

// User info
interface IUserInfo {
  id: string;
  name?: string;
  avatar?: string;
}

// Conversation (user-specific view)
interface ConversationProps extends BaseEntity {
  name?: string;
  image?: string;
  members: string[];
  updatedAt: number;
  unRead?: number;
  latestMessage?: LatestMessageProps;
  typing?: { [userId: string]: boolean };
}

// Shared conversation data
interface ConversationData {
  unRead?: { [userId: string]: string };  // userId -> messageId
  typing?: { [userId: string]: boolean };
}

// Message
interface MessageProps extends BaseEntity {
  text: string;
  senderId: string;
  createdAt: Date | number;
  type?: 'text' | 'image' | 'video' | 'voice';
  path?: string;
  extension?: string;
  status?: MessageStatus;
  readBy: { [userId: string]: boolean };
}

// Latest message preview
interface LatestMessageProps {
  senderId: string;
  name: string;
  text: string;
  type?: 'text' | 'image' | 'video';
  path?: string;
  extension?: string;
  status?: MessageStatus;
  readBy: { [userId: string]: boolean };
}

// Send message payload
interface SendMessageProps {
  text: string;
  createdAt?: number;
  senderId: string;
  readBy: { [userId: string]: boolean };
  status?: MessageStatus;
  type?: 'text' | 'image' | 'video' | 'voice';
  path?: string;
  extension?: string;
}

// Media file
interface MediaFile {
  id: string;
  path: string;
  type: 'image' | 'video' | 'text' | undefined;
}
```

---

## Features Supported

| Feature | Supported |
|---------|-----------|
| 1-on-1 conversations | ✅ |
| Group conversations | ✅ |
| Real-time messaging | ✅ |
| Message status (Sent/Seen) | ✅ |
| Typing indicators | ✅ |
| Unread message counts | ✅ |
| Image messages | ✅ |
| Video messages | ✅ |
| Voice messages | ✅ |
| Message encryption | ✅ (optional) |
| Personalized conversation views | ✅ |
| Load earlier messages (pagination) | ✅ |

---

## Collection Prefix (Optional)

The library supports an optional prefix for all collection paths. This is useful for:
- Separating development/staging/production data
- Multi-tenant applications

```typescript
// Without prefix
users/{userId}/conversations/{conversationId}
conversations/{conversationId}/messages/{messageId}

// With prefix "app1"
app1-users/{userId}/conversations/{conversationId}
app1-conversations/{conversationId}/messages/{messageId}
```

Configure via:
```typescript
FirestoreServices.getInstance().configuration({
  userInfo: { id: 'user1', name: 'John' },
  prefix: 'app1',  // Optional prefix
});
```

---

## Hooks

### useUnreadCount

Get and listen to total unread message count across all conversations.

```typescript
import { useUnreadCount } from 'rn-firebase-chat';

function App() {
  const { unreadCount, loading, error, refresh } = useUnreadCount();

  // With realtime updates (default)
  const { unreadCount } = useUnreadCount(true);

  // Without realtime (fetch once)
  const { unreadCount } = useUnreadCount(false);

  return (
    <View>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Text>Total Unread: {unreadCount}</Text>
      )}
    </View>
  );
}
```

### useConversationUnreadCount

Get and listen to unread count for a specific conversation.

```typescript
import { useConversationUnreadCount } from 'rn-firebase-chat';

function ConversationItem({ conversationId }: { conversationId: string }) {
  const { unreadCount, loading } = useConversationUnreadCount(conversationId);

  return (
    <View>
      <Text>Messages</Text>
      {unreadCount > 0 && <Badge count={unreadCount} />}
    </View>
  );
}
```

### Hook Return Type

```typescript
interface UnreadCountResult {
  /** Total unread message count */
  unreadCount: number;
  /** Whether the count is currently being loaded */
  loading: boolean;
  /** Any error that occurred while fetching */
  error: Error | null;
  /** Manually refresh the unread count */
  refresh: () => Promise<void>;
}
```

---

## FirestoreServices Methods

### Unread Count Methods

```typescript
const firestoreServices = FirestoreServices.getInstance();

// Get total unread count (one-time fetch)
const totalUnread = await firestoreServices.getTotalUnreadCount();

// Get unread count for specific conversation (one-time fetch)
const conversationUnread = await firestoreServices.getUnreadCountByConversation('conv_123');

// Listen to total unread count changes (realtime)
const unsubscribe = firestoreServices.listenTotalUnreadCount((count) => {
  console.log('Total unread:', count);
});
// Call unsubscribe() to stop listening

// Listen to specific conversation unread count (realtime)
const unsubscribe = firestoreServices.listenUnreadCountByConversation(
  'conv_123',
  (count) => {
    console.log('Conversation unread:', count);
  }
);
// Call unsubscribe() to stop listening
```
