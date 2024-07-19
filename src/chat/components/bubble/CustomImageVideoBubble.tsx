import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  ViewStyle,
  StyleProp,
  ImageStyle,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import FastImage, {
  type ImageStyle as FastImageStyle,
} from 'react-native-fast-image';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { ButtonTap } from './DoubleTap';

export interface CustomImageVideoBubbleProps {
  message: MessageProps;
  position: 'left' | 'right';
  onSelectImgVideoUrl: (message: MessageProps) => void;
  playIcon?: string;
  bubbleContainerStyle?: StyleProp<ViewStyle>;
  bubbleStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<FastImageStyle>;
  videoContainerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  playIconStyle?: StyleProp<ImageStyle>;
}

export const CustomImageVideoBubble: React.FC<CustomImageVideoBubbleProps> = ({
  position,
  message,
  onSelectImgVideoUrl,
  playIcon = require('../../../images/play.png'),
  bubbleContainerStyle,
  bubbleStyle,
  imageStyle,
  videoContainerStyle,
  videoStyle,
  playIconStyle,
}) => {
  const [isPauseVideo, setIsPauseVideo] = useState(true);
  const videoRefs = useRef<VideoRef>(null);

  const handlePressMessage = () => {
    if (message.type === MessageTypes.video) {
      setIsPauseVideo(true);
    }
    onSelectImgVideoUrl(message);
  };

  const handleVideoPress = () => {
    setIsPauseVideo(false);
  };

  const handleVideoEnd = () => {
    setIsPauseVideo(true);
    if (videoRefs.current) {
      videoRefs.current.seek(0);
    }
  };

  const renderImage = () => (
    <FastImage
      source={{ uri: message.path, priority: FastImage.priority.high }}
      style={[styles.image, imageStyle]}
      resizeMode="cover"
    />
  );

  const renderVideo = () => (
    <ButtonTap
      buttonStyle={[styles.videoContainer, videoContainerStyle]}
      onSingleTap={handlePressMessage}
      onDoubleTap={handlePressMessage}
    >
      <View>
        <Video
          source={{ uri: message.path }}
          style={[styles.video, videoStyle]}
          paused={isPauseVideo}
          repeat={false}
          resizeMode="cover"
          onEnd={handleVideoEnd}
          ref={videoRefs}
        />
        {isPauseVideo && (
          <Image style={[styles.playIcon, playIconStyle]} source={playIcon} />
        )}
      </View>
    </ButtonTap>
  );

  return (
    <View
      style={[
        styles.bubbleContainer,
        bubbleContainerStyle,
        position === 'left' ? styles.flexStart : styles.flexEnd,
      ]}
    >
      <Pressable
        onPress={handlePressMessage}
        style={[styles.bubble, bubbleStyle]}
      >
        {message.type === MessageTypes.image ? renderImage() : renderVideo()}
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
  videoContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: 200,
    height: 200,
  },
  playIcon: {
    width: 50,
    height: 50,
    position: 'absolute',
    resizeMode: 'contain',
    right: 105,
    top: 75,
    zIndex: 1,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
});
