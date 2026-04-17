import type { BaseEntity } from './base';
import type { MessageStatus, MessageTypes } from './conversation';

// Union of concrete media types used in Firestore docs.
// undefined means the field is absent (plain-text message).
export type MediaType = 'image' | 'video' | 'text' | 'voice' | undefined;

/** Matches the flat Firestore replyMessage document shape. */
export interface ReplyToMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
}

export interface QuickReplyValue {
  title: string;
  value: string;
  /** Optional message override shown in the chat bubble when selected */
  messageId?: string;
}

export interface QuickReplies {
  type: 'radio' | 'checkbox';
  values: QuickReplyValue[];
  /** Keep chips visible after selection (checkbox only) */
  keepIt?: boolean;
}

export interface LatestMessageProps {
  readBy: Record<string, boolean>;
  senderId: string;
  name: string;
  text: string;
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
}

export interface MessageProps extends BaseEntity {
  text: string;
  senderId: string;
  readBy: Record<string, boolean>;
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  // number for client timestamps; object covers Firestore FieldValue (server timestamp) on write
  createdAt: number | object;
  replyMessage?: ReplyToMessage;
  isEdited?: boolean;
  quickReplies?: QuickReplies;
}

export interface SendMessageProps {
  text: string;
  senderId: string;
  readBy: Record<string, boolean>;
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  // Callers pass Date.now() or a Firestore FieldValue server timestamp
  createdAt?: number | object;
  replyMessage?: ReplyToMessage;
  quickReplies?: QuickReplies;
}

export type ImagePickerValue = {
  type: MessageTypes.image | MessageTypes.video;
  path: string;
  extension: string;
};
