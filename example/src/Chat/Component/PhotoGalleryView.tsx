// import React, {useEffect} from 'react';
// import {
//   Dimensions,
//   FlatList,
//   Image,
//   StyleSheet,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import {PhotoIdentifier} from '@react-native-camera-roll/camera-roll/src/CameraRoll';
// import {useCameraRoll} from '@react-native-camera-roll/camera-roll';
// import {GiftedChatProps} from 'react-native-gifted-chat';
//
// const {width, height} = Dimensions.get('screen');
//
// interface IPhotoGalleryView extends GiftedChatProps {
//   conversationId: string;
//   onSendImage: (message: any) => void;
// }
//
// export const PhotoGalleryView: React.FC<IPhotoGalleryView> = ({
//   conversationId,
//   onSendImage,
//   onSend,
// }) => {
//   const [photos, getPhotos] = useCameraRoll();
//
//   useEffect(() => {
//     getPhotos().then();
//   }, [getPhotos]);
//
//   return (
//     <View style={styles.container}>
//       <FlatList<PhotoIdentifier>
//         numColumns={4}
//         data={photos.edges}
//         renderItem={({item}) => {
//           return (
//             <TouchableOpacity
//               onPress={() => {
//                 console.log('PhotoGalleryView', item);
//                 onSendImage({
//                   imageUrl: item.node.image.uri,
//                   extension: `${item.node.type}/${item.node.image.extension}`,
//                   type: 'image',
//                 });
//                 // uploadFileToFirebase(
//                 //   item.node.image.uri,
//                 //   `${item.node.type}/${item.node.image.extension}`,
//                 //   conversationId,
//                 // );
//               }}>
//               <Image
//                 source={{uri: item.node.image.uri}}
//                 style={{
//                   width: width / 4,
//                   height: width / 4,
//                 }}
//               />
//             </TouchableOpacity>
//           );
//         }}
//       />
//     </View>
//   );
// };
//
// const styles = StyleSheet.create({
//   container: {
//     height: '45%',
//   },
// });
