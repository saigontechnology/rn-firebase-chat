import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import {
  encryptData,
  formatLatestMessage,
  formatMessageData,
  formatSendMessage,
  generateKey,
} from '../../utilities';
import {
  ConversationProps,
  FireStoreCollection,
  SendPhotoVideoMessageProps,
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

  configuration = ({ userInfo, enableEncrypt, encryptKey }: FirestoreProps) => {
    if (userInfo) {
      this.userInfo = userInfo;
    }
    if (enableEncrypt && encryptKey) {
      this.enableEncrypt = enableEncrypt;
      generateKey(encryptKey, 'salt', 5000, 256).then((res) => {
        this.encryptKey = res;
      });
    }
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
   * @param memberIds list member id in the conversation
   * @param name conversation's name
   * @param image conversation's image
   */
  createConversation = async (
    memberIds: string[],
    name?: string,
    image?: string
  ): Promise<ConversationProps> => {
    let conversationData: Partial<ConversationProps> = {
      members: [this.userId, ...memberIds],
      name,
      updatedAt: Date.now(),
    };

    if (image) {
      conversationData.image = image;
    }
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

  sendMessageWithFile = async (message: SendPhotoVideoMessageProps) => {
    const { fileUrl, extension, type } = message;

    if (!fileUrl || !extension || this.conversationId === null) {
      throw new Error('Please provide fileUrl and extension');
    }

    const task = uploadFileToFirebase(
      fileUrl,
      type,
      this.conversationId,
      extension
    );
    task
      .then(
        (res) => {
          storage()
            .ref(res.metadata.fullPath)
            .getDownloadURL()
            .then((imgURL) => {
              firestore()
                .collection<SendPhotoVideoMessageProps>(
                  `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
                )
                .add(message)
                .then((snapShot) => {
                  snapShot
                    .update({
                      fileUrl: imgURL,
                    })
                    .then();
                })
                .catch((err) => {
                  console.log('chat', err);
                });
            });
        },
        (err) => {
          console.log('reject', err);
        }
      )
      .catch(() => {
        console.log('chat', 'err');
      });
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
        listMessage.push(formatMessageData(data, userInfo));
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
        listMessage.push(formatMessageData(data, userInfo));
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
      .onSnapshot((snapshot) => {
        if (snapshot) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              callBack({ ...change.doc.data(), id: change.doc.id });
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
          querySnapshot.forEach(function (doc) {
            listChannels.push({
              ...(doc.data() as ConversationProps),
              id: doc.id,
            });
          });
          resolve(listChannels);
        })
    );
  };

  listenConversationUpdate = (callback: (_: ConversationProps) => void) => {
    firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .onSnapshot(function (snapshot) {
        if (snapshot) {
          snapshot.docChanges().forEach(function (change) {
            if (change.type === 'modified') {
              callback?.({
                ...(change.doc.data() as ConversationProps),
                id: change.doc.id,
              });
            }
          });
        }
      });
  };
}
