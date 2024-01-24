/**
 * Created by NL on 06/04/21.
 */
import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Composer, InputToolbarProps, SendProps} from 'react-native-gifted-chat';
import {PressAbleIcon} from '../../Components';
import {
  MediaType,
  PhotoQuality,
  launchImageLibrary,
} from 'react-native-image-picker';
import {MEDIA_TYPE_IMAGE_PICKER} from '../constanst';
import {MEDIA_FILE_TYPE} from '../../../../src/Chat/constanst';

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

  const {onSend, text} = props;
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

  const options = {
    mediaType: MEDIA_TYPE_IMAGE_PICKER.mixed as MediaType,
    includeBase64: false,
    includeExtra: true,
    quality: 1 as PhotoQuality,
  };

  const showDocumentPicker = async () => {
    try {
      const res = await launchImageLibrary(options);
      const {assets} = res;
      if (assets && assets?.length > 0) {
        const {type, uri} = assets[0];
        let mediaType = MEDIA_FILE_TYPE.image;

        if (type?.includes(MEDIA_FILE_TYPE.video)) {
          mediaType = MEDIA_FILE_TYPE.video;
        }

        onSend?.(
          {
            imageUrl: uri,
            extension: type,
            type: mediaType,
          },
          true,
        );
      }
    } catch (error) {
      console.log('Can not open document picker', error);
    }
  };

  return (
    <View style={styles.container}>
      <PressAbleIcon
        style={styles.mgHorizontal}
        size={28}
        icon={require('../../Assets/camera.png')}
      />
      <PressAbleIcon
        onPress={() => {
          togglePhotoGallery(!isShowPhotoGallery);
          showDocumentPicker();
        }}
        style={styles.mgHorizontal}
        size={28}
        icon={require('../../Assets/image.png')}
      />
      <View style={styles.composeWrapper}>
        <ScrollView scrollEnabled={false}>
          <Composer {...props} textInputStyle={styles.textInputStyle} />
        </ScrollView>
      </View>
      {text ? (
        <PressAbleIcon
          style={styles.mgHorizontal}
          onPress={() => onSend?.({text: text}, true)}
          size={28}
          icon={require('../../Assets/send.png')}
        />
      ) : (
        <View style={styles.directionStyle}>
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
  mgHorizontal: {
    marginHorizontal: 12,
  },
  textInputStyle: {
    marginHorizontal: 20,
    lineHeight: 20,
  },
  directionStyle: {
    flexDirection: 'row',
  },
});

export default CustomInputMessage;
