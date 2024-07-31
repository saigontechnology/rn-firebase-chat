import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { formatTime } from '../../utilities';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  downloading: boolean;
  playPause: () => void;
  totalDurationSec: number;
  currentPositionSec: number;
  currentDurationSec: number;
  onSlide: (value: number) => void;
}

const ImageURL = {
  playIcon: require('../../images/play_white.png'),
  pauseIcon: require('../../images/pause_white.png'),
};

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  playPause,
  downloading,
  totalDurationSec,
  currentPositionSec,
  currentDurationSec,
  onSlide,
}) => {
  return (
    <View style={styles.container}>
      {downloading ? (
        <ActivityIndicator color={'white'} animating size="small" />
      ) : (
        <TouchableOpacity style={styles.buttonPlaying} onPress={playPause}>
          <Image
            source={isPlaying ? ImageURL.pauseIcon : ImageURL.playIcon}
            style={styles.icon}
          />
        </TouchableOpacity>
      )}
      <View style={styles.controls}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={currentDurationSec}
          value={currentPositionSec}
          onSlidingComplete={onSlide}
          minimumTrackTintColor="white"
          maximumTrackTintColor="#8190C8"
          thumbTintColor="white"
          disabled
        />
      </View>
      <Text style={styles.timer}>{formatTime(totalDurationSec)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 100,
    // minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fexDirection: 'row',
    backgroundColor: '#2F80ED',
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#d3d3d3',
  },
  buttonPlaying: {
    marginLeft: 0,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  controls: {
    width: 140,
    height: 30,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timer: {
    color: 'white',
    textAlign: 'center',
  },
});
