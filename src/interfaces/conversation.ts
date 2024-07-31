/**
 * Created by NL on 6/27/23.
 */
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { BaseEntity } from './base';
import type { LatestMessageProps } from './message';

interface MemberProps {
  [userId: string]: FirebaseFirestoreTypes.DocumentReference;
}

interface CustomConversationInfo {
  id: string;
  name?: string;
  image?: string;
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
  unRead?: number;
}
interface ConversationData {
  unRead?: { [key: string]: string };
  typing?: { [key: string]: boolean };
}

enum MessageTypes {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
  document = 'document',
  videoCall = 'videoCall',
  voiceCall = 'voiceCall',
}

enum MessageStatus {
  sent,
  received,
  seen,
  failed,
}

enum ConversationActions {
  update = 'update',
  delete = 'delete',
}

export {
  ConversationProps,
  MemberProps,
  MessageTypes,
  MessageStatus,
  ConversationData,
  ConversationActions,
  CustomConversationInfo,
};
