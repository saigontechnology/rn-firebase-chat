import firestore from '@react-native-firebase/firestore';
import type { UserProfileProps } from '../../interfaces';
import { FireStoreCollection } from '../../interfaces';

const createUserProfile = async (userId: string, name: string) => {
  const userRef = firestore()
    .collection<UserProfileProps>(FireStoreCollection.users)
    .doc(userId);
  const user = await userRef.get();
  if (!user.exists) {
    console.log('No such document!');
    await userRef.set({
      created: Date.now(),
      status: 'online',
      name,
      updated: Date.now(),
    });
  } else {
    // console.log('Document data:', user.data());
  }
};

// const updateUserProfile = async (info: any, userUid?: string) => {
//   await firestore()
//     .collection<UserProfileProps>(FireStoreCollection.users)
//     .doc(userUid)
//     .update(info);
// };
//
// const getUserProfile = async (userUid?: string) => {
//   return await firestore()
//     .collection<UserProfileProps>(FireStoreCollection.users)
//     .doc(userUid)
//     .get()
//     .then((snapshot) => {
//       return snapshot.data()?.name;
//     });
// };
//
// const getUserConversations = (userUid?: string) => {
//   let list = [] as any;
//   return new Promise((resolve) => {
//     firestore()
//       .collection<IConversation>(
//         `${FireStoreCollection.users}/${userUid}/${FireStoreCollection.conversations}`
//       )
//       .get()
//       .then((snapshot) => {
//         return snapshot.docs.map((d) => {
//           if (d.data().memberRef) {
//             d.data()
//               .memberRef?.get()
//               .then((r: QueryDocumentSnapshot<UserProfileProps>) => {
//                 list.push({
//                   ...d.data(),
//                   memberName: r.data()?.name,
//                   memberRef: '',
//                 });
//                 resolve(list);
//               });
//           } else {
//             list.push({ ...d.data() });
//             resolve(list);
//           }
//         });
//       });
//   });
// };

const checkUsernameExist = (username?: string) => {
  return new Promise<boolean>(async (resolve) => {
    const userRef = firestore()
      .collection<UserProfileProps>(FireStoreCollection.users)
      .doc(username);
    const user = await userRef.get();
    resolve(user.exists);
  });
};

// snapshot.forEach(doc => {
//   console.log('user', doc);
//   // doc.data().memberRef.get()
//   list.push(doc.data());
//   return Promise.resolve(list);
// });
// snapshot.docChanges().forEach(i => {
//   return i.doc
//     .data()
//     .memberRef.get()
//     .then(r => {
//       list.push(i.doc.data());
//     });
// });
// return Promise.resolve(list);

export {
  createUserProfile,
  // updateUserProfile,
  // getUserProfile,
  // getUserConversations,
  checkUsernameExist,
};
