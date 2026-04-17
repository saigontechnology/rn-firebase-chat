import type { BaseEntity } from './base';
import type { MessageStatus, MessageTypes } from './conversation';

// Union of concrete media types used in Firestore docs.
// undefined means the field is absent (plain-text message).
export type MediaType = 'image' | 'video' | 'text' | undefined;

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
}

export type ImagePickerValue = {
  type: MessageTypes.image | MessageTypes.video;
  path: string;
  extension: string;
};
