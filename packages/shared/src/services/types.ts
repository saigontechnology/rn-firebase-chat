import type {
  ConversationProps,
  CustomConversationInfo,
  IUserInfo,
  MediaFile,
  MessageProps,
  SendMessageProps,
} from '../types';

export type Unsubscribe = () => void;

/**
 * Platform-agnostic Firestore service contract.
 * Implemented by each app using its own Firebase SDK.
 */
export interface IFirestoreService {
  // --- Configuration ---
  configuration(
    userInfo: IUserInfo,
    blackListWords?: string[],
    prefix?: string
  ): void;

  // --- User ---
  createUserProfile(userId: string, name: string): Promise<void>;
  checkUsernameExist(username: string): Promise<boolean>;

  // --- Conversations ---
  createConversation(
    conversationId: string,
    memberIds: string[],
    name?: string,
    image?: string,
    isGroup?: boolean
  ): Promise<void>;

  getListConversation(): Promise<ConversationProps[]>;
  searchListConversation(searchText: string): ConversationProps[];

  listenConversationUpdate(
    callback: (conversation: ConversationProps) => void
  ): Unsubscribe;

  // --- Messages ---
  sendMessage(message: SendMessageProps): Promise<void>;
  sendMessageWithFile(message: SendMessageProps): Promise<void>;

  getMessageHistory(maxPageSize?: number): Promise<MessageProps[]>;
  getMoreMessage(maxPageSize?: number): Promise<MessageProps[]>;

  receiveMessageListener(
    callback: (messages: MessageProps[]) => void
  ): Unsubscribe;

  countAllMessages(): Promise<number>;

  // --- Read receipts & typing ---
  changeReadMessage(messageId: string, userId: string): Promise<void>;
  setUserConversationTyping(isTyping: boolean): Promise<void>;

  // --- Media ---
  getMediaFilesByConversationId(): Promise<MediaFile[]>;

  // --- Session management ---
  setConversation(info: CustomConversationInfo): void;
  clearConversation(): void;
}
