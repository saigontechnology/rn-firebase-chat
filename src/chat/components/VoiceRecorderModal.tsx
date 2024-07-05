import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { PlayAudio } from '../../chat_obs/components/PlayAudio';
import WaveForm from '../../chat_obs/components/WaveForm';
import {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AVModeIOSOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  type AudioSet,
} from 'react-native-audio-recorder-player';
import uuid from 'react-native-uuid';
import { convertExtension } from '../../utilities';
import {
  MessageTypes,
  type IUserInfo,
  type MessageProps,
} from '../../interfaces';

interface VoiceRecorderModalProps {
  userInfo: IUserInfo | null;
  onSend: (message: MessageProps) => void;
  onSetCurrentId: (id: string) => void;
}

export interface VoiceRecorderModalRef {
  show: () => void;
  hide: () => void;
}

const ImageURL = {
  delete: require('../../images/delete.png'),
  playAudio: require('../../images/play_audio.png'),
  sendAudio: require('../../images/send_audio.png'),
  replay: require('../../images/replay.png'),
};

const audioSet: AudioSet = {
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  AVModeIOS: AVModeIOSOption.measurement,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVNumberOfChannelsKeyIOS: 2,
  AVFormatIDKeyIOS: AVEncodingOption.aac,
};

export const audioRecorderPlayer = new AudioRecorderPlayer();

const VoiceRecorderModal = forwardRef<
  VoiceRecorderModalRef,
  VoiceRecorderModalProps
>((props, ref) => {
  const { userInfo, onSend, onSetCurrentId } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [isReplay, setReplay] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recordTime, setRecordTime] = useState(0);

  const [uri, setUri] = useState<string>('');

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsVisible(true);
      onSetCurrentId('');
    },
    hide: () => setIsVisible(false),
  }));

  const reset = useCallback(() => {
    setIsVisible(false);
    setIsRecord(false);
    setReplay(false);
    setUri('');
    setWaveform([]);
  }, []);

  const onSendMessage = useCallback(
    async (path: string) => {
      try {
        const extension = convertExtension(path);
        const type = MessageTypes.voice;
        const id = uuid.v4();
        const message = {
          id: id,
          _id: id,
          type: type,
          path: path,
          extension,
          duration: recordTime,
          name: 'Audio_' + id,
        } as MessageProps;
        const user = {
          _id: userInfo?.id || '',
          ...userInfo,
        };
        message.user = user;
        onSend(message);
      } catch (error) {
        console.log('error: ', error);
      }
      reset();
    },
    [onSend, recordTime, reset, userInfo]
  );

  const getLevel = useMemo(
    () => (metering: number) => {
      if (metering > 50) {
        return 10;
      } else if (metering > 40 && metering <= 50) {
        return 30;
      } else if (metering > 30 && metering <= 40) {
        return 40;
      } else {
        return 50;
      }
    },
    []
  );

  const startRecording = useCallback(async () => {
    setIsRecord(true);
    audioRecorderPlayer.removeRecordBackListener();
    audioRecorderPlayer.stopRecorder();
    await audioRecorderPlayer.startRecorder(undefined, audioSet, true);
    audioRecorderPlayer.addRecordBackListener((e) => {
      const { currentMetering } = e || {};
      const volume = getLevel(Math.abs(currentMetering || 0));
      console.log('volume: ', volume);
      setWaveform((prevWaveform) => [...prevWaveform, volume]);
      setRecordTime(Math.floor(e.currentPosition / 1000));
    });
  }, [getLevel]);

  const getPathRecord = useCallback(async () => {
    let result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    if (Platform.OS === 'android') {
      result = result?.startsWith('file:///')
        ? result.replace('file:///', '')
        : result;
    }
    return result;
  }, []);

  const stopRecording = useCallback(async () => {
    const path = await getPathRecord();
    setUri(path);
    setIsRecord(false);
  }, [getPathRecord]);

  const handleDelete = useCallback(() => {
    reset();
    stopRecording();
  }, [reset, stopRecording]);

  const handleReplay = useCallback(() => {
    setIsRecord(false);
    setReplay(true);
    stopRecording();
  }, [stopRecording]);

  const handleSend = useCallback(async () => {
    if (isRecord) {
      const path = await getPathRecord();
      setUri(path);
      onSendMessage(path);
      setIsVisible(false);
    } else {
      startRecording();
    }
  }, [getPathRecord, isRecord, onSendMessage, startRecording]);

  const handleOutsidePress = () => {
    if (isRecord || isReplay) {
      Alert.alert('Are you sure you want to delete this recording?', '', [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: reset,
        },
      ]);
    } else {
      reset();
    }
  };

  const renderPlayRecord = () => (
    <View style={styles.modalContainer}>
      {isRecord && <WaveForm isRecording={isRecord} data={waveform} />}
      <Text style={styles.modeText}>Press to record</Text>
      <View style={styles.buttonContainer}>
        {isRecord && (
          <TouchableOpacity style={styles.button} onPress={handleDelete}>
            <View style={styles.iconViewContainer}>
              <Image source={ImageURL.delete} style={[styles.icon]} />
            </View>
            <Text>Delete</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <View style={styles.iconViewContainer}>
            <Image
              source={isRecord ? ImageURL.sendAudio : ImageURL.playAudio}
              style={styles.iconRecord}
            />
          </View>
        </TouchableOpacity>
        {isRecord && (
          <TouchableOpacity style={styles.button} onPress={handleReplay}>
            <View style={styles.iconViewContainer}>
              <Image source={ImageURL.replay} style={styles.icon} />
            </View>
            <Text>Replay</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderReplayRecord = () => (
    <View style={styles.modalContainer}>
      <View style={styles.viewPlayAudio}>
        <PlayAudio uri={uri} />
      </View>
      <View style={styles.containerReplay}>
        <TouchableOpacity style={styles.button} onPress={handleDelete}>
          <View style={styles.iconViewContainer}>
            <Image source={ImageURL.delete} style={styles.icon} />
          </View>
          <Text>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <View style={styles.iconViewContainer}>
            <Image source={ImageURL.sendAudio} style={styles.iconSend} />
          </View>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setIsVisible(false)}
      style={styles.modal}
    >
      <Pressable style={styles.overlay} onPress={handleOutsidePress} />
      {!isReplay ? renderPlayRecord() : renderReplayRecord()}
    </Modal>
  );
});

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    height: 260,
    justifyContent: 'center',
    zIndex: 1,
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
  },
  progressBar: {
    width: '90%',
    height: 40,
  },
  durationText: {
    position: 'absolute',
    right: 30,
    top: 10,
    color: '#000',
    fontSize: 16,
  },
  modeText: {
    marginBottom: 30,
    color: '#000',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  containerReplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  sendButton: {
    alignItems: 'center',
  },
  viewPlayAudio: {
    marginBottom: 20,
  },
  iconViewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginBottom: 5,
  },
  iconText: {
    fontSize: 24,
  },
  sendText: {
    color: 'white',
  },
  icon: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  iconRecord: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  iconSend: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
  },
});

export default VoiceRecorderModal;
