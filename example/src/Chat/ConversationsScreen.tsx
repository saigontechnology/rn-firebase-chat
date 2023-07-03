// import React, {useEffect, useState} from 'react';
// import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
// import auth from '@react-native-firebase/auth';
// import {IConversation} from '../Services/Firestore/type';
// import {timeFromNow} from '../Utilities';
// import {getUserConversations} from '../Services/Firestore';
// import {NativeStackScreenProps} from '@react-navigation/native-stack';
//
// const user = auth().currentUser;
//
// interface ConversationsScreenProps extends NativeStackScreenProps<any> {}
//
// export const ConversationsScreen: React.FC<ConversationsScreenProps> = ({
//   navigation,
// }) => {
//   const [conversationsList, setConversationsList] = useState<IConversation[]>(
//     [],
//   );
//
//   const getUserConversationsList = async () => {
//     getUserConversations(user?.uid).then(res => {
//       setConversationsList(res);
//     });
//   };
//
//   useEffect(() => {
//     getUserConversationsList().then();
//   }, []);
//
//   // const {data, status, fetchRefresh} = useFirestoreList<IConversation>({
//   //   // orderBy: 'updated',
//   //   // orderDirection: 'desc',
//   //   collection: `${FireStoreCollection.users}/${user?.uid}/${FireStoreCollection.conversations}`,
//   //
//   // });
//
//   return (
//     <View style={styles.container}>
//       <FlatList<IConversation>
//         contentContainerStyle={{
//           paddingHorizontal: 16,
//         }}
//         keyExtractor={item => item.id}
//         data={conversationsList}
//         renderItem={({item}) => {
//           return (
//             <TouchableOpacity
//               onPress={() => {
//                 navigation.navigate('ChatScreen', {
//                   conversationInfo: item,
//                 });
//               }}
//               style={{
//                 flexDirection: 'row',
//               }}>
//               <View style={{flex: 1}}>
//                 <Text>{item.memberName}</Text>
//                 <Text>{item.latestMessage.text}</Text>
//               </View>
//               <Text>{timeFromNow(item.latestMessage.timestamp)}</Text>
//             </TouchableOpacity>
//           );
//         }}
//         // refreshing={status.pullToRefresh}
//         // onRefresh={fetchRefresh}
//         ListEmptyComponent={
//           <View style={{alignItems: 'center'}}>
//             <Text>Empty</Text>
//           </View>
//         }
//       />
//     </View>
//   );
// };
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });
