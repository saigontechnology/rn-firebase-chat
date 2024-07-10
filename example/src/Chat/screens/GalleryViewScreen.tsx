import React from 'react';
import {View, StyleSheet} from 'react-native';
// import {GalleryScreen} from 'rn-firebase-chat';
// import {GalleryScreen} from '../../../../src/chat/GalleryScreen';
import {PropsGallery} from '../../navigation/type';

export const GalleryViewScreen: React.FC<PropsGallery> = ({
  navigation,
  route,
}) => {
  return (
    <View style={styles.container}>
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
    flex: 1,
    backgroundColor: '#fff442',
  },
  viewListConverstation: {
    height: '100%',
    backgroundColor: 'white',
  },
});
