import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TextStyle,
} from 'react-native';
import {
  Composer,
  InputToolbarProps,
  SendProps,
} from 'react-native-gifted-chat';
import { PressableIcon } from './PressableIcon';
import {
  launchImageLibrary,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { MessageTypes } from '../../interfaces';
import { convertExtension } from '../../utilities';

const ImageURL = {
  camera: require('../../images/camera.png'),
  gallery: require('../../images/gallery.png'),
  send: require('../../images/send.png'),
};

const defaultLibraryOptions: ImageLibraryOptions = {
  mediaType: 'mixed',
};
export interface IInputToolbar extends InputToolbarProps<any>, SendProps<any> {
  hasCamera?: boolean;
  hasGallery?: boolean;
  onPressCamera?: () => void;
  onPressGallery?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<TextStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  cameraIcon?: string;
  galleryIcon?: string;
  iconSend?: string;
  iconStyle?: StyleProp<ImageStyle>;
  libraryOptions?: ImageLibraryOptions;
  renderLeftCustomView?: () => React.ReactNode;
  renderRightCustomView?: () => React.ReactNode;
}

const InputToolbar: React.FC<IInputToolbar> = ({
  hasCamera,
  hasGallery,
  onPressCamera,
  onPressGallery,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  cameraIcon = ImageURL.camera,
  galleryIcon = ImageURL.gallery,
  iconSend = ImageURL.send,
  iconStyle,
  libraryOptions = defaultLibraryOptions,
  renderLeftCustomView,
  renderRightCustomView,
  ...props
}) => {
  const { onSend, text } = props;

  const flattenedIconStyle = StyleSheet.flatten([
    styles.iconStyleDefault,
    iconStyle,
  ]);

  const openGallery = useCallback(async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary(
        libraryOptions
      );

      if (result?.assets) {
        const file = result?.assets[0];
        const mediaType = file?.type?.startsWith('image')
          ? MessageTypes.image
          : MessageTypes.video;
        const extension = convertExtension(file);

        onSend?.(
          {
            type: mediaType,
            path: file?.uri ?? '',
            extension: extension,
          },
          true
        );
      }
    } catch (error) {
      console.error('Error while opening gallery:', error);
    }
  }, [libraryOptions, onSend]);

  return (
    <View style={[styles.container, containerStyle]}>
      {renderLeftCustomView && renderLeftCustomView()}
      {hasCamera && (
        <PressableIcon
          icon={cameraIcon}
          iconStyle={flattenedIconStyle}
          onPress={onPressCamera}
        />
      )}
      {hasGallery && (
        <PressableIcon
          onPress={onPressGallery || openGallery}
          icon={galleryIcon}
          iconStyle={flattenedIconStyle}
        />
      )}
      <View style={[styles.composeWrapper, composeWrapperStyle]}>
        <Composer
          {...props}
          textInputStyle={[styles.textInput, composerTextInputStyle]}
        />
      </View>
      {!!text && (
        <PressableIcon
          iconStyle={flattenedIconStyle}
          onPress={() => onSend?.({ text: text }, true)}
          icon={iconSend}
        />
      )}
      {renderRightCustomView && renderRightCustomView()}
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
