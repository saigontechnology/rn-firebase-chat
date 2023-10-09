/**
 * Created by NL on 06/04/21.
 */
import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Composer, InputToolbarProps, SendProps} from 'react-native-gifted-chat';
import {PressAbleIcon} from '../../Components';

interface ICustomInputMessage extends InputToolbarProps<any>, SendProps<any> {
  isShowPhotoGallery: boolean;
  togglePhotoGallery: (value: boolean) => void;
}

const CustomInputMessage: React.FC<ICustomInputMessage> = ({
  isShowPhotoGallery,
  togglePhotoGallery,
  ...props
}) => {
  const [, setIsShowImagePicker] = useState(false);

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

  // const showDocumentPicker = async () => {
  //   // try {
  //   //   const res = await DocumentPicker.pick({
  //   //     type: [DocumentPicker.types.allFiles],
  //   //   })
  //   //   //file size < 5Mb
  //   //   if (!res.size || res.uri.includes('storage/document'))
  //   //     return Toast.info('Can not send file from drive.')
  //   //   if (res.size > 5 * 1024 * 1024) {
  //   //     Alert.alert('', 'File size must less than 5Mb')
  //   //   } else {
  //   //     const documentUri = await getPathForFirebaseStorage(res.uri)
  //   //     const messageData: any = {type: res.type, fileUrl: documentUri, fileName: res.name, size: res.size}
  //   //     if (res.type.includes('image')) messageData.imageUrl = 'file://' + documentUri
  //   //     onSend(messageData)
  //   //   }
  //   // } catch (err) {
  //   //   if (DocumentPicker.isCancel(err)) {
  //   //     // User cancelled the picker, exit any dialogs or menus and move on
  //   //   } else {
  //   //     throw err
  //   //   }
  //   // }
  // };
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
          onPress={() => onSend?.({text: text}, true)}
          size={28}
          icon={require('../../Assets/send.png')}
        />
      ) : (
        <View style={{flexDirection: 'row'}}>
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
});

export default CustomInputMessage;
