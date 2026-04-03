import firestore from '@react-native-firebase/firestore';
import { FireStoreCollection, type UserProfileProps } from '../../interfaces';
import { getServerTimestamp } from '../../utilities';
import { FirestoreServices } from './firestore';

const firestoreServices = FirestoreServices.getInstance();

const createUserProfile = async (userId: string, name: string) => {
  const path = firestoreServices.getUrlWithPrefix(FireStoreCollection.users);
  try {
    const userRef = firestore()
      .collection<Omit<UserProfileProps, 'id'>>(path)
      .doc(userId);
    const user = await userRef.get();
    if (!user.exists()) {
      await userRef.set({
        created: getServerTimestamp(),
        status: 'online',
        name,
        updated: getServerTimestamp(),
      });
    }
  } catch (e) {
    console.error('[createUserProfile] error:', e);
  }
};

const checkUsernameExist = async (username?: string) => {
  const userRef = firestore()
    .collection<UserProfileProps>(
      firestoreServices.getUrlWithPrefix(FireStoreCollection.users)
    )
    .doc(username);
  const user = await userRef.get();
  return user.exists();
};

export { createUserProfile, checkUsernameExist };
