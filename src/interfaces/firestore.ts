import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Created by NL on 6/27/23.
 */
enum FireStoreCollection {
  users = 'users',
  messages = 'messages',
  conversations = 'conversations',
}

type FirestoreReference =
  | FirebaseFirestoreTypes.CollectionReference
  | FirebaseFirestoreTypes.DocumentReference;

export { FireStoreCollection, FirestoreReference };
