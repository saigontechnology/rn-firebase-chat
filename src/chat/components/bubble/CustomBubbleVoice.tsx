import React, { useState, useEffect } from 'react';
import type { MessageProps } from '../../../interfaces';
import {
  getState,
  subscribe,
  startPlaying,
  stopPlaying,
  removeRecordBackListener,
  addPlayBackListener,
  seekToPlayer,
  getPathDownloadAudio,
} from '../../../utilities';
import { AudioPlayerControls } from '../../../addons/audio/components/AudioPlayerControls';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface CustomBubbleVoiceProps {
  currentMessage: MessageProps;
  position: 'left' | 'right';
  isCurrentlyPlaying: boolean;
  onSetCurrentId: (id: string) => void;
  bubbleContainerStyle?: StyleProp<ViewStyle>;
  customSlider?: (
    currentDurationSec: number,
    currentPositionSec: number,
    onSlideRelease: (value: number) => void,
    onSlideStart: (value: number) => void,
    onSlideMove: (e: any, gestureState: any) => void
  ) => React.ReactNode;
}

export const CustomBubbleVoice: React.FC<CustomBubbleVoiceProps> = (props) => {
  const {
    currentMessage,
    isCurrentlyPlaying,
    onSetCurrentId,
    position,
    bubbleContainerStyle,
    customSlider,
  } = props;

  const [stateAudio, setStateAudio] = useState(getState());

  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [isPlayingLocal, setPlayingLocal] = useState<boolean>(false);

  const downloadAudio = async (url: string) => {
    const path = await getPathDownloadAudio(url);
    if (path) {
      setLocalPath(path);
    } else {
      console.error('Error downloading audio');
    }
  };

  useEffect(() => {
    if (
      (!isCurrentlyPlaying && stateAudio.isPlaying) ||
      stateAudio.isRecording
    ) {
      stopPlaying();
      setPlayingLocal(false);
      setCurrentPositionSec(0);
    }
  }, [isCurrentlyPlaying, stateAudio.isPlaying, stateAudio.isRecording]);

  const playPause = async () => {
    onSetCurrentId(currentMessage.id);

    if (!localPath) return;
    try {
      if (isPlayingLocal) {
        await stopPlaying();
        setPlayingLocal(false);
      } else {
        stateAudio.isPlaying && (await stopPlaying());
        setPlayingLocal(false);
        setCurrentPositionSec(0);

        setPlayingLocal(true);
        await startPlaying(localPath);
        addPlayBackListener((e) => {
          setCurrentPositionSec(e.currentPosition);
          setCurrentDurationSec(e.duration);
          if (e.currentPosition >= e.duration) {
            stopPlaying();
            setPlayingLocal(false);
            setCurrentPositionSec(0);
          }
        });
      }
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const onSlide = async (value: number) => {
    await seekToPlayer(value);
    setCurrentPositionSec(value);
  };

  useEffect(() => {
    if (!currentMessage.path) return;
    if (currentMessage.path?.startsWith('http')) {
      downloadAudio(currentMessage.path);
    } else {
      setLocalPath(currentMessage.path);
    }
  }, [currentMessage.path]);

  useEffect(() => {
    const unsubscribe = subscribe(setStateAudio);
    return () => {
      unsubscribe();
      removeRecordBackListener();
    };
  }, []);

  return (
    <View
      style={[
        styles.bubbleContainer,
        bubbleContainerStyle,
        position === 'left' ? styles.flexStart : styles.flexEnd,
      ]}
    >
      <AudioPlayerControls
        key={currentMessage.id}
        isPlaying={isPlayingLocal}
        playPause={playPause}
        currentDurationSec={currentDurationSec}
        currentPositionSec={currentPositionSec}
        onSlide={onSlide}
        style={styles.bubble}
        customSlider={customSlider}
      />
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
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
});
