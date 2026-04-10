/**
 * Created by NL on 6/27/23.
 */
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { FieldValue } from '@react-native-firebase/firestore';
import type { BaseEntity } from './base';
import type { LatestMessageProps, MessageProps } from './message';

// Re-export shared enums and types that are platform-agnostic
export {
  MessageTypes,
  MessageStatus,
  type CustomConversationInfo,
  type MediaFile,
} from '@saigontechnology/firebase-chat-shared';

export interface MemberProps {
  [userId: string]: FirebaseFirestoreTypes.DocumentReference;
}

/** RN-specific: updatedAt uses Firebase FieldValue; unRead is a per-user map. */
export interface ConversationProps extends BaseEntity {
  latestMessage?: LatestMessageProps;
  updatedAt: number | FieldValue;
  members: string[];
  name?: string;
  image?: string;
  typing?: Record<string, boolean>;
  unRead?: Record<string, number | string>;
}

export interface ConversationData {
  unRead?: Record<string, number>;
  typing?: Record<string, boolean>;
  messages?: FirebaseFirestoreTypes.CollectionReference<MessageProps>;
}
