import React from 'react';
import {StyleProp, TouchableOpacity, ViewStyle} from 'react-native';

interface IVectorIconButton {
  Component: any;
  name: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const VectorIconButton: React.FC<IVectorIconButton> = ({
  Component,
  name,
  size,
  color,
  onPress,
  style,
  disabled,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      style={style}
      onPress={() => onPress?.()}>
      <Component name={name} size={size} color={color} />
    </TouchableOpacity>
  );
};
