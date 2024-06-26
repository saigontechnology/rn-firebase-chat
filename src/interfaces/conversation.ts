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
  latestMessage?: LatestMessageProps;
  updatedAt: number;
  members: string[];
  name?: string;
  image?: string;
  typing?: {
    [userId: string]: boolean;
  };
  unRead?: {
    [userId: string]: number;
  };
  extraData?: any;
}

enum MessageTypes {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
}

enum MessageStatus {
  sending,
  sent,
  failed,
  read,
}

export { ConversationProps, MemberProps, MessageTypes, MessageStatus };
