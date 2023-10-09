import firestore from '@react-native-firebase/firestore';
import type { ConversationProps } from '../../interfaces';
import { FireStoreCollection } from '../../interfaces';

const createConversation = async (
  userId: string,
  partnerId: string
  // conversationName: string,
) => {
  let conversationData = {
    members: {
      [userId]: firestore().doc(`${FireStoreCollection.users}/${userId}`),
      [partnerId]: firestore().doc(`${FireStoreCollection.users}/${partnerId}`),
    },
  };

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
      [partnerId]: 0,
    },
    members: conversationData.members,
  };

  await firestore()
    .collection<Partial<ConversationProps>>(
      `${FireStoreCollection.conversations}`
    )
    .doc(conversationRef.id)
    .set(userConversationData, {
      merge: true,
    });

  await firestore()
    .collection(`${FireStoreCollection.users}`)
    .doc(userId)
    .set(
      {
        conversations: [conversationRef.id],
      },
      {
        merge: true,
      }
    );

  await firestore()
    .collection(`${FireStoreCollection.users}`)
    .doc(partnerId)
    .set(
      {
        conversations: [conversationRef.id],
      },
      {
        merge: true,
      }
    );

  // await firestore()
  //   .collection<IUserConversation>(
  //     `${FireStoreCollection.users}/${partnerId}/${FireStoreCollection.conversations}`,
  //   )
  //   .doc(conversationRef.id)
  //   .set({
  //     ...userConversationData,
  //     conversationName: conversationName,
  //     members: {
  //       [userId]: `${FireStoreCollection.users}/${userId}`,
  //     },
  //   });
  return { ...conversationData, id: conversationRef.id };
};

export { createConversation };
