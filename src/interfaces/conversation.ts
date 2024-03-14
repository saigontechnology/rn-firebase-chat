/**
 * Created by NL on 6/27/23.
 */
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { BaseEntity } from './base';
import type { LatestMessageProps } from './message';

interface MemberProps {
  [userId: string]: FirebaseFirestoreTypes.DocumentReference;
}
interface ConversationProps extends BaseEntity {
  latestMessage: LatestMessageProps;
  updated: number;
  // memberId?: string;
  // memberRef?: DocumentReference;
  members: MemberProps;
  conversationName?: string;
  typing: {
    [userId: string]: boolean;
  };
  unRead: {
    [userId: string]: number;
  };
  startAt?: {
    [userId: string]: number;
  };
}

export { ConversationProps, MemberProps };
