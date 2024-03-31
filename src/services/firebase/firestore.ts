import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  encryptData,
  formatEncryptedMessageData,
  formatMessageData,
  generateKey,
} from '../../utilities';
import {
  ConversationProps,
  FireStoreCollection,
  type IUserInfo,
  type MessageProps,
  MessageStatus,
  type UserProfileProps,
} from '../../interfaces';

interface FirestoreProps {
  userInfo: IUserInfo;
  enableEncrypt?: boolean;
  memberIds?: string[];
}

let instance: FirestoreServices | undefined;

export class FirestoreServices {
  userId: string | undefined;
  memberId: string | undefined;
  memberIds: string[] | undefined;
  userInfo: IUserInfo;
  conversationId: string | undefined;
  enableEncrypt: boolean | undefined;

  messageCursor:
    | FirebaseFirestoreTypes.QueryDocumentSnapshot<MessageProps>
    | undefined;

  constructor(props: FirestoreProps) {
    this.userInfo = props.userInfo;
    this.enableEncrypt = props.enableEncrypt;
    this.memberIds = props.memberIds;
  }

  static getInstance = () => {
    if (!instance) {
      throw new Error(
        'To use chat feature you must wrap your app with ChatProvider'
      );
    }
    return instance;
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
    const userId = this.userInfo.id;
    let conversationData = {
      members: [userId, ...memberIds],
      name,
      image,
      updated: Date.now(),
    };
    /** Create the conversation to the user who create the chat */
    const conversationRef = await firestore()
      .collection<Partial<ConversationProps>>(
        `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
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
    return { ...conversationData, id: conversationRef.id };
  };

  sendMessage = async (text: string, file?: any) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    let message = text;
    /** Encrypt the message before store to firestore */
    if (this.enableEncrypt) {
      const key = await generateKey('Arnold', 'salt', 5000, 256);
      message = await encryptData(text, key);
    }

    const messageData = {
      readBy: {},
      status: MessageStatus.sent,
      senderId: this.userId,
      created: Date.now(),
      text: message,
      ...file,
    };
    try {
      /** send message to collection conversation by id */
      const messageRef = await firestore()
        .collection<MessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .add(messageData);
      this.updateUserConversation(message);
    } catch (e) {}
  };

  updateUserConversation = (message: string) => {
    if (!this.userId) {
      return;
    }

    const latestMessageData = {
      text: message,
      created: Date.now(),
      senderId: this.userId,
      readBy: {
        [this.userId]: true,
      },
    };
    let conversationRef = firestore()
      .collection<ConversationProps>(`${FireStoreCollection.conversations}`)
      .doc(this.conversationId);
    return firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(conversationRef);
      const unRead = doc?.data()?.unRead ?? {};
      if (doc.exists) {
        transaction.update(conversationRef, {
          latestMessage: latestMessageData,
          unRead: Object.fromEntries(
            Object.entries(unRead).map(([memberId]) => {
              if (memberId === this.userId) {
                return [memberId, 0];
              } else {
                return [memberId, (unRead?.[memberId] ?? 0) + 1];
              }
            })
          ),
        });
        return;
      }
      conversationRef
        .update({
          latestMessage: latestMessageData,
          unRead: Object.fromEntries(
            Object.entries(unRead).map(([memberId]) => {
              if (memberId === this.userId) {
                return [memberId, 0];
              } else {
                return [memberId, 1];
              }
            })
          ),
        })
        .then();
    });
  };

  changeReadMessage = () => {
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

  getMessageHistory = () => {
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
        .orderBy('created', 'desc')
        .limit(20)
        .get();
      if (this.enableEncrypt) {
        listMessage = await Promise.all(
          querySnapshot.docs.map((doc) => {
            return formatEncryptedMessageData(
              { ...doc.data(), id: doc.id },
              (this.userInfo as UserProfileProps).name
            );
          })
        );
      } else {
        querySnapshot.forEach((doc) => {
          listMessage.push(
            formatMessageData(
              { ...doc.data(), id: doc.id },
              (this.userInfo as UserProfileProps).name
            )
          );
        });
      }
      if (listMessage.length > 0) {
        this.messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      resolve(listMessage);
    });
  };

  getMoreMessage = () => {
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
        .orderBy('created', 'desc')
        .limit(20)
        .startAfter(this.messageCursor)
        .get();
      if (this.enableEncrypt) {
        listMessage = await Promise.all<MessageProps>(
          querySnapshot.docs.map((doc) => {
            return formatEncryptedMessageData(
              { ...doc.data(), id: doc.id },
              (this.userInfo as UserProfileProps).name
            );
          })
        );
      } else {
        querySnapshot.forEach((doc) => {
          let message = formatMessageData(
            { ...doc.data(), id: doc.id },
            (this.userInfo as UserProfileProps).name
          );
          listMessage.push(message);
        });
      }
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
            if (
              change.type === 'modified' &&
              change.doc.data().status === 'sent'
            ) {
              callBack({ ...change.doc.data(), id: change.doc.id });
            }
          });
        }
      });
  };

  userConversationListener = (
    callBack?: (data: FirebaseFirestoreTypes.DocumentData | undefined) => void
  ) => {
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
    const userId = this.userInfo.id;
    const listChannels: ConversationProps[] = [];
    return new Promise((resolve) =>
      firestore()
        .collection<Partial<ConversationProps>>(
          `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
        )
        .orderBy('updated', 'desc')
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
    const userId = this.userInfo.id;
    firestore()
      .collection(
        `${FireStoreCollection.users}/${userId}/${FireStoreCollection.conversations}`
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
