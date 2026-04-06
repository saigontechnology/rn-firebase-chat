import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import type { ImagePickerValue } from '../../interfaces';

const ImageURL = {
  camera: require('../../images/camera.png'),
  gallery: require('../../images/gallery.png'),
  send: require('../../images/send.png'),
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IInputToolbar extends InputToolbarProps<any>, SendProps<any> {
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
  const { onSend, text } = props;

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

  const renderLeftIcons = () => {
    if (renderLeftCustomView) return renderLeftCustomView();
    if (hasCamera) {
      return (
        <PressableIcon
          icon={cameraIcon}
          iconStyle={flattenedIconStyle}
          onPress={onPressCamera}
        />
      );
    }
    return (
      <PressableIcon
        onPress={hasGallery ? handleGalleryPress : undefined}
        icon={galleryIcon}
        iconStyle={flattenedIconStyle}
      />
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderLeftIcons()}
      <View style={[styles.composeWrapper, composeWrapperStyle]}>
        <ScrollView scrollEnabled={false}>
          <Composer
            {...props}
            textInputStyle={[styles.textInput, composerTextInputStyle]}
          />
        </ScrollView>
      </View>
      <TouchableOpacity
        style={styles.emojiButton}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Text style={styles.emojiText}>😊</Text>
      </TouchableOpacity>
      <PressableIcon
        iconStyle={[
          flattenedIconStyle,
          !text ? styles.sendIconInactive : undefined,
        ]}
        onPress={() => text && onSend?.({ text: text }, true)}
        icon={iconSend}
      />
      {renderRightCustomView && renderRightCustomView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  textInput: {
    marginHorizontal: 4,
    lineHeight: 20,
    color: '#111827',
  },
  marginWrapperView: {
    marginRight: 10,
  },
  iconStyleDefault: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
    tintColor: '#8E8E93',
  },
  emojiButton: {
    marginHorizontal: 6,
  },
  emojiText: {
    fontSize: 22,
  },
  sendIconInactive: {
    tintColor: '#C7C7CC',
  },
});

export default InputToolbar;
