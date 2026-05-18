# Migration Guide: react-firebase-chat v1.0.0+ — WebChatProvider Architecture

This guide covers migrating the web chat from the legacy `ChatProvider` (with `firebaseConfig`) to the new `WebChatProvider` architecture, aligning with the monorepo-based shared core in v1.0.0+.

## Summary of Changes

### Architecture

| Area | Old | New |
|------|-----|-----|
| Provider | `ChatProvider` with `firebaseConfig` prop | `WebChatProvider` with `encryptionKey` + `enableEncrypt` |
| Firebase init | Handled inside `ChatProvider` | Handled externally by the host app |
| Styles import | `@saigontechnology/react-firebase-chat/styles` (no extension) | `@saigontechnology/react-firebase-chat/styles.css` |
| Conversation names (1:1) | `conversation.name` | `conversation.names?.[partnerId]` |
| Typing indicator names | Derived from `selectedPartners` only | Derived from `conversation.names` map with `selectedPartners` fallback |
| Partner resolution | Used `conversation.name` for all chats | Uses `conversation.names?.[partnerId]` for 1:1, `conversation.name` for groups |

### Bug Fixes

- **Partner names showing "Unknown"** — 1:1 chats now resolve display names from `conversation.names?.[partnerId]` instead of `conversation.name`
- **Typing indicator showing User ID** — `partnerNames` map now prefers the `names` field from the conversation document
- **Encryption race condition** — `WebChatProvider` waits for encryption configuration before fetching conversations (previously `ChatProvider` could fetch messages before encryption was ready)
- **Conversation timestamp resolution** — `listenConversationUpdate` now correctly resolves Firestore Timestamps to millisecond numbers, fixing missing datetime display and incorrect sort order after sending messages

---

## Breaking Changes

### 1. ChatProvider → WebChatProvider

The `ChatProvider` component has been replaced by `WebChatProvider`. The `firebaseConfig` prop is removed — Firebase must be initialized externally by the host app before rendering the provider.

```diff
import {
- ChatProvider,
+ WebChatProvider,
  ChatScreen,
} from '@saigontechnology/react-firebase-chat'

- <ChatProvider
+ <WebChatProvider
    key={chatKey}
    currentUser={chatUser}
-   firebaseConfig={firebaseConfig}
    encryptionKey={chatSettings?.encryptionKey}
+   enableEncrypt={!!chatSettings?.encryptionKey}
  >
    <ChatScreen ... />
- </ChatProvider>
+ </WebChatProvider>
```

**Migration:** Initialize Firebase in your app before rendering `WebChatProvider`. Pass `encryptionKey` and `enableEncrypt` separately (previously encryption was implicitly enabled when `encryptionKey` was present).

### 2. Styles Import Path Changed

The CSS import path now requires the `.css` extension:

```diff
- import '@saigontechnology/react-firebase-chat/styles'
+ import '@saigontechnology/react-firebase-chat/styles.css'
```

If you had a `@ts-expect-error` comment for the old import, remove it:

```diff
- // @ts-expect-error -- CSS import has no type declarations
- import '@saigontechnology/react-firebase-chat/styles'
+ import '@saigontechnology/react-firebase-chat/styles.css'
```

### 3. Conversation Name Resolution for 1:1 Chats

The `conversation.name` field is a **conversation-level** value (used for group chat names). For 1:1 chats, it may be empty or contain the creator's info.

**Old:** `conversation.name` was used for all display names.

**New:** Use `conversation.names?.[partnerId]` for 1:1 chats, falling back to `conversation.name` for groups.

```diff
- const displayName = c.name || 'Unknown'
+ const isGroup = (c.members ?? []).length > 2
+ const partnerId = isGroup
+   ? ''
+   : (c.members ?? []).find((m) => m !== currentUserId) || ''
+ const displayName = isGroup
+   ? (c.name ?? 'Group')
+   : (c.names?.[partnerId] ?? c.name ?? 'Unknown')
```

This applies to:
- Conversation list items
- Chat header
- Search filtering
- Avatar display

### 4. Search Filtering Updated

If you have custom search/filtering on conversations, update it to search by the correct name field:

```diff
const filtered = searchQuery
- ? conversations.filter((c) =>
-     (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
-   )
+ ? conversations.filter((c) => {
+     const isGroup = (c.members ?? []).length > 2
+     const partnerId = isGroup
+       ? ''
+       : (c.members ?? []).find((m) => m !== user?.id) || ''
+     const name = isGroup
+       ? (c.name ?? '')
+       : (c.names?.[partnerId] ?? c.name ?? '')
+     return name.toLowerCase().includes(searchQuery.toLowerCase())
+   })
  : conversations
```

### 5. Wait for Chat Settings Before Rendering

If encryption is enabled, ensure the encryption key is loaded before rendering the provider to avoid the encryption race condition:

```diff
- if (!chatUser) return null
+ if (!chatUser || isChatSettingsLoading) return null
```

---

## Internal Library Changes (No App Code Changes Needed)

These changes are internal to `@saigontechnology/react-firebase-chat` and `@saigontechnology/firebase-chat-shared`. They are listed here for awareness.

### Partner Resolution in ChatScreen

`resolvePartners` now uses `conversation.names?.[partnerId]` for 1:1 chats instead of `conversation.name`:

```typescript
// Old: all chats used conversation.name
name: conversation.name

// New: 1:1 chats use per-member names map
const getPartnerName = (pid: string) =>
  isGroup
    ? conversation.name
    : (conversation.names?.[pid] ?? conversation.name);
```

### Typing Indicator Name Resolution

The `partnerNames` map (used by `useTyping` to show display names in the typing indicator) now prefers the `names` field from the conversation document, with `selectedPartners` as a fallback:

```typescript
// Old: only from selectedPartners (could be empty before resolvePartners completes)
const partnerNames = useMemo(() => {
  const map: Record<string, string> = {};
  selectedPartners.forEach((p) => {
    if (p.name) map[p.id] = p.name;
  });
  return map;
}, [selectedPartners]);

// New: prefers conversation.names, falls back to selectedPartners
const partnerNames = useMemo(() => {
  const convId = selectedConversationId || effectiveConversationId;
  const conv = convId ? conversations.find((c) => c.id === convId) : undefined;
  const map: Record<string, string> = {};
  if (conv?.names) {
    Object.entries(conv.names).forEach(([uid, name]) => {
      if (uid !== `${currentUser.id}` && name) map[uid] = name;
    });
  }
  selectedPartners.forEach((p) => {
    if (p.name && !map[p.id]) map[p.id] = p.name;
  });
  return map;
}, [selectedPartners, conversations, selectedConversationId, effectiveConversationId, currentUser.id]);
```

### Conversation Timestamp Resolution in Real-time Listener

`listenConversationUpdate` now resolves `updatedAt` from Firestore Timestamps to millisecond numbers, matching the behavior of `getListConversation`:

```typescript
const rawTs = data.updatedAt as { toMillis?: () => number } | number | undefined;
const updatedAt = typeof rawTs === 'number' ? rawTs : (rawTs?.toMillis?.() ?? Date.now());
```

---

## Step-by-Step Migration

### 1. Update Dependencies

```bash
pnpm install @saigontechnology/react-firebase-chat@latest
```

Or if using a local link:

```bash
# Rebuild the library
cd /path/to/rn-firebase-chat/packages/react-firebase-chat
pnpm build

# Reinstall in your project
cd /path/to/your-web-project
pnpm install
```

### 2. Update Provider

Replace `ChatProvider` with `WebChatProvider` and remove `firebaseConfig`:

```tsx
import {
  WebChatProvider,
  ChatScreen,
} from '@saigontechnology/react-firebase-chat'
import '@saigontechnology/react-firebase-chat/styles.css'

// Firebase must be initialized before this component renders
<WebChatProvider
  currentUser={chatUser}
  encryptionKey={chatSettings?.encryptionKey}
  enableEncrypt={!!chatSettings?.encryptionKey}
>
  <ChatScreen
    conversationId={conversationId}
    partners={partners}
    showFileUpload={false}
    renderHeader={() => null}
    renderChatList={renderChatList}
  />
</WebChatProvider>
```

### 3. Update Custom Chat List (if using `renderChatList`)

If you provide a custom `renderChatList`, update name resolution for each conversation item:

```tsx
renderChatList={({ conversations, selectedConversationId, handleSelectConversation }) => {
  return conversations.map((c) => {
    const isGroup = (c.members ?? []).length > 2
    const partnerId = isGroup
      ? ''
      : (c.members ?? []).find((m) => m !== currentUserId) || ''
    const displayName = isGroup
      ? (c.name ?? 'Group')
      : (c.names?.[partnerId] ?? c.name ?? 'Unknown')

    return (
      <div key={c.id} onClick={() => handleSelectConversation(c)}>
        <UserAvatar user={{ name: displayName, id: partnerId, avatar: c.image }} />
        <span>{displayName}</span>
      </div>
    )
  })
}}
```

### 4. Update Styles Import

```diff
- // @ts-expect-error -- CSS import has no type declarations
- import '@saigontechnology/react-firebase-chat/styles'
+ import '@saigontechnology/react-firebase-chat/styles.css'
```

---

## FAQ

**Q: Do I need to initialize Firebase myself now?**
A: Yes. `WebChatProvider` no longer accepts `firebaseConfig`. Initialize Firebase in your app's entry point (e.g., `firebase.ts` config file) before rendering the provider.

**Q: Will existing Firestore data work?**
A: Yes. The Firestore document structure is backward-compatible. The `names` field is additive — old conversations without it will continue to work, and it will be populated as users open conversations via `setConversationInfo`.

**Q: Why does my conversation list still show "Unknown" for some conversations?**
A: The `names` field is populated when each user opens a conversation (via `setConversationInfo`). If a partner has never opened a conversation on the new version, their name won't be in the `names` map yet. The fallback chain is: `conversation.names?.[partnerId]` → `conversation.name` → `'Unknown'`.

**Q: The typing indicator shows a user ID instead of a name. Why?**
A: This happens when the `names` map in the conversation document doesn't contain the typing user's ID. Ensure both users have opened the conversation at least once on the updated version so `setConversationInfo` can write their names. The library now reads from `conversation.names` first, then falls back to `selectedPartners`.

**Q: Can I use `ChatProvider` and `WebChatProvider` interchangeably?**
A: No. `ChatProvider` is deprecated for web use. `WebChatProvider` is the replacement with proper encryption initialization ordering and no Firebase config coupling.

**Q: Where is the React Native migration guide?**
A: See [`packages/rn-firebase-chat/MOBILE_MIGRATION_GUIDE.md`](../rn-firebase-chat/MOBILE_MIGRATION_GUIDE.md) for the mobile-specific migration guide.
