import React from 'react';
import { useContext } from 'react';
import { Image, ImageProps } from 'react-native';
import { ChatContext } from '../ChatProvider';

export const CustomImage: React.FC<ImageProps> = (props) => {
  const { CustomImageComponent } = useContext(ChatContext);
  if (CustomImageComponent) {
    return <CustomImageComponent {...props} />;
  }
  return <Image {...props} />;
};
