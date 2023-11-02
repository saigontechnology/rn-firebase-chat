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
import { uploadFileToFirebase } from '../Firebase/storage';

interface FirestoreProps {
  userId?: string;
  userInfo?: UserProfileProps;
  conversationId?: string;
  enableEncrypt?: boolean;
}

let instance: FirestoreServices | undefined;

export class FirestoreServices {
  userId;
  userInfo;
  conversationId;
  enableEncrypt;

  messageCursor:
    | FirebaseFirestoreTypes.QueryDocumentSnapshot<MessageProps>
    | undefined;

  constructor(props: FirestoreProps) {
    this.userId = props.userId;
    this.userInfo = props.userInfo;
    this.conversationId = props.conversationId;
    this.enableEncrypt = props.enableEncrypt;
  }

  static getInstance = (props: FirestoreProps) => {
    if (instance) {
      return instance;
    }
    instance = new FirestoreServices(props);
    return instance;
  };

  setChatData = (
    userId: string,
    data: { name: string; id: string },
    conversationId: string,
    enableEncrypt: boolean
  ) => {
    this.userId = userId.toString();
    this.userInfo = { ...this.userInfo, ...data };
    this.conversationId = conversationId;
    this.enableEncrypt = enableEncrypt;
  };

  sendMessage = async (text: string, file?: any) => {
    if (!this.conversationId) {
      return;
    }
    let message = text;
    if (this.enableEncrypt) {
      const key = await generateKey('Arnold', 'salt', 5000, 256);
      message = await encryptData(text, key);
    }
    const created = new Date().valueOf();
    const messageData = {
      readBy: {},
      status: 'pending',
      senderId: this.userId,
      created: created,
      text: message || '',
      ...file,
    };
    await this.updateLatestMessageInChannel(message || '');

    if (file) {
      const task = uploadFileToFirebase(
        file.imageUrl,
        file.extension,
        this.conversationId
      );
      task
        .then(
          (res) => {
            storage()
              .ref(res.metadata.fullPath)
              .getDownloadURL()
              .then((imageUrl) => {
                firestore()
                  .collection<MessageProps>(
                    `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
                  )
                  .add(messageData)
                  .then((snapShot) => {
                    snapShot
                      .update({
                        imageUrl,
                        status: 'sent',
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
    } else {
      firestore()
        .collection<MessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .add(messageData)
        .then((snapShot) => {
          snapShot
            .update({
              status: 'sent',
            })
            .then();
        })
        .catch((err) => {
          console.log('chat', err);
        });
    }
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
    return firestore().runTransaction((transaction) => {
      return transaction.get(conversationRef).then((doc) => {
        const unRead = doc?.data()?.unRead ?? {};
        if (!doc.exists) {
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
        } else {
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
        }
      });
    });
  };

  changeReadMessage = () => {
    if (!this.userId) {
      return;
    }
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
      if (!this.conversationId) {
        return resolve(0);
      }
      firestore()
        .collection<MessageProps>(
          `${FireStoreCollection.conversations}/${this.conversationId}/${FireStoreCollection.messages}`
        )
        .count()
        .get()
        .then((snapshot) => {
          resolve(snapshot.data().count);
        });
    });
  };

  setUserConversationTyping = (isTyping: boolean) => {
    if (!this.userId) {
      return new Promise<void>((resolve) => {
        resolve();
      });
    }
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
  };
}
