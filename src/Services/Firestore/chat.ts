import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { uploadFileToFirebase } from '../Firebase';
import {
  encryptData,
  formatEncryptedMessageData,
  formatMessageData,
  generateKey,
} from '../../Utilities';
import type {
  ConversationProps,
  MemberProps,
  MessageProps,
  UserProfileProps,
} from '../../interfaces';
import { FireStoreCollection } from '../../interfaces';
import { PENDING_TYPE } from 'src/Chat/constanst';

let userInfo: UserProfileProps;
let currentUserId = '';
const setUserData = (userId: string, data: { name: string; id: string }) => {
  currentUserId = userId.toString();
  userInfo = data;
};

const sendMessage = async (
  conversationId: string,
  text: string,
  members: MemberProps,
  file?: any,
  enableEncrypt?: boolean
) => {
  let message = text;
  if (enableEncrypt) {
    const key = await generateKey('Arnold', 'salt', 5000, 256);
    message = await encryptData(text, key);
  }
  const created = new Date().valueOf();
  const messageData = {
    readBy: {},
    status: PENDING_TYPE,
    senderId: currentUserId,
    created: created,
    text: message || '',
    ...file,
  };
  await updateLatestMessageInChannel(
    currentUserId,
    conversationId,
    message || ''
  );

  if (file) {
    const task = uploadFileToFirebase(
      file.imageUrl,
      file.extension,
      conversationId
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
                  `${FireStoreCollection.conversations}/${conversationId}/${FireStoreCollection.messages}`
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
        `${FireStoreCollection.conversations}/${conversationId}/${FireStoreCollection.messages}`
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

const updateLatestMessageInChannel = (
  userId: string,
  conversationId: string,
  message: string
) => {
  const created = new Date().valueOf();
  const latestMessageData = {
    text: message,
    created: created,
    senderId: userId,
    readBy: {
      [userId]: true,
    },
  };
  let conversationRef = firestore()
    .collection<ConversationProps>(`${FireStoreCollection.conversations}`)
    .doc(conversationId);
  return firestore().runTransaction(function (transaction) {
    return transaction.get(conversationRef).then(function (doc) {
      const unRead = doc?.data()?.unRead ?? {};
      if (!doc.exists) {
        conversationRef
          .update({
            latestMessage: latestMessageData,
            unRead: Object.fromEntries(
              Object.entries(unRead).map(([memberId]) => {
                if (memberId === currentUserId) {
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
              if (memberId === currentUserId) {
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

const changeReadMessage = (conversationId: string) => {
  firestore()
    .collection(`${FireStoreCollection.conversations}`)
    .doc(conversationId)
    .set(
      {
        unRead: {
          [currentUserId]: 0,
        },
      },
      { merge: true }
    )
    .then(() => {});
};

let messageCursor:
  | FirebaseFirestoreTypes.QueryDocumentSnapshot<MessageProps>
  | undefined;

//
const getMessageHistory = (conversationId: string, enableEncrypt?: boolean) => {
  let listMessage: Awaited<Partial<MessageProps> | void>[] = [];
  return new Promise(async (resolve) => {
    const querySnapshot = await firestore()
      .collection<MessageProps>(
        `${FireStoreCollection.conversations}/${conversationId}/${FireStoreCollection.messages}`
      )
      .orderBy('created', 'desc')
      .limit(20)
      .get();
    if (enableEncrypt) {
      listMessage = await Promise.all(
        querySnapshot.docs.map((doc) => {
          return formatEncryptedMessageData(
            { ...doc.data(), id: doc.id },
            userInfo.name
          );
        })
      );
    } else {
      querySnapshot.forEach(function (doc) {
        listMessage.push(
          formatMessageData({ ...doc.data(), id: doc.id }, userInfo.name)
        );
      });
    }
    if (listMessage.length > 0) {
      messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
    }
    resolve(listMessage);
  });
};

const getMoreMessage = (
  conversationId: string,
  enableEncrypt?: boolean
): any => {
  if (!messageCursor) {
    return new Promise((resolve) => resolve([]));
  }
  let listMessage: Awaited<Partial<MessageProps> | void>[] = [];
  return new Promise(async (resolve) => {
    const querySnapshot = await firestore()
      .collection<MessageProps>(
        `${FireStoreCollection.conversations}/${conversationId}/${FireStoreCollection.messages}`
      )
      .orderBy('created', 'desc')
      .limit(20)
      .startAfter(messageCursor)
      .get();
    if (enableEncrypt) {
      listMessage = await Promise.all(
        querySnapshot.docs.map((doc) => {
          return formatEncryptedMessageData(
            { ...doc.data(), id: doc.id },
            userInfo.name
          );
        })
      );
    } else {
      querySnapshot.forEach((doc) => {
        let message = formatMessageData(
          { ...doc.data(), id: doc.id },
          userInfo.name
        );
        listMessage.push(message);
      });
    }
    if (listMessage.length > 0) {
      messageCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
    }
    resolve(listMessage);
  });
};

const receiveMessageListener = (
  conversationId: string,
  callBack: (message: any) => void
) => {
  return firestore()
    .collection<MessageProps>(
      `${FireStoreCollection.conversations}/${conversationId}/${FireStoreCollection.messages}`
    )
    .onSnapshot(function (snapshot) {
      if (snapshot) {
        snapshot.docChanges().forEach(function (change) {
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

function userConversationListener(
  conversationId: string,
  callBack?: (data: FirebaseFirestoreTypes.DocumentData | undefined) => void
) {
  return firestore()
    .collection(`${FireStoreCollection.conversations}`)
    .doc(conversationId)
    .onSnapshot(function (snapshot) {
      if (snapshot) {
        callBack?.(snapshot.data());
      }
    });
}

const countAllMessages = (conversationId: string) => {
  return new Promise<number>((resolve) => {
    firestore()
      .collection<MessageProps>(
        `${FireStoreCollection.conversations}/${conversationId}/${FireStoreCollection.messages}`
      )
      .count()
      .get()
      .then((snapshot) => {
        resolve(snapshot.data().count);
      });
  });
};

const setUserConversationTyping = (
  conversationId: string,
  memberId: string,
  isTyping: boolean
) => {
  return firestore()
    .collection(`${FireStoreCollection.conversations}`)
    .doc(conversationId)
    .set(
      {
        typing: {
          [currentUserId]: isTyping,
        },
      },
      {
        merge: true,
      }
    );
};

export {
  setUserData,
  getMessageHistory,
  updateLatestMessageInChannel,
  sendMessage,
  receiveMessageListener,
  changeReadMessage,
  getMoreMessage,
  countAllMessages,
  userConversationListener,
  setUserConversationTyping,
};
