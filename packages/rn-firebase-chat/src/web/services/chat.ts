import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  getDoc,
  serverTimestamp,
  increment,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import { UserService } from './user';
import {
  type ConversationProps,
  type IMessage,
  type IUserInfo,
  type LatestMessageProps,
  type MediaFile,
  type StorageProvider,
  type EncryptionFunctions,
  type EncryptionOptions,
  type EncryptionStatus,
  FireStoreCollection,
  MediaType,
} from '../types';
import {
  getMediaTypeFromExtension,
  sanitizeUserInput,
  validateUserId,
} from '@saigontechnology/firebase-chat-shared';
import { filterBlackListWords, generateBadWordsRegex } from '../utils/security';
import {
  encryptData,
  decryptedMessageData,
  generateEncryptionKey,
} from '../utils/encryption';
import { convertToLatestMessage } from '../utils/formatters';

const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export class ChatService {
  // ================================================================
  // Singleton
  // ================================================================

  private static instance: ChatService;
  private db: ReturnType<typeof getFirebaseFirestore>;
  private userService: UserService;

  // ================================================================
  // User configuration (mirrors FirestoreServices)
  // ================================================================

  userInfo?: IUserInfo;
  enableEncrypt: boolean = false;
  encryptKey: string = '';
  regexBlacklist?: RegExp;
  prefix: string = '';
  maxFileSizeBytes: number = DEFAULT_MAX_FILE_SIZE_BYTES;

  // ================================================================
  // Encryption function overrides (mirrors FirestoreServices)
  // ================================================================

  generateKeyFunctionProp?: (key: string) => Promise<string>;
  encryptFunctionProp?: (text: string) => Promise<string>;
  decryptFunctionProp?: (text: string) => Promise<string>;

  // ================================================================
  // Storage provider (mirrors FirestoreServices)
  // ================================================================

  private storageProvider: StorageProvider | null = null;

  // ================================================================
  // Decrypt cache (mirrors FirestoreServices — private)
  // ================================================================

  private decryptCache = new Map<string, string>();

  // ================================================================
  // Conversation state (mirrors FirestoreServices)
  // ================================================================

  conversationId: string | null = null;
  memberIds: string[] = [];
  partners: Record<string, IUserInfo> | null = null;

  // ================================================================
  // Message pagination cursor (mirrors FirestoreServices)
  // ================================================================

  messageCursor?: QueryDocumentSnapshot<DocumentData>;

  // ================================================================
  // Known-conversations cache (web optimisation)
  // ================================================================

  private knownConversations = new Set<string>();

  constructor() {
    this.db = getFirebaseFirestore();
    this.userService = UserService.getInstance();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // ================================================================
  // userId getter (mirrors FirestoreServices)
  // ================================================================

  get userId(): string {
    if (!this.userInfo?.id) {
      throw new Error(
        'ChatService: userInfo not configured. Call configuration() before using chat functions.'
      );
    }
    return this.userInfo.id;
  }

  // ================================================================
  // Configuration (mirrors FirestoreServices)
  // ================================================================

  async configuration({
    userInfo,
    blackListWords,
    prefix,
    maxFileSizeBytes,
  }: {
    userInfo?: IUserInfo;
    blackListWords?: string[];
    prefix?: string;
    /** Maximum allowed file size in bytes for uploadFile. Defaults to 25 MB. */
    maxFileSizeBytes?: number;
  }): Promise<void> {
    if (userInfo) {
      if (!validateUserId(userInfo.id)) {
        throw new Error('Invalid user ID format');
      }
      this.userInfo = {
        ...userInfo,
        name: sanitizeUserInput(userInfo.name || ''),
      };
    }
    if (blackListWords) {
      this.regexBlacklist = generateBadWordsRegex(blackListWords);
    }
    if (prefix !== undefined) {
      this.prefix = prefix;
    }
    if (typeof maxFileSizeBytes === 'number' && maxFileSizeBytes > 0) {
      this.maxFileSizeBytes = maxFileSizeBytes;
    }
  }

  async configurationEncryption({
    encryptKey,
    encryptionOptions,
  }: {
    encryptKey: string;
    encryptionOptions: EncryptionOptions;
  }): Promise<void> {
    if (!encryptKey) {
      console.error('Encrypt key is required');
      return;
    }
    try {
      this.enableEncrypt = true;
      this.encryptKey = this.generateKeyFunctionProp
        ? await this.generateKeyFunctionProp(encryptKey)
        : await generateEncryptionKey(encryptKey, encryptionOptions);

      if (!this.encryptKey || this.encryptKey.length === 0) {
        throw new Error('Failed to generate encryption key');
      }
      this.decryptCache.clear();
    } catch (error) {
      console.error('Error configuring encryption:', error);
      this.enableEncrypt = false;
      this.encryptKey = '';
      this.decryptCache.clear();
      throw new Error('Failed to configure encryption');
    }
  }

  createEncryptionsFunction(functions: EncryptionFunctions): void {
    this.generateKeyFunctionProp = functions.generateKeyFunctionProp;
    this.encryptFunctionProp = functions.encryptFunctionProp;
    this.decryptFunctionProp = functions.decryptFunctionProp;
  }

  setStorageProvider(provider: StorageProvider): void {
    this.storageProvider = provider;
  }

  private getStorageProviderOrThrow(): StorageProvider {
    if (!this.storageProvider) {
      throw new Error(
        'StorageProvider is not configured. Call setStorageProvider(provider) before uploading files.'
      );
    }
    return this.storageProvider;
  }

  // ================================================================
  // Encryption status (mirrors FirestoreServices)
  // ================================================================

  isEncryptionReady(): boolean {
    return !!(
      this.enableEncrypt &&
      this.encryptKey &&
      this.encryptKey.length > 0
    );
  }

  async testEncryption(testText: string = 'test'): Promise<boolean> {
    if (!this.isEncryptionReady()) return false;
    try {
      const encrypted = this.encryptFunctionProp
        ? await this.encryptFunctionProp(testText)
        : await encryptData(testText, this.encryptKey);
      const decrypted = this.decryptFunctionProp
        ? await this.decryptFunctionProp(encrypted)
        : await decryptedMessageData(encrypted, this.encryptKey);
      return decrypted === testText;
    } catch {
      return false;
    }
  }

  async getEncryptionStatus(): Promise<EncryptionStatus> {
    const status: EncryptionStatus = {
      isEnabled: !!this.enableEncrypt,
      isReady: this.isEncryptionReady(),
      keyGenerated: !!(this.encryptKey && this.encryptKey.length > 0),
    };
    if (status.isReady) {
      try {
        status.testPassed = await this.testEncryption();
        status.lastTestedAt = Date.now();
      } catch {
        status.testPassed = false;
      }
    }
    return status;
  }

  // ================================================================
  // Helpers (mirrors FirestoreServices)
  // ================================================================

  getUrlWithPrefix(url: string): string {
    return this.prefix ? `${this.prefix}-${url}` : url;
  }

  getRegexBlacklist(): RegExp | undefined {
    return this.regexBlacklist;
  }

  private get CONVERSATIONS(): string {
    return this.getUrlWithPrefix(FireStoreCollection.conversations);
  }

  /** Cached decrypt — avoids re-decrypting the same ciphertext (mirrors FirestoreServices). */
  private async cachedDecrypt(cipher: string): Promise<string> {
    if (this.decryptCache.has(cipher)) return this.decryptCache.get(cipher)!;
    const plain = this.decryptFunctionProp
      ? await this.decryptFunctionProp(cipher)
      : await decryptedMessageData(cipher, this.encryptKey);
    this.decryptCache.set(cipher, plain);
    return plain;
  }

  /**
   * Convert a raw Firestore document into IMessage, decrypting text when
   * encryption is configured. Used by getMessageHistory / getMoreMessage /
   * receiveMessageListener — the same role as formatMessageData in mobile.
   */
  private async formatMessageDoc(
    data: DocumentData,
    id: string
  ): Promise<IMessage> {
    let text = data.text ?? '';
    if (this.isEncryptionReady() && text) {
      text = await this.cachedDecrypt(text);
    } else if (this.regexBlacklist && text) {
      text = filterBlackListWords(text, this.regexBlacklist);
    }

    return {
      id,
      text,
      createdAt:
        data.createdAt?.toMillis?.() ??
        (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
      image: data.type === MediaType.image ? data.path : undefined,
      video: data.type === MediaType.video ? data.path : undefined,
      audio: data.type === MediaType.voice ? data.path : undefined,
      senderId: data.senderId,
      type: data.type,
      path: data.path,
      extension: data.extension,
      readBy: data.readBy ?? {},
      sent: data.sent,
      received: data.received,
      pending: data.pending,
      isEdited: data.isEdited,
      replyMessage: data.replyMessage,
    };
  }

  /**
   * Convert a raw Firestore document into IMessage WITHOUT decryption.
   * Used by subscribeToMessages so callers (e.g. useChat) can handle
   * decryption via their own derived key from React context.
   */
  private formatMessageDocRaw(data: DocumentData, id: string): IMessage {
    return {
      id,
      text: data.text ?? '',
      createdAt:
        data.createdAt?.toMillis?.() ??
        (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
      image: data.type === MediaType.image ? data.path : undefined,
      video: data.type === MediaType.video ? data.path : undefined,
      audio: data.type === MediaType.voice ? data.path : undefined,
      senderId: data.senderId,
      type: data.type,
      path: data.path,
      extension: data.extension,
      readBy: data.readBy ?? {},
      sent: data.sent,
      received: data.received,
      pending: data.pending,
      isEdited: data.isEdited,
      replyMessage: data.replyMessage,
    };
  }

  private async formatLatestMessageDoc(
    latestMessage: LatestMessageProps
  ): Promise<LatestMessageProps> {
    if (!latestMessage?.text || !this.isEncryptionReady()) return latestMessage;
    return {
      ...latestMessage,
      text: await this.cachedDecrypt(latestMessage.text),
    };
  }

  // ================================================================
  // Conversation management (mirrors FirestoreServices)
  // ================================================================

  setConversationInfo(
    conversationId: string,
    memberIds: string[],
    partners: IUserInfo[]
  ): void {
    this.conversationId = conversationId;
    this.memberIds = [this.userId, ...memberIds];
    this.partners = partners.reduce<Record<string, IUserInfo>>(
      (acc, p) => ({ ...acc, [p.id]: p }),
      {}
    );
  }

  clearConversationInfo(): void {
    this.conversationId = null;
    this.memberIds = [];
    this.partners = null;
  }

  async createConversation(
    conversationId: string,
    memberIds: string[],
    name?: string,
    image?: string
  ): Promise<ConversationProps> {
    const allMembers = [this.userId, ...memberIds];
    const unRead: Record<string, number> = {};
    allMembers.forEach((id) => (unRead[id] = 0));

    const data: Record<string, unknown> = {
      members: allMembers,
      name,
      unRead,
      updatedAt: serverTimestamp(),
    };
    if (image) data.image = image;

    let docId: string;
    if (conversationId) {
      await setDoc(doc(this.db, this.CONVERSATIONS, conversationId), data, {
        merge: true,
      });
      docId = conversationId;
    } else {
      const ref = await addDoc(collection(this.db, this.CONVERSATIONS), data);
      docId = ref.id;
    }

    this.conversationId = docId;
    this.knownConversations.add(docId);
    this.userService
      .createUserIfNotExists(this.userId)
      .catch((err) => console.error('Error ensuring user document:', err));

    return { ...(data as unknown as ConversationProps), id: docId };
  }

  // ================================================================
  // Messaging (mirrors FirestoreServices)
  // ================================================================

  async sendMessage(
    message: Omit<IMessage, 'id' | 'createdAt'>,
    replyMessage?: IMessage['replyMessage']
  ): Promise<void> {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before sending the first message!'
      );
      return;
    }

    if (!message.text?.trim() && !message.path) {
      console.error('Message text or path is required');
      return;
    }

    let text = message.text ?? '';
    if (text) text = sanitizeUserInput(text);

    // Route media messages through sendMessageWithFile (mirrors FirestoreServices)
    if (message.type === MediaType.image || message.type === MediaType.video) {
      await this.sendMessageWithFile({ ...message, text }, replyMessage);
      return;
    }

    // Encrypt text if enabled
    let encryptedText = text;
    if (this.isEncryptionReady() && text.trim()) {
      try {
        encryptedText = this.encryptFunctionProp
          ? await this.encryptFunctionProp(text)
          : await encryptData(text, this.encryptKey);
        if (!encryptedText) throw new Error('Encryption returned empty result');
      } catch (error) {
        console.error('Failed to encrypt message:', error);
        throw new Error('Message encryption failed — message not sent');
      }
    } else if (this.regexBlacklist && text) {
      encryptedText = filterBlackListWords(text, this.regexBlacklist);
    }

    const messageData: Record<string, unknown> = {
      text: encryptedText,
      type: message.type ?? MediaType.text,
      senderId: message.senderId ?? this.userId,
      readBy: message.readBy ?? { [this.userId]: true },
      path: message.path ?? '',
      extension: message.extension ?? '',
      createdAt: serverTimestamp(),
    };
    if (replyMessage) messageData.replyMessage = replyMessage;

    try {
      await addDoc(
        collection(
          this.db,
          this.CONVERSATIONS,
          this.conversationId,
          'messages'
        ),
        messageData
      );

      const conversationUpdate: Record<string, unknown> = {
        latestMessage: convertToLatestMessage(
          this.userId,
          this.userInfo?.name ?? '',
          encryptedText
        ),
        updatedAt: serverTimestamp(),
        [`unRead.${this.userId}`]: 0,
      };
      this.memberIds.forEach((memberId) => {
        if (memberId !== this.userId) {
          conversationUpdate[`unRead.${memberId}`] = increment(1);
        }
      });

      updateDoc(
        doc(this.db, this.CONVERSATIONS, this.conversationId!),
        conversationUpdate
      ).catch((err) => console.error('Error updating conversation:', err));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendMessageWithFile(
    message: Omit<IMessage, 'id' | 'createdAt'>,
    replyMessage?: IMessage['replyMessage']
  ): Promise<void> {
    const { path, extension } = message;

    if (!path || !extension || !this.conversationId) {
      console.error('Please provide path and extension');
      return;
    }

    try {
      let downloadUrl = path;

      // Upload if the path is a temporary blob/data URL (mirrors FirestoreServices.sendMessageWithFile)
      if (path.startsWith('blob:') || path.startsWith('data:')) {
        const provider = this.getStorageProviderOrThrow();
        const remotePath = `${this.conversationId}/${Date.now()}.${extension}`;
        const uploadResult = await provider.uploadFile(path, remotePath);
        downloadUrl = uploadResult.downloadUrl;
      }

      const messageForStorage: Record<string, unknown> = {
        ...message,
        path: downloadUrl,
        createdAt: serverTimestamp(),
      };
      if (replyMessage) messageForStorage.replyMessage = replyMessage;

      if (this.isEncryptionReady() && message.text?.trim()) {
        try {
          messageForStorage.text = this.encryptFunctionProp
            ? await this.encryptFunctionProp(message.text)
            : await encryptData(message.text, this.encryptKey);
        } catch (error) {
          console.error('Failed to encrypt file message text:', error);
        }
      }

      await addDoc(
        collection(
          this.db,
          this.CONVERSATIONS,
          this.conversationId,
          'messages'
        ),
        messageForStorage
      );

      // Mirror sendMessage: update conversation latestMessage + unRead counters
      // so the conversation list reflects the file send and other members see unread.
      const latestText = (messageForStorage.text as string) ?? '';
      const conversationUpdate: Record<string, unknown> = {
        latestMessage: convertToLatestMessage(
          this.userId,
          this.userInfo?.name ?? '',
          latestText,
          message.type,
          downloadUrl,
          extension
        ),
        updatedAt: serverTimestamp(),
        [`unRead.${this.userId}`]: 0,
      };
      this.memberIds.forEach((memberId) => {
        if (memberId !== this.userId) {
          conversationUpdate[`unRead.${memberId}`] = increment(1);
        }
      });

      updateDoc(
        doc(this.db, this.CONVERSATIONS, this.conversationId!),
        conversationUpdate
      ).catch((err) =>
        console.error('Error updating conversation after file send:', err)
      );
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw error;
    }
  }

  async updateMessage(message: IMessage): Promise<void> {
    if (!this.conversationId || !message.id) {
      console.error('Conversation ID and Message ID are required to update');
      return;
    }

    let updatedText = sanitizeUserInput(message.text ?? '');

    if (this.isEncryptionReady() && updatedText.trim()) {
      try {
        const encrypted = this.encryptFunctionProp
          ? await this.encryptFunctionProp(updatedText)
          : await encryptData(updatedText, this.encryptKey);
        if (encrypted) updatedText = encrypted;
      } catch (error) {
        console.error('Failed to encrypt updated message:', error);
        throw new Error('Message encryption failed');
      }
    }

    try {
      const messageRef = doc(
        this.db,
        this.CONVERSATIONS,
        this.conversationId,
        'messages',
        message.id
      );
      await updateDoc(messageRef, {
        text: updatedText,
        isEdited: true,
        updatedAt: serverTimestamp(),
      });

      // Attempt to refresh the conversation latestMessage preview
      try {
        const convRef = doc(this.db, this.CONVERSATIONS, this.conversationId);
        const convSnap = await getDoc(convRef);
        const convData = convSnap.data();
        if (
          convData?.latestMessage?.text &&
          convData.latestMessage.senderId === this.userId
        ) {
          await updateDoc(convRef, {
            'latestMessage.text': updatedText,
            'updatedAt': serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn(
          'Message updated but conversation preview could not be refreshed:',
          err
        );
      }
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  async changeReadMessage(_messageId: string, userId?: string): Promise<void> {
    if (!userId || !this.conversationId) return;
    try {
      await updateDoc(doc(this.db, this.CONVERSATIONS, this.conversationId), {
        [`unRead.${userId}`]: 0,
      });
    } catch (error) {
      console.error('Error updating unread message ID:', error);
    }
  }

  // ================================================================
  // Message history with stateful cursor (mirrors FirestoreServices)
  // ================================================================

  async getMessageHistory(maxPageSize: number): Promise<IMessage[]> {
    if (!this.userInfo || !this.conversationId) return [];
    try {
      const q = query(
        collection(
          this.db,
          this.CONVERSATIONS,
          this.conversationId,
          'messages'
        ),
        orderBy('createdAt', 'desc'),
        limit(maxPageSize)
      );
      const snapshot = await getDocs(q);
      const results = await Promise.all(
        snapshot.docs.map((d) => this.formatMessageDoc(d.data(), d.id))
      );
      if (results.length > 0) {
        this.messageCursor = snapshot.docs[snapshot.docs.length - 1];
      }
      return results;
    } catch (err) {
      console.error('[getMessageHistory] Exception:', err);
      return [];
    }
  }

  async getMoreMessage(maxPageSize: number): Promise<IMessage[]> {
    if (!this.userInfo || !this.messageCursor || !this.conversationId)
      return [];
    try {
      const q = query(
        collection(
          this.db,
          this.CONVERSATIONS,
          this.conversationId,
          'messages'
        ),
        orderBy('createdAt', 'desc'),
        startAfter(this.messageCursor),
        limit(maxPageSize)
      );
      const snapshot = await getDocs(q);
      const results = await Promise.all(
        snapshot.docs.map((d) => this.formatMessageDoc(d.data(), d.id))
      );
      if (results.length > 0) {
        this.messageCursor = snapshot.docs[snapshot.docs.length - 1];
      }
      return results;
    } catch (err) {
      console.error('[getMoreMessage] Exception:', err);
      return [];
    }
  }

  receiveMessageListener(callback: (message: IMessage) => void): () => void {
    if (!this.conversationId) {
      console.error(
        'Please set conversation info before listening for messages!'
      );
      return () => {};
    }

    const q = query(
      collection(this.db, this.CONVERSATIONS, this.conversationId, 'messages'),
      where('createdAt', '>', Timestamp.now()),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot) return;
      const added = snapshot.docChanges().filter((c) => c.type === 'added');
      if (!added.length) return;
      Promise.all(
        added.map((c) => this.formatMessageDoc(c.doc.data(), c.doc.id))
      ).then((messages) => messages.forEach(callback));
    });
  }

  countAllMessages(): Promise<number> {
    return new Promise<number>((resolve) => {
      if (!this.conversationId) {
        resolve(0);
        return;
      }
      getDocs(
        collection(this.db, this.CONVERSATIONS, this.conversationId, 'messages')
      )
        .then((snap) => resolve(snap.size))
        .catch(() => resolve(0));
    });
  }

  setUserConversationTyping(isTyping: boolean): Promise<void> | undefined {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before sending the first message!'
      );
      return;
    }
    return updateDoc(doc(this.db, this.CONVERSATIONS, this.conversationId), {
      [`typing.${this.userId}`]: isTyping,
    }).catch((err) => console.error('Error updating typing status:', err));
  }

  // ================================================================
  // Conversation listeners (mirrors FirestoreServices)
  // ================================================================

  userConversationListener(
    callback?: (
      data:
        | { unRead?: Record<string, number>; typing?: Record<string, boolean> }
        | undefined
    ) => void
  ): (() => void) | undefined {
    if (!this.conversationId) {
      console.error('Please create conversation before listening!');
      return;
    }
    return onSnapshot(
      doc(this.db, this.CONVERSATIONS, this.conversationId),
      (snap) => {
        if (!snap.exists()) {
          callback?.(undefined);
          return;
        }
        const data = snap.data();
        callback?.({ unRead: data?.unRead ?? {}, typing: data?.typing ?? {} });
      }
    );
  }

  listenConversationUpdate(
    callback: (conversation: ConversationProps) => void
  ): () => void {
    const q = query(
      collection(this.db, this.CONVERSATIONS),
      where('members', 'array-contains', this.userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      if (!snapshot) return;
      const changed = snapshot
        .docChanges()
        .filter((c) => c.type === 'modified' || c.type === 'added');
      if (!changed.length) return;

      const conversations = await Promise.all(
        changed.map(async (c) => {
          const data = c.doc.data();
          return {
            ...(data as ConversationProps),
            id: c.doc.id,
            latestMessage: data.latestMessage
              ? await this.formatLatestMessageDoc(data.latestMessage)
              : data.latestMessage,
          } as ConversationProps;
        })
      );
      conversations.forEach(callback);
    });
  }

  async getListConversation(): Promise<ConversationProps[]> {
    const q = query(
      collection(this.db, this.CONVERSATIONS),
      where('members', 'array-contains', this.userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data();
        return {
          ...(data as ConversationProps),
          id: d.id,
          latestMessage: data.latestMessage
            ? await this.formatLatestMessageDoc(data.latestMessage)
            : data.latestMessage,
        } as ConversationProps;
      })
    );
  }

  async searchConversations(searchText: string): Promise<ConversationProps[]> {
    if (!searchText.trim()) return this.getListConversation();
    const normalizedSearch = searchText.toLowerCase().trim();
    const all = await this.getListConversation();
    return all.filter(
      (c) =>
        c.name?.toLowerCase().includes(normalizedSearch) ||
        c.latestMessage?.text?.toLowerCase().includes(normalizedSearch)
    );
  }

  async getMediaFilesByConversationId(): Promise<MediaFile[]> {
    if (!this.conversationId) {
      console.error('Please create conversation before listing media files!');
      return [];
    }
    const provider = this.getStorageProviderOrThrow();
    const files = await provider.listFiles(this.conversationId);
    return files.map((file) => ({
      id: file.name?.split('.')[0] ?? `${Date.now()}`,
      path: file.downloadUrl,
      type: (getMediaTypeFromExtension(file.name) ??
        MediaType.file) as MediaType,
    }));
  }

  // ================================================================
  // Web-specific — kept for hook / component compatibility
  // ================================================================

  /**
   * Real-time message subscription used by useChat.
   * Returns raw (un-decrypted) IMessage objects so the hook can apply
   * its own decryption via the React-context derived key.
   */
  subscribeToMessages(
    conversationId: string,
    callback: (messages: IMessage[], lastDoc?: DocumentSnapshot) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((d) =>
        this.formatMessageDocRaw(d.data(), d.id)
      );
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      callback(messages.reverse(), lastDoc);
    });
  }

  /** Real-time conversation list subscription used by ChatScreen. */
  subscribeToUserConversations(
    userId: string,
    callback: (conversations: ConversationProps[]) => void
  ): () => void {
    this.userService.createUserIfNotExists(userId).catch(console.error);

    const q = query(
      collection(this.db, this.CONVERSATIONS),
      where('members', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations: ConversationProps[] = [];
      snapshot.forEach((docSnap) => {
        this.knownConversations.add(docSnap.id);
        const data = docSnap.data();
        const names: Record<string, string> = data.names || {};
        conversations.push({
          id: docSnap.id,
          name: names[userId] || data.name || '',
          image: data.image,
          members: data.members || [],
          unRead: data.unRead || {},
          typing: data.typing ?? {},
          updatedAt:
            data.updatedAt?.toMillis?.() ?? data.updatedAt ?? Date.now(),
          joinedAt:
            data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
          latestMessage: data.latestMessage || undefined,
        });
      });
      callback(conversations);
    });
  }

  /** Upload a File and return its storage path + download URL. */
  async uploadFile(
    file: File,
    conversationId: string
  ): Promise<{ path: string; downloadURL: string }> {
    if (file.size > this.maxFileSizeBytes) {
      throw new Error(
        `File size ${formatBytes(file.size)} exceeds the ${formatBytes(this.maxFileSizeBytes)} limit`
      );
    }

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `conversations/${conversationId}/files/${fileName}`;

      if (this.storageProvider) {
        const localPath = URL.createObjectURL(file);
        const result = await this.storageProvider.uploadFile(
          localPath,
          filePath
        );
        URL.revokeObjectURL(localPath);
        return { path: result.fullPath, downloadURL: result.downloadUrl };
      }

      throw new Error(
        'No storage provider configured. Call setStorageProvider() with a ' +
          'WebFirebaseStorageProvider or another StorageProvider before uploading files.'
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteMessage(
    conversationId: string,
    messageId: string
  ): Promise<void> {
    try {
      await deleteDoc(
        doc(this.db, this.CONVERSATIONS, conversationId, 'messages', messageId)
      );
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async getMessagesWithPagination(
    conversationId: string,
    limitCount: number = 50,
    latestMessageDoc?: DocumentSnapshot
  ): Promise<IMessage[]> {
    try {
      let q = query(
        collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      if (latestMessageDoc) {
        q = query(
          collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
          orderBy('createdAt', 'desc'),
          startAfter(latestMessageDoc),
          limit(limitCount)
        );
      }
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map((d) =>
        this.formatMessageDocRaw(d.data(), d.id)
      );
      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // ================================================================
  // Backward-compat aliases (kept so existing callers don't break)
  // ================================================================

  /** @deprecated Use configuration({ prefix }) instead. */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /** @deprecated Use configuration({ blackListWords }) instead. */
  setBlackListRegex(regex?: RegExp): void {
    this.regexBlacklist = regex;
  }

  /** @deprecated Use changeReadMessage() instead. */
  async updateUnread(conversationId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, this.CONVERSATIONS, conversationId), {
        [`unRead.${userId}`]: 0,
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'not-found') return;
      console.error('Error updating unread count:', error);
      throw new Error('Failed to update unread count');
    }
  }

  /** @deprecated Use setUserConversationTyping() instead. */
  async updateTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      await updateDoc(doc(this.db, this.CONVERSATIONS, conversationId), {
        [`typing.${userId}`]: isTyping,
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }

  /** @deprecated Use userConversationListener() instead. */
  subscribeToConversation(
    conversationId: string,
    callback: (
      data:
        | { unRead?: Record<string, number>; typing?: Record<string, boolean> }
        | undefined
    ) => void
  ): () => void {
    return onSnapshot(
      doc(this.db, this.CONVERSATIONS, conversationId),
      (snap) => {
        if (!snap.exists()) {
          callback(undefined);
          return;
        }
        const data = snap.data();
        callback({ unRead: data?.unRead ?? {}, typing: data?.typing ?? {} });
      }
    );
  }
}
