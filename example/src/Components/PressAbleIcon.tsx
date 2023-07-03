import React from 'react';
import {
  TouchableOpacity,
  ViewStyle,
  Image,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
} from 'react-native';

interface IPressAbleIcon {
  icon: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  onPress?: () => void;
  resizeMode?: string | any;
  tintColor?: string;
  disabled?: boolean;
  hitSlop?: object;
  size?: number;
}

export const PressAbleIcon: React.FC<IPressAbleIcon> = ({
  icon,
  style,
  iconStyle,
  onPress,
  resizeMode = 'contain',
  disabled,
  hitSlop,
  size = 18,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      hitSlop={{top: 10, right: 10, bottom: 10, left: 10, ...hitSlop}}
      style={style}
      onPress={onPress}>
      <Image
        source={icon}
        style={[{width: size, height: size}, iconStyle]}
        resizeMode={resizeMode}
      />
    </TouchableOpacity>
  );
};
