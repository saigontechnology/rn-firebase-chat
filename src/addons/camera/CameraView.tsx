import React, {
  createRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import type { PhotoFile, VideoFile } from 'react-native-vision-camera';
import Video from 'react-native-video';
import { v4 as uuidv4 } from 'uuid';
import { CaptureCameraButton } from './CaptureButton';
import type {
  CameraViewMethods,
  FrontBackType,
  IconPaths,
  OnOffType,
} from './interface';
import { initialMediaState } from './constants';
import { MessageTypes, type MessageProps, type MediaType } from '../../interfaces';
import {
  getAbsoluteFilePath,
  getMediaTypeFromExtension,
} from '../../utilities';
import Images from '../../asset';
import { useChatContext } from '../../hooks';

export type CameraViewProps = {
  onSend: (message: MessageProps) => void;
  iconProps?: IconPaths;
};

export const cameraRef = createRef<CameraViewMethods>();

export const CameraView: React.FC<CameraViewProps> = ({
  onSend,
  iconProps,
}) => {
  const { userInfo } = useChatContext();
  const camera = useRef<Camera>(null);
  const [media, setMedia] = useState(initialMediaState);
  const [isVideoPress, setIsVideoPress] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isShowCamera, setIsShowCamera] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<FrontBackType>('back');
  const [flash, setFlash] = useState<OnOffType>('off');
  const device = useCameraDevice(cameraPosition);

  const supportsFlash = device?.hasFlash ?? false;

  useImperativeHandle(cameraRef, () => ({
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
  }));

  const onMediaCaptured = useCallback(
    (data: PhotoFile | VideoFile, type: MessageTypes) => {
      setMedia({ type, path: data.path });
      setIsShowCamera(false);
    },
    []
  );

  const onCloseCamera = useCallback(() => {
    if (isVideoPress) {
      setIsVideoPress(false);
      return;
    }
    setIsVisible(false);
  }, [isVideoPress]);

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((position) => (position === 'back' ? 'front' : 'back'));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((currentFlash) => (currentFlash === 'off' ? 'on' : 'off'));
  }, []);

  const onSendPressed = useCallback(async () => {
    const extension = getMediaTypeFromExtension(media.path);
    const id = uuidv4();
    const message: MessageProps = {
      id: id,
      _id: id,
      text: '',
      senderId: userInfo?.id || '',
      readBy: {},
      createdAt: new Date(),
      type: media.type as MediaType,
      path: getAbsoluteFilePath(media.path),
      extension,
      user: {
        _id: userInfo?.id || '',
        ...userInfo,
      },
    };
    onSend(message);
    setIsVisible(false);
  }, [media.path, media.type, onSend, userInfo]);

  const startRecording = async () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setTimer(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRecording) {
      interval = setInterval(
        () => setTimer((prevTimer) => prevTimer + 1),
        1000
      );
    } else if (!isRecording && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, timer]);

  const renderMediaPage = useCallback(() => {
    const source = { uri: media.path };
    return (
      <View style={styles.container}>
        {media.type === MessageTypes.image ? (
          <Image
            source={source}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Video source={source} style={StyleSheet.absoluteFill} />
        )}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            setMedia(initialMediaState);
            setIsShowCamera(true);
          }}
        >
          <Image
            source={iconProps?.close ?? Images.close}
            style={styles.iconClose}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSendPressed}>
          <Image
            source={iconProps?.send || Images.send}
            style={[styles.icon, styles.iconColor]}
          />
        </TouchableOpacity>
      </View>
    );
  }, [
    iconProps?.close,
    iconProps?.send,
    media.path,
    media.type,
    onSendPressed,
  ]);

  const renderTimerView = useCallback(() => {
    return (
      <View style={styles.bottomView}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={() => {
            setIsRecording(false);
            setIsVideoPress(false);
          }}
        >
          <Text
            style={[
              styles.bottomText,
              !isVideoPress && styles.bottomTextSelected,
            ]}
          >
            Photo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.videoButton}
          onPress={() => {
            setTimer(0);
            setIsVideoPress(true);
          }}
        >
          <Text
            style={[
              styles.bottomText,
              isVideoPress && styles.bottomTextSelected,
            ]}
          >
            Video
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isVideoPress]);

  const renderCamera = useCallback(
    () => (
      <View style={styles.container}>
        {device && (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            ref={camera}
            photo={!isVideoPress}
            video={isVideoPress}
          />
        )}
        <TouchableOpacity style={styles.backBtton} onPress={onCloseCamera}>
          <Image
            source={iconProps?.back || Images.back}
            style={styles.iconBack}
          />
        </TouchableOpacity>
        {isVideoPress && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, isRecording && styles.redColor]}>
              {new Date(timer * 1000).toISOString().slice(11, 19)}
            </Text>
          </View>
        )}
        <CaptureCameraButton
          style={styles.captureButton}
          camera={camera}
          onMediaCaptured={onMediaCaptured}
          flash={supportsFlash ? flash : 'off'}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          isPhoto={!isVideoPress}
        />
        <View style={styles.rightButtonRow}>
          <TouchableOpacity style={styles.button} onPress={onFlipCameraPressed}>
            <Image
              style={styles.icon}
              source={iconProps?.cameraChange ?? Images.cameraChange}
            />
          </TouchableOpacity>
          {supportsFlash && (
            <TouchableOpacity style={styles.button} onPress={onFlashPressed}>
              <Image
                style={styles.icon}
                source={
                  flash === 'on'
                    ? iconProps?.flashOn ?? Images.flashOn
                    : iconProps?.flashOff ?? Images.flashOff
                }
              />
            </TouchableOpacity>
          )}
        </View>
        {renderTimerView()}
      </View>
    ),
    [
      device,
      iconProps?.back,
      iconProps?.cameraChange,
      iconProps?.flashOff,
      iconProps?.flashOn,
      flash,
      isRecording,
      isVideoPress,
      onCloseCamera,
      onFlashPressed,
      onFlipCameraPressed,
      onMediaCaptured,
      renderTimerView,
      supportsFlash,
      timer,
    ]
  );

  return (
    <Modal visible={isVisible}>
      {isShowCamera ? renderCamera() : renderMediaPage()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 60,
  },
  button: {
    marginBottom: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
    right: 30,
    top: 50,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 30,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtton: {
    position: 'absolute',
    top: 50,
    left: 30,
    width: 35,
    height: 35,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  iconClose: {
    width: 25,
    height: 25,
    tintColor: 'white',
  },
  iconBack: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  iconColor: {
    tintColor: 'white',
  },
  timerContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 24,
  },
  redColor: {
    color: 'red',
  },
  bottomView: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoButton: {
    marginRight: 10,
  },
  videoButton: {
    marginLeft: 10,
  },
  bottomText: {
    color: 'gray',
    fontSize: 20,
    fontWeight: '400',
  },
  bottomTextSelected: {
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CameraView;
