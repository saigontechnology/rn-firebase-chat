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
  getCurrentTimestamp,
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
}

interface ConversationData {
  unRead?: { [key: string]: number };
  typing?: { [key: string]: boolean };
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

    if (!path || !extension || this.conversationId === null || !type) {
      throw new Error('Please provide path and extension');
    }

    try {
      const uploadResult = await uploadFileToFirebase(
        path,
        this.conversationId,
        extension,
        type
      );
      const imgURL = await storage()
        .ref(uploadResult.metadata.fullPath)
        .getDownloadURL();

      const messageRef = firestore()
        .collection<SendMessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .add({ ...message, path: imgURL });

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
  sendMessage = async (message: MessageProps, conversationName?: string) => {
    if (!this.conversationId) {
      throw new Error(
        'Please create conversation before send the first message!'
      );
    }
    const { text, type, path, extension, name, size, duration } = message;
    let messageData;

    if (!!message.type && message.type !== MessageTypes.text) {
      messageData = formatSendMessage(
        this.userId,
        text,
        type,
        path,
        extension,
        name,
        size,
        duration
      );
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
        this.memberIds?.forEach((memberId) => {
          this.updateUserConversation(
            memberId,
            latestMessageData,
            conversationName
          );
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  updateUserConversation = (
    userId: string,
    latestMessageData: LatestMessageProps,
    conversationName?: string
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
        conversationName
          ? {
              latestMessage: latestMessageData,
              updatedAt: getCurrentTimestamp(),
              name: conversationName,
            }
          : {
              latestMessage: latestMessageData,
              updatedAt: getCurrentTimestamp(),
            },
        { merge: true }
      )
      .then();
  };

  updateUnReadMessageInChannel = async () => {
    if (!this.userId || !this.conversationId) {
      return;
    }

    let conversationRef = firestore()
      .collection<ConversationData>(`${FireStoreCollection.conversations}`)
      .doc(this.conversationId);

    return firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(conversationRef);
      const unRead = doc.data()?.unRead ?? {};

      if (!doc.exists) {
        // If the document doesn't exist, create it with initial unRead object
        transaction.set(conversationRef, {
          unRead: Object.fromEntries(
            Object.entries(unRead).map(([memberId]) => {
              if (memberId === this.userId) {
                return [memberId, 0];
              } else {
                return [memberId, 1];
              }
            })
          ),
        });
      } else {
        // If the document exists, update it
        transaction.update(conversationRef, {
          unRead: Object.fromEntries(
            Object.entries(unRead).map(([memberId]) => {
              if (memberId === this.userId) {
                return [memberId, 0];
              } else {
                return [memberId, (unRead[memberId] ?? 0) + 1];
              }
            })
          ),
        });
      }
      return;
    });
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
      .where('createdAt', '>', getCurrentTimestamp())
      .onSnapshot((snapshot) => {
        if (snapshot) {
          snapshot.docChanges().forEach((change) => {
            const message = change.doc.data();
            message.id = change.doc.id;
            if (change.type === 'added') {
              callBack(message);
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

  listenConversationUpdate = (callback: (_: ConversationProps) => void) =>
    firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .onSnapshot(function (snapshot) {
        if (snapshot) {
          snapshot.docChanges().forEach(function (change) {
            if (change.type !== 'removed') {
              callback?.({
                ...(change.doc.data() as ConversationProps),
                id: change.doc.id,
              });
            }
          });
        }
      });

  listenConversationDelete = (callback: (id: string) => void) =>
    firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .onSnapshot(function (snapshot) {
        if (snapshot) {
          snapshot.docChanges().forEach(function (change) {
            if (change.type === 'removed') {
              callback?.(change.doc.id);
            }
          });
        }
      });

  checkConversationExist = async (id: string) => {
    const conversation = await firestore()
      .collection(
        `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
      )
      .doc(id)
      .get();

    return conversation?.exists;
  };

  /**
   * delete conversation from list
   * @param softDelete indicates whether to completely remove conversation or simply remove from user's list
   */
  deleteConversation = async (
    conversationId: string,
    partnersId?: string[]
  ): Promise<boolean> => {
    try {
      const isConversationExist = await this.checkConversationExist(
        conversationId
      );
      if (!isConversationExist) return false;

      await firestore()
        .collection(
          `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
        )
        .doc(conversationId)
        .delete();
      if (!partnersId?.length) return true;

      // If !partnersId, simply remove conversation on user side
      // If partnersId, delete all conversations of each partners
      const partnerBatch = firestore().batch();
      partnersId.forEach(async (id) => {
        const doc = firestore()
          .collection(
            `${FireStoreCollection.users}/${id}/${FireStoreCollection.conversations}`
          )
          .doc(conversationId);
        partnerBatch.delete(doc);
      });

      // Delete all messages of that conversation
      const batch = firestore().batch();
      const collectionRef = firestore()
        .collection(`${FireStoreCollection.conversations}`)
        .doc(conversationId);
      const messages = await collectionRef
        .collection(FireStoreCollection.messages)
        .get();
      messages?.forEach((message) => batch.delete(message.ref));

      await partnerBatch.commit();
      await batch.commit();
      await collectionRef.delete();
      return true;
    } catch (e) {
      return false;
    }
  };

  leaveConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const isConversationExist = await this.checkConversationExist(
        conversationId
      );
      if (!isConversationExist) return false;

      const leftConversation = firestore()
        .collection(
          `${FireStoreCollection.users}/${this.userId}/${FireStoreCollection.conversations}`
        )
        .doc(conversationId);

      const newMembers = (
        (await leftConversation.get()).data() as ConversationProps
      ).members?.filter((e) => e !== this.userId);

      const batch = firestore().batch();
      newMembers?.forEach((id) => {
        const doc = firestore()
          .collection(
            `${FireStoreCollection.users}/${id}/${FireStoreCollection.conversations}`
          )
          .doc(conversationId);
        batch.set(
          doc,
          {
            members: newMembers,
          },
          { merge: true }
        );
      });
      await leftConversation.delete();
      await batch.commit();

      return true;
    } catch (e) {
      return false;
    }
  };
}
