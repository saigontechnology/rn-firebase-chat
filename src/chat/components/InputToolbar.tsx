import React, { useRef } from 'react';
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
import type { ImagePickerValue } from '../../addons/camera/interface';

const ImageURL = {
  camera: require('../../images/camera.png'),
  gallery: require('../../images/gallery.png'),
  send: require('../../images/send.png'),
};
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
  iconContainerStyle?: StyleProp<ViewStyle>;
  disableSendButton?: boolean;
  renderLeftCustomView?: () => React.ReactNode;
  renderRightCustomView?: () => React.ReactNode;
  alwaysShowSendButton?: boolean;
  renderRightCustomButtons?: () => React.ReactNode;
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
  iconContainerStyle,
  disableSendButton = false,
  renderLeftCustomView,
  renderRightCustomView,
  alwaysShowSendButton = false,
  renderRightCustomButtons,
  ...props
}) => {
  const { onSend, text } = props;
  const scrollRef = useRef<ScrollView>(null);

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
      <View style={[styles.composeWrapper, composeWrapperStyle]}>
        <ScrollView scrollEnabled={false} ref={scrollRef}>
          <Composer
            {...props}
            textInputStyle={[styles.textInput, composerTextInputStyle]}
            onInputSizeChanged={() =>
              scrollRef?.current && scrollRef?.current.scrollToEnd()
            }
          />
        </ScrollView>
        {renderRightCustomButtons && renderRightCustomButtons()}
      </View>
      {(alwaysShowSendButton || !!text) && (
        <PressableIcon
          disabled={!text || disableSendButton}
          iconStyle={flattenedIconStyle}
          onPress={() => !!text?.trim() && onSend?.({ text: text }, true)} // only send when there are text
          icon={iconSend}
          style={iconContainerStyle}
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
    marginTop: 4,
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'lightgray',
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: 'row',
    marginRight: 10,
    alignItems: 'center',
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
