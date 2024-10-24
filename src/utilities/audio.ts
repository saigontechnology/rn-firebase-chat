import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AVModeIOSOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  type AudioSet,
} from 'react-native-audio-recorder-player';

type State = {
  isRecording: boolean;
  isPlaying: boolean;
  recordingUri: string | null;
  playingUri: string | null;
};

const state: State = {
  isRecording: false,
  isPlaying: false,
  recordingUri: null,
  playingUri: null,
};

const audioSet: AudioSet = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  AVModeIOS: AVModeIOSOption.measurement,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 2,
  AVFormatIDKeyIOS: AVEncodingOption.aac,
};

type Listener = (state: State) => void;

const listeners = new Set<Listener>();

const audioRecorderPlayer = new AudioRecorderPlayer();

const getState = (): State => state;

const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = () => {
  listeners.forEach((listener) => listener(state));
};

const setRecordingState = (isRecording: boolean, uri: string | null = null) => {
  state.isRecording = isRecording;
  state.recordingUri = uri;
  notify();
};

const setPlayingState = (isPlaying: boolean, uri: string | null = null) => {
  state.isPlaying = isPlaying;
  state.playingUri = uri;
  notify();
};

const startRecording = async (): Promise<void> => {
  audioRecorderPlayer.removeRecordBackListener();
  await audioRecorderPlayer.stopRecorder();
  const uri = await audioRecorderPlayer.startRecorder(
    undefined,
    audioSet,
    true
  );
  setRecordingState(true, uri);
};

const stopRecording = async (): Promise<string> => {
  let filePath = await audioRecorderPlayer.stopRecorder();
  audioRecorderPlayer.removeRecordBackListener();
  setRecordingState(false);
  if (Platform.OS === 'android') {
    filePath = filePath?.startsWith('file:///')
      ? filePath.replace('file:///', '')
      : filePath;
  }
  return filePath;
};

const startPlaying = async (uri: string): Promise<void> => {
  await audioRecorderPlayer.startPlayer(uri);
  setPlayingState(true, uri);
};

const stopPlaying = async (): Promise<void> => {
  await audioRecorderPlayer.stopPlayer();
  setPlayingState(false);
};

const addRecordBackListener = (callback: (event: any) => void): void => {
  audioRecorderPlayer.addRecordBackListener(callback);
};

const removeRecordBackListener = (): void => {
  audioRecorderPlayer.removeRecordBackListener();
};

const addPlayBackListener = (callback: (event: any) => void): void => {
  audioRecorderPlayer.addPlayBackListener(callback);
};

const removePlayBackListener = (): void => {
  audioRecorderPlayer.removePlayBackListener();
};

const seekToPlayer = async (value: number): Promise<void> => {
  await audioRecorderPlayer.seekToPlayer(value);
};

const getPathDownloadAudio = async (
  url: string
): Promise<string | undefined> => {
  try {
    const fileName = url.split('/').pop()?.split('?')[0];
    const fileExt = fileName?.split('.').pop();
    const baseName = fileName?.split('.').shift();

    if (!fileExt || !baseName) {
      console.error('Invalid file name or extension');
      return;
    }

    const path = Platform.select({
      ios: `file://${RNFS.DocumentDirectoryPath}/${baseName}.m4a`,
      android: `${RNFS.DocumentDirectoryPath}/${baseName}.mp4`,
    });

    if (!path) {
      console.error('Path could not be generated');
      return;
    }

    const exists = await RNFS.exists(path);
    if (!exists) {
      console.log('Downloading file');
      await RNFS.downloadFile({ fromUrl: url, toFile: path }).promise;
    } else {
      console.log('File already exists:', path);
    }

    return path;
  } catch (error) {
    console.error('Error downloading audio:', error);
    return undefined;
  }
};

export {
  getState,
  subscribe,
  startRecording,
  stopRecording,
  startPlaying,
  stopPlaying,
  addRecordBackListener,
  removeRecordBackListener,
  addPlayBackListener,
  removePlayBackListener,
  seekToPlayer,
  getPathDownloadAudio,
};
