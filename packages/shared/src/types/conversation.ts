import type { BaseEntity } from './base';
import type { LatestMessageProps, MediaType } from './message';

export enum MessageTypes {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
}

// Numeric enum preserved for wire-compatibility with RN app
export enum MessageStatus {
  sent,
  received,
  seen,
  failed,
}

export interface MemberProps {
  [userId: string]: string; // userId -> userId (DocumentReference resolved on each platform)
}

export interface CustomConversationInfo {
  id: string;
  name?: string;
  image?: string;
}

export interface ConversationProps extends BaseEntity {
  latestMessage?: LatestMessageProps;
  // number for client writes; object covers Firestore FieldValue (server timestamp) on write
  updatedAt: number | object;
  members: string[];
  name?: string;
  names?: Record<string, string>;
  image?: string;
  typing?: Record<string, boolean>;
  unRead?: Record<string, number | string>;
}

export interface ConversationData {
  unRead?: Record<string, number | string>;
  typing?: Record<string, boolean>;
}

export interface MediaFile {
  id: string;
  path: string;
  type: MediaType;
}
