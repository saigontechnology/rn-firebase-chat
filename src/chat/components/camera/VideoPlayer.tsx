import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Video, {
  OnLoadData,
  OnProgressData,
  VideoRef,
} from 'react-native-video';
import { formatTime } from '../../../utilities';
import CustomSlider from '../slider';
import Images from '../../../asset';

const { height, width } = Dimensions.get('window');
interface VideoPlayerProps {
  videoUri: string;
  customSlider?: (
    currentTime: number,
    duration: number,
    paused: boolean,
    videoRef: VideoRef | null
  ) => React.ReactNode;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUri,
  customSlider,
}) => {
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const videoRef = useRef<VideoRef>(null);

  const handleLoad = (meta: OnLoadData) => {
    setDuration(meta.duration);
  };

  const handleProgress = (progress: OnProgressData) => {
    setCurrentTime(progress.currentTime);
  };

  const togglePlayPause = () => {
    setPaused((prev) => !prev);
  };

  const handleSlide = (value: number) => {
    if (videoRef.current) {
      videoRef.current?.resume();
      videoRef.current.seek(value);
      setCurrentTime(value);
    }
  };

  const onEnd = () => {
    setCurrentTime(0);
    setPaused(true);
    videoRef.current?.seek(0);
    videoRef.current?.pause();
  };

  const onSlideMove = () => {
    videoRef.current?.pause();
  };

  const renderSlider = () => {
    return (
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.overlayButton}
          onPress={togglePlayPause}
        >
          <Image
            source={paused ? Images.playIcon : Images.pauseWhiteIcon}
            style={styles.image}
          />
        </TouchableOpacity>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <CustomSlider
          duration={duration}
          currentTime={currentTime}
          onSlideRelease={handleSlide}
          onSlideMove={onSlideMove}
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        paused={paused}
        onLoad={handleLoad}
        onProgress={handleProgress}
        resizeMode="contain"
        onEnd={onEnd}
      />
      {customSlider
        ? customSlider(currentTime, duration, paused, videoRef.current)
        : renderSlider()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  video: {
    flex: 1,
    width: width,
    height: height,
  },
  overlayButton: {
    // position: 'absolute',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    color: 'white',
    marginHorizontal: 5,
  },
  sliderContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'gray',
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    position: 'absolute',
  },
  image: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
});
