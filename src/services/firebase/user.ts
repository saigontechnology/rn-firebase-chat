import firestore from '@react-native-firebase/firestore';
import { FireStoreCollection, type UserProfileProps } from '../../interfaces';
import { FirestoreServices } from './firestore';

const firestoreServices = FirestoreServices.getInstance();

const createUserProfile = async (userId: string, name: string) => {
  const prefix = firestoreServices.getConfiguration('prefix');
  const userRef = firestore()
    .collection<Omit<UserProfileProps, 'id'>>(
      prefix
        ? `${prefix}-${FireStoreCollection.users}`
        : FireStoreCollection.users
    )
    .doc(userId);
  const user = await userRef.get();
  if (!user.exists) {
    await userRef.set({
      created: Date.now(),
      status: 'online',
      name,
      updated: Date.now(),
    });
  } else {
    // console.log('Document data:', user.data());
  }
};

const checkUsernameExist = (username?: string) => {
  const prefix = firestoreServices.getConfiguration('prefix');
  return new Promise<boolean>(async (resolve) => {
    const userRef = firestore()
      .collection<UserProfileProps>(
        prefix
          ? `${prefix}-${FireStoreCollection.users}`
          : FireStoreCollection.users
      )
      .doc(username);
    const user = await userRef.get();
    resolve(user.exists);
  });
};

export { createUserProfile, checkUsernameExist };
