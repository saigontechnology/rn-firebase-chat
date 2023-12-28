/**
 * Created by NL on 06/04/21.
 */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Composer, InputToolbarProps, SendProps } from 'react-native-gifted-chat';
import { PressAbleIcon } from '../../Components';
import * as ImagePicker from 'react-native-image-picker';

interface ICustomInputMessage extends InputToolbarProps<any>, SendProps<any> {
  isShowPhotoGallery: boolean;
  togglePhotoGallery: (value: boolean) => void;
}

// const byteToMB = 1048576;
// const IMAGE_TYPE = 'image';

const CustomInputMessage: React.FC<ICustomInputMessage> = ({
  isShowPhotoGallery,
  togglePhotoGallery,
  ...props
}) => {
  // const [, setIsShowImagePicker] = useState(false);
  const [image, setImage] = useState({});

  const { onSend, text } = props;
  /**************************
   ======== Lifecycle =======
   **************************/

  /**************************
   ======= Functions =======
   *************************/
  // const showImagePicker = () => setIsShowImagePicker(true);

  // const handleSelectImage = (image: ImagePickerResponse) => {
  //   onSend({type: image.type, imageUrl: image.uri});
  // };

  const showDocumentPicker = async () => {
    try {
      ImagePicker.launchImageLibrary(
        {
          mediaType: 'mixed',
          includeBase64: false,
          includeExtra: true,
          quality: 1,
        },
        (res: ImagePicker.ImagePickerResponse) => {
          const { assets } = res;
          if (assets && assets?.length > 0) {
            const { type, uri } = assets[0];
            if (type?.includes('video')) {
              onSend?.({ imageUrl: uri, extension: type, type: 'video' }, true);
            } else if (type?.includes('image')) {
              onSend?.({ imageUrl: uri, extension: type, type: 'image' }, true);
            }
          }
        },
      );
    } catch (error) { }
  };
  return (
    <View style={styles.container}>
      <PressAbleIcon
        style={{
          marginHorizontal: 12,
        }}
        size={28}
        icon={require('../../Assets/camera.png')}
      />
      <PressAbleIcon
        onPress={() => {
          togglePhotoGallery(!isShowPhotoGallery);
          showDocumentPicker();
        }}
        style={{
          marginHorizontal: 12,
        }}
        size={28}
        icon={require('../../Assets/image.png')}
      />
      <View style={styles.composeWrapper}>
        <ScrollView scrollEnabled={false}>
          <Composer
            {...props}
            textInputStyle={{
              marginHorizontal: 20,
              lineHeight: 20,
            }}
          />
        </ScrollView>
      </View>
      {text ? (
        <PressAbleIcon
          style={{
            marginHorizontal: 12,
          }}
          onPress={() => onSend?.({ text: text }, true)}
          size={28}
          icon={require('../../Assets/send.png')}
        />
      ) : (
        <View style={styles.row}>
          {/*<VectorIconButton*/}
          {/*  onPress={() => {*/}
          {/*    showDocumentPicker();*/}
          {/*  }}*/}
          {/*  style={{marginRight: 8}}*/}
          {/*  size={22}*/}
          {/*  Component={MaterialIcons}*/}
          {/*  name={'attach-file'}*/}
          {/*  color={'blue'}*/}
          {/*/>*/}
          {/*<VectorIconButton*/}
          {/*  onPress={() => {*/}
          {/*    showImagePicker();*/}
          {/*  }}*/}
          {/*  size={22}*/}
          {/*  Component={MaterialIcons}*/}
          {/*  name={'image'}*/}
          {/*  color={'blue'}*/}
          {/*/>*/}
        </View>
      )}
      {/*<ImagePickerDropDown*/}
      {/*  visible={isShowImagePicker}*/}
      {/*  onClose={() => setIsShowImagePicker(false)}*/}
      {/*  onSelectImage={handleSelectImage}*/}
      {/*/>*/}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'lightgray',
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: 'row',
  },
  row: { flexDirection: 'row' }
});

export default CustomInputMessage;
