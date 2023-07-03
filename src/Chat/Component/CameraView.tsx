// import React from 'react';
// import {
//   View,
//   StyleSheet,
//   Modal,
//   ModalProps,
//   StatusBar,
//   TouchableOpacity,
//   Text,
// } from 'react-native';
// import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
// import Camera, {useCameraDevices} from 'react-native-vision-camera';
//
// interface ICameraView extends ModalProps {}
//
// export const CameraView: React.FC<ICameraView> = ({visible = true}) => {
//   const devices = useCameraDevices();
//   const device = devices.back;
//
//   if (device == null)
//     return (
//       <View>
//         <Text>không mở được camera đâu</Text>
//       </View>
//     );
//   return (
//     <Modal visible={visible}>
//       <SafeAreaProvider>
//         <SafeAreaView edges={['top']} style={styles.container}>
//           {/*<Camera*/}
//           {/*  style={StyleSheet.absoluteFill}*/}
//           {/*  device={device}*/}
//           {/*  isActive={true}*/}
//           {/*/>*/}
//           <StatusBar barStyle={'light-content'} />
//           <View style={styles.content}>
//             <View style={styles.header}>
//               <TouchableOpacity style={styles.closeIcon}>
//                 <Text>Close</Text>
//               </TouchableOpacity>
//               <View style={styles.headerCenterContainer}>
//                 <TouchableOpacity>
//                   <Text>Xoay Cam</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity>
//                   <Text>Bật/Tắt Flash</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//             <TouchableOpacity
//               style={{
//                 width: 60,
//                 height: 60,
//                 backgroundColor: 'white',
//                 position: 'absolute',
//                 bottom: 20,
//                 alignSelf: 'center',
//                 borderRadius: 30,
//                 justifyContent: 'center',
//                 alignItems: 'center',
//               }}></TouchableOpacity>
//           </View>
//         </SafeAreaView>
//       </SafeAreaProvider>
//     </Modal>
//   );
// };
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   content: {
//     height: '80%',
//     backgroundColor: 'blue',
//     borderRadius: 16,
//   },
//   header: {
//     flexDirection: 'row',
//   },
//   closeIcon: {
//     position: 'absolute',
//     zIndex: 1,
//   },
//   headerCenterContainer: {
//     flexDirection: 'row',
//     flex: 1,
//     justifyContent: 'center',
//   },
// });
