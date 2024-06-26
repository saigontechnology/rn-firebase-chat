import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  TouchableOpacity,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import FastImage from 'react-native-fast-image';
import { MessageTypes, type MessageProps } from '../../interfaces';

interface CustomImageVideoBubbleProps {
  message: MessageProps;
  position: 'left' | 'right';
  selectedImgVideoUrl: (url: string) => void;
}

export const CustomImageVideoBubble: React.FC<CustomImageVideoBubbleProps> = ({
  position,
  message,
  selectedImgVideoUrl,
}) => {
  const [isPauseVideo, setIsPauseVideo] = useState(true);
  const videoRefs = useRef<VideoRef>(null);

  return (
    <View
      style={[
        styles.bubleContainer,
        position === 'left' ? styles.flexStart : styles.flexEnd,
      ]}
    >
      <Pressable
        onPress={() =>
          message.path &&
          message.type === MessageTypes.image &&
          selectedImgVideoUrl(message.path)
        }
        style={styles.bubble}
      >
        {message.type === MessageTypes.image ? (
          <FastImage
            source={{
              uri: message.path,
              priority: FastImage.priority.high,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => setIsPauseVideo(false)}
          >
            <View>
              <Video
                source={{ uri: message.path }}
                style={styles.video}
                paused={isPauseVideo}
                repeat={false}
                onEnd={() => {
                  setIsPauseVideo(true);
                  videoRefs.current?.seek(0);
                }}
                ref={videoRefs}
              />
              {isPauseVideo && (
                <Image
                  style={styles.playIcon}
                  source={require('../../images/play.png')}
                />
              )}
            </View>
          </TouchableOpacity>
        )}
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
  bubleContainer: {
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
  videoText: {
    color: '#fff',
    fontSize: 16,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
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
});
