import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import {
  encryptData,
  formatLatestMessage,
  formatMessageData,
  formatMessageText,
  formatSendMessage,
  generateBadWordsRegex,
  generateKey,
  getCurrentFormattedDate,
  getCurrentTimestamp,
  addLinkByDate,
  extractLinks,
} from '../../utilities';
import {
  ConversationProps,
  FireStoreCollection,
  FirestoreReference,
  MessageTypes,
  type IUserInfo,
  type LatestMessageProps,
  type MessageProps,
  type SendMessageProps,
} from '../../interfaces';
import { uploadFileToFirebase } from './storage';

interface FirestoreProps {
  userInfo: IUserInfo;
  enableEncrypt?: boolean;
  encryptKey?: string;
  memberIds?: string[];
  blackListWords: string[] | null;
}

export class FirestoreServices {
  private static instance: FirestoreServices;

  /** User configuration*/
  userInfo: IUserInfo | undefined;
  enableEncrypt: boolean | undefined;
  encryptKey: string = '';
  regexBlacklist: RegExp | undefined;

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

  configuration = ({
    userInfo,
    enableEncrypt,
    encryptKey,
    blackListWords,
  }: FirestoreProps) => {
    if (userInfo) {
      this.userInfo = userInfo;
    }

    if (blackListWords) {
      this.regexBlacklist = generateBadWordsRegex(blackListWords);
    }

    if (enableEncrypt && encryptKey) {
      this.enableEncrypt = enableEncrypt;
      generateKey(encryptKey, 'salt', 5000, 256).then((res) => {
        this.encryptKey = res;
      });
    }
  };

  getRegexBlacklist = () => {
    return this.regexBlacklist;
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
      `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
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

  sendMessageWithFile = async (message: SendMessageProps) => {
    const { path, extension, type } = message;

    if (!path || !extension || this.conversationId === null) {
      throw new Error('Please provide path and extension');
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

      const messageRef = firestore()
        .collection<SendMessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .add(message);

      const snapShot = await messageRef;
      await snapShot.update({ path: imgURL });

      this.memberIds?.forEach((memberId) => {
        this.updateUserConversation(
          memberId,
          formatLatestMessage(this.userId, '', type, path, extension)
        );
      });
    } catch (error) {
      console.error('Error sending message with file:', error);
    }
  };

  /**
   * send message to collection conversation and update latest message to users
   * @param text is message
   */
  sendMessage = async (message: MessageProps) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    const { text, type, path, extension } = message;
    let messageData;

    if (
      message.type === MessageTypes.image ||
      message.type === MessageTypes.video
    ) {
      messageData = formatSendMessage(this.userId, text, type, path, extension);
      this.sendMessageWithFile(messageData);
    } else {
      /** Format message */
      messageData = formatSendMessage(this.userId, text);
      /** Encrypt the message before store to firestore */
      if (this.enableEncrypt && this.encryptKey) {
        messageData.text = await encryptData(text, this.encryptKey);
      }

      try {
        /** Send message to collection conversation by id */
        await firestore()
          .collection<SendMessageProps>(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
          .add(messageData);

        /** Format latest message data */
        const latestMessageData = formatLatestMessage(
          this.userId,
          messageData.text
        );

        const links = extractLinks(message.text);
        this.memberIds?.forEach((memberId) => {
          this.updateUserConversation(memberId, latestMessageData, links);
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  getUserLinks = async () => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }

    const conversationRef = firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .doc(this.conversationId);
    const doc = await conversationRef.get();
    const existingLinks = doc.data()?.links || [];
    return existingLinks;
  };

  updateUserConversation = async (
    userId: string,
    latestMessageData: LatestMessageProps,
    links?: string[] | null
  ) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }

    const conversationRef = firestore()
      .collection(
        `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
      )
      .doc(this.conversationId);
    const doc = await conversationRef.get();

    const getToday = getCurrentFormattedDate();
    const existingLinks = doc.data()?.links || [];
    const currentLinks = addLinkByDate(existingLinks, links, getToday);

    conversationRef
      .set(
        {
          latestMessage: latestMessageData,
          updatedAt: getCurrentTimestamp(),
          links: currentLinks,
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

  getMessageHistory = (maxPageSize: number) => {
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
      querySnapshot.forEach((doc) => {
        const data = { ...doc.data(), id: doc.id };
        const userInfo =
          data.senderId === this.userInfo?.id
            ? this.userInfo
            : (this.partners?.[doc.data().senderId] as IUserInfo);
        listMessage.push(
          formatMessageData(data, userInfo, this.regexBlacklist)
        );
      });
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
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .orderBy('createdAt', 'desc')
        .limit(maxPageSize)
        .startAfter(this.messageCursor)
        .get();
      querySnapshot.forEach((doc) => {
        const data = { ...doc.data(), id: doc.id };
        const userInfo =
          data.senderId === this.userInfo?.id
            ? this.userInfo
            : (this.partners?.[doc.data().senderId] as IUserInfo);
        listMessage.push(
          formatMessageData(data, userInfo, this.regexBlacklist)
        );
      });
      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      resolve(listMessage);
    });
  };

  receiveMessageListener = (callBack: (message: any) => void) => {
    return firestore()
      .collection<MessageProps>(
        `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
      )
      .where('createdAt', '>', getCurrentTimestamp())
      .onSnapshot((snapshot) => {
        if (snapshot) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = { ...change.doc.data(), id: change.doc.id };
              const userInfo =
                data.senderId === this.userInfo?.id
                  ? this.userInfo
                  : (this.partners?.[change.doc.data().senderId] as IUserInfo);
              callBack(formatMessageData(data, userInfo, this.regexBlacklist));
            }
          });
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

  getListConversation = async (): Promise<ConversationProps[]> => {
    const listChannels: ConversationProps[] = [];
    return new Promise((resolve) =>
      firestore()
        .collection<Partial<ConversationProps>>(
          `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
        )
        .orderBy('updatedAt', 'desc')
        .get()
        .then((querySnapshot) => {
          const regex = this.regexBlacklist;
          querySnapshot.forEach(function (doc) {
            const data = { ...doc.data(), id: doc.id };
            const message = {
              ...data,
              latestMessage: data.latestMessage
                ? formatMessageText(data?.latestMessage, regex)
                : data.latestMessage,
            } as ConversationProps;
            listChannels.push(message);
          });
          resolve(listChannels);
        })
    );
  };

  listenConversationUpdate = (callback: (_: ConversationProps) => void) => {
    const regex = this.regexBlacklist;

    firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .onSnapshot(function (snapshot) {
        if (snapshot) {
          snapshot.docChanges().forEach(function (change) {
            if (change.type === 'modified') {
              const data = {
                ...(change.doc.data() as ConversationProps),
                id: change.doc.id,
              };
              const message = {
                ...data,
                latestMessage: data.latestMessage
                  ? formatMessageText(data?.latestMessage, regex)
                  : data.latestMessage,
              } as ConversationProps;
              callback?.(message);
            }
          });
        }
      });
  };
}
