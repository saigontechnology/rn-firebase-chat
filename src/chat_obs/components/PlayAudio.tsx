import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { formatTime } from '../../utilities';
import { audioRecorderPlayer } from '../../chat/components/VoiceRecorderModal';

interface PlayAudioProps {
  uri?: string;
}

const ImageURL = {
  playIcon: require('../../images/play_green.png'),
  pauseIcon: require('../../images/pause_red.png'),
};

export const PlayAudio: React.FC<PlayAudioProps> = (props) => {
  const { uri } = props;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);

  const playAudio = useCallback(async () => {
    audioRecorderPlayer.startPlayer(uri);
    audioRecorderPlayer.addPlayBackListener((e) => {
      setCurrentPositionSec(e.currentPosition);
      setCurrentDurationSec(e.duration);
      if (e.currentPosition >= e.duration) {
        audioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
      }
      return;
    });
    setIsPlaying(true);
  }, [uri]);

  useEffect(() => {
    playAudio();
  }, [playAudio, uri]);

  const playPause = async () => {
    if (isPlaying) {
      await audioRecorderPlayer.stopPlayer();
      setIsPlaying(false);
    } else {
      playAudio();
    }
  };

  const onSlide = async (value: number) => {
    await audioRecorderPlayer.seekToPlayer(value);
    setCurrentPositionSec(value);
  };

  useEffect(() => {
    return () => {
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.buttonPlaying} onPress={playPause}>
        <Image
          source={isPlaying ? ImageURL.pauseIcon : ImageURL.playIcon}
          style={styles.icon}
        />
      </TouchableOpacity>
      <View style={styles.controls}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={currentDurationSec}
          value={currentPositionSec}
          onSlidingComplete={onSlide}
          minimumTrackTintColor="white"
          maximumTrackTintColor="#323F4B"
          thumbTintColor="white"
          disabled
        />
      </View>
      <Text style={styles.timer}>{formatTime(currentPositionSec / 1000)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F3FF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
    marginTop: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timer: {
    width: 50,
    textAlign: 'center',
  },
  controls: {
    width: 160,
    height: 40,
  },
  icon: {
    width: 30,
    height: 30,
  },
  buttonPlaying: {
    marginLeft: 10,
    marginRight: 10,
  },
});
