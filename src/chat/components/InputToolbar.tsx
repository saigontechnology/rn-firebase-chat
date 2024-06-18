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
  hasCamera?: boolean;
  onPressFirstAction?: () => void;
  onPressSecondAction?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<ViewStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  firstIcon?: string;
  secondIcon?: string;
  iconSend?: string;
  iconStyle?: StyleProp<ImageStyle>;
  renderLeftCustomView?: React.ReactNode;
  renderRightCustomView?: React.ReactNode;
}

const InputToolbar: React.FC<IInputToolbar> = ({
  hasCamera,
  onPressSecondAction,
  onPressFirstAction,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  firstIcon = ImageURL.camera,
  secondIcon = ImageURL.gallery,
  iconSend = ImageURL.send,
  iconStyle,
  ...props
}) => {
  const { onSend, text } = props;

  const flattenedIconStyle = StyleSheet.flatten([
    styles.iconStyleDefault,
    iconStyle,
  ]);

  return (
    <View style={[styles.container, containerStyle]}>
      {hasCamera && (
        <PressableIcon
          icon={firstIcon}
          iconStyle={flattenedIconStyle}
          onPress={onPressFirstAction}
        />
      )}
      {hasCamera && (
        <PressableIcon
          onPress={onPressSecondAction}
          icon={secondIcon}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
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
