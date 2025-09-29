import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

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
  getMediaTypeFromExtension,
  decryptedMessageData,
  getTextMessage,
  validateUserId,
  validateEncryptionKey,
  validateMessage,
  sanitizeUserInput,
} from '../../utilities';
import {
  ConversationData,
  ConversationProps,
  EncryptionFunctions,
  EncryptionOptions,
  EncryptionStatus,
  FireStoreCollection,
  FirestoreReference,
  MediaFile,
  MessageTypes,
  type IUserInfo,
  type LatestMessageProps,
  type MessageProps,
  type SendMessageProps,
} from '../../interfaces';
import { uploadFileToFirebase } from './storage';

type PropsWithEncryption = {
  enableEncrypt: true;
  encryptionOptions: EncryptionOptions;
  encryptKey?: string;
}

type PropsWithoutEncryption = {
  enableEncrypt: false;
}

type FirestoreEncryptionProps = PropsWithEncryption | PropsWithoutEncryption;

type FirestoreBaseProps = {
  userInfo?: IUserInfo;
  memberIds?: string[];
  blackListWords?: string[];
  encryptionFuncProps?: EncryptionFunctions;
  prefix?: string;
}

export type FirestoreProps = FirestoreBaseProps & FirestoreEncryptionProps;

export class FirestoreServices {
  private static instance: FirestoreServices;

  /** User configuration */
  userInfo: IUserInfo | undefined;
  enableEncrypt: boolean = false;
  encryptKey: string = '';
  regexBlacklist: RegExp | undefined;
  prefix = '';

  /** Encryption function */
  generateKeyFunctionProp: ((key: string) => Promise<string>) | undefined;
  encryptFunctionProp: ((text: string) => Promise<string>) | undefined;
  decryptFunctionProp: ((text: string) => Promise<string>) | undefined;

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
      console.error('Please set userInfo before call chat  function');
    }
    return this.userInfo?.id || '';
  }

  static getInstance = () => {
    if (!FirestoreServices.instance) {
      FirestoreServices.instance = new FirestoreServices();
    }
    return FirestoreServices.instance;
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
    } catch (error) {
      console.error('Error configuring encryption:', error);
      this.enableEncrypt = false;
      this.encryptKey = '';
      throw new Error('Failed to configure encryption');
    }
  };

  getRegexBlacklist = () => {
    return this.regexBlacklist;
  };

  getUrlWithPrefix = (url: string) =>
    this.prefix ? `${this.prefix}-${url}` : url;

  getConfiguration = <
    K extends keyof Omit<
      FirestoreProps,
      // We remove these the props because they are converted to different props name
      'blackListWords' | 'encryptionOptions' | 'encryptionFuncProps'
    >
  >(
    key: K
  ) => this[key];

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
    image?: string,
    isGroup?: boolean
  ): Promise<ConversationProps> => {
    let conversationData: Partial<ConversationProps> = {
      members: [this.userId, ...memberIds],
      name,
      updatedAt: getCurrentTimestamp(),
    };

    if (image) {
      conversationData.image = image;
    }

    let conversationRef: FirestoreReference = firestore().collection<
      Partial<ConversationProps>
    >(
      this.getUrlWithPrefix(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
    );
    /** Create the conversation to the user who create the chat */
    if (conversationId) {
      conversationRef = conversationRef.doc(conversationId);
      await conversationRef.set(conversationData);
    } else {
      conversationRef = await conversationRef.add(conversationData);
    }
    /** Add the conversation to the user who is conversation's member */
    await Promise.all([
      memberIds.map((memberId) => {
        const otherMemberConversationData = isGroup
          ? conversationData
          : /**
             * If this is 1-on-1 chat
             * We map conversation info of other people with this user info
             */
            {
              ...conversationData,
              name: this.userInfo?.name,
              image: this.userInfo?.avatar,
            };
        return firestore()
          .collection(
            this.getUrlWithPrefix(
              `${FireStoreCollection.users}/${memberId}/${FireStoreCollection.conversations}`
            )
          )
          .doc(conversationRef.id)
          .set(otherMemberConversationData);
      }),
    ]);

    this.conversationId = conversationRef.id;
    this.memberIds = memberIds;
    return { ...conversationData, id: conversationRef.id } as ConversationProps;
  };

  sendMessageWithFile = async (message: SendMessageProps): Promise<void> => {
    const { path, extension, type } = message;

    if (!path || !extension || this.conversationId === null) {
      console.error('Please provide path and extension');
      return;
    }

    try {
      const uploadResult = await uploadFileToFirebase(
        path,
        this.conversationId,
        extension
      );
      const imgURL = await storage()
        .ref(uploadResult.metadata.fullPath)
        .getDownloadURL();

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
          // Continue with unencrypted text for file messages as the media itself might be more important
        }
      }

      await firestore()
        .collection<SendMessageProps>(
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        )
        .add(messageForStorage);

      this.memberIds?.forEach((memberId) => {
        this.updateUserConversation(
          memberId,
          formatLatestMessage(
            this.userId,
            this.userInfo?.name || '',
            message.text || '', // Use original text for latest message
            type,
            path,
            extension
          )
        );
      });
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw error; // Re-throw to allow caller to handle
    }
  };

  /**
   * send message to collection conversation and update latest message to users
   * @param text is message
   */
  sendMessage = async (message: MessageProps): Promise<void> => {
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

    const { text, type, path, extension } = message;
    let messageData;

    if (
      message.type === MessageTypes.image ||
      message.type === MessageTypes.video
    ) {
      messageData = formatSendMessage(this.userId, text, type, path, extension);
      await this.sendMessageWithFile(messageData);
    } else {
      /** Format message */
      messageData = formatSendMessage(this.userId, text);

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
          // Depending on security requirements, you might want to:
          // 1. Throw error to prevent sending unencrypted message
          // 2. Send unencrypted message with warning
          // 3. Retry encryption
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

        /** Format latest message data - use original text for latest message */
        const latestMessageData = formatLatestMessage(
          this.userId,
          this.userInfo?.name || '',
          text // Use original text, not encrypted for latest message display
        );
        this.memberIds?.forEach((memberId) => {
          this.updateUserConversation(memberId, latestMessageData);
        });
      } catch (e) {
        console.error('Error sending message:', e);
        throw e; // Re-throw to allow caller to handle
      }
    }
  };

  updateUserConversation = (
    userId: string,
    latestMessageData: LatestMessageProps
  ): void => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before send the first message!'
      );
      return;
    }
    const userConversationRef = firestore()
      .collection<Partial<ConversationProps>>(
        this.getUrlWithPrefix(
          `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
        )
      )
      .doc(this.conversationId);
    if (userId === this.userId) {
      /** Update latest message for each member */
      userConversationRef
        .set(
          {
            latestMessage: latestMessageData,
            updatedAt: getCurrentTimestamp(),
            /** Update unRead for this user to 0 */
            unRead: 0,
          },
          { merge: true }
        )
        .catch((error) => {
          console.error('Error updating user conversation:', error);
        });
    } else {
      userConversationRef
        .get()
        .then((snapshot) => {
          /** Get unRead count for other members */
          const unReadCount = snapshot.data()?.unRead;
          userConversationRef
            .set(
              {
                latestMessage: latestMessageData,
                updatedAt: getCurrentTimestamp(),
                /** Increase unRead for other uses */
                unRead: unReadCount ? unReadCount + 1 : 1,
              },
              { merge: true }
            )
            .catch((error) => {
              console.error('Error updating user conversation:', error);
            });
        })
        .catch((error) => {
          console.error('Error getting user conversation snapshot:', error);
        });
    }
  };

  changeReadMessage = async (messageId: string, userId?: string) => {
    if (!userId || !this.conversationId) {
      return;
    }
    const conversationRef = firestore()
      .collection<ConversationData>(
        this.getUrlWithPrefix(`${FireStoreCollection.conversations}`)
      )
      .doc(this.conversationId);
    const userConversationRef = firestore()
      .collection<Partial<ConversationProps>>(
        this.getUrlWithPrefix(
          `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
        )
      )
      .doc(this.conversationId);

    try {
      await firestore().runTransaction(async (transaction) => {
        const conversationDoc = await transaction.get(conversationRef);
        let unRead: Record<string, string> = {};

        if (conversationDoc.exists()) {
          const conversationData = conversationDoc.data();
          if (conversationData && conversationData.unRead) {
            unRead = conversationData.unRead;
          }
        }

        unRead[userId] = messageId;
        transaction.set(conversationRef, { unRead }, { merge: true });
        transaction.set(userConversationRef, { unRead: 0 }, { merge: true });
      });
    } catch (error) {
      console.error('Error updating unread message ID: ', error);
    }
  };

  getMessageHistory = (maxPageSize: number) => {
    let listMessage: Awaited<MessageProps>[] = [];
    return new Promise<Array<MessageProps>>(async (resolve) => {
      if (!this.userInfo) {
        resolve(listMessage);
        return;
      }
      const querySnapshot = await firestore()
        .collection<MessageProps>(
          this.getUrlWithPrefix(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
        )
        .orderBy('createdAt', 'desc')
        .limit(maxPageSize)
        .get();
      for (const doc of querySnapshot.docs) {
        const data = { ...doc.data(), id: doc.id };
        const userInfo =
          data.senderId === this.userInfo?.id
            ? this.userInfo
            : (this.partners?.[doc.data().senderId] as IUserInfo);
        listMessage.push(
          await formatMessageData(
            data,
            userInfo,
            this.regexBlacklist,
            this.encryptKey,
            this.decryptFunctionProp
          )
        );
      }
      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      resolve(listMessage);
    });
  };

  getMoreMessage = (maxPageSize: number) => {
    let listMessage: Awaited<MessageProps>[] = [];
    return new Promise<Array<MessageProps>>(async (resolve) => {
      if (!this.userInfo || !this.messageCursor) {
        resolve(listMessage);
        return;
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

      for (const doc of querySnapshot.docs) {
        const data = { ...doc.data(), id: doc.id };
        const userInfo =
          data.senderId === this.userInfo?.id
            ? this.userInfo
            : (this.partners?.[doc.data().senderId] as IUserInfo);
        listMessage.push(
          await formatMessageData(
            data,
            userInfo,
            this.regexBlacklist,
            this.encryptKey,
            this.decryptFunctionProp
          )
        );
      }
      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      resolve(listMessage);
    });
  };

  receiveMessageListener = (
    callBack: (message: MessageProps) => void
  ): (() => void) => {
    return firestore()
      .collection(
        this.getUrlWithPrefix(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
      )
      .where('createdAt', '>', getCurrentTimestamp())
      .onSnapshot(async (snapshot) => {
        if (snapshot) {
          for (const change of snapshot.docChanges()) {
            if (change.type === 'added') {
              const data = {
                ...change.doc.data(),
                id: change.doc.id,
              } as MessageProps & { id: string };
              const userInfo =
                data.senderId === this.userInfo?.id
                  ? this.userInfo
                  : (this.partners?.[change.doc.data().senderId] as IUserInfo);
              callBack(
                await formatMessageData(
                  data,
                  userInfo,
                  this.regexBlacklist,
                  this.encryptKey,
                  this.decryptFunctionProp
                )
              );
            }
          }
        }
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
          this.getUrlWithPrefix(
            `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
          )
        )
        .orderBy('updatedAt', 'desc')
        .get()
        .then(async (querySnapshot) => {
          for (const doc of querySnapshot.docs) {
            const data = { ...doc.data(), id: doc.id };
            const message = {
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
            listChannels.push(message);
          }
          resolve(listChannels);
        })
    );
  };

  listenConversationUpdate = (
    callback: (_: ConversationProps) => void
  ): (() => void) => {
    const regex = this.regexBlacklist;

    return firestore()
      .collection(
        this.getUrlWithPrefix(
          `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
        )
      )
      .onSnapshot(async (snapshot) => {
        if (snapshot) {
          for (const change of snapshot.docChanges()) {
            if (change.type === 'modified') {
              const data = {
                ...(change.doc.data() as ConversationProps),
                id: change.doc.id,
              };
              const message = {
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
              callback?.(message);
            }
          }
        }
      });
  };

  getMediaFilesByConversationId = async (): Promise<MediaFile[]> => {
    if (!this.conversationId) {
      console.error(
        'Please create conversation before sending the first message!'
      );
      return [];
    }

    const listRef = storage().ref(this.conversationId);
    const result = await listRef.listAll();

    const filePromises = result.items.map(async (fileRef) => {
      const filePath = await fileRef.getDownloadURL();
      const id = fileRef.name?.split('.')[0];
      return {
        id: id || getCurrentTimestamp().toString(),
        path: filePath,
        type: getMediaTypeFromExtension(fileRef.name),
      };
    });
    const fileURLs: MediaFile[] = await Promise.all(filePromises);

    return fileURLs;
  };
}
