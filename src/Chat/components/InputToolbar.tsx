import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import {
  Composer,
  InputToolbarProps,
  SendProps,
} from 'react-native-gifted-chat';

interface IInputToolbar extends InputToolbarProps<any>, SendProps<any> {
  isShowCamera?: boolean;
  isShowPhotoGallery?: boolean;
  onPressPhotoGallery?: () => void;
  onPressCamera?: () => void;
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

export const PressableIcon: React.FC<{
  icon: any;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'repeat' | 'center';
  disabled?: boolean;
  hitSlop?: { top?: number; right?: number; bottom?: number; left?: number };
  size?: number;
}> = ({
  icon,
  style,
  iconStyle,
  onPress,
  resizeMode = 'contain',
  disabled,
  hitSlop,
  size = 18,
}) => (
  <TouchableOpacity
    disabled={disabled}
    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10, ...hitSlop }}
    style={style}
    onPress={onPress}
  >
    <Image
      source={icon}
      style={[{ width: size, height: size }, iconStyle]}
      resizeMode={resizeMode}
    />
  </TouchableOpacity>
);

const InputToolbar: React.FC<IInputToolbar> = ({
  isShowCamera = true,
  isShowPhotoGallery = true,
  onPressPhotoGallery,
  onPressCamera,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  customViewStyle,
  iconCamera = require('../../images/camera.png'),
  iconGallery = require('../../images/gallery.png'),
  iconSend = require('../../images/send.png'),
  iconStyle,
  iconSize = 28,
  iconMargin = 12,
  ...props
}) => {
  const { onSend, text } = props;

  return (
    <View style={[styles.container, containerStyle]}>
      {isShowCamera && (
        <PressableIcon
          onPress={onPressCamera}
          style={{ marginHorizontal: iconMargin }}
          size={iconSize}
          icon={iconCamera}
          iconStyle={iconStyle}
        />
      )}
      {isShowPhotoGallery && (
        <PressableIcon
          onPress={onPressPhotoGallery}
          style={{ marginHorizontal: iconMargin }}
          size={iconSize}
          icon={iconGallery}
          iconStyle={iconStyle}
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
      {text ? (
        <PressableIcon
          style={{ marginHorizontal: iconMargin }}
          onPress={() => onSend?.({ text: text }, true)}
          size={iconSize}
          icon={iconSend}
          iconStyle={iconStyle}
        />
      ) : (
        <View style={[styles.marginWrapperView, customViewStyle]} />
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
  },
  textInput: {
    marginHorizontal: 20,
    lineHeight: 20,
  },
  marginWrapperView: {
    marginRight: 10,
  },
});

InputToolbar.defaultProps = {
  isShowCamera: true,
  isShowPhotoGallery: true,
  iconCamera: require('../../images/camera.png'),
  iconGallery: require('../../images/gallery.png'),
  iconSend: require('../../images/send.png'),
  iconSize: 28,
  iconMargin: 12,
};

export default InputToolbar;
