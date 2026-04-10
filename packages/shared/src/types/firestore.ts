export enum FireStoreCollection {
  users = 'users',
  messages = 'messages',
  conversations = 'conversations',
}

// Platform-agnostic reference type — will be narrowed by each app's Firebase SDK
export type FirestoreReference = unknown;
