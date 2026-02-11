# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native Firebase Chat library (`rn-firebase-chat`) — an npm package providing real-time chat UI components backed by Firebase Firestore. Built with TypeScript, published via react-native-builder-bob in CommonJS, ES module, and TypeScript declaration formats.

## Common Commands

```bash
yarn test                # Run Jest tests
yarn lint                # ESLint check
yarn lint --fix          # Auto-fix lint/formatting
yarn typecheck           # TypeScript type-check (main)
yarn typecheck:build     # TypeScript type-check (build config)
yarn typecheck:example   # TypeScript type-check (example app)
yarn build:types         # Generate .d.ts declarations
yarn bootstrap           # Install all deps + example pods
yarn example start       # Start Metro for example app
yarn example ios         # Run example on iOS
yarn example android     # Run example on Android
```

Use `yarn` (v1 classic), not npm. Node version: see `.nvmrc`.

## Architecture

### Entry Point & Exports (`src/index.ts`)

The library exports: `FirestoreServices`, screen components (`ChatProvider`, `ChatScreen`, `ListConversationScreen`, `GalleryScreen`, `ErrorBoundary`), custom hooks, and reducer actions.

### State Management

Uses React Context + `useReducer` (not Redux). `ChatProvider` wraps the app and provides `ChatContext` with state/dispatch. The reducer lives in `src/reducer/` with actions: `SET_LIST_CONVERSATION`, `SET_CONVERSATION`, `CLEAR_CONVERSATION`, `UPDATE_CONVERSATION`.

### Firebase Services (`src/services/firebase/`)

`FirestoreServices` is a **singleton** (`getInstance()`) managing all Firestore operations: conversations CRUD, message sending/fetching with cursor-based pagination, real-time listeners via `onSnapshot`, typing indicators, and read receipts. `storage.ts` handles file uploads.

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

Encryption (AES via `react-native-aes-crypto`), message formatting with decryption, blacklist/bad-word filtering, input sanitization (XSS/directory traversal prevention), date and color helpers.

## Code Style

- TypeScript strict mode, target ES2022
- Prettier: single quotes, 2-space indent, trailing commas (es5), no tabs
- Conventional commits enforced by commitlint (`fix:`, `feat:`, `refactor:`, `docs:`, `test:`, `chore:`)
- Pre-commit hooks (lefthook): ESLint + TypeScript check on staged files

## Build

Uses `react-native-builder-bob` — source in `src/`, output to `lib/` with targets: commonjs, module, typescript. The `prepack`/`prepare` scripts run `bob build` automatically.
