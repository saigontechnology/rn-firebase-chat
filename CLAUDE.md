# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native Firebase Chat library (`rn-firebase-chat`) — an npm package providing real-time chat UI components backed by Firebase Firestore. Built with TypeScript, published via react-native-builder-bob in CommonJS, ES module, and TypeScript declaration formats.

## Common Commands

```bash
yarn test                              # Run Jest tests
yarn test src/__tests__/foo.test.ts    # Run a specific test file
yarn test -t "test name pattern"       # Run tests matching a name
yarn test --watch                      # Watch mode
yarn lint                              # ESLint check
yarn lint --fix                        # Auto-fix lint/formatting
yarn typecheck                         # TypeScript type-check (main)
yarn typecheck:build                   # TypeScript type-check (build config)
yarn typecheck:example                 # TypeScript type-check (example app)
yarn build:types                       # Generate .d.ts declarations
yarn bootstrap                         # Install all deps + example pods
yarn example start                     # Start Metro for example app
yarn example ios                       # Run example on iOS
yarn example android                   # Run example on Android
```

Use `yarn` (v1 classic, v1.22.22), not npm. Node >= 16 required; see `.nvmrc` for the pinned version.

## Architecture

### Entry Point & Exports (`src/index.ts`)

The library exports: `FirestoreServices`, screen components (`ChatProvider`, `ChatScreen`, `ListConversationScreen`, `GalleryScreen`, `ErrorBoundary`), custom hooks, and reducer actions.

### State Management

Uses React Context + `useReducer` (not Redux). `ChatProvider` wraps the app and provides `ChatContext` with state/dispatch. The reducer lives in `src/reducer/` with actions: `SET_LIST_CONVERSATION`, `SET_CONVERSATION`, `CLEAR_CONVERSATION`, `UPDATE_CONVERSATION`.

### Firebase Services (`src/services/firebase/`)

`FirestoreServices` is a **singleton** (`getInstance()`) managing all Firestore operations: conversations CRUD, message sending/fetching with cursor-based pagination, real-time listeners via `onSnapshot`, typing indicators, and read receipts. `storage.ts` handles file uploads.

Initialization is split across multiple methods that must be called in order:
1. `getInstance()` — lazy-loads the singleton
2. `configuration({ userId, blackListWords, prefix })` — sets user info; validates userId format
3. `configurationEncryption({ key, ... })` — optional; generates PBKDF2 key for AES encryption
4. `setStorageProvider(storage)` — required only when using file uploads
5. `createEncryptionsFunction({ encrypt, decrypt, getKey })` — override with custom crypto functions

Decrypted messages are cached in a `Map` (`decryptCache`) to avoid redundant decryption on re-renders.

### Custom Hooks (`src/hooks.ts`)

- `useChat()` — full context + FirestoreServices access
- `useChatContext()` — raw context access
- `useChatSelector<T>()` — selector pattern for state slices
- `useTypingIndicator()` — typing indicator with timeout

### Key Interfaces (`src/interfaces/`)

- `MessageProps` extends GiftedChat's `IMessage` with `senderId`, `readBy`, `status`, `type` (media), `path`, `extension`
- `ConversationProps` holds `latestMessage`, `members[]`, `typing`, `unRead`
- `MessageStatus` enum: sent, received, seen, failed
- `MessageTypes` enum: text, image, voice, video

### Screen Components (`src/chat/`)

- `ChatScreen` — main chat UI built on `react-native-gifted-chat`, supports custom bubbles, media, encryption, typing indicators
- `ListConversationScreen` — FlatList-based conversation list
- `GalleryScreen` — media gallery viewer
- Components in `src/chat/components/` for input toolbar, bubbles, message status, etc.

### Camera Addon (`src/addons/camera/`)

Optional camera integration using `react-native-vision-camera` with `useCamera()` and `useEnhancedCamera()` hooks.

### Utilities (`src/utilities/`)

- **`aesCrypto.ts`** — AES encryption with a random 16-byte IV prepended to each ciphertext. `decryptedMessageData()` falls back to plaintext if decryption fails (handles mixed encrypted/plaintext history).
- **`security.ts`** — `sanitizeUserInput()`, `validateFilePath()` (blocks `../`), `validateEncryptionKey()`, `validateMessage()`, and a `RateLimiter` class (sliding-window, default 10 attempts/60 s). Called internally by `FirestoreServices`; not exported publicly.
- `messageFormatter.ts` — message formatting with decryption; `blackList.ts` — bad-word filtering; date and color helpers.

## Code Style

- TypeScript strict mode, target ES2022
- Prettier: single quotes, 2-space indent, trailing commas (es5), no tabs
- Conventional commits enforced by commitlint (`fix:`, `feat:`, `refactor:`, `docs:`, `test:`, `chore:`)
- Pre-commit hooks (lefthook): ESLint + TypeScript check on staged files

## Testing

Tests live in `src/__tests__/`. Firebase SDK and `react-native-aes-crypto` are mocked — the Firebase mock only implements `collection`, `doc`, `get`, `set`, `add`, `onSnapshot`. CI runs tests with `--maxWorkers=2 --coverage`.

## Build

Uses `react-native-builder-bob` — source in `src/`, output to `lib/` with targets: commonjs, module, typescript. The `prepack`/`prepare` scripts run `bob build` automatically. CI also strips source maps from the build output.
