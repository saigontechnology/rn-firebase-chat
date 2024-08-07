import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
// import {FirestoreServicesInstance} from 'rn-firebase-chat';
import {FirestoreServices} from 'rn-firebase-chat';
// import {GalleryScreen} from '../../../../src/chat/GalleryScreen';
import {PropsGallery} from '../../navigation/type';
const FirestoreServicesInstance = FirestoreServices.getInstance();

export const GalleryViewScreen: React.FC<PropsGallery> = ({
  navigation,
  route,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={async () => {
          await FirestoreServicesInstance.leaveConversation();
          navigation.navigate('UserListScreen');
        }}
        style={{width: 200, height: 25, backgroundColor: "blue",marginTop: 100, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: 'white'}}>
          Leave group
        </Text>
      </TouchableOpacity>
      {/* <TouchableOpacity style={styles.button} onPress={onPressAddUser}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity> */}
      <View style={styles.viewListConverstation}>
        {/* <GalleryScreen /> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // backgroundColor: '#fff442',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewListConverstation: {
    height: '100%',
    backgroundColor: 'white',
  },
});
