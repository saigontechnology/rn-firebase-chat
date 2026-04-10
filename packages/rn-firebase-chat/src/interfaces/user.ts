/**
 * Created by NL on 6/27/23.
 */
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { BaseEntity } from './base';
import type { ConversationProps } from './conversation';

export type { UserStatus } from '@saigontechnology/firebase-chat-shared';

export interface UserProfileProps extends BaseEntity {
  created?: number;
  name: string;
  status: 'online' | 'offline';
  updated?: number;
  /** RN-specific: Firestore collection reference for the user's conversations. */
  conversations?: FirebaseFirestoreTypes.CollectionReference<ConversationProps>;
}
