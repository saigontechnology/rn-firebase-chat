import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export { FireStoreCollection } from '@saigontechnology/firebase-chat-shared';

export type FirestoreReference =
  | FirebaseFirestoreTypes.CollectionReference
  | FirebaseFirestoreTypes.DocumentReference;
