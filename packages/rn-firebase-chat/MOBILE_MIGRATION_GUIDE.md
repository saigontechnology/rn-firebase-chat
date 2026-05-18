# Migration Guide: rn-firebase-chat v0.x to v1.0.0+

This guide covers migrating from the legacy single-package `rn-firebase-chat` (v0.x) to the new monorepo-based architecture (v1.0.0+).

## Summary of Changes

### Architecture

| Area | Old (v0.x) | New (v1.0.0+) |
|------|------------|----------------|
| Structure | Single package | Monorepo with shared core |
| Business logic | Embedded in RN package | Extracted to `@saigontechnology/firebase-chat-shared` |
| Storage providers | Bundled in main package | Extracted to `@saigontechnology/chat-storage-providers` |
| Platform adapters | Implicit (direct `@react-native-firebase` imports) | Injected via `FirestoreClient` interface pattern |
| Web support | None | `@saigontechnology/react-firebase-chat` (separate package) |
| Package manager | yarn v1 | pnpm + Turborepo |

> **Note:** The shared and storage-providers packages are **bundled inside** the published `rn-firebase-chat` npm package via `bundledDependencies`. You only need to install `rn-firebase-chat` - the sub-packages come with it.

### New Features (v1.0.0)

- **Reply to messages** with scroll-to-original support
- **Edit unsent messages** (messages not yet marked as `seen`)
- **Lazy conversation creation** - no Firestore document is created until the first message is sent
- **`useChatScreen` shared hook** - all message lifecycle logic (history, real-time listeners, optimistic sends, pagination) extracted into a testable hook
- **`useListConversation` shared hook** - conversation list logic with built-in search
- **Platform adapter pattern** - `FirestoreServices` receives a `FirestoreClient` interface, enabling web/RN/test adapters
- **Auto-registered RN adapters** - importing `rn-firebase-chat` automatically injects `RNFirestoreClient` and `RNAesCryptoProvider`
- **`GalleryScreen`** component for media/file/link browsing
- **`SearchBar`** component for conversation search
- **`MessageStatusIndicator`** component
- **`ErrorBoundary`** component wrapping chat UI
- **Conversation name sync** - `names` field (`Record<string, string>`) replaces single `name` for 1:1 chats
- **`createUserProfile` now accepts avatar** parameter
- **Real-time conversation update listener** built into `ChatProvider`
- **Encryption race condition fix** - encryption configuration completes before conversation fetching
- **Conversation timestamp fix** - `listenConversationUpdate` now correctly resolves Firestore Timestamps to millisecond numbers, fixing missing datetime display and incorrect sort order after sending messages

---

## Installation

```bash
# Remove old version
yarn remove rn-firebase-chat

# Install new version
yarn add rn-firebase-chat@^1.0.0
```

### New Peer Dependencies

The following peer dependencies were added in v1.0.0:

```bash
yarn add react-native-keyboard-controller react-native-reanimated react-native-worklets react-native-safe-area-context
```

**Full peer dependency list:**

| Dependency | Required | Notes |
|---|---|---|
| `@react-native-firebase/app` | Yes | Unchanged |
| `@react-native-firebase/firestore` | Yes | Unchanged |
| `react-native-gifted-chat` | Yes | Unchanged |
| `react-native-aes-crypto` | Yes | Unchanged |
| `react-native-gesture-handler` | Yes | Unchanged |
| `react-native-keyboard-controller` | **New** | Replaces internal `KeyboardAvoidingView` |
| `react-native-reanimated` | **New** | Required by keyboard-controller |
| `react-native-worklets` | **New** | Required by reanimated v4 |
| `react-native-safe-area-context` | **New** | Safe area insets |
| `react-native-image-picker` | Optional | For file/image upload |
| `react-native-video` | Optional | For video playback |
| `react-native-vision-camera` | Optional | For camera capture |

---

## Breaking Changes

### 1. ChatProvider - Initialization Order Changed

The old `ChatProvider` had a race condition where encryption configuration and conversation fetching ran in parallel. The new version ensures encryption is fully configured **before** fetching conversations.

**Old behavior:**
```tsx
// Two independent useEffect hooks:
// Effect 1: configure user -> createUserProfile -> getListConversation + listenUpdates
// Effect 2: configure encryption (ran in parallel, could finish after messages were fetched)
```

**New behavior:**
```tsx
// Single init flow:
// 1. useLayoutEffect: configure user (synchronous, before children mount)
// 2. useEffect: configure encryption -> createUserProfile -> getListConversation -> listenUpdates
```

**Migration:** No code changes needed if you were already passing `encryptionFuncProps` to `ChatProvider`. If you were experiencing intermittent decryption failures on first load, this fix resolves that.

### 2. ChatProvider - `createUserProfile` Signature Changed

`createUserProfile` now accepts an `avatar` parameter:

```diff
- createUserProfile(userId, name)
+ createUserProfile(userId, name, avatar)
```

**Migration:** If you call `createUserProfile` directly (outside of `ChatProvider`), add the avatar parameter. If you only use it through `ChatProvider`, no changes needed - the provider passes `userInfo.avatar` automatically.

### 3. ChatScreen - Removed `isGroup` Prop

The `isGroup` prop was removed from `ChatScreen`. Group vs 1:1 logic is now handled internally based on member count.

```diff
<ChatScreen
  memberIds={memberIds}
  partners={partners}
- isGroup={true}
/>
```

### 4. ChatScreen - GiftedChat Props Type Changed

The base props type changed from `GiftedChatProps<MessageProps>` to `Omit<ComponentProps<typeof GiftedChat<IMessage>>, 'messages' | 'user'>`.

**Migration:** If you were passing GiftedChat-specific props, they should still work. The `messages` and `user` props are now managed internally and cannot be overridden.

### 5. ChatScreen - Reply and Edit Message Support

`ChatScreen` now supports reply-to and edit-message features out of the box. The `onLongPress` handler is now used internally for edit mode. If you had a custom `onLongPress`, you'll need to work with the new behavior:

- Long-pressing your own unseen message enters **edit mode**
- Reply is available via the built-in GiftedChat reply UI

### 6. ChatScreen - Removed Internal `KeyboardAvoidingView`

The redundant `KeyboardAvoidingView` wrapper was removed. Keyboard handling is now delegated to `react-native-keyboard-controller` via GiftedChat's built-in keyboard props.

**Migration:** Remove any external `KeyboardAvoidingView` wrapper you may have added around `ChatScreen`. Install `react-native-keyboard-controller` as a peer dependency.

### 7. Conversation Data Model - `names` Field

The `names` field on `ConversationProps` changed semantics:

**Old:** `names` was optional and not consistently used.

**New:** `names` is a `Record<string, string>` where each user writes their own display name (`names[userId] = displayName`). This is automatically synced when opening a conversation via `setConversationInfo`.

To display a partner's name: `conversation.names?.[partnerId]`

### 8. Conversation Data Model - Partner Name & Avatar Resolution

The `conversation.name` and `conversation.image` fields are **conversation-level** values, not partner-specific. In 1:1 chats, these may contain the conversation creator's info or be empty.

**For correct partner name:** Use `conversation.names?.[partnerId]` instead of `conversation.name`.

**For correct partner avatar:** The conversation document does not store per-user avatars. You need to fetch the partner's avatar from the Firebase `users` collection:

```tsx
import firestore from '@react-native-firebase/firestore';

// Fetch partner avatar from Firebase user profile
const snap = await firestore().collection('users').doc(partnerId).get();
const partnerAvatar = snap.data()?.avatar;
```

**Example: Resolving partner info for the chat list:**

```tsx
const partnerId = conversation.members?.find(id => id !== currentUserId);
const partnerName =
  (partnerId ? conversation.names?.[partnerId] : undefined) ??
  conversation.name ??
  'Chat';

// Avatar must be fetched from the users collection, not conversation.image
const partnerAvatar = avatarCache[partnerId]; // fetched separately
```

### 9. ListConversationScreen - Search Built-in

`ListConversationScreen` now has built-in search support via `useListConversation` hook from the shared package.

**Option A: Built-in search bar** (simplest — renders a search input inside the list):
```tsx
<ListConversationScreen
  hasSearchBar={true}                    // Enable search (default: false)
  searchPlaceholder="Search..."          // Custom placeholder
  searchDebounceDelay={300}              // Debounce delay in ms
  onPress={handleConversationPress}
/>
```

**Option B: External search with client-side filtering** (when you need a custom search UI, e.g., with filter/sort buttons):
```tsx
// Keep unfiltered list in a ref, dispatch filtered results on query change
const fullListRef = useRef<ConversationProps[]>([]);

useEffect(() => {
  if (!chatDispatch) return;
  if (!searchQuery) {
    chatDispatch(setListConversation(fullListRef.current));
    return;
  }
  const query = searchQuery.toLowerCase();
  const filtered = fullListRef.current.filter((c) => {
    const name = c.name?.toLowerCase() ?? '';
    const nameValues = c.names
      ? Object.values(c.names).join(' ').toLowerCase()
      : '';
    const lastMsg = c.latestMessage?.text?.toLowerCase() ?? '';
    return name.includes(query) || nameValues.includes(query) || lastMsg.includes(query);
  });
  chatDispatch(setListConversation(filtered));
}, [searchQuery, chatDispatch]);
```

Note: `ListConversationScreen` does not accept a `data` prop (it reads from chat context internally), so external filtering must go through `setListConversation`. Keep the unfiltered source of truth in a ref to avoid feedback loops.

### 10. Direct Firestore Access Still Supported

`FirestoreServices.getInstance().getListConversation()` is still exported and works for manual conversation loading. This is useful when you need control over loading timing (e.g., loading on mount with a ref guard, pull-to-refresh).

```tsx
async function loadConversations(
  chatDispatch: any,
  fullListRef: React.MutableRefObject<ConversationProps[]>,
): Promise<{error?: string}> {
  const fs = FirestoreServices.getInstance();
  const res = await fs.getListConversation();
  if (res && chatDispatch) {
    fullListRef.current = res;
    chatDispatch(setListConversation(res));
  }
  return {};
}
```

The `ChatProvider` also handles initial fetch and real-time updates via `onSnapshot` listeners. If you rely on the provider's automatic loading, use `useChatSelector(getListConversation)` to read the conversation list without manual dispatch.

---

## Bug Fixes (v1.0.0)

### Conversation Timestamp Resolution in Real-time Listener

**Problem:** After sending a message and navigating back to the chat list, the updated conversation would show the latest message text but with a missing datetime, and the conversation would be pushed to the bottom of the list instead of appearing at the top.

**Cause:** `listenConversationUpdate` was passing the raw Firestore `updatedAt` field through without converting it from a Firestore `Timestamp` object to a JavaScript number (milliseconds). This caused:
1. `formatTime()` to receive a non-number and return an empty string (missing datetime)
2. The reducer's sort comparison `(b.updatedAt as number) - (a.updatedAt as number)` to produce `NaN`, pushing the conversation to the end

**Fix:** `listenConversationUpdate` now resolves `updatedAt` the same way `getListConversation` does:

```typescript
const rawTs = data.updatedAt as { toMillis?: () => number } | number | undefined;
const updatedAt = typeof rawTs === 'number' ? rawTs : (rawTs?.toMillis?.() ?? Date.now());
```

**Migration:** No code changes needed. This is an internal fix.

---

## New Exports

The following exports are new in v1.0.0:

### Components

| Export | Description |
|---|---|
| `GalleryScreen` | Media gallery modal (images, videos, files, links) |
| `SearchBar` | Reusable search bar component |
| `MessageStatusIndicator` | Message delivery status indicator |
| `ErrorBoundary` | Error boundary wrapping chat UI |

### Hooks

| Export | Description |
|---|---|
| `useChat` | Combined hook returning `useChatContext()` + `firestoreServices` |
| `useChatSelector` | Select specific chat state: `useChatSelector(getConversation)` |
| `useTypingIndicator` | Manage typing indicator lifecycle |
| `useDebounce` | Generic debounce hook |

### Actions & Selectors

| Export | Description |
|---|---|
| `ChatActionKind` | Enum of action types |
| `setListConversation` | Dispatch action |
| `setConversation` | Dispatch action |
| `clearConversation` | Dispatch action |
| `updateConversation` | Dispatch action |

### Types

| Export | Description |
|---|---|
| `MessageProps` | Message shape with GiftedChat fields |
| `ConversationProps` | Conversation document shape |
| `SendMessageProps` | Message payload for sending |
| `LatestMessageProps` | Latest message in conversation |
| `CustomConversationInfo` | Custom conversation metadata |
| `IUserInfo` | User shape: `{ id, name, avatar }` |
| `MessageStatus` | Enum: `sent`, `received`, `seen`, `failed` |
| `MessageTypes` | Enum: `text`, `image`, `voice`, `video` |
| `MediaFile` | Media file metadata |
| `StorageProvider` | Storage adapter interface |
| `UploadResult` | Upload response shape |
| `StorageFile` | Storage file metadata |
| `ImagePickerValue` | Image picker result |
| `MemberProps` | Conversation member shape |

### Services

| Export | Description |
|---|---|
| `FirestoreServices` | Singleton service (now uses injected `FirestoreClient`) |
| `createRNFirestoreClient` | Factory for RN Firestore adapter |
| `FirebaseStorageProvider` | Firebase Storage adapter |
| `createUserProfile` | Create/update user profile (now includes avatar) |

---

## Step-by-Step Migration

### 1. Update Dependencies

```bash
yarn add rn-firebase-chat@^1.0.0
yarn add react-native-keyboard-controller react-native-reanimated react-native-worklets react-native-safe-area-context
cd ios && pod install
```

### 2. Update ChatProvider

The `ChatProvider` API is mostly unchanged. Key differences:

```diff
<ChatProvider
  userInfo={{
    id: userId,
    name: userName,
    avatar: userAvatar,   // avatar is now used by createUserProfile
  }}
  enableEncrypt={true}
  encryptKey={encryptKey}
  encryptionOptions={{
    salt: 'your-salt',
    iterations: 10000,
    keyLength: 256,
  }}
  encryptionFuncProps={{
    encryptFunctionProp: encrypt,
    decryptFunctionProp: decrypt,
    generateKeyFunctionProp: generateKey,
  }}
+ storageProvider={new FirebaseStorageProvider()}  // Optional: for file uploads
>
  <App />
</ChatProvider>
```

### 3. Update ChatScreen

```diff
import {
  ChatScreen,
  useChatContext,
- setConversation,
} from 'rn-firebase-chat';

const ChatDetailScreen = () => {
- const { chatDispatch } = useChatContext();

  return (
    <ChatScreen
      memberIds={memberIds}
      partners={partners}
      customConversationInfo={{ id: conversationId, names }}
      enableTyping={true}
      messageStatusEnable={true}
      maxPageSize={20}
-     isGroup={isGroupChat}
-     isKeyboardInternallyHandled={false}
-     maxInputLength={5000}
      sendMessageNotification={handleNotification}
      renderAvatar={renderCustomAvatar}
      renderBubble={renderCustomBubble}
      renderComposer={renderCustomComposer}
    />
  );
};
```

### 4. Update ChatListScreen

The new `ListConversationScreen` replaces `FlatList` for rendering conversations. Conversations must be loaded explicitly via `FirestoreServices.getInstance().getListConversation()` and dispatched to context with `setListConversation`. Partner names are now resolved from `conversation.names[partnerId]` instead of `conversation.name`.

**Important:** `conversation.image` is a conversation-level field and should NOT be used as the partner's avatar. Instead, fetch partner avatars from the Firebase `users` collection.

**Search:** `ListConversationScreen` offers built-in search via `hasSearchBar={true}`. If your UI requires a custom external search bar (e.g., with filter/sort buttons alongside it), use client-side filtering: keep the full unfiltered list in a `useRef`, dispatch filtered results to `setListConversation` when the query changes, and restore the full list when the query is cleared.

```diff
import {
  ListConversationScreen,
  useChatContext,
  setConversation,
  setListConversation,
  FirestoreServices,
  type ConversationProps,
} from 'rn-firebase-chat';
+import firestore from '@react-native-firebase/firestore';

const ChatListScreen = () => {
- const { chatState, chatDispatch } = useChatContext();
- const conversations = (chatState as any)?.listConversation as ConversationProps[] | undefined;
+ const { chatDispatch } = useChatContext();
+ const fullListRef = useRef<ConversationProps[]>([]);
+ const [partnerAvatars, setPartnerAvatars] = useState<Record<string, string>>({});

  // Load conversations on mount
  useEffect(() => {
    const fs = FirestoreServices.getInstance();
    fs.getListConversation().then(res => {
+     fullListRef.current = res;
      chatDispatch(setListConversation(res));
+     // Fetch partner avatars from Firebase user profiles
+     fetchPartnerAvatars(res);
    });
  }, []);

+ const fetchPartnerAvatars = async (conversations: ConversationProps[]) => {
+   const db = firestore();
+   const partnerIds = new Set<string>();
+   for (const c of conversations) {
+     const pid = c.members?.find(id => id !== currentUserId);
+     if (pid) partnerIds.add(pid);
+   }
+   const avatars: Record<string, string> = {};
+   await Promise.all(
+     [...partnerIds].map(async (pid) => {
+       const snap = await db.collection('users').doc(pid).get();
+       const avatar = snap.data()?.avatar;
+       if (avatar) avatars[pid] = avatar;
+     }),
+   );
+   setPartnerAvatars(avatars);
+ };

  const handlePress = (conversation: ConversationProps) => {
    chatDispatch(setConversation(conversation));
+   const partnerId = conversation.members?.find(id => id !== currentUserId);
+   const partnerName =
+     conversation.names?.[partnerId] ?? conversation.name ?? 'Chat';
    navigation.navigate('ChatDetail', {
      conversationId: conversation.id,
-     memberIds: conversation.members,
-     names: conversation.names,
+     partnerId,
+     partnerName,
+     partnerAvatar: partnerId ? partnerAvatars[partnerId] : undefined,
+     names: currentUserId
+       ? { [currentUserId]: formatFullName(user.firstName, user.lastName) }
+       : undefined,
    });
  };

  return (
-   <FlatList
-     data={conversations ?? []}
-     keyExtractor={(item) => item.id}
-     renderItem={({ item, index }) => renderCustomItem({ item, index })}
-   />
+   <ListConversationScreen
+     onPress={handlePress}
+     renderCustomItem={renderCustomItem}
+     ItemSeparatorComponent={Separator}
+   />
  );
};
```

### 5. Update Custom Conversation List Items

If you render custom conversation items, update them to resolve partner name and avatar correctly:

```diff
function ConversationListItem({ data, currentUserId, partnerAvatarUrl }) {
- const name = data.name;
- const avatar = data.image;
+ const partnerId = data.members?.find(id => id !== currentUserId);
+ const name =
+   (partnerId ? data.names?.[partnerId] : undefined) ?? data.name ?? 'Chat';
+ const avatar = partnerAvatarUrl ?? data.image;

  return (
    <View>
      <Image source={{ uri: avatar }} />
      <Text>{name}</Text>
    </View>
  );
}
```

### 6. Update Metro Config (Monorepo Users Only)

If you're linking to the local monorepo during development, update your metro config to resolve the new package structure:

```js
// metro.config.js
const monorepoRoot = path.resolve(__dirname, '../rn-firebase-chat');

config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/rn-firebase-chat'),
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'packages/storage-providers'),
];
```

---

## Removed / Renamed Exports

| Old Export | Status | Replacement |
|---|---|---|
| `isGroup` prop on `ChatScreen` | Removed | Handled internally based on member count |
| `isKeyboardInternallyHandled` prop | Removed | Keyboard handled by `react-native-keyboard-controller` |
| `maxInputLength` prop | Removed | Configure via `inputToolbarProps` |

---

## FAQ

**Q: Do I need to install `@saigontechnology/firebase-chat-shared` separately?**
A: No. It's bundled inside `rn-firebase-chat` via `bundledDependencies`.

**Q: Will my existing Firestore data work with the new version?**
A: Yes. The Firestore document structure is backward-compatible. The `names` field is additive - old conversations without it will continue to work, and it will be populated as users open conversations.

**Q: I was manually calling `FirestoreServices.getInstance()` to fetch conversations. Do I need to change that?**
A: It still works and is a valid pattern. The `ChatProvider` also handles initial fetch + real-time updates automatically. If you use manual loading (e.g., for pull-to-refresh or controlled timing), keep the unfiltered list in a `useRef` as the source of truth for search filtering, and dispatch to `setListConversation` for the UI. If you prefer automatic loading, use `useChatSelector(getListConversation)` to read the conversation list.

**Q: Why is my conversation showing the wrong partner name or avatar?**
A: `conversation.name` and `conversation.image` are conversation-level fields, not partner-specific. Use `conversation.names?.[partnerId]` for the partner's name. For avatars, fetch from the Firebase `users` collection since there is no per-user avatar stored in the conversation document.

**Q: My conversation list shows missing timestamps and wrong sort order after sending a message.**
A: This was a bug in versions prior to v1.0.0 where `listenConversationUpdate` did not convert Firestore Timestamps to numbers. Update to v1.0.0+ to fix this.

**Q: My custom encryption functions stopped working. What changed?**
A: The initialization order changed. Encryption is now configured **before** conversations are fetched (fixing a race condition). If you pass `encryptionFuncProps` to `ChatProvider`, ensure your `generateKeyFunctionProp` resolves correctly - it's now awaited before any messages are loaded.

**Q: How do I add web support to my project?**
A: Install the web package separately: `pnpm install @saigontechnology/react-firebase-chat`. It shares the same Firestore backend and encryption format. See the [Web Migration Guide](../react-firebase-chat/WEB_MIGRATION_GUIDE.md) for setup details.
