// import React, {useState} from 'react';
// import {
//   Text,
//   View,
//   StyleSheet,
//   Modal,
//   TouchableOpacity,
//   NativeModules,
//   Image,
// } from 'react-native';
//
// const DownloadManager = NativeModules.DownloadManager;
//
// function CustomView(props) {
//   const [showImage, setShowImage] = useState(false);
//   const source = props.currentMessage;
//
//   function downloadFile(url, fileName, mimeType) {
//     DownloadManager.downloadFile(url, fileName, mimeType);
//   }
//
//   if (source.type?.includes('photo') || source.type?.includes('image'))
//     return (
//       <View style={{borderRadius: 5, overflow: 'hidden', marginBottom: 5}}>
//         <TouchableOpacity
//           onPress={() => {
//             setShowImage(true);
//           }}>
//           <Image
//             source={{uri: source.imageUrl}}
//             style={{width: 150, height: 150}}
//           />
//         </TouchableOpacity>
//         <Modal animationType={'fade'} transparent={false} visible={showImage}>
//           <View style={{flex: 1}}>
//             {/*<ImageViewer*/}
//             {/*  style={{width: '100%', height: '100%'}}*/}
//             {/*  imageUrls={[{url: source.imageUrl}]}*/}
//             {/*  renderImage={props => <FastImage {...props} />}*/}
//             {/*  renderHeader={() => (*/}
//             {/*    <TouchableOpacity*/}
//             {/*      onPress={() => setShowImage(false)}*/}
//             {/*      style={styles.container.buttonClose}>*/}
//             {/*      <MaterialIcons name={'close'} size={30} color={'#fff'} />*/}
//             {/*    </TouchableOpacity>*/}
//             {/*  )}*/}
//             {/*/>*/}
//           </View>
//         </Modal>
//       </View>
//     );
//   else if (!!source.type && source.type !== 'text') {
//     return (
//       <View
//         style={{
//           flexDirection: 'row',
//           marginHorizontal: 10,
//           marginTop: 10,
//           width: '80%',
//         }}>
//         <TouchableOpacity
//           style={styles.container.fileContainer}
//           onPress={() => {
//             downloadFile(source.fileUrl, source.fileName, source.mine);
//           }}>
//           {/*<Image*/}
//           {/*  source={Images.defaultImage}*/}
//           {/*  style={{width: 30, height: 30}}*/}
//           {/*/>*/}
//         </TouchableOpacity>
//         <View>
//           <Text style={styles[props.position].fileName}>{source.fileName}</Text>
//           <Text style={styles[props.position].fileSize}>
//             {((source.fileSize || 0) / 1024).toFixed(2)} kb
//           </Text>
//         </View>
//       </View>
//     );
//   }
//   return null;
// }
//
// const styles = {
//   left: StyleSheet.create({
//     fileName: {
//       flex: 1,
//     },
//     fileSize: {},
//   }),
//   right: StyleSheet.create({
//     fileName: {
//       flex: 1,
//     },
//     fileSize: {},
//   }),
//   container: StyleSheet.create({
//     buttonClose: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       position: 'absolute',
//       right: 10,
//       zIndex: 9999,
//     },
//     fileContainer: {
//       borderRadius: 20,
//       padding: 5,
//       marginRight: 10,
//       width: 40,
//       height: 40,
//     },
//   }),
// };
//
// export default CustomView;
