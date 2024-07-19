import React, { useRef, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { CustomImageVideoBubbleProps } from './CustomImageBubble';

export const CustomVideoBubble: React.FC<CustomImageVideoBubbleProps> = ({
  position,
  message,
  playIcon = require('../../../images/play.png'),
  bubbleContainerStyle,
  bubbleStyle,
  videoContainerStyle,
  videoStyle,
  playIconStyle,
}) => {
  const [isPauseVideo, setIsPauseVideo] = useState(true);
  const videoRefs = useRef<VideoRef>(null);

  const handleVideoPress = () => {
    setIsPauseVideo((prev) => !prev);
  };

  const handleVideoEnd = () => {
    setIsPauseVideo(true);
    if (videoRefs.current) {
      videoRefs.current.seek(0);
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
      <View style={[styles.bubble, StyleSheet.flatten(bubbleStyle)]}>
        <TouchableOpacity
          style={[
            styles.videoContainer,
            StyleSheet.flatten(videoContainerStyle),
          ]}
          onPress={handleVideoPress}
          activeOpacity={0.8}
        >
          <View>
            <Video
              source={{ uri: message.path }}
              style={[styles.video, StyleSheet.flatten(videoStyle)]}
              paused={isPauseVideo}
              repeat={false}
              onEnd={handleVideoEnd}
              ref={videoRefs}
            />
            {isPauseVideo && (
              <Image
                style={[styles.playIcon, StyleSheet.flatten(playIconStyle)]}
                source={playIcon}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '70%',
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: '#d3d3d3',
    borderWidth: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 5,
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
    tintColor: '#d3d3d3',
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
});
