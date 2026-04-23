import type { ICryptoProvider } from '../encryption/types';
import {
  formatLatestMessage,
  formatMessageData,
  formatMessageText,
  formatSendMessage,
  generateBadWordsRegex,
  getCurrentTimestamp,
  getMediaTypeFromExtension,
  sanitizeUserInput,
  validateEncryptionKey,
  validateMessage,
  validateUserId,
} from '../utils';
import {
  FireStoreCollection,
  MessageTypes,
  type ConversationProps,
  type EncryptionFunctions,
  type EncryptionOptions,
  type EncryptionStatus,
  type IUserInfo,
  type MediaFile,
  type MessageProps,
  type SendMessageProps,
} from '../types';
import type { StorageProvider } from '../types/storage';
import type {
  DocumentChange,
  DocumentData,
  DocumentRef,
  FirestoreClient,
  QueryDocumentSnapshot,
} from './firestore-client';

type PropsWithEncryption = {
  enableEncrypt?: true;
  encryptionOptions: EncryptionOptions;
  encryptKey?: string;
};

type PropsWithoutEncryption = {
  enableEncrypt: false;
  encryptionOptions?: never;
  encryptKey?: never;
};

type FirestoreEncryptionProps = PropsWithEncryption | PropsWithoutEncryption;

type FirestoreBaseProps = {
  userInfo?: IUserInfo;
  memberIds?: string[];
  blackListWords?: string[];
  encryptionFuncProps?: EncryptionFunctions;
  prefix?: string;
  storageProvider?: StorageProvider;
  /** Maximum allowed file size in bytes for sendMessageWithFile. Defaults to 25 MB. */
  maxFileSizeBytes?: number;
};

const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export type FirestoreProps = FirestoreBaseProps & FirestoreEncryptionProps;

export class FirestoreServices {
  private static instance: FirestoreServices;

  /** User configuration */
  userInfo?: IUserInfo;
  enableEncrypt: boolean = false;
  encryptKey: string = '';
  regexBlacklist: RegExp | undefined;
  prefix = '';
  maxFileSizeBytes: number = DEFAULT_MAX_FILE_SIZE_BYTES;

  /** Encryption function overrides */
  generateKeyFunctionProp: ((key: string) => Promise<string>) | undefined;
  encryptFunctionProp: ((text: string) => Promise<string>) | undefined;
  decryptFunctionProp: ((text: string) => Promise<string>) | undefined;

  /** Platform-injected Firestore adapter */
  private firestoreClient: FirestoreClient | null = null;

  /** Platform-injected crypto provider (RN or Web) */
  private cryptoProvider: ICryptoProvider | null = null;

  /** Storage provider */
  private storageProvider: StorageProvider | null = null;

  /** Decryption cache: ciphertext → plaintext, cleared when encryptKey changes */
  private decryptCache = new Map<string, string>();

  /** Conversation info */
  conversationId: string | null = null;
  memberIds: string[] = [];
  partners: Record<string, IUserInfo> | null = null;
  /** Message pagination cursor */
  messageCursor: QueryDocumentSnapshot<MessageProps> | undefined;

  constructor() {}

  get userId(): string {
    if (!this.userInfo?.id) {
      throw new Error(
        'FirestoreServices: userInfo not configured. Call configuration() before using chat functions.'
      );
    }
    return this.userInfo.id;
  }

  static getInstance = () => {
    if (!FirestoreServices.instance) {
      FirestoreServices.instance = new FirestoreServices();
    }
    return FirestoreServices.instance;
  };

  setFirestoreClient = (client: FirestoreClient): void => {
    this.firestoreClient = client;
  };

  getClient = (): FirestoreClient => {
    if (!this.firestoreClient) {
      throw new Error(
        'FirestoreClient is not configured. Call ' +
          'FirestoreServices.getInstance().setFirestoreClient(client) ' +
          'with a FirestoreClient implementation before using chat functions.'
      );
    }
    return this.firestoreClient;
  };

  setCryptoProvider = (provider: ICryptoProvider): void => {
    this.cryptoProvider = provider;
  };

  private getCryptoProviderOrThrow = (): ICryptoProvider => {
    if (!this.cryptoProvider) {
      throw new Error(
        'CryptoProvider is not configured. Call ' +
          'FirestoreServices.getInstance().setCryptoProvider(provider) ' +
          'to enable encryption, or supply encryption function overrides via createEncryptionsFunction().'
      );
    }
    return this.cryptoProvider;
  };

  setStorageProvider = (provider: StorageProvider): void => {
    this.storageProvider = provider;
  };

  private getStorageProviderOrThrow = (): StorageProvider => {
    if (!this.storageProvider) {
      throw new Error(
        'StorageProvider is not configured. To send files, call ' +
          'FirestoreServices.getInstance().setStorageProvider(provider) ' +
          'with a StorageProvider implementation (e.g., FirebaseStorageProvider).'
      );
    }
    return this.storageProvider;
  };

  createEncryptionsFunction = (functions: EncryptionFunctions) => {
    this.generateKeyFunctionProp = functions.generateKeyFunctionProp;
    this.encryptFunctionProp = functions.encryptFunctionProp;
    this.decryptFunctionProp = functions.decryptFunctionProp;
  };

  configuration = async ({
    userInfo,
    blackListWords,
    prefix,
    maxFileSizeBytes,
  }: FirestoreBaseProps): Promise<void> => {
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

    if (prefix) {
      this.prefix = prefix;
    }

    if (typeof maxFileSizeBytes === 'number' && maxFileSizeBytes > 0) {
      this.maxFileSizeBytes = maxFileSizeBytes;
    }
  };

  configurationEncryption = async ({
    encryptKey,
    encryptionOptions,
  }: PropsWithEncryption) => {
    if (!encryptKey) {
      console.error('Encrypt key is required');
      return;
    }

    try {
      const keyValidation = validateEncryptionKey(encryptKey);
      if (!keyValidation.isValid) {
        console.warn('Weak encryption key detected:', keyValidation.errors);
      }

      this.enableEncrypt = true;
      this.encryptKey = this.generateKeyFunctionProp
        ? await this.generateKeyFunctionProp(encryptKey)
        : await this.getCryptoProviderOrThrow().generateEncryptionKey(
            encryptKey,
            encryptionOptions
          );

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
  };

  getRegexBlacklist = () => this.regexBlacklist;

  getUrlWithPrefix = (url: string) =>
    this.prefix ? `${this.prefix}-${url}` : url;

  getConfiguration = <
    K extends keyof Omit<
      FirestoreProps,
      'blackListWords' | 'encryptionOptions' | 'encryptionFuncProps'
    >,
  >(
    key: K
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => (this as Record<string, any>)[key];

  isEncryptionReady = (): boolean =>
    !!(this.enableEncrypt && this.encryptKey && this.encryptKey.length > 0);

  private encrypt = async (text: string): Promise<string> => {
    if (this.encryptFunctionProp) return this.encryptFunctionProp(text);
    return this.getCryptoProviderOrThrow().encryptData(text, this.encryptKey);
  };

  /** Strict decrypt — throws on invalid ciphertext. Used for testEncryption(). */
  private decrypt = async (cipher: string): Promise<string> => {
    if (this.decryptFunctionProp) return this.decryptFunctionProp(cipher);
    return this.getCryptoProviderOrThrow().decryptData(cipher, this.encryptKey);
  };

  /**
   * Safe decrypt — falls back to the original text if decryption fails.
   * Handles messages stored before encryption was enabled (plain-text mixed history).
   */
  private safeDecrypt = async (cipher: string): Promise<string> => {
    if (this.decryptFunctionProp) {
      try {
        return await this.decryptFunctionProp(cipher);
      } catch {
        return cipher;
      }
    }
    return this.getCryptoProviderOrThrow().decryptedMessageData(
      cipher,
      this.encryptKey
    );
  };

  /**
   * Returns a decrypt callback for formatMessageText/formatMessageData.
   * Uses the safe variant so plain-text history doesn't throw.
   * Returns undefined when encryption is off so formatters skip decryption.
   */
  private get effectiveDecryptFn():
    | ((cipher: string) => Promise<string>)
    | undefined {
    if (!this.isEncryptionReady()) return undefined;
    return (cipher: string) => this.safeDecrypt(cipher);
  }

  testEncryption = async (testText: string = 'test'): Promise<boolean> => {
    if (!this.isEncryptionReady()) return false;
    try {
      const encrypted = await this.encrypt(testText);
      const decrypted = await this.decrypt(encrypted);
      return decrypted === testText;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  };

  getEncryptionStatus = async (): Promise<EncryptionStatus> => {
    const status: EncryptionStatus = {
      isEnabled: !!this.enableEncrypt,
      isReady: this.isEncryptionReady(),
      keyGenerated: !!(this.encryptKey && this.encryptKey.length > 0),
    };
    if (status.isReady) {
      try {
        status.testPassed = await this.testEncryption();
        status.lastTestedAt = new Date();
      } catch (error) {
        status.testPassed = false;
        console.error('Encryption status test failed:', error);
      }
    }
    return status;
  };

  setConversationInfo = (
    conversationId: string,
    memberIds: string[],
    partners: IUserInfo[]
  ) => {
    this.conversationId = conversationId;
    this.memberIds = [this.userId, ...memberIds];
    this.partners = partners.reduce((a, b) => ({ ...a, [b.id]: b }), {});

    // Keep each partner's view of the current user's name up to date.
    // Fire-and-forget: errors are silently ignored (doc may not exist yet).
    if (this.userInfo?.name && this.userId) {
      const nameUpdates: Record<string, string> = {
        [`names.${this.userId}`]: this.userInfo!.name,
      };
      this.getClient()
        .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
        .doc(conversationId)
        .update(nameUpdates)
        .catch(() => {});
    }
  };

  clearConversationInfo = () => {
    this.conversationId = null;
    this.memberIds = [];
    this.partners = null;
  };

  createConversation = async (
    conversationId: string,
    memberIds: string[],
    name?: string,
    image?: string,
    names?: Record<string, string>
  ): Promise<ConversationProps> => {
    const client = this.getClient();
    const conversationData: Partial<ConversationProps> = {
      members: [this.userId, ...memberIds],
      updatedAt: client.fieldValues.serverTimestamp(),
    };
    if (name) conversationData.name = name;
    if (names) conversationData.names = names;
    if (image) conversationData.image = image;

    const conversationsCollection = client.collection<
      Partial<ConversationProps>
    >(this.getUrlWithPrefix(FireStoreCollection.conversations));

    let conversationRef: DocumentRef<Partial<ConversationProps>>;
    if (conversationId) {
      conversationRef = conversationsCollection.doc(conversationId);
      await conversationRef.set(conversationData, { merge: true });
    } else {
      conversationRef = await conversationsCollection.add(conversationData);
    }

    this.conversationId = conversationRef.id;
    this.memberIds = memberIds;
    return { ...conversationData, id: conversationRef.id } as ConversationProps;
  };

  sendMessageWithFile = async (message: SendMessageProps): Promise<void> => {
    const { path, extension, fileSize } = message;

    if (!path || !extension || this.conversationId === null) {
      console.error('Please provide path and extension');
      return;
    }

    if (typeof fileSize === 'number' && fileSize > this.maxFileSizeBytes) {
      throw new Error(
        `File size ${formatBytes(fileSize)} exceeds the ${formatBytes(this.maxFileSizeBytes)} limit`
      );
    }

    try {
      const client = this.getClient();
      // If path is already a remote URL (pre-uploaded by web), skip the upload step.
      const isRemoteUrl =
        path.startsWith('http://') || path.startsWith('https://');
      let imgURL: string;
      if (isRemoteUrl) {
        imgURL = path;
      } else {
        const provider = this.getStorageProviderOrThrow();
        const remotePath = `${this.conversationId}/${new Date().getTime()}.${extension}`;
        const uploadResult = await provider.uploadFile(path, remotePath);
        imgURL = uploadResult.downloadUrl;
      }

      const messageForStorage = {
        ...message,
        path: imgURL,
        createdAt: message.createdAt ?? client.fieldValues.serverTimestamp(),
      };

      if (this.enableEncrypt && this.encryptKey && message.text?.trim()) {
        try {
          messageForStorage.text = await this.encrypt(message.text);
        } catch (error) {
          console.error('Failed to encrypt file message text:', error);
        }
      }

      await client
        .collection<SendMessageProps>(
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        )
        .add(messageForStorage);

      const latestText = messageForStorage.text ?? '';
      const latestMessageData = formatLatestMessage(
        this.userId,
        this.userInfo?.name || '',
        latestText,
        message.type,
        imgURL,
        extension
      );
      const conversationUpdate: Record<string, unknown> = {
        latestMessage: latestMessageData,
        updatedAt: client.fieldValues.serverTimestamp(),
        [`unRead.${this.userId}`]: 0,
      };
      this.memberIds.forEach((memberId) => {
        if (memberId !== this.userId) {
          conversationUpdate[`unRead.${memberId}`] =
            client.fieldValues.increment(1);
        }
      });

      client
        .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
        .doc(this.conversationId!)
        .update(conversationUpdate)
        .catch((error: unknown) =>
          console.error('Error updating conversation after file send:', error)
        );
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw error;
    }
  };

  sendMessage = async (
    message: MessageProps,
    replyMessage?: MessageProps['replyMessage']
  ): Promise<void> => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before send the first message!'
      );
      return;
    }

    if (!message.text?.trim() && !message.path) {
      console.error('Message text or path is required');
      return;
    }

    if (message.text?.trim()) {
      const messageValidation = validateMessage(message.text);
      if (!messageValidation.isValid) {
        console.error('Invalid message:', messageValidation.errors);
        return;
      }
    }

    if (message.text) {
      message.text = sanitizeUserInput(message.text);
    }

    const { text, type, path, extension } = message;
    const serverTs = this.getClient().fieldValues.serverTimestamp();
    let messageData;

    if (
      message.type === MessageTypes.image ||
      message.type === MessageTypes.video
    ) {
      messageData = formatSendMessage(this.userId, text, type, path, extension);
      messageData.createdAt = serverTs;
      if (replyMessage) messageData.replyMessage = replyMessage;
      await this.sendMessageWithFile(messageData);
    } else {
      messageData = formatSendMessage(this.userId, text);
      messageData.createdAt = serverTs;
      if (replyMessage) messageData.replyMessage = replyMessage;

      if (this.enableEncrypt && this.encryptKey && text?.trim()) {
        try {
          const encryptedText = await this.encrypt(text);
          if (!encryptedText) {
            throw new Error('Encryption returned empty result');
          }
          messageData.text = encryptedText;
        } catch (error) {
          console.error('Failed to encrypt message:', error);
          throw new Error('Message encryption failed - message not sent');
        }
      }

      try {
        const client = this.getClient();
        await client
          .collection<SendMessageProps>(
            this.getUrlWithPrefix(
              `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
            )
          )
          .add(messageData);

        const latestText = messageData.text ?? text;
        const latestMessageData = formatLatestMessage(
          this.userId,
          this.userInfo?.name || '',
          latestText
        );

        const conversationUpdate: Record<string, unknown> = {
          latestMessage: latestMessageData,
          updatedAt: client.fieldValues.serverTimestamp(),
          [`unRead.${this.userId}`]: 0,
        };
        this.memberIds.forEach((memberId) => {
          if (memberId !== this.userId) {
            conversationUpdate[`unRead.${memberId}`] =
              client.fieldValues.increment(1);
          }
        });

        client
          .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
          .doc(this.conversationId!)
          .update(conversationUpdate)
          .catch((error: unknown) =>
            console.error('Error updating conversation:', error)
          );
      } catch (e) {
        console.error('Error sending message:', e);
        throw e;
      }
    }
  };

  updateMessage = async (message: MessageProps): Promise<void> => {
    if (!this.conversationId || !message.id) {
      console.error('Conversation ID and Message ID are required to update');
      return;
    }

    const { text } = message;
    let updatedText = text;

    const sanitizedText = sanitizeUserInput(text);
    const messageValidation = validateMessage(sanitizedText);
    if (!messageValidation.isValid) {
      console.error('Invalid message:', messageValidation.errors);
      return;
    }
    updatedText = sanitizedText;

    if (this.enableEncrypt && this.encryptKey && updatedText.trim()) {
      try {
        const encryptedText = await this.encrypt(updatedText);
        if (encryptedText) updatedText = encryptedText;
      } catch (error) {
        console.error('Failed to encrypt updated message:', error);
        throw new Error('Message encryption failed');
      }
    }

    try {
      const client = this.getClient();
      const messageRef = client
        .collection(
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        )
        .doc(message.id);

      await messageRef.set(
        { text: updatedText, isEdited: true },
        { merge: true }
      );

      try {
        const conversationRef = client
          .collection<
            Partial<ConversationProps>
          >(this.getUrlWithPrefix(FireStoreCollection.conversations))
          .doc(this.conversationId);

        const conversationDoc = await conversationRef.get();
        const conversationData = conversationDoc.data();

        if (
          conversationData?.latestMessage?.text &&
          conversationData.latestMessage.senderId === this.userId
        ) {
          await conversationRef.update({
            'latestMessage.text': updatedText,
            'updatedAt': client.fieldValues.serverTimestamp(),
          });
        }
      } catch (convError) {
        console.warn(
          'Message updated successfully, but conversation preview could not be refreshed (likely restricted by security rules):',
          convError
        );
      }
    } catch (e) {
      console.error('Error updating message:', e);
      throw e;
    }
  };

  changeReadMessage = async (_messageId: string, userId?: string) => {
    if (!userId || !this.conversationId) return;
    try {
      await this.getClient()
        .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
        .doc(this.conversationId)
        .update({ [`unRead.${userId}`]: 0 });
    } catch (error) {
      console.error('Error updating unread message ID: ', error);
    }
  };

  getMessageHistory = async (maxPageSize: number) => {
    const listMessage: MessageProps[] = [];
    if (!this.userInfo) return listMessage;

    try {
      const path = this.getUrlWithPrefix(
        `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
      );

      const querySnapshot = await this.getClient()
        .collection<MessageProps>(path)
        .get({
          orderBy: [['createdAt', 'desc']],
          limit: maxPageSize,
        });

      const results = await Promise.all(
        querySnapshot.docs.map((doc) => {
          const data = { ...doc.data(), id: doc.id };
          const userInfo =
            data.senderId === this.userInfo?.id
              ? this.userInfo
              : ((this.partners?.[doc.data().senderId] as IUserInfo) ??
                this.userInfo);
          return formatMessageData(
            data,
            userInfo,
            this.regexBlacklist,
            this.encryptKey,
            this.effectiveDecryptFn
          );
        })
      );
      listMessage.push(...results);

      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
    } catch (err) {
      console.error('[getMessageHistory] Exception occurred:', err);
    }

    return listMessage;
  };

  getMoreMessage = async (maxPageSize: number) => {
    const listMessage: MessageProps[] = [];
    if (!this.userInfo || !this.messageCursor) return listMessage;

    const querySnapshot = await this.getClient()
      .collection<MessageProps>(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .get({
        orderBy: [['createdAt', 'desc']],
        limit: maxPageSize,
        startAfter: this.messageCursor,
      });

    const results = await Promise.all(
      querySnapshot.docs.map((doc) => {
        const data = { ...doc.data(), id: doc.id };
        const userInfo =
          data.senderId === this.userInfo?.id
            ? this.userInfo
            : ((this.partners?.[doc.data().senderId] as IUserInfo) ??
              this.userInfo);
        return formatMessageData(
          data,
          userInfo,
          this.regexBlacklist,
          this.encryptKey,
          this.effectiveDecryptFn
        );
      })
    );
    listMessage.push(...results);

    if (listMessage.length > 0) {
      this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    return listMessage;
  };

  receiveMessageListener = (
    callBack: (message: MessageProps) => void
  ): (() => void) => {
    const client = this.getClient();
    return client
      .collection<MessageProps>(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .onSnapshot(
        { where: [['createdAt', '>', client.fieldValues.timestampNow()]] },
        (snapshot) => {
          if (!snapshot) return;
          const added = snapshot
            .docChanges()
            .filter(
              (change: DocumentChange<MessageProps>) => change.type === 'added'
            );
          if (!added.length) return;
          Promise.all(
            added.map((change: DocumentChange<MessageProps>) => {
              const data = {
                ...change.doc.data(),
                id: change.doc.id,
              } as MessageProps & { id: string };
              const userInfo =
                data.senderId === this.userInfo?.id
                  ? this.userInfo
                  : ((this.partners?.[
                      change.doc.data().senderId
                    ] as IUserInfo) ?? this.userInfo);
              return formatMessageData(
                data,
                userInfo,
                this.regexBlacklist,
                this.encryptKey,
                this.effectiveDecryptFn
              );
            })
          ).then((messages) => messages.forEach(callBack));
        }
      );
  };

  userConversationListener = (
    callBack?: (data: DocumentData | undefined) => void
  ): (() => void) | undefined => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before send the first message!'
      );
      return;
    }
    return this.getClient()
      .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
      .doc(this.conversationId)
      .onSnapshot((snapshot) => {
        if (snapshot) callBack?.(snapshot.data());
      });
  };

  countAllMessages = () => {
    if (!this.conversationId) return Promise.resolve(0);
    return this.getClient()
      .collection<MessageProps>(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .count();
  };

  setUserConversationTyping = (
    isTyping: boolean
  ): Promise<void> | undefined => {
    if (!this.conversationId) return;
    if (this.userId) {
      return this.getClient()
        .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
        .doc(this.conversationId)
        .set(
          { typing: { [this.userId]: isTyping ? Date.now() : 0 } },
          { merge: true }
        );
    }
    return Promise.resolve();
  };

  getListConversation = async (): Promise<ConversationProps[]> => {
    const listChannels: ConversationProps[] = [];
    const querySnapshot = await this.getClient()
      .collection<Partial<ConversationProps>>(
        this.getUrlWithPrefix(FireStoreCollection.conversations)
      )
      .get({
        where: [['members', 'array-contains', this.userId]],
        orderBy: [['updatedAt', 'desc']],
      });

    const messages = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = { ...doc.data(), id: doc.id };
        const rawTs = data.updatedAt as
          | { toMillis?: () => number }
          | number
          | undefined;
        const updatedAt =
          typeof rawTs === 'number'
            ? rawTs
            : (rawTs?.toMillis?.() ?? Date.now());
        return {
          ...data,
          updatedAt,
          latestMessage: data.latestMessage
            ? await formatMessageText(
                data?.latestMessage,
                this.regexBlacklist,
                this.encryptKey,
                this.effectiveDecryptFn
              )
            : data.latestMessage,
        } as ConversationProps;
      })
    );
    listChannels.push(...messages);
    return listChannels;
  };

  searchConversations = async (
    searchText: string
  ): Promise<ConversationProps[]> => {
    if (!searchText.trim()) return this.getListConversation();

    const normalizedSearch = searchText.toLowerCase().trim();

    try {
      const allConversations = await this.getListConversation();
      return allConversations.filter(
        (conversation) =>
          conversation.name?.toLowerCase().includes(normalizedSearch) ||
          conversation.latestMessage?.text
            ?.toLowerCase()
            .includes(normalizedSearch)
      );
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  };

  listenConversationUpdate = (
    callback: (_: ConversationProps) => void
  ): (() => void) => {
    const regex = this.regexBlacklist;

    return this.getClient()
      .collection<ConversationProps>(
        this.getUrlWithPrefix(FireStoreCollection.conversations)
      )
      .onSnapshot(
        {
          where: [['members', 'array-contains', this.userId]],
          orderBy: [['updatedAt', 'desc']],
        },
        (snapshot) => {
          if (!snapshot) return;
          const modified = snapshot
            .docChanges()
            .filter(
              (change: DocumentChange<ConversationProps>) =>
                change.type === 'modified' || change.type === 'added'
            );
          if (!modified.length) return;
          Promise.all(
            modified.map(async (change: DocumentChange<ConversationProps>) => {
              const data = {
                ...change.doc.data(),
                id: change.doc.id,
              };
              return {
                ...data,
                latestMessage: data.latestMessage
                  ? await formatMessageText(
                      data?.latestMessage,
                      regex,
                      this.encryptKey,
                      this.effectiveDecryptFn
                    )
                  : data.latestMessage,
              } as ConversationProps;
            })
          ).then((messages) => messages.forEach(callback));
        }
      );
  };

  getMediaFilesByConversationId = async (): Promise<MediaFile[]> => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before sending the first message!'
      );
      return [];
    }

    const provider = this.getStorageProviderOrThrow();
    const files = await provider.listFiles(this.conversationId);

    const fileURLs: MediaFile[] = files.map((file) => {
      const id = file.name?.split('.')[0];
      return {
        id: id || getCurrentTimestamp().toString(),
        path: file.downloadUrl,
        type: getMediaTypeFromExtension(file.name),
      };
    });

    return fileURLs;
  };

  deleteMessage = async (messageId: string): Promise<void> => {
    if (!this.conversationId) {
      console.error('Conversation ID is required to delete a message');
      return;
    }
    await this.getClient()
      .collection(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .doc(messageId)
      .delete();
  };

  subscribeToListConversation = (
    callback: (conversations: ConversationProps[]) => void
  ): (() => void) => {
    const regex = this.regexBlacklist;
    return this.getClient()
      .collection<ConversationProps>(
        this.getUrlWithPrefix(FireStoreCollection.conversations)
      )
      .onSnapshot(
        {
          where: [['members', 'array-contains', this.userId]],
          orderBy: [['updatedAt', 'desc']],
        },
        async (snapshot) => {
          const conversations = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = { ...doc.data(), id: doc.id };
              const raw = data.updatedAt as
                | { toMillis?: () => number }
                | number
                | undefined;
              const updatedAt =
                typeof raw === 'number'
                  ? raw
                  : (raw?.toMillis?.() ?? Date.now());
              return {
                ...data,
                updatedAt,
                latestMessage: data.latestMessage
                  ? await formatMessageText(
                      data.latestMessage,
                      regex,
                      this.encryptKey,
                      this.effectiveDecryptFn
                    )
                  : data.latestMessage,
              } as ConversationProps;
            })
          );
          callback(conversations);
        }
      );
  };
}
