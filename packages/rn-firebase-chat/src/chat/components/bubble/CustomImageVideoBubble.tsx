import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { LazyVideo } from '../LazyVideo';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import Images from '../../../asset';
import { CustomImage } from '../CustomImage';

const MAX_IMAGE_WIDTH = 240;
const MAX_IMAGE_HEIGHT = 320;

/**
 * Scale (w, h) into a bounding box (maxW, maxH) preserving aspect ratio.
 * Matches the iMessage/WhatsApp behavior: portrait images stay portrait,
 * landscape stay landscape, and both are capped to the same envelope.
 */
const fitInBox = (
  w: number,
  h: number,
  maxW: number,
  maxH: number
): { width: number; height: number } => {
  if (w <= 0 || h <= 0) return { width: maxW, height: maxW };
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
};

export interface CustomImageVideoBubbleProps {
  message: MessageProps;
  position: 'left' | 'right';
  onSelectImgVideoUrl: (url: string) => void;
  playIcon?: string;
  bubbleContainerStyle?: StyleProp<ViewStyle>;
  bubbleStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  videoContainerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  playIconStyle?: StyleProp<ImageStyle>;
}

export const CustomImageVideoBubble: React.FC<CustomImageVideoBubbleProps> = ({
  position,
  message,
  onSelectImgVideoUrl,
  playIcon = Images.playIcon,
  bubbleContainerStyle,
  bubbleStyle,
  imageStyle,
  videoContainerStyle,
  videoStyle,
  playIconStyle,
}) => {
  const [isPauseVideo, setIsPauseVideo] = useState(true);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>(
    { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH }
  );
  const videoRefs = useRef<{ seek: (time: number) => void } | null>(null);

  // Fetch the image's intrinsic dimensions, then scale into the bubble envelope
  // so portrait/landscape both display naturally without center-cropping.
  useEffect(() => {
    if (!message.path || message.type !== MessageTypes.image) return;
    let cancelled = false;
    Image.getSize(
      message.path,
      (w, h) => {
        if (cancelled) return;
        setImageSize(fitInBox(w, h, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT));
      },
      () => {
        // Fallback to square on load failure — same behavior as before.
      }
    );
    return () => {
      cancelled = true;
    };
  }, [message.path, message.type]);

  const handleImagePress = () => {
    if (message.path && message.type === MessageTypes.image) {
      onSelectImgVideoUrl(message.path);
    }
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
    <CustomImage
      source={{ uri: message.path }}
      style={[imageSize, imageStyle]}
      resizeMode="contain"
    />
  );

  const renderVideo = () => (
    <TouchableOpacity
      style={[styles.videoContainer, videoContainerStyle]}
      onPress={handleVideoPress}
    >
      <View>
        <LazyVideo
          source={{ uri: message.path }}
          style={[styles.video, videoStyle]}
          paused={isPauseVideo}
          repeat={false}
          onEnd={handleVideoEnd}
          ref={videoRefs}
        />
        {isPauseVideo && (
          <Image style={[styles.playIcon, playIconStyle]} source={playIcon} />
        )}
      </View>
    </TouchableOpacity>
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
        onPress={handleImagePress}
        style={[styles.bubble, bubbleStyle]}
      >
        {message.type === MessageTypes.image ? renderImage() : renderVideo()}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
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
  videoContainer: {
    width: 240,
    height: 240,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: 240,
    height: 240,
  },
  playIcon: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    resizeMode: 'contain',
    zIndex: 1,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
});
