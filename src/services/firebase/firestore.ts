import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  encryptData,
  formatEncryptedMessageData,
  formatLatestMessage,
  formatMessageData,
  formatSendMessage,
  generateEncryptionKey,
} from '../../utilities';
import {
  ConversationProps,
  EncryptionOptions,
  FireStoreCollection,
  type IUserInfo,
  type LatestMessageProps,
  type MessageProps,
  type SendMessageProps,
} from '../../interfaces';

interface FirestoreProps {
  userInfo: IUserInfo;
  enableEncrypt?: boolean;
  encryptKey?: string;
  memberIds?: string[];
}

export class FirestoreServices {
  private static instance: FirestoreServices;

  /** User configuration*/
  userInfo: IUserInfo | undefined;
  enableEncrypt: boolean | undefined;
  encryptKey: string = '';

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
      throw new Error('Please set userInfo before call chat  function');
    }
    return this.userInfo?.id || '';
  }

  static getInstance = () => {
    if (!FirestoreServices.instance) {
      FirestoreServices.instance = new FirestoreServices();
    }
    return FirestoreServices.instance;
  };

  configuration = ({ userInfo, enableEncrypt }: FirestoreProps) => {
    if (userInfo) {
      this.userInfo = userInfo;
    }
    this.enableEncrypt = enableEncrypt;
  };

  setConversationInfo = async (
    conversationId: string,
    memberIds: string[],
    partners: IUserInfo[],
    options?: EncryptionOptions
  ) => {
    this.conversationId = conversationId;
    this.memberIds = [this.userId, ...memberIds];
    this.partners = partners.reduce((a, b) => ({ ...a, [b.id]: b }), {});

    if (this.enableEncrypt && this.conversationId) {
      const res = await generateEncryptionKey(this.conversationId, options);
      this.encryptKey = res;
    }
  };
  clearConversationInfo = () => {
    this.conversationId = null;
    this.memberIds = [];
    this.partners = null;
  };

  /**
   *
   * @param memberIds list member id in the conversation
   * @param name conversation's name
   * @param image conversation's image
   */
  createConversation = async (
    memberIds: string[],
    name?: string,
    image?: string
  ): Promise<ConversationProps> => {
    let conversationData = {
      members: [this.userId, ...memberIds],
      name,
      image,
      updatedAt: Date.now(),
    };
    /** Create the conversation to the user who create the chat */
    const conversationRef = await firestore()
      .collection<Partial<ConversationProps>>(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .add(conversationData);
    /** Add the conversation to the user who is conversation's member */
    await Promise.all([
      memberIds.map((memberId) => {
        return firestore()
          .collection(
            `${FireStoreCollection.users}/${memberId}/${FireStoreCollection.conversations}`
          )
          .doc(conversationRef.id)
          .set(conversationData);
      }),
    ]);

    this.conversationId = conversationRef.id;
    this.memberIds = memberIds;
    return { ...conversationData, id: conversationRef.id } as ConversationProps;
  };

  /**
   * send message to collection conversation and update latest message to users
   * @param text is message
   */
  sendMessage = async (text: string) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    let message = text;
    /** Encrypt the message before store to firestore */
    if (this.enableEncrypt && this.encryptKey) {
      message = await encryptData(text, this.encryptKey);
    }
    /** Format message */
    const messageData = formatSendMessage(this.userId, message);
    try {
      /** Send message to collection conversation by id */
      await firestore()
        .collection<SendMessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .add(messageData);
      /** Update last message to members */

      /** Format latest message data */
      const latestMessageData = formatLatestMessage(this.userId, message);
      this.memberIds?.forEach((memberId) => {
        this.updateUserConversation(memberId, latestMessageData);
      });
    } catch (e) {
      console.log(e);
    }
  };

  updateUserConversation = (
    userId: string,
    latestMessageData: LatestMessageProps
  ) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    /** Update latest message for each member */
    firestore()
      .collection(
        `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
      )
      .doc(this.conversationId)
      .set(
        {
          latestMessage: latestMessageData,
          updatedAt: Date.now(),
        },
        { merge: true }
      )
      .then();
  };

  changeReadMessage = () => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    if (this.userId) {
      firestore()
        .collection(`${FireStoreCollection.conversations}`)
        .doc(this.conversationId)
        .set(
          {
            unRead: {
              [this.userId]: 0,
            },
          },
          { merge: true }
        )
        .then();
    }
  };

  getMessageHistory = (maxPageSize: number, options?: EncryptionOptions) => {
    let listMessage: Awaited<MessageProps>[] = [];
    return new Promise<Array<MessageProps>>(async (resolve) => {
      if (!this.userInfo) {
        resolve(listMessage);
        return;
      }
      const querySnapshot = await firestore()
        .collection<MessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
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
        const message = formatMessageData(data, userInfo);
        if (this.enableEncrypt && this.conversationId) {
          message.text = await formatEncryptedMessageData(
            message.text,
            this.conversationId,
            options
          );
        }
        listMessage.push(message);
      }
      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      resolve(listMessage);
    });
  };

  getMoreMessage = (maxPageSize: number, options?: EncryptionOptions) => {
    let listMessage: Awaited<MessageProps>[] = [];
    return new Promise<Array<MessageProps>>(async (resolve) => {
      if (!this.userInfo || !this.messageCursor) {
        resolve(listMessage);
        return;
      }
      const querySnapshot = await firestore()
        .collection<MessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
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

        const message = formatMessageData(data, userInfo);

        if (this.enableEncrypt && this.conversationId) {
          message.text = await formatEncryptedMessageData(
            data.text,
            this.conversationId,
            options
          );
        }

        listMessage.push(message);
      }
      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      resolve(listMessage);
    });
  };

  receiveMessageListener = (
    callBack: (message: any) => void,
    options?: EncryptionOptions
  ) => {
    return firestore()
      .collection<MessageProps>(
        `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
      )
      .onSnapshot(async (snapshot) => {
        if (snapshot) {
          for (const change of snapshot.docChanges()) {
            const message = change.doc.data();
            message.id = change.doc.id;
            if (change.type === 'added') {
              if (this.enableEncrypt && this.conversationId) {
                message.text = await formatEncryptedMessageData(
                  message.text,
                  this.conversationId,
                  options
                );
              }
              callBack(message);
            }
          }
        }
      });
  };

  userConversationListener = (
    callBack?: (data: FirebaseFirestoreTypes.DocumentData | undefined) => void
  ) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    return firestore()
      .collection(`${FireStoreCollection.conversations}`)
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
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
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

  setUserConversationTyping = (isTyping: boolean) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    if (this.userId) {
      return firestore()
        .collection(`${FireStoreCollection.conversations}`)
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

  getListConversation = async (
    options?: EncryptionOptions
  ): Promise<ConversationProps[]> => {
    const listChannels: ConversationProps[] = [];
    return new Promise((resolve) =>
      firestore()
        .collection<Partial<ConversationProps>>(
          `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
        )
        .orderBy('updatedAt', 'desc')
        .get()
        .then(async (querySnapshot) => {
          for (const doc of querySnapshot.docs) {
            const message = doc.data() as ConversationProps;
            message.id = doc.id;
            if (!!message.latestMessage?.text && this.enableEncrypt) {
              message.latestMessage.text =
                (await formatEncryptedMessageData(
                  message.latestMessage.text,
                  message.id,
                  options
                )) ?? message.latestMessage.text;
            }
            listChannels.push(message);
          }
          resolve(listChannels);
        })
    );
  };

  listenConversationUpdate = (
    callback: (_: ConversationProps) => void,
    options?: EncryptionOptions
  ) => {
    firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .onSnapshot(async (snapshot) => {
        if (snapshot) {
          for (const change of snapshot.docChanges()) {
            const message = change.doc.data() as ConversationProps;
            if (change.type === 'modified') {
              message.id = change.doc.id;
              if (
                this.enableEncrypt &&
                this.conversationId &&
                !!message.latestMessage?.text
              ) {
                message.latestMessage.text = await formatEncryptedMessageData(
                  message.latestMessage.text,
                  this.conversationId,
                  options
                );
              }
              callback?.(message);
            }
          }
        }
      });
  };
}
