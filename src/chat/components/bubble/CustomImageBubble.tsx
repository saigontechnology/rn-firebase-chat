import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import FastImage, {
  type ImageStyle as FastImageStyle,
} from 'react-native-fast-image';
import { MessageTypes, type MessageProps } from '../../../interfaces';

export interface CustomImageBubbleProps {
  message: MessageProps;
  position: 'left' | 'right';
  onSelectImgVideoUrl: (url: string) => void;
  bubbleContainerStyle?: StyleProp<ViewStyle>;
  bubbleStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<FastImageStyle>;
}

export const CustomImageBubble: React.FC<CustomImageBubbleProps> = ({
  position,
  message,
  onSelectImgVideoUrl,
  bubbleContainerStyle,
  bubbleStyle,
  imageStyle,
}) => {
  const handleImagePress = () => {
    if (message.path && message.type === MessageTypes.image) {
      onSelectImgVideoUrl(message.path);
    }
  };

  return (
    <View
      style={[
        styles.bubbleContainer,
        StyleSheet.flatten(bubbleContainerStyle),
        position === 'left' ? styles.flexStart : styles.flexEnd,
      ]}
    >
      <Pressable
        onPress={handleImagePress}
        style={[styles.bubble, StyleSheet.flatten(bubbleStyle)]}
      >
        <FastImage
          source={{ uri: message.path, priority: FastImage.priority.high }}
          style={[styles.image, StyleSheet.flatten(imageStyle)]}
          resizeMode="cover"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '70%',
    backgroundColor: '#e1ffc7',
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: '#d3d3d3',
    borderWidth: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  image: {
    width: 200,
    height: 200,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
});
