import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  increment,
  getCountFromServer,
  Timestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
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
  MediaFile,
  MessageTypes,
  type IUserInfo,
  type MessageProps,
  type SendMessageProps,
} from '../../interfaces';
import type { StorageProvider } from '../../interfaces/storage';

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
};

export type FirestoreProps = FirestoreBaseProps & FirestoreEncryptionProps;

export class FirestoreServices {
  private static instance: FirestoreServices;
  private readonly db = getFirestore(getApp());

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
    | FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
    | undefined;

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
  };

  getRegexBlacklist = () => {
    return this.regexBlacklist;
  };

  getUrlWithPrefix = (url: string) =>
    this.prefix ? `${this.prefix}-${url}` : url;

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
      'blackListWords' | 'encryptionOptions' | 'encryptionFuncProps'
    >,
  >(
    key: K
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => (this as Record<string, any>)[key];

  isEncryptionReady = (): boolean => {
    return !!(
      this.enableEncrypt &&
      this.encryptKey &&
      this.encryptKey.length > 0
    );
  };

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
    if (this.userInfo?.name && memberIds.length > 0) {
      const nameUpdates: Record<string, string> = {};
      memberIds.forEach((id) => {
        nameUpdates[`names.${id}`] = this.userInfo!.name;
      });
      updateDoc(
        doc(
          this.db,
          this.getUrlWithPrefix(FireStoreCollection.conversations),
          conversationId
        ),
        nameUpdates
      ).catch(() => {});
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
    const conversationData: Partial<ConversationProps> = {
      members: [this.userId, ...memberIds],
      updatedAt: getServerTimestamp(),
    };

    if (name) conversationData.name = name;
    if (names) conversationData.names = names;
    if (image) conversationData.image = image;

    const conversationsCol = collection(
      this.db,
      this.getUrlWithPrefix(FireStoreCollection.conversations)
    );

    let docId: string;
    if (conversationId) {
      const conversationRef = doc(conversationsCol, conversationId);
      await setDoc(conversationRef, conversationData, { merge: true });
      docId = conversationId;
    } else {
      const conversationRef = await addDoc(conversationsCol, conversationData);
      docId = conversationRef.id;
    }

    this.conversationId = docId;
    this.memberIds = memberIds;
    return { ...conversationData, id: docId } as ConversationProps;
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

      const messageForStorage = { ...message, path: imgURL };

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

      await addDoc(
        collection(
          this.db,
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        ),
        messageForStorage
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
    let messageData;

    if (
      message.type === MessageTypes.image ||
      message.type === MessageTypes.video
    ) {
      messageData = formatSendMessage(this.userId, text, type, path, extension);
      if (replyMessage) messageData.replyMessage = replyMessage;
      await this.sendMessageWithFile(messageData);
    } else {
      messageData = formatSendMessage(this.userId, text);
      if (replyMessage) messageData.replyMessage = replyMessage;

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
        await addDoc(
          collection(
            this.db,
            this.getUrlWithPrefix(
              `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
            )
          ),
          messageData
        );

        const latestText = messageData.text ?? text;
        const latestMessageData = formatLatestMessage(
          this.userId,
          this.userInfo?.name || '',
          latestText
        );

        const unReadUpdate: Record<string, unknown> = {
          [`unRead.${this.userId}`]: 0,
        };
        this.memberIds.forEach((memberId) => {
          if (memberId !== this.userId) {
            unReadUpdate[`unRead.${memberId}`] = increment(1);
          }
        });

        const conversationRef = doc(
          this.db,
          this.getUrlWithPrefix(FireStoreCollection.conversations),
          this.conversationId!
        );

        setDoc(
          conversationRef,
          { latestMessage: latestMessageData, updatedAt: getServerTimestamp() },
          { merge: true }
        )
          .then(() => updateDoc(conversationRef, unReadUpdate))
          .catch((error) =>
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
      const messageRef = doc(
        this.db,
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        ),
        message.id
      );

      await setDoc(
        messageRef,
        { text: updatedText, isEdited: true },
        { merge: true }
      );

      try {
        const conversationRef = doc(
          this.db,
          this.getUrlWithPrefix(FireStoreCollection.conversations),
          this.conversationId
        );

        const conversationDoc = await getDoc(conversationRef);
        const conversationData = conversationDoc.data();

        if (
          conversationData?.latestMessage?.text &&
          conversationData.latestMessage.senderId === this.userId
        ) {
          await updateDoc(conversationRef, {
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
      await updateDoc(
        doc(
          this.db,
          this.getUrlWithPrefix(FireStoreCollection.conversations),
          this.conversationId
        ),
        { [`unRead.${userId}`]: 0 }
      );
    } catch (error) {
      console.error('Error updating unread message ID: ', error);
    }
  };

  getMessageHistory = async (maxPageSize: number) => {
    const listMessage: Awaited<MessageProps>[] = [];

    if (!this.userInfo) {
      return listMessage;
    }

    try {
      const path = this.getUrlWithPrefix(
        `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
      );

      const q = query(
        collection(this.db, path),
        orderBy('createdAt', 'desc'),
        limit(maxPageSize)
      );
      const querySnapshot = await getDocs(q);

      const results = await Promise.all(
        querySnapshot.docs.map(
          (
            docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
          ) => {
            const data = {
              ...docSnap.data(),
              id: docSnap.id,
            } as MessageProps & { id: string };
            const userInfo =
              data.senderId === this.userInfo?.id
                ? this.userInfo
                : ((this.partners?.[data.senderId] as IUserInfo) ??
                  this.userInfo);
            return formatMessageData(
              data,
              userInfo,
              this.regexBlacklist,
              this.encryptKey,
              this.decryptFunctionProp
            );
          }
        )
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
    const listMessage: Awaited<MessageProps>[] = [];

    if (!this.userInfo || !this.messageCursor) {
      return listMessage;
    }

    const path = this.getUrlWithPrefix(
      `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
    );

    const q = query(
      collection(this.db, path),
      orderBy('createdAt', 'desc'),
      limit(maxPageSize),
      startAfter(this.messageCursor)
    );
    const querySnapshot = await getDocs(q);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const results = await Promise.all(
      querySnapshot.docs.map(
        (
          docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
        ) => {
          const data = { ...docSnap.data(), id: docSnap.id } as MessageProps & {
            id: string;
          };
          const userInfo =
            data.senderId === this.userInfo?.id
              ? this.userInfo
              : ((this.partners?.[data.senderId] as IUserInfo) ??
                this.userInfo);
          return formatMessageData(
            data,
            userInfo,
            this.regexBlacklist,
            this.encryptKey,
            this.decryptFunctionProp
          );
        }
      )
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
    const q = query(
      collection(
        this.db,
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      ),
      where('createdAt', '>', Timestamp.now())
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot) return;
      const added = snapshot
        .docChanges()
        .filter(
          (change: FirebaseFirestoreTypes.DocumentChange) =>
            change.type === 'added'
        );
      if (!added.length) return;
      Promise.all(
        added.map((change: FirebaseFirestoreTypes.DocumentChange) => {
          const data = {
            ...change.doc.data(),
            id: change.doc.id,
          } as MessageProps & { id: string };
          const userInfo =
            data.senderId === this.userInfo?.id
              ? this.userInfo
              : (this.partners?.[change.doc.data().senderId] as IUserInfo);
          return formatMessageData(
            data,
            userInfo,
            this.regexBlacklist,
            this.encryptKey,
            this.decryptFunctionProp
          );
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

    const docRef = doc(
      this.db,
      this.getUrlWithPrefix(FireStoreCollection.conversations),
      this.conversationId
    );

    return onSnapshot(docRef, (snapshot) => {
      if (snapshot) {
        callBack?.(snapshot.data());
      }
    });
  };

  countAllMessages = () => {
    return new Promise<number>((resolve) => {
      if (this.conversationId) {
        const path = this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        );
        getCountFromServer(query(collection(this.db, path))).then(
          (snapshot) => {
            resolve(snapshot.data().count);
          }
        );
        return;
      }
      resolve(0);
    });
  };

  setUserConversationTyping = (
    isTyping: boolean
  ): Promise<void> | undefined => {
    if (!this.conversationId) {
      return;
    }
    if (this.userId) {
      return setDoc(
        doc(
          this.db,
          this.getUrlWithPrefix(FireStoreCollection.conversations),
          this.conversationId
        ),
        { typing: { [this.userId]: isTyping ? Date.now() : 0 } },
        { merge: true }
      );
    }
    return Promise.resolve();
  };

  getListConversation = async (): Promise<ConversationProps[]> => {
    const q = query(
      collection(
        this.db,
        this.getUrlWithPrefix(FireStoreCollection.conversations)
      ),
      where('members', 'array-contains', this.userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return Promise.all(
      querySnapshot.docs.map(
        async (
          docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
        ) => {
          const data = {
            ...docSnap.data(),
            id: docSnap.id,
          } as ConversationProps;
          return {
            ...data,
            latestMessage: data.latestMessage
              ? await formatMessageText(
                  data.latestMessage,
                  this.regexBlacklist,
                  this.encryptKey,
                  this.decryptFunctionProp
                )
              : data.latestMessage,
          } as ConversationProps;
        }
      )
    );
  };

  searchConversations = async (
    searchText: string
  ): Promise<ConversationProps[]> => {
    if (!searchText.trim()) {
      return this.getListConversation();
    }

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

    const q = query(
      collection(
        this.db,
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
                  data.latestMessage,
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

    return files.map((file) => {
      const id = file.name?.split('.')[0];
      return {
        id: id || getCurrentTimestamp().toString(),
        path: file.downloadUrl,
        type: getMediaTypeFromExtension(file.name),
      };
    });
  };
}
