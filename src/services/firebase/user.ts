import firestore from '@react-native-firebase/firestore';
import { FireStoreCollection, type UserProfileProps } from '../../interfaces';
import { getCurrentTimestamp } from '../../utilities';

const createUserProfile = async (userId: string, name: string) => {
  const userRef = firestore()
    .collection<Omit<UserProfileProps, 'id'>>(FireStoreCollection.users)
    .doc(userId);
  const user = await userRef.get();
  if (!user.exists) {
    await userRef.set({
      created: getCurrentTimestamp(),
      status: 'online',
      name,
      updated: getCurrentTimestamp(),
    });
  } else {
    // console.log('Document data:', user.data());
  }
};

const checkUsernameExist = (username?: string) => {
  return new Promise<boolean>(async (resolve) => {
    const userRef = firestore()
      .collection<UserProfileProps>(FireStoreCollection.users)
      .doc(username);
    const user = await userRef.get();
    resolve(user.exists);
  });
};

export { createUserProfile, checkUsernameExist };
