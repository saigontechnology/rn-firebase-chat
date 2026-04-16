import type { BaseEntity } from './base';
import type { MessageStatus, MessageTypes } from './conversation';
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
    createdAt?: number | object;
}
export type ImagePickerValue = {
    type: MessageTypes.image | MessageTypes.video;
    path: string;
    extension: string;
};
