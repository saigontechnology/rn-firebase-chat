import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {
  encryptData,
  formatEncryptedMessageData,
  formatMessageData,
  generateKey,
} from '../../Utilities';
import {
  ConversationProps,
  FireStoreCollection,
  type MessageProps,
  type UserProfileProps,
} from '../../interfaces';
import { uploadFileToFirebase } from '../Firebase';
import { haveSameContents } from '../../Utilities/ultis';
import { MESSAGE_STATUS } from '../../Chat/constanst';

interface FirestoreProps {
  userId: string;
  memberId: string[];
  userInfo?: UserProfileProps;
  conversationId?: string;
  enableEncrypt?: boolean;
}

let instance: FirestoreServices | undefined;

export class FirestoreServices {
  userId: string | undefined;
  memberId: string[] | undefined;
  userInfo: UserProfileProps | undefined;
  conversationId: string | undefined;
  enableEncrypt: boolean | undefined;

  messageCursor:
    | FirebaseFirestoreTypes.QueryDocumentSnapshot<MessageProps>
    | undefined;

  constructor() {}

  static getInstance = () => {
    if (instance) {
      return instance;
    }
    instance = new FirestoreServices();
    return instance;
  };

  setChatData = ({
    userId,
    memberId,
    userInfo,
    conversationId,
    enableEncrypt,
  }: FirestoreProps) => {
    this.userId = userId.toString();
    this.memberId = memberId;
    this.userInfo = userInfo;
    this.conversationId = conversationId;
    this.enableEncrypt = enableEncrypt;
  };

  sendMessage = async (text: string, file?: any) => {
    try {
      if (!this.conversationId) {
        return;
      }
      let message = text;
      const messageData = {
        readBy: {},
        status: MESSAGE_STATUS.pending,
        senderId: this.userId,
        ...file,
      };
      if (message) {
        if (this.enableEncrypt) {
          const key = await generateKey('Arnold', 'salt', 5000, 256);
          message = await encryptData(text, key);
        }
        const created = new Date().valueOf();
        messageData.created = created;
        messageData.text = message;
        await this.updateLatestMessageInChannel(message);
        const messageRef = await firestore()
          .collection<MessageProps>(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
          .add(messageData);

        await messageRef.update({
          status: MESSAGE_STATUS.sent as MessageProps['status'],
        });
      }
      if (file) {
        const res = await uploadFileToFirebase(
          file?.imageUrl,
          file?.extension,
          this.conversationId
        );
        const imageUrl = await storage()
          .ref(res.metadata.fullPath)
          .getDownloadURL();

        const created = new Date().valueOf();
        messageData.created = created;
        messageData.text = '';

        const fileMessageRef = await firestore()
          .collection<MessageProps>(
            `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
          )
          .add(messageData);

        await fileMessageRef.update({
          imageUrl,
          status: MESSAGE_STATUS.sent as MessageProps['status'],
        });
      }
    } catch (error) {}
  };

  updateLatestMessageInChannel = (message: string) => {
    if (!this.userId) {
      return;
    }
    const created = new Date().valueOf();
    const latestMessageData = {
      text: message,
      created: created,
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
              change.doc.data().status === MESSAGE_STATUS.sent
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

  createConversation = async () => {
    const userId = this.userId as string;
    const memberId = this.memberId as string[];

    const conversationData = {
      members: {
        [userId]: firestore().doc(`${FireStoreCollection.users}/${userId}`),
        // [memberId]: firestore().doc(`${FireStoreCollection.users}/${memberId}`),
      },
    };
    memberId.forEach((item, index) => {
      conversationData.members[item] = firestore().doc(
        `${FireStoreCollection.users}/${item}`
      );
    });

    const conversationRef = await firestore()
      .collection<Partial<ConversationProps>>(
        `${FireStoreCollection.conversations}`
      )
      .add(conversationData);

    const userConversationData: Partial<ConversationProps> = {
      id: conversationRef.id,
      updated: new Date().valueOf(),
      unRead: {
        [userId]: 0,
        // [memberId]: 0,
      },
      members: conversationData.members,
    };

    await Promise.all([
      //Update info of the conversation
      firestore()
        .collection<Partial<ConversationProps>>(
          `${FireStoreCollection.conversations}`
        )
        .doc(conversationRef.id)
        .set(userConversationData, {
          merge: true,
        }),
      //Add the conversation id to the info of the user
      [userId, ...memberId].map((id) => {
        const userRef = firestore()
          .collection(`${FireStoreCollection.users}`)
          .doc(id);
        return firestore().runTransaction(async (transaction) => {
          const doc = await transaction.get<Partial<UserProfileProps>>(userRef);
          const conversations = doc?.data()?.conversations ?? [];
          if (doc.exists) {
            transaction.update(userRef, {
              conversations: conversations.concat(conversationRef.id),
            });
            return;
          }
          await userRef.update({
            conversations: conversations.concat(conversationRef.id),
          });
        });
      }),
    ]);
    this.conversationId = conversationRef.id;
    return { ...conversationData, id: conversationRef.id };
  };

  getConservation = async (userId: string, memberId: string[]) => {
    let conversationId = '';
    await firestore()
      .collection(`${FireStoreCollection.conversations}`)
      .get()
      .then((e) => {
        e.docs.map((r) => {
          const data = r.data();
          let listUser: string[] = [];
          try {
            listUser = Object.keys(data?.members);

            const listMemberA: string[] = [...memberId, userId];
            const res = haveSameContents(listUser, listMemberA);
            if (res) {
              conversationId = data.id;
            }
          } catch (error) {}
        });
      });
    return conversationId;
  };
}
