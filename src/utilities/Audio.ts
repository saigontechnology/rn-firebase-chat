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
  const uri = await audioRecorderPlayer.startRecorder(
    undefined,
    audioSet,
    true
  );
  setRecordingState(true, uri);
};

const stopRecording = async (): Promise<void> => {
  await audioRecorderPlayer.stopRecorder();
  setRecordingState(false);
};

const startPlaying = async (uri: string): Promise<void> => {
  await audioRecorderPlayer.startPlayer(uri);
  setPlayingState(true, uri);
};

const stopPlaying = async (): Promise<void> => {
  await audioRecorderPlayer.stopPlayer();
  console.log('STOOPPPP');
  setPlayingState(false);
};

const addRecordBackListener = (callback: (event: any) => void): void => {
  audioRecorderPlayer.addRecordBackListener(callback);
};

const removeRecordBackListener = (): void => {
  state.isPlaying && stopPlaying();
  audioRecorderPlayer.removeRecordBackListener();
};

const addPlayBackListener = (callback: (event: any) => void): void => {
  audioRecorderPlayer.addPlayBackListener(callback);
};

const removePlayBackListener = (): void => {
  state.isPlaying && stopPlaying();
  audioRecorderPlayer.removePlayBackListener();
};

const seekToPlayer = async (value: number): Promise<void> => {
  await audioRecorderPlayer.seekToPlayer(value);
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
};
