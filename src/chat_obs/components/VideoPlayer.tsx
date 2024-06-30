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
import Slider from '@react-native-community/slider';
import { formatTime } from '../../utilities';

const { height, width } = Dimensions.get('window');
interface VideoPlayerProps {
  videoUri: string;
}

const ImageAssets = {
  playIcon: require('../../images/play_white.png'),
  pauseIcon: require('../../images/pause_white.png'),
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUri }) => {
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
    setPaused(!paused);
  };

  const handleSlide = (value: number) => {
    if (videoRef.current) {
      videoRef.current.seek(value);
      setCurrentTime(value);
    }
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
      />
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause}>
          <Image
            source={paused ? ImageAssets.playIcon : ImageAssets.pauseIcon}
            style={styles.image}
          />
        </TouchableOpacity>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Slider
          style={styles.slider}
          value={currentTime}
          maximumValue={duration}
          minimumValue={0}
          step={1}
          onValueChange={handleSlide}
          minimumTrackTintColor="white"
          maximumTrackTintColor="gray"
          thumbTintColor="white"
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
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
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    color: 'white',
    marginHorizontal: 5,
  },
  slider: {
    flex: 1,
  },
  image: {
    width: 25,
    height: 25,
    tintColor: 'white',
  },
});

export default VideoPlayer;
