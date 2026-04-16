import React from 'react';

// ==========================================
// Core Types matching RN-Firebase-Chat
// ==========================================

// User types matching RN implementation
export interface IUserInfo {
  id: string;
  name: string;
  avatar?: string;
}

// IMessage interface compatible with RN app (as per documentation)
export interface IMessage {
  id: string;
  text?: string;
  createdAt: number;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  senderId?: string;
  type?: MediaType;
  readBy?: Record<string, boolean>;
  isEdited?: boolean;
  replyMessage?: {
    id: string;
    text: string;
    userId: string;
    userName?: string;
  };
}

export interface IUser {
  id: string;
  name?: string;
  avatar?: string;
}

// IConversation interface compatible with RN app
export interface IConversation {
  id: string;
  members: string[];
  latestMessage?: IMessage;
  latestMessageTime?: number;
  unRead?: Record<string, number>;
  title?: string;
  type: 'private' | 'group';
  createdAt: number;
  updatedAt: number;
}

// Message/media type used in Firestore documents
export enum MediaType {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
  file = 'file',
  system = 'system',
}

// Optional message delivery status in Firestore
export enum MessageStatus {
  sent = 'sent',
  received = 'received',
  seen = 'seen',
  failed = 'failed',
}

// Firestore message document model
export interface MessageProps {
  text: string;
  senderId: string;
  readBy: Record<string, boolean>;
  status?: MessageStatus;
  type?: MediaType;
  path?: string;
  extension?: string;
  createdAt: number;
}

// Send Message Props - for sending new messages
export interface SendMessageProps {
  text?: string;
  senderId: string;
  type?: MediaType;
  path?: string;
  extension?: string;
  createdAt: number;
}

// Latest message summary stored inside user conversation summaries
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

// Conversation document in the main collection (real-time only data)
export interface ConversationRealtimeProps {
  id: string;
  typing: Record<string, boolean>;
  unRead: Record<string, number>;
}

// Conversation summary stored per user under /users/{userId}/conversations
export interface ConversationProps {
  id: string;
  name?: string;
  image?: string;
  members: string[];
  unRead?: Record<string, number>;
  typing?: Record<string, boolean>;
  updatedAt: number;
  joinedAt?: number;
  latestMessage?: LatestMessageProps;
}

export interface ConversationData {
  unRead?: Record<string, number>;
  typing?: Record<string, boolean>;
}

// Media file interface
export interface MediaFile {
  id: string;
  path: string;
  type: MediaType;
}

// Encryption options used by the library (matching rn-firebase-chat)
export interface EncryptionOptions {
  salt: string;
  iterations?: number;
  keyLength?: number;
}

export interface EncryptionFunctions {
  generateKeyFunctionProp?: (key: string) => Promise<string>;
  encryptFunctionProp?: (text: string) => Promise<string>;
  decryptFunctionProp?: (text: string) => Promise<string>;
}

export interface EncryptionStatus {
  isEnabled: boolean;
  isReady: boolean;
  keyGenerated: boolean;
  testPassed?: boolean;
  lastTestedAt?: number; // timestamp in milliseconds
}

// Storage provider interface (matching rn-firebase-chat)
export interface UploadResult {
  downloadUrl: string;
  fullPath: string;
}

export interface StorageFile {
  name: string;
  downloadUrl: string;
}

export interface StorageProvider {
  uploadFile(localPath: string, remotePath: string): Promise<UploadResult>;
  getDownloadUrl(remotePath: string): Promise<string>;
  listFiles(directoryPath: string): Promise<StorageFile[]>;
}

// Input toolbar props (matching rn-firebase-chat)
export interface InputToolbarProps {
  hasCamera?: boolean;
  hasGallery?: boolean;
  onPressCamera?: () => void;
  onPressGallery?: () => void;
  containerStyle?: React.CSSProperties;
  cameraIcon?: string;
  galleryIcon?: string;
  iconSend?: string;
}

// User profile document stored in /users
export enum UserStatus {
  online = 'online',
  offline = 'offline',
}

export interface UserProfileProps {
  id: string; // document ID
  status: UserStatus;
  name: string;
  created?: number;
  updated?: number;
  conversations?: FirestoreReference; // CollectionReference<ConversationProps>
}

export interface CustomConversationInfo {
  id: string;
  name?: string;
  image?: string;
}

// Firestore collections enum
export enum FireStoreCollection {
  users = 'users',
  conversations = 'conversations',
  messages = 'messages',
}

export type FirestoreReference = unknown; // Will be properly typed when Firebase is available

// Connection status
export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error';

// ==========================================
// Extended Types for ReactJS Implementation
// ==========================================

// Extended User interface for ReactJS features
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: number; // timestamp in milliseconds
  status?: 'online' | 'away' | 'busy' | 'offline';
}

// Reply preview stored inside a message document
export interface ReplyMessagePreview {
  id: string;
  text: string;
  userId: string;
  userName?: string;
}

// Extended Message interface for ReactJS features
export interface Message {
  id: string;
  text: string;
  userId: string;
  createdAt: number; // timestamp in milliseconds
  updatedAt?: number; // timestamp in milliseconds
  isEdited?: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  readBy: Record<string, boolean>;
  replyTo?: string; // Message ID this is replying to
  replyMessage?: ReplyMessagePreview; // Inline reply preview (matching rn-firebase-chat)
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
  };
}

// Typing indicator
export interface TypingUser {
  uid: string;
  displayName: string;
  timestamp: number; // timestamp in milliseconds
}

// Chat room interface for ReactJS
export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[]; // User UIDs
  admins: string[]; // User UIDs
  createdBy: string;
  createdAt: number; // timestamp in milliseconds
  updatedAt: number; // timestamp in milliseconds
  latestMessage?: Message;
  isPrivate: boolean;
  settings: {
    allowFileSharing: boolean;
    allowImageSharing: boolean;
    maxParticipants?: number;
    muteNotifications: boolean;
  };
}

// ==========================================
// ReactJS Configuration & Component Types
// ==========================================

// Chat configuration for ReactJS
export interface ChatConfig {
  enableTypingIndicator: boolean;
  enableReadReceipts: boolean;
  enableFileUpload: boolean;
  enableImageUpload: boolean;
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  maxMessageLength: number;
  enableEmojis: boolean;
  enableMarkdown: boolean;
  theme: 'light' | 'dark' | 'auto';
  dateFormat: string;
  timeFormat: string;
}

// Event types for ReactJS
export interface ChatEvents {
  onMessageSent: (message: Message) => void;
  onMessageReceived: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (messageId: string) => void;
  onUserJoined: (user: IUser) => void;
  onUserLeft: (userId: string) => void;
  onUserTyping: (user: TypingUser) => void;
  onUserStoppedTyping: (userId: string) => void;
  onConnectionStatusChanged: (status: ConnectionStatus) => void;
  onError: (error: Error) => void;
}

// Component props for ReactJS
export interface ChatProps {
  roomId: string;
  currentUser: IUser;
  config?: Partial<ChatConfig>;
  events?: Partial<ChatEvents>;
  className?: string;
  style?: React.CSSProperties;
}

export interface MessageListProps {
  messages: Message[];
  currentUser: IUser;
  onMessageUpdate?: (message: Message) => void;
  onMessageDelete?: (messageId: string) => void;
  /** Called when the user requests to edit a message (own messages only) */
  onEdit?: (message: Message) => void;
  /** Called when the user requests to reply to a message */
  onReply?: (message: Message) => void;
  className?: string;
  messageStatusEnable?: boolean;
  customMessageStatus?: (hasUnread: boolean) => React.ReactNode;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
  /** Max messages to display per page; scroll to top loads the previous page */
  maxPageSize?: number;
  /**
   * True when other members have unread messages — used to show Sent vs Seen indicator
   * on the last own message. Matches rn-firebase-chat userUnreadMessage.
   */
  userUnreadMessage?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxInputLength?: number;
  /** Controlled value — used by ChatScreen to pre-fill text when editing a message */
  value?: string;
  onValueChange?: (text: string) => void;
}

export interface UserAvatarProps {
  user: IUser;
  size?: 'small' | 'medium' | 'large';
  showOnlineStatus?: boolean;
  className?: string;
}

// Firebase configuration
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Hook return types for ReactJS
export interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  /** True when other members have unread messages (my last message is "sent" not "seen"). Matches rn-firebase-chat. */
  userUnreadMessage: boolean;
  sendMessage: (
    text: string,
    replyMessage?: ReplyMessagePreview
  ) => Promise<void>;
  updateMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: () => Promise<void>;
}

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export interface UseTypingReturn {
  typingUsers: TypingUser[];
  setTyping: (isTyping: boolean) => void;
}
