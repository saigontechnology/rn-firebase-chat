import React from 'react';
import {
  TouchableOpacity,
  Image,
  StyleProp,
  ViewStyle,
  ImageStyle,
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
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'repeat' | 'center';
  disabled?: boolean;
  hitSlop?: { top?: number; right?: number; bottom?: number; left?: number };
  size?: number;
}> = ({
  icon,
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
  >
    <Image source={icon} style={iconStyle} resizeMode={resizeMode} />
  </TouchableOpacity>
);
