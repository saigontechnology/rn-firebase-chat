import {
  FireStoreCollection,
  type IUser,
  type UserProfileProps,
} from '../types';
import { FirestoreServices } from './firestore';

const firestoreServices = FirestoreServices.getInstance();

const getUsersCollection = () =>
  firestoreServices
    .getClient()
    .collection<UserProfileProps>(
      firestoreServices.getUrlWithPrefix(FireStoreCollection.users)
    );

export const createUserProfile = async (
  userId: string,
  name: string,
  avatar?: string
): Promise<void> => {
  const client = firestoreServices.getClient();
  await getUsersCollection()
    .doc(userId)
    .set(
      {
        created: client.fieldValues.serverTimestamp(),
        updated: client.fieldValues.serverTimestamp(),
        status: 'online',
        name,
        ...(avatar !== undefined ? { avatar } : {}),
      },
      { merge: true }
    );
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  const snap = await getUsersCollection().doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<UserProfileProps> | undefined;
  return { id: userId, name: data?.name ?? '', avatar: data?.avatar };
};

export const getAllUsers = async (): Promise<IUser[]> => {
  const snap = await getUsersCollection().get();
  return snap.docs.map((d) => {
    const data = d.data() as Partial<UserProfileProps> | undefined;
    return { id: d.id, name: data?.name ?? '', avatar: data?.avatar };
  });
};

export const checkUsernameExist = async (
  username?: string
): Promise<boolean> => {
  if (!username) return false;
  const snap = await getUsersCollection().doc(username).get();
  return snap.exists;
};
