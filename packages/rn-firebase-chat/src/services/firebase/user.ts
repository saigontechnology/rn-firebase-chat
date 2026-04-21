import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
} from '@react-native-firebase/firestore';
import { FireStoreCollection, type UserProfileProps } from '../../interfaces';
import { getServerTimestamp } from '../../utilities';
import { FirestoreServices } from './firestore';

const firestoreServices = FirestoreServices.getInstance();
const db = getFirestore(getApp());

const createUserProfile = async (userId: string, name: string) => {
  const path = firestoreServices.getUrlWithPrefix(FireStoreCollection.users);
  const userRef = doc(collection(db, path), userId);
  const user = await getDoc(userRef);
  if (!user.exists()) {
    await setDoc(userRef, {
      created: getServerTimestamp(),
      status: 'online',
      name,
      updated: getServerTimestamp(),
    });
  }
};

const checkUsernameExist = async (username?: string) => {
  const userRef = doc(
    collection(
      db,
      firestoreServices.getUrlWithPrefix(FireStoreCollection.users)
    ),
    username
  );
  const user = await getDoc(userRef);
  return user.exists();
};

export { createUserProfile, checkUsernameExist };
