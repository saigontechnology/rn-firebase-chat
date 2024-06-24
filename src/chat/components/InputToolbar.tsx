import React, { useCallback } from 'react';
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
  ComposerProps,
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
export interface IInputToolbar extends InputToolbarProps<any>, SendProps<any> {
  hasCamera?: boolean;
  hasGallery?: boolean;
  onPressCamera?: () => void;
  onPressGallery?: () => void;
  renderCustomTool: ((props: ComposerProps) => React.ReactNode) | undefined;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<ViewStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  cameraIcon?: string;
  galleryIcon?: string;
  iconSend?: string;
  iconStyle?: StyleProp<ImageStyle>;
  renderLeftCustomView?: React.ReactNode;
  renderRightCustomView?: React.ReactNode;
}

const InputToolbar: React.FC<IInputToolbar> = ({
  hasCamera,
  hasGallery,
  onPressCamera,
  onPressGallery,
  renderCustomTool,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  cameraIcon = ImageURL.camera,
  galleryIcon = ImageURL.gallery,
  iconSend = ImageURL.send,
  iconStyle,
  ...props
}) => {
  const { onSend, text } = props;

  const flattenedIconStyle = StyleSheet.flatten([
    styles.iconStyleDefault,
    iconStyle,
  ]);

  const openGallery = useCallback(async () => {
    try {
      const options: ImageLibraryOptions = {
        mediaType: 'mixed',
      };

      const result: ImagePickerResponse = await launchImageLibrary(options);

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
  }, [onSend]);

  return (
    <View style={[styles.container, containerStyle]}>
      {renderCustomTool ? (
        renderCustomTool(props)
      ) : (
        <View>
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
          {props.renderLeftCustomView}
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
              iconStyle={flattenedIconStyle}
              onPress={() => onSend?.({ text: text }, true)}
              icon={iconSend}
            />
          )}
          {props.renderRightCustomView}
        </View>
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
