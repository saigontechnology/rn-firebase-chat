/**
 * Created by NL on 6/27/23.
 */
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { BaseEntity } from './base';
import { ConversationProps } from './conversation';

type UserStatus = 'online' | 'offline';

interface UserProfileProps extends BaseEntity {
  created?: number;
  name: string;
  status: UserStatus;
  updated?: number;
  // Collection of conversation with id of conversation
  conversations?: FirebaseFirestoreTypes.CollectionReference<ConversationProps>;
}

export { type UserProfileProps };
