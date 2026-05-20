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
  type ComposerProps,
  type IMessage,
} from 'react-native-gifted-chat';
import { PressableIcon } from './PressableIcon';
import type { ImagePickerValue, MessageProps } from '../../interfaces';

const ImageURL = {
  camera: require('../../images/camera.png'),
  gallery: require('../../images/gallery.png'),
  send: require('../../images/send.png'),
};

export interface IInputToolbar
  extends
    Omit<InputToolbarProps<IMessage>, 'onSend'>,
    Omit<SendProps<IMessage>, 'onSend'>,
    Pick<ComposerProps, 'textInputProps'> {
  onSend?: (
    message: MessageProps | ImagePickerValue,
    sendImmediately?: boolean
  ) => void | Promise<void>;
  hasCamera?: boolean;
  hasGallery?: boolean;
  onPressCamera?: () => void;
  /** Callback when gallery is pressed. Returns single image or array of images based on enableMultiImageSelection */
  onPressGallery?: () => Promise<ImagePickerValue | ImagePickerValue[] | void>;
  /** Enable selecting multiple images from gallery. Default: false */
  enableMultiImageSelection?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<ViewStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  cameraIcon?: string;
  galleryIcon?: string;
  iconSend?: string;
  iconStyle?: StyleProp<ImageStyle>;
  renderLeftCustomView?: () => React.ReactNode;
  renderRightCustomView?: () => React.ReactNode;
}

const InputToolbar: React.FC<IInputToolbar> = ({
  hasCamera,
  hasGallery,
  onPressCamera,
  onPressGallery,
  enableMultiImageSelection = false,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  cameraIcon = ImageURL.camera,
  galleryIcon = ImageURL.gallery,
  iconSend = ImageURL.send,
  iconStyle,
  renderLeftCustomView,
  renderRightCustomView,
  ...props
}) => {
  const { onSend, text, textInputProps } = props;

  const handleGalleryPress = async () => {
    const result = await onPressGallery?.();
    if (!result) return;

    if (enableMultiImageSelection && Array.isArray(result)) {
      // Send multiple images sequentially (one at a time) to avoid Firebase Storage errors
      for (const image of result) {
        await onSend?.(image, true);
      }
    } else if (!Array.isArray(result)) {
      // Single image
      onSend?.(result, true);
    }
  };

  const flattenedIconStyle = StyleSheet.flatten([
    styles.iconStyleDefault,
    iconStyle,
  ]);

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
          onPress={handleGalleryPress}
          icon={galleryIcon}
          iconStyle={flattenedIconStyle}
        />
      )}
      <View style={[styles.composeWrapper, composeWrapperStyle]}>
        <ScrollView scrollEnabled={false}>
          <Composer
            text={text}
            textInputProps={{
              ...textInputProps,
              style: [styles.textInput, composerTextInputStyle],
            }}
          />
        </ScrollView>
      </View>
      {!!text && (
        <PressableIcon
          iconStyle={flattenedIconStyle}
          onPress={() => onSend?.({ text: text } as MessageProps, true)}
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F2F2F2',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'lightgray',
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: 'row',
    marginRight: 8,
  },
  textInput: {
    marginHorizontal: 20,
    lineHeight: 20,
    color: '#111827',
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
