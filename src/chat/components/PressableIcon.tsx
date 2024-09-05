import React from 'react';
import {
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  ImageStyle,
  type Insets,
  ImageResizeMode,
  StyleSheet,
} from 'react-native';

const defaultHitSlop = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
};

export const PressableIcon: React.FC<{
  icon: any;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
  resizeMode?: ImageResizeMode;
  disabled?: boolean;
  hitSlop?: Insets;
  size?: number;
}> = ({
  icon,
  style,
  iconStyle,
  onPress,
  resizeMode = 'contain',
  disabled,
  hitSlop,
}) => (
  <TouchableOpacity
    disabled={disabled}
    hitSlop={{ ...defaultHitSlop, ...hitSlop }}
    onPress={onPress}
    style={[disabled && styles.disabledStyle, StyleSheet.flatten(style)]}
  >
    <Image source={icon} style={iconStyle} resizeMode={resizeMode} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  disabledStyle: {
    opacity: 0.5,
  },
});
