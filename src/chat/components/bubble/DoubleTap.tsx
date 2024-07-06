import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTap } from '../../../hooks';

interface ButtonTapProps {
  onSingleTap: () => void;
  onDoubleTap: () => void;
  buttonStyle: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const ButtonTap: React.FC<ButtonTapProps> = ({
  onSingleTap,
  onDoubleTap,
  children,
  buttonStyle,
}) => {
  const handleTap = useTap(onSingleTap, onDoubleTap);

  return (
    <TouchableOpacity style={buttonStyle} onPress={handleTap}>
      {children}
    </TouchableOpacity>
  );
};
