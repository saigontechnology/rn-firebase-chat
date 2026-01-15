import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TouchableOpacity,
  Text,
  LayoutAnimation,
  TextInput,
  Pressable,
  TextInputProps,
} from 'react-native';
import {
  Composer,
  InputToolbarProps,
  SendProps,
} from 'react-native-gifted-chat';
import { PressableIcon } from './PressableIcon';
import type { ImagePickerValue } from '../../addons/camera/interface';

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
  onPressGallery?: () => Promise<ImagePickerValue | void>;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<ViewStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  cameraIcon?: string;
  galleryIcon?: string;
  iconSend?: string;
  iconStyle?: StyleProp<ImageStyle>;
  expandIcon?: () => React.ReactNode;
  renderLeftCustomView?: () => React.ReactNode;
  renderRightCustomView?: () => React.ReactNode;
  composerTextInputProps?: Partial<TextInputProps>;
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
  expandIcon,
  renderLeftCustomView,
  renderRightCustomView,
  composerTextInputProps,
  ...props
}) => {
  const { onSend, text } = props;
  const [showOptions, setShowOptions] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const flattenedIconStyle = StyleSheet.flatten([
    styles.iconStyleDefault,
    iconStyle,
  ]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOptions(!!text);
  }, [text]);

  const handleChevronPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOptions((prev) => !prev);
  };

  const handleWrapperPress = () => {
    textInputRef.current?.focus();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderLeftCustomView && renderLeftCustomView()}
      {showOptions && (hasCamera || hasGallery) ? (
        <TouchableOpacity
          onPress={handleChevronPress}
          style={styles.chevronButton}
        >
          {expandIcon ? (
            expandIcon()
          ) : (
            <Text style={styles.chevronText}>›</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          {hasCamera && (
            <PressableIcon
              icon={cameraIcon}
              iconStyle={flattenedIconStyle}
              onPress={onPressCamera}
            />
          )}
          {hasGallery && (
            <PressableIcon
              onPress={() =>
                onPressGallery?.().then((res) => {
                  if (res) {
                    onSend?.(res, true);
                  }
                })
              }
              icon={galleryIcon}
              iconStyle={flattenedIconStyle}
            />
          )}
        </>
      )}
      <Pressable
        style={[styles.composeWrapper, composeWrapperStyle]}
        onPress={handleWrapperPress}
      >
        <Composer
          {...props}
          multiline={true}
          textInputProps={{
            style: styles.textInputContainer,
            ...composerTextInputProps,
            // @ts-expect-error - ref is supported but not in type definition
            ref: textInputRef,
          }}
          textInputStyle={[styles.textInput, composerTextInputStyle]}
        />
      </Pressable>
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
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,

    flexDirection: 'row',
    minHeight: 44,
    alignItems: 'center',
  },
  textInputContainer: {
    maxHeight: 80,
    marginVertical: 4,
  },
  textInput: {
    lineHeight: 20,
    fontSize: 16,
  },
  marginWrapperView: {
    marginRight: 10,
  },
  iconStyleDefault: {
    width: 24,
    height: 24,
    tintColor: '#7cb518',
  },
  chevronButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#7cb518',
    lineHeight: 28,
  },
});

export default InputToolbar;
