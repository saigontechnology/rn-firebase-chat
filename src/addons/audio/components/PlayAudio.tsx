import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {
  formatTime,
  startPlaying,
  stopPlaying,
  addPlayBackListener,
  seekToPlayer,
  removePlayBackListener,
} from '../../../utilities';
import Images from '../../../asset';
import CustomSlider from '../../../chat/components/slider';

interface PlayAudioProps {
  uri?: string;
  customSlider?: (
    currentDurationSec: number,
    currentPositionSec: number,
    onSlideRelease: (value: number) => void,
    onSlideStart: (value: number) => void,
    onSlideMove: (e: any, gestureState: any) => void
  ) => React.ReactNode;
}

const ImageURL = {
  playIcon: Images.playGreenIcon,
  pauseIcon: Images.pauseRedIcon,
};

export const PlayAudio: React.FC<PlayAudioProps> = (props) => {
  const { uri, customSlider } = props;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);

  const playAudio = useCallback(async () => {
    if (!uri) {
      Alert.alert('Error', 'No audio file found');
      return;
    }
    startPlaying(uri);
    setIsPlaying(true);
    addPlayBackListener((e) => {
      setCurrentPositionSec(e.currentPosition);
      setCurrentDurationSec(e.duration);
      if (e.currentPosition >= e.duration) {
        stopPlaying();
        setIsPlaying(false);
        setCurrentPositionSec(0);
      }
      return;
    });
  }, [uri]);

  useEffect(() => {
    playAudio();
  }, [playAudio, uri]);

  const playPause = async () => {
    if (isPlaying) {
      await stopPlaying();
      setIsPlaying(false);
    } else {
      playAudio();
    }
  };

  const onSlideStart = () => {
    if (isPlaying) {
      stopPlaying();
    }
  };

  const onSlideMove = (e: any, gestureState: any) => {};

  const onSlideRelease = async (value: number) => {
    if (uri) {
      await seekToPlayer(value);
      setCurrentPositionSec(value);
      if (!isPlaying) {
        startPlaying(uri);
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      removePlayBackListener();
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
        {customSlider ? (
          customSlider(
            currentDurationSec,
            currentPositionSec,
            onSlideRelease,
            onSlideStart,
            onSlideMove
          )
        ) : (
          <CustomSlider
            duration={currentDurationSec}
            currentTime={currentPositionSec}
            onSlideRelease={onSlideRelease}
            onSlideStart={onSlideStart}
            onSlideMove={onSlideMove}
          />
        )}
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
  controls: {
    width: 160,
    height: 40,
  },
  timer: {
    width: 50,
    textAlign: 'center',
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
