import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import type { MessageProps } from '../../../interfaces';
import RNFS from 'react-native-fs';
import { AudioPlayerControls } from '../../../chat_obs/components/AudioPlayerControls';
import { audioRecorderPlayer } from '../VoiceRecorderModal';

interface CustomBubbleVoiceProps {
  currentMessage: MessageProps;
  position: 'left' | 'right';
  isCurrentlyPlaying: boolean;
  onSetCurrentId: (id: string) => void;
}

export const CustomBubbleVoice: React.FC<CustomBubbleVoiceProps> = (props) => {
  const { currentMessage, isCurrentlyPlaying, onSetCurrentId } = props;
  console.log('CustomBubbleVoice: ', currentMessage.id);
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [isPlayingLocal, setPlayingLocal] = useState<boolean>(false);

  const downloadAudio = async (url: string) => {
    const fileName = url.split('/').pop()?.split('?')[0];
    const getFileExt = fileName?.split('.')[0];
    const path = Platform.select({
      ios: `file://${RNFS.DocumentDirectoryPath}/${getFileExt}.m4a`,
      android: `${RNFS.DocumentDirectoryPath}/${getFileExt}.mp4`,
    });
    if (!path) return;
    try {
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.downloadFile({ fromUrl: url, toFile: path }).promise;
      }
      setLocalPath(path);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  useEffect(() => {
    if (!isCurrentlyPlaying) {
      audioRecorderPlayer.stopPlayer();
      setPlayingLocal(false);
      setCurrentPositionSec(0);
    }
  }, [isCurrentlyPlaying]);

  const playPause = async () => {
    onSetCurrentId(currentMessage.id);

    if (!localPath) return;
    try {
      if (isPlayingLocal) {
        await audioRecorderPlayer.stopPlayer();
        setPlayingLocal(false);
      } else {
        await audioRecorderPlayer.stopPlayer();
        setPlayingLocal(false);
        setCurrentPositionSec(0);

        setPlayingLocal(true);
        await audioRecorderPlayer.startPlayer(localPath);
        audioRecorderPlayer.addPlayBackListener((e) => {
          setCurrentPositionSec(e.currentPosition);
          setCurrentDurationSec(e.duration);
          if (e.currentPosition >= e.duration) {
            audioRecorderPlayer.stopPlayer();
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
    await audioRecorderPlayer.seekToPlayer(value);
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
    return () => {
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);
  console.log('isCurrentlyPlaying: ', isCurrentlyPlaying, currentMessage.id);
  return (
    <AudioPlayerControls
      key={currentMessage.id}
      isPlaying={isCurrentlyPlaying}
      playPause={playPause}
      currentDurationSec={currentDurationSec}
      currentPositionSec={currentPositionSec}
      onSlide={onSlide}
    />
  );
};
