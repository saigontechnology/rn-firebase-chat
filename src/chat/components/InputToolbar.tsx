import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import {
  Composer,
  InputToolbarProps,
  SendProps,
} from 'react-native-gifted-chat';
import { PressableIcon } from './PressableIcon';

const ImageURL = {
  camera: require('../../images/camera.png'),
  gallery: require('../../images/gallery.png'),
  send: require('../../images/send.png'),
};
export interface IInputToolbar extends InputToolbarProps<any>, SendProps<any> {
  isShowCamera?: boolean;
  isShowPhotoGallery?: boolean;
  togglePhotoGallery?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<ViewStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  iconCamera?: any;
  iconGallery?: any;
  iconSend?: any;
  iconStyle?: StyleProp<ImageStyle>;
  iconSize?: number;
  iconMargin?: number;
}

const InputToolbar: React.FC<IInputToolbar> = ({
  isShowCamera = true,
  isShowPhotoGallery = true,
  togglePhotoGallery,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  iconCamera = ImageURL.camera,
  iconGallery = ImageURL.gallery,
  iconSend = ImageURL.send,
  iconStyle,
  ...props
}) => {
  const { onSend, text } = props;

  return (
    <View style={[styles.container, containerStyle]}>
      {isShowCamera && (
        <PressableIcon
          icon={iconCamera}
          iconStyle={(styles.iconStyleDefault, iconStyle)}
        />
      )}
      {isShowPhotoGallery && (
        <PressableIcon
          onPress={togglePhotoGallery}
          icon={iconGallery}
          iconStyle={[styles.iconStyleDefault, iconStyle]}
        />
      )}
      <View style={[styles.composeWrapper, composeWrapperStyle]}>
        <ScrollView scrollEnabled={false}>
          <Composer
            {...props}
            textInputStyle={[styles.textInput, composerTextInputStyle]}
          />
        </ScrollView>
      </View>
      {!!text && (
        <PressableIcon
          iconStyle={[styles.iconStyleDefault, iconStyle]}
          onPress={() => onSend?.({ text: text }, true)}
          icon={iconSend}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    marginTop: 12,
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'lightgray',
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: 'row',
    marginRight: 10,
  },
  textInput: {
    marginHorizontal: 20,
    lineHeight: 20,
  },
  marginWrapperView: {
    marginRight: 10,
  },
  iconStyleDefault: {
    width: 28,
    height: 28,
    marginHorizontal: 12,
  },
});

export default InputToolbar;
