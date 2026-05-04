# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo containing a real-time Firebase chat library for React Native and Web. The monorepo uses **pnpm workspaces** with **Turborepo** for task orchestration.

### Packages

| Package | npm name | Description |
|---|---|---|
| `packages/rn-firebase-chat` | `rn-firebase-chat` | React Native chat UI (gifted-chat, RN Firebase) |
| `packages/react-firebase-chat` | `@saigontechnology/react-firebase-chat` | Web chat UI (plain React, Firebase JS SDK) |
| `packages/shared` | `@saigontechnology/firebase-chat-shared` | Shared business logic, `FirestoreServices`, `useChatScreen` hook |
| `packages/storage-providers` | `@saigontechnology/chat-storage-providers` | Firebase Storage + Cloudinary adapters |

### Apps

| App | Description |
|---|---|
| `apps/example` | Expo + React Native example (iOS/Android + web via Expo) |
| `apps/web-vite` | Vite + React web-only example |

## Common Commands

Run from the **monorepo root** (`rn-firebase-chat/`):

```bash
yarn lint                              # ESLint all packages (turbo)
yarn lint --fix                        # Auto-fix lint/formatting
pnpm build                             # Build all packages (turbo)
pnpm install                           # Install all deps + update lockfile
```

Run from **`packages/rn-firebase-chat/`**:

```bash
yarn test                              # Run Jest tests
yarn test src/__tests__/foo.test.ts    # Run a specific test file
yarn test -t "test name pattern"       # Run tests matching a name
yarn test --watch                      # Watch mode
yarn typecheck                         # TypeScript type-check
yarn build:types                       # Generate .d.ts declarations
yarn example start                     # Start Metro for example app
yarn example ios                       # Run example on iOS
yarn example android                   # Run example on Android
```

Run from **`packages/react-firebase-chat/`**:

```bash
pnpm build                             # tsc + postcss → dist/
pnpm build:css                         # postcss only (CSS files to dist/)
pnpm typecheck                         # TypeScript type-check
pnpm lint                              # ESLint
```

Use `yarn` (v1 classic, v1.22.22) for root-level commands. Use `pnpm` for package-level commands. Node >= 16 required.

## Architecture

### Shared Package (`packages/shared/`)

Core business logic shared between mobile and web. **No React Native or DOM imports.**

- **`FirestoreServices`** — singleton managing all Firestore operations: conversations CRUD, message send/fetch (cursor-based pagination), real-time `onSnapshot` listeners, typing indicators, read receipts. Lives in `src/services/firestore.ts`.
- **Platform adapter pattern** — `FirestoreServices` receives a `FirestoreClient` interface injected at runtime. Mobile uses `rn-adapter.ts` (wraps `@react-native-firebase/firestore`); web uses `web-firestore-adapter.ts` (wraps Firebase JS SDK). This keeps the shared service free of any platform SDK import.
- **`useChatScreen<TMessage>`** — shared React hook (`src/ui/hooks/useChatScreen.ts`) that drives both mobile and web chat screens. Handles message history, real-time listeners, optimistic sends, load-earlier pagination, and lazy conversation creation. Receives a `ChatScreenService` interface and a platform-specific `formatMessage` callback.
- **User services** (`src/services/user.ts`) — `createUserProfile` (upsert via `{ merge: true }`), `getUserById`, `getAllUsers`. All operate via the injected `FirestoreClient`.

### `FirestoreServices` initialization order

1. `getInstance()` — lazy singleton
2. `setFirestoreClient(client)` — inject platform adapter (**required**)
3. `configuration({ userInfo, blackListWords, prefix })` — set user; validates userId format
4. `configurationEncryption({ encryptKey, encryptionOptions })` — optional AES encryption
5. `setStorageProvider(provider)` — required only for file uploads
6. `createEncryptionsFunction({ encrypt, decrypt, getKey })` — override crypto functions

### Conversation data model

- `name` (string) — **group chats only**; do not set for 1:1 conversations
- `names` (Record\<string, string\>) — map of `{ [userId]: ownDisplayName }`; each user writes their own entry. To display the partner's name: `names[partnerId]`
- `setConversationInfo` writes `names[currentUserId] = currentUser.name` as a fire-and-forget update every time the conversation is opened, keeping names in sync

### Lazy conversation creation (`useChatScreen`)

For new conversations, no Firestore document is created until the first message is sent. `conversationId` starts as `undefined`; `sendMessage` calls `service.createConversation` on first send, sets the new ID on `resolvedConversationId`, and skips the history-reload effect via `conversationCreatedInternally` ref — so the optimistic message stays visible and real-time listeners activate immediately.

### RN package (`packages/rn-firebase-chat/`)

- Thin wrapper around the shared package; re-exports `FirestoreServices` from `@saigontechnology/firebase-chat-shared`
- `ChatScreen` — GiftedChat-based UI; calls `useChatScreen` with `formatMessageData` as the `formatMessage` adapter
- `ListConversationScreen` — FlatList conversation list; dispatches `setConversation` to context on item press
- `ChatProvider` — wraps the app; initialises `FirestoreServices` (configures + injects `RNFirestoreClient`)
- Platform adapter: `src/services/firebase/rn-adapter.ts` wraps `@react-native-firebase/firestore` into `FirestoreClient`
- State: React Context + `useReducer`; actions: `SET_LIST_CONVERSATION`, `SET_CONVERSATION`, `CLEAR_CONVERSATION`, `UPDATE_CONVERSATION`

### Web package (`packages/react-firebase-chat/`)

- Built with `tsc` → `dist/` (not `react-native-builder-bob`)
- `WebChatProvider` — wraps the app; configures `FirestoreServices` and injects `WebFirestoreClient`
- `ChatScreen` — web chat UI; calls shared `useChatScreen` with web-specific formatMessage
- `ChatList` — sidebar conversation list
- Platform adapter: `src/services/web-firestore-adapter.ts` wraps Firebase JS SDK into `FirestoreClient`
- CSS: per-component CSS files in `src/components/` and `src/addons/`; bundled `dist/styles.css` via postcss

### Storage providers (`packages/storage-providers/`)

- `FirebaseStorageProvider` — uploads to Firebase Storage (shared between RN and web)
- `CloudinaryStorageProvider` — uploads to Cloudinary (web-friendly)

### Key Interfaces (`packages/shared/src/types/`)

- `MessageProps` — `senderId`, `readBy`, `status`, `type` (media), `path`, `extension`
- `ConversationProps` — `latestMessage`, `members[]`, `names`, `typing`, `unRead`
- `MessageStatus` enum: `sent`, `received`, `seen`, `failed`
- `MessageTypes` enum: `text`, `image`, `voice`, `video`

### Security utilities (`packages/shared/src/utils/`)

- `sanitizeUserInput()`, `validateFilePath()` (blocks `../`), `validateEncryptionKey()`, `validateMessage()`
- `RateLimiter` — sliding-window, default 10 attempts / 60 s
- All called internally by `FirestoreServices`; not exported publicly

## Code Style

- TypeScript strict mode, target ES2020 (shared/web) / ES2022 (RN)
- Prettier: single quotes, 2-space indent, trailing commas (es5), no tabs
- Conventional commits enforced by commitlint (`fix:`, `feat:`, `refactor:`, `docs:`, `test:`, `chore:`)
- Pre-commit hooks (lefthook): ESLint + TypeScript check on staged files

## Testing

Tests live in `packages/rn-firebase-chat/src/__tests__/`. Firebase SDK and `react-native-aes-crypto` are mocked. CI runs with `--maxWorkers=2 --coverage`.

## Build

- **RN package**: `react-native-builder-bob` — source `src/`, output `lib/` (commonjs + module + typescript)
- **Web package**: `tsc --project tsconfig.build.json` → `dist/`; CSS copied by `postcss` (`build:css` script)
- **Turbo** outputs: `lib/**` and `dist/**`
