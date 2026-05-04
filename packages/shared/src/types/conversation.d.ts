import type { BaseEntity } from './base';
import type { LatestMessageProps, MediaType } from './message';
export declare enum MessageTypes {
    text = "text",
    image = "image",
    voice = "voice",
    video = "video"
}
export declare enum MessageStatus {
    sent = 0,
    received = 1,
    seen = 2,
    failed = 3
}
export interface MemberProps {
    [userId: string]: string;
}
export interface CustomConversationInfo {
    id: string;
    name?: string;
    image?: string;
}
export interface ConversationProps extends BaseEntity {
    latestMessage?: LatestMessageProps;
    updatedAt: number | object;
    members: string[];
    name?: string;
    image?: string;
    typing?: Record<string, boolean>;
    unRead?: Record<string, string | number>;
}
export interface ConversationData {
    unRead?: Record<string, string | number>;
    typing?: Record<string, boolean>;
}
export interface MediaFile {
    id: string;
    path: string;
    type: MediaType;
}
