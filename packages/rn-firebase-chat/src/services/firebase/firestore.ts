import firestore, {
  collection,
  FirebaseFirestoreTypes,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { InteractionManager } from 'react-native';
import {
  encryptData,
  decryptData,
  formatLatestMessage,
  formatMessageData,
  formatMessageText,
  formatSendMessage,
  generateBadWordsRegex,
  generateEncryptionKey,
  getCurrentTimestamp,
  getServerTimestamp,
  getMediaTypeFromExtension,
  validateUserId,
  validateEncryptionKey,
  validateMessage,
  sanitizeUserInput,
} from '../../utilities';
import {
  ConversationProps,
  EncryptionFunctions,
  EncryptionOptions,
  EncryptionStatus,
  FireStoreCollection,
  FirestoreReference,
  MediaFile,
  MessageTypes,
  type IUserInfo,
  type MessageProps,
  type SendMessageProps,
} from '../../interfaces';
import type {
  ChatScreenService,
  MessageProps as SharedMessageProps,
  ReplyToMessage,
  StorageProvider,
} from '@saigontechnology/firebase-chat-shared';

type PropsWithoutEncryption = {
  enableEncrypt: false;
  encryptionOptions?: never;
  encryptKey?: never;
};

type PropsWithEncryption = {
  enableEncrypt: true;
  encryptionOptions: EncryptionOptions;
  encryptKey: string;
};

type FirestoreEncryptionProps = PropsWithEncryption | PropsWithoutEncryption;

type FirestoreBaseProps = {
  userInfo?: IUserInfo;
  memberIds?: string[];
  blackListWords?: string[];
  encryptionFuncProps?: EncryptionFunctions;
  prefix?: string;
  storageProvider?: StorageProvider;
};

export type FirestoreProps = FirestoreBaseProps & FirestoreEncryptionProps;

export class FirestoreServices implements ChatScreenService {
  private static instance: FirestoreServices;

  /** User configuration */
  userInfo?: IUserInfo;
  enableEncrypt: boolean = false;
  encryptKey: string = '';
  regexBlacklist: RegExp | undefined;
  prefix = '';

  /** Encryption function */
  generateKeyFunctionProp: ((key: string) => Promise<string>) | undefined;
  encryptFunctionProp: ((text: string) => Promise<string>) | undefined;
  decryptFunctionProp: ((text: string) => Promise<string>) | undefined;

  /** Storage provider */
  private storageProvider: StorageProvider | null = null;

  /** Decryption cache: ciphertext → plaintext, cleared when encryptKey changes */
  private decryptCache = new Map<string, string>();

  /** Conversation info */
  conversationId: string | null = null;
  memberIds: string[] = [];
  partners: Record<string, IUserInfo> | null = null;
  /** Message info */
  messageCursor:
    | FirebaseFirestoreTypes.QueryDocumentSnapshot<MessageProps>
    | undefined;

  /**
   * The constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
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
  }: FirestoreBaseProps): Promise<void> => {
    // Validate user info
    if (userInfo) {
      if (!validateUserId(userInfo.id)) {
        throw new Error('Invalid user ID format');
      }

      // Sanitize user name and other string fields
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
      // Validate encryption key strength
      const keyValidation = validateEncryptionKey(encryptKey);
      if (!keyValidation.isValid) {
        console.warn('Weak encryption key detected:', keyValidation.errors);
        // Continue but log warnings - don't break existing functionality
      }

      this.enableEncrypt = true;
      this.encryptKey = this.generateKeyFunctionProp
        ? await this.generateKeyFunctionProp(encryptKey)
        : await generateEncryptionKey(encryptKey, encryptionOptions);

      // Validate the generated key
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

  getRegexBlacklist = () => {
    return this.regexBlacklist;
  };

  getUrlWithPrefix = (url: string) =>
    this.prefix ? `${this.prefix}-${url}` : url;

  /** Cached decrypt — avoids re-decrypting the same ciphertext multiple times */
  private cachedDecrypt = async (cipher: string): Promise<string> => {
    if (this.decryptCache.has(cipher)) {
      return this.decryptCache.get(cipher)!;
    }
    const plain = this.decryptFunctionProp
      ? await this.decryptFunctionProp(cipher)
      : cipher;
    this.decryptCache.set(cipher, plain);
    return plain;
  };

  getConfiguration = <
    K extends keyof Omit<
      FirestoreProps,
      // We remove these the props because they are converted to different props name
      'blackListWords' | 'encryptionOptions' | 'encryptionFuncProps'
    >,
  >(
    key: K
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => (this as Record<string, any>)[key];

  /**
   * Validates if encryption is properly configured
   */
  isEncryptionReady = (): boolean => {
    return !!(
      this.enableEncrypt &&
      this.encryptKey &&
      this.encryptKey.length > 0
    );
  };

  /**
   * Test encryption/decryption flow
   */
  testEncryption = async (testText: string = 'test'): Promise<boolean> => {
    if (!this.isEncryptionReady()) {
      return false;
    }

    try {
      const encrypted = this.encryptFunctionProp
        ? await this.encryptFunctionProp(testText)
        : await encryptData(testText, this.encryptKey);

      const decrypted = this.decryptFunctionProp
        ? await this.decryptFunctionProp(encrypted)
        : await decryptData(encrypted, this.encryptKey);

      return decrypted === testText;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  };

  /**
   * Get comprehensive encryption status
   */
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
  };

  clearConversationInfo = () => {
    this.conversationId = null;
    this.memberIds = [];
    this.partners = null;
  };

  /**
   *
   * @param conversationId pre-defined ID for the conversation
   * @param memberIds list member id in the conversation
   * @param name conversation's name
   * @param image conversation's image
   */
  createConversation = async (
    conversationId: string,
    memberIds: string[],
    name?: string,
    image?: string
  ): Promise<ConversationProps> => {
    const conversationData: Partial<ConversationProps> = {
      members: [this.userId, ...memberIds],
      name,
      updatedAt: getServerTimestamp(),
    };

    if (image) {
      conversationData.image = image;
    }

    const conversationsCollection = firestore().collection<
      Partial<ConversationProps>
    >(this.getUrlWithPrefix(FireStoreCollection.conversations));

    let conversationRef: FirestoreReference;
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
    const { path, extension } = message;

    if (!path || !extension || this.conversationId === null) {
      console.error('Please provide path and extension');
      return;
    }

    try {
      const provider = this.getStorageProviderOrThrow();
      const remotePath = `${this.conversationId}/${new Date().getTime()}.${extension}`;
      const uploadResult = await provider.uploadFile(path, remotePath);
      const imgURL = uploadResult.downloadUrl;

      // Create message copy for storage
      const messageForStorage = { ...message, path: imgURL };

      // Encrypt file message text if encryption is enabled and text exists
      if (this.enableEncrypt && this.encryptKey && message.text?.trim()) {
        try {
          const encryptedText = this.encryptFunctionProp
            ? await this.encryptFunctionProp(message.text)
            : await encryptData(message.text, this.encryptKey);

          messageForStorage.text = encryptedText;
        } catch (error) {
          console.error('Failed to encrypt file message text:', error);
        }
      }

      await firestore()
        .collection<SendMessageProps>(
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        )
        .add(messageForStorage);
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw error; // Re-throw to allow caller to handle
    }
  };

  /**
   * send message to collection conversation and update latest message to users
   * @param text is message
   */
  sendMessage = async (
    message: SharedMessageProps,
    replyMessage?: ReplyToMessage
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

    // Validate message content if it's a text message
    if (message.text?.trim()) {
      const messageValidation = validateMessage(message.text);
      if (!messageValidation.isValid) {
        console.error('Invalid message:', messageValidation.errors);
        return;
      }
    }

    // Sanitize message text
    if (message.text) {
      message.text = sanitizeUserInput(message.text);
    }

    // Convert replyMessage from ReplyToMessage to ReplyMessage format
    const convertedReplyMessage = replyMessage
      ? {
          _id: replyMessage.id,
          text: replyMessage.text,
          user: {
            _id: replyMessage.userId,
            name: replyMessage.userName,
          },
        }
      : undefined;

    const { text, type, path, extension } = message;
    let messageData;

    if (
      message.type === MessageTypes.image ||
      message.type === MessageTypes.video
    ) {
      messageData = formatSendMessage(this.userId, text, type, path, extension);
      if (convertedReplyMessage)
        messageData.replyMessage = convertedReplyMessage;
      await this.sendMessageWithFile(messageData);
    } else {
      /** Format message */
      messageData = formatSendMessage(this.userId, text);
      if (convertedReplyMessage)
        messageData.replyMessage = convertedReplyMessage;

      /** Encrypt the message before store to firestore */
      if (this.enableEncrypt && this.encryptKey && text?.trim()) {
        try {
          const encryptedText = this.encryptFunctionProp
            ? await this.encryptFunctionProp(text)
            : await encryptData(text, this.encryptKey);

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
        /** Send message to collection conversation by id */
        await firestore()
          .collection<SendMessageProps>(
            this.getUrlWithPrefix(
              `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
            )
          )
          .add(messageData);

        /** Reuse already-encrypted text for latestMessage — no second encryption */
        const latestText = messageData.text ?? text;
        const latestMessageData = formatLatestMessage(
          this.userId,
          this.userInfo?.name || '',
          latestText
        );

        /** Build unRead update using dot-notation field paths so each key is
         *  written atomically without overwriting other members' counters.
         *  sender → 0, all other members → increment by 1 */
        const conversationUpdate: Record<string, unknown> = {
          latestMessage: latestMessageData,
          updatedAt: getServerTimestamp(),
          [`unRead.${this.userId}`]: 0,
        };
        this.memberIds.forEach((memberId) => {
          if (memberId !== this.userId) {
            conversationUpdate[`unRead.${memberId}`] =
              firestore.FieldValue.increment(1);
          }
        });

        /** Update top-level conversations doc so listenConversationUpdate fires.
         *  Use set+merge so this never throws not-found when the doc is absent. */
        firestore()
          .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
          .doc(this.conversationId!)
          .set(conversationUpdate, { merge: true })
          .catch((error) =>
            console.error('Error updating conversation:', error)
          );
      } catch (e) {
        console.error('Error sending message:', e);
        throw e; // Re-throw to allow caller to handle
      }
    }
  };

  /**
   * Update an existing message
   */
  updateMessage = async (message: SharedMessageProps): Promise<void> => {
    if (!this.conversationId || !message.id) {
      console.error('Conversation ID and Message ID are required to update');
      return;
    }

    const { text } = message;
    let updatedText = text;

    // Sanitize and validate
    const sanitizedText = sanitizeUserInput(text);
    const messageValidation = validateMessage(sanitizedText);
    if (!messageValidation.isValid) {
      console.error('Invalid message:', messageValidation.errors);
      return;
    }

    updatedText = sanitizedText;

    /** Encrypt the message if enabled */
    if (this.enableEncrypt && this.encryptKey && updatedText.trim()) {
      try {
        const encryptedText = this.encryptFunctionProp
          ? await this.encryptFunctionProp(updatedText)
          : await encryptData(updatedText, this.encryptKey);

        if (encryptedText) {
          updatedText = encryptedText;
        }
      } catch (error) {
        console.error('Failed to encrypt updated message:', error);
        throw new Error('Message encryption failed');
      }
    }

    try {
      const messageRef = firestore()
        .collection(
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        )
        .doc(message.id);

      // Attempt to update the message document itself.
      // We use .set with merge: true for maximum compatibility with varying security rules.
      await messageRef.set(
        { text: updatedText, isEdited: true },
        { merge: true }
      );

      // Attempt to update the top-level conversation preview.
      // This is wrapped in its own try/catch because client-side rules often
      // forbid direct updates to conversation metadata even if sub-collections are allowed.
      try {
        const conversationRef = firestore()
          .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
          .doc(this.conversationId);

        const conversationDoc = await conversationRef.get();
        const conversationData = conversationDoc.data();

        if (
          conversationData?.latestMessage?.text &&
          conversationData.latestMessage.senderId === this.userId
        ) {
          // Update top-level latestMessage text if the edited message was indeed the latest one
          await conversationRef.update({
            'latestMessage.text': updatedText,
            'updatedAt': getServerTimestamp(),
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
    if (!userId || !this.conversationId) {
      return;
    }

    try {
      await firestore()
        .collection(this.getUrlWithPrefix(FireStoreCollection.conversations))
        .doc(this.conversationId)
        .update({ [`unRead.${userId}`]: 0 });
    } catch (error) {
      console.error('Error updating unread message ID: ', error);
    }
  };

  getMessageHistory = async (
    maxPageSize: number
  ): Promise<SharedMessageProps[]> => {
    const listMessage: SharedMessageProps[] = [];

    if (!this.userInfo) {
      return listMessage;
    }

    try {
      const path = this.getUrlWithPrefix(
        `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
      );

      const querySnapshot = await firestore()
        .collection<MessageProps>(path)
        .orderBy('createdAt', 'desc')
        .limit(maxPageSize)
        .get();

      await new Promise<void>((resolve) =>
        InteractionManager.runAfterInteractions(resolve)
      );

      const results = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = { ...doc.data(), id: doc.id };
          const userInfo =
            data.senderId === this.userInfo?.id
              ? this.userInfo
              : ((this.partners?.[doc.data().senderId] as IUserInfo) ??
                this.userInfo);
          const formatted = await formatMessageData(
            data,
            userInfo,
            this.regexBlacklist,
            this.encryptKey,
            this.decryptFunctionProp
          );

          // Convert local MessageProps to SharedMessageProps
          const sharedMessage: SharedMessageProps = {
            ...formatted,
            replyMessage: formatted.replyMessage
              ? {
                  id: formatted.replyMessage._id || '',
                  text: formatted.replyMessage.text,
                  userId: String(formatted.replyMessage.user?._id || ''),
                  userName: formatted.replyMessage.user?.name || '',
                }
              : undefined,
          };

          return sharedMessage;
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

  getMoreMessage = async (
    maxPageSize: number
  ): Promise<SharedMessageProps[]> => {
    const listMessage: SharedMessageProps[] = [];

    if (!this.userInfo || !this.messageCursor) {
      return listMessage;
    }

    const querySnapshot = await firestore()
      .collection<MessageProps>(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .orderBy('createdAt', 'desc')
      .limit(maxPageSize)
      .startAfter(this.messageCursor)
      .get();

    await new Promise<void>((resolve) =>
      InteractionManager.runAfterInteractions(resolve)
    );
    const results = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = { ...doc.data(), id: doc.id };
        const userInfo =
          data.senderId === this.userInfo?.id
            ? this.userInfo
            : ((this.partners?.[doc.data().senderId] as IUserInfo) ??
              this.userInfo);
        const formatted = await formatMessageData(
          data,
          userInfo,
          this.regexBlacklist,
          this.encryptKey,
          this.decryptFunctionProp
        );

        // Convert local MessageProps to SharedMessageProps
        const sharedMessage: SharedMessageProps = {
          ...formatted,
          replyMessage: formatted.replyMessage
            ? {
                id: formatted.replyMessage._id || '',
                text: formatted.replyMessage.text,
                userId: String(formatted.replyMessage.user?._id || ''),
                userName: formatted.replyMessage.user?.name || '',
              }
            : undefined,
        };

        return sharedMessage;
      })
    );
    listMessage.push(...results);

    if (listMessage.length > 0) {
      this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    return listMessage;
  };

  receiveMessageListener = (
    callBack: (message: SharedMessageProps) => void
  ): (() => void) => {
    return firestore()
      .collection(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .where('createdAt', '>', firestore.Timestamp.now())
      .onSnapshot((snapshot) => {
        if (!snapshot) return;
        const added = snapshot
          .docChanges()
          .filter(
            (change: FirebaseFirestoreTypes.DocumentChange) =>
              change.type === 'added'
          );
        if (!added.length) return;
        Promise.all(
          added.map(async (change: FirebaseFirestoreTypes.DocumentChange) => {
            const data = {
              ...change.doc.data(),
              id: change.doc.id,
            } as MessageProps & { id: string };
            const userInfo =
              data.senderId === this.userInfo?.id
                ? this.userInfo
                : (this.partners?.[change.doc.data().senderId] as IUserInfo);
            const formatted = await formatMessageData(
              data,
              userInfo,
              this.regexBlacklist,
              this.encryptKey,
              this.decryptFunctionProp
            );

            // Convert local MessageProps to SharedMessageProps
            const sharedMessage: SharedMessageProps = {
              ...formatted,
              replyMessage: formatted.replyMessage
                ? {
                    id: formatted.replyMessage._id || '',
                    text: formatted.replyMessage.text,
                    userId: String(formatted.replyMessage.user?._id || ''),
                    userName: formatted.replyMessage.user?.name || '',
                  }
                : undefined,
            };

            return sharedMessage;
          })
        ).then((messages) => messages.forEach(callBack));
      });
  };

  userConversationListener = (
    callBack?: (data: FirebaseFirestoreTypes.DocumentData | undefined) => void
  ): (() => void) | undefined => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before send the first message!'
      );
      return;
    }
    return firestore()
      .collection(this.getUrlWithPrefix(`${FireStoreCollection.conversations}`))
      .doc(this.conversationId)
      .onSnapshot((snapshot) => {
        if (snapshot) {
          callBack?.(snapshot.data());
        }
      });
  };

  countAllMessages = () => {
    return new Promise<number>((resolve) => {
      if (this.conversationId) {
        firestore()
          .collection<MessageProps>(
            this.getUrlWithPrefix(
              `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
            )
          )
          .count()
          .get()
          .then((snapshot) => {
            resolve(snapshot.data().count);
          });
        return;
      }
      resolve(0);
    });
  };

  setUserConversationTyping = (
    isTyping: boolean
  ): Promise<void> | undefined => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before send the first message!'
      );
      return;
    }
    if (this.userId) {
      return firestore()
        .collection(
          this.getUrlWithPrefix(`${FireStoreCollection.conversations}`)
        )
        .doc(this.conversationId)
        .set(
          {
            typing: {
              [this.userId]: isTyping,
            },
          },
          {
            merge: true,
          }
        );
    }
    return new Promise<void>((resolve) => {
      resolve();
    });
  };

  getListConversation = async (): Promise<ConversationProps[]> => {
    const listChannels: ConversationProps[] = [];
    return new Promise((resolve) =>
      firestore()
        .collection<Partial<ConversationProps>>(
          this.getUrlWithPrefix(FireStoreCollection.conversations)
        )
        .where('members', 'array-contains', this.userId)
        .orderBy('updatedAt', 'desc')
        .get()
        .then(async (querySnapshot) => {
          await new Promise<void>((resolve) =>
            InteractionManager.runAfterInteractions(resolve)
          );
          const messages = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const data = { ...doc.data(), id: doc.id };
              return {
                ...data,
                latestMessage: data.latestMessage
                  ? await formatMessageText(
                      data?.latestMessage,
                      this.regexBlacklist,
                      this.encryptKey,
                      this.decryptFunctionProp
                    )
                  : data.latestMessage,
              } as ConversationProps;
            })
          );
          listChannels.push(...messages);
          resolve(listChannels);
        })
    );
  };

  /**
   * Search conversations by name or latest message text.
   * Fetches all conversations for the current user and filters client-side.
   * This approach is used because Firebase doesn't support case-insensitive
   * or full-text search natively.
   *
   * @param searchText The text to search for in conversation names or messages
   * @returns Promise resolving to filtered conversations
   */
  searchConversations = async (
    searchText: string
  ): Promise<ConversationProps[]> => {
    if (!searchText.trim()) {
      return this.getListConversation();
    }

    const normalizedSearch = searchText.toLowerCase().trim();

    try {
      // Fetch all conversations for the current user
      const allConversations = await this.getListConversation();

      // Filter conversations by name or latest message text (case-insensitive)
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

    const q = query(
      collection(
        firestore(),
        this.getUrlWithPrefix(FireStoreCollection.conversations)
      ),
      where('members', 'array-contains', this.userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot) return;
      const modified = snapshot
        .docChanges()
        .filter(
          (change: FirebaseFirestoreTypes.DocumentChange) =>
            change.type === 'modified' || change.type === 'added'
        );
      if (!modified.length) return;
      Promise.all(
        modified.map(async (change: FirebaseFirestoreTypes.DocumentChange) => {
          const data = {
            ...(change.doc.data() as ConversationProps),
            id: change.doc.id,
          };
          return {
            ...data,
            latestMessage: data.latestMessage
              ? await formatMessageText(
                  data?.latestMessage,
                  regex,
                  this.encryptKey,
                  this.decryptFunctionProp
                )
              : data.latestMessage,
          } as ConversationProps;
        })
      ).then((messages) => messages.forEach(callback));
    });
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
}
