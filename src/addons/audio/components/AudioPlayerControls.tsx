import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { formatTime } from '../../../utilities';
import Images from '../../../asset';
import CustomSlider from '../../../chat/components/slider';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  duration: number;
  playPause: () => void;
  currentPositionSec: number;
  currentDurationSec: number;
  onSlide: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  customSlider?: (
    currentDurationSec: number,
    currentPositionSec: number,
    onSlideRelease: (value: number) => void,
    onSlideStart: (value: number) => void,
    onSlideMove: (e: any, gestureState: any) => void
  ) => React.ReactNode;
}

const ImageURL = {
  playIcon: Images.playWhiteIcon,
  pauseIcon: Images.pauseIcon,
};

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  duration,
  playPause,
  currentPositionSec,
  currentDurationSec,
  onSlide,
  style,
  customSlider,
}) => {
  const onSlideStart = () => {
    if (isPlaying) {
      playPause();
    }
  };

  const onSlideMove = (e: any, gestureState: any) => {
    // Handle movement updates, for now, we're not using it
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.buttonPlaying} onPress={playPause}>
        <Image
          source={isPlaying ? ImageURL.pauseIcon : ImageURL.playIcon}
          style={styles.icon}
        />
      </TouchableOpacity>
      <View style={styles.controls}>
        {customSlider ? (
          customSlider(
            currentDurationSec,
            currentPositionSec,
            onSlide,
            onSlideStart,
            onSlideMove
          )
        ) : (
          <CustomSlider
            duration={currentDurationSec}
            currentTime={currentPositionSec}
            onSlideRelease={onSlide}
            onSlideStart={onSlideStart}
            onSlideMove={onSlideMove}
            sliderContainer={styles.sliderContainer}
            sliderTrack={styles.sliderTrack}
            sliderThumb={styles.sliderThumb}
          />
        )}
      </View>
      <Text style={styles.timer}>
        {isPlaying
          ? formatTime(currentPositionSec / 1000)
          : formatTime(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 100,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e1ffc7',
    borderRadius: 20,
    borderColor: '#d3d3d3',
  },
  buttonPlaying: {
    marginLeft: 10,
  },
  icon: {
    width: 25,
    height: 25,
    tintColor: 'black',
  },
  controls: {
    width: 140,
    height: 40,
  },
  timer: {
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  sliderTrack: {
    marginRight: 8,
    marginLeft: 20,
  },
  sliderThumb: {
    marginLeft: 10,
  },
});
