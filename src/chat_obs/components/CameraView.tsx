import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { CaptureButton } from './CaptureButton';
import Video from 'react-native-video';

type MediaType = 'photo' | 'video';

type CameraViewProps = {
  visible?: boolean;
  onSendMedia: (media: {
    type: MediaType;
    path: string;
    extension: string;
  }) => void;
};

const iconPaths = {
  close: require('../../images/close.png'),
  send: require('../../images/send.png'),
  cameraChange: require('../../images/camera_change.png'),
  flashOn: require('../../images/flash_on.png'),
  flashOff: require('../../images/flash_off.png'),
};

const initialMediaState = {
  type: 'photo' as MediaType,
  path: '',
};

export const CameraView: React.FC<CameraViewProps> = ({
  visible = true,
  onSendMedia,
}) => {
  const camera = useRef<Camera>(null);
  const [media, setMedia] = useState(initialMediaState);
  const [isVideoPress, setIsVideoPress] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isShowCamera, setIsShowCamera] = useState(true);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back'
  );
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const device = useCameraDevice(cameraPosition);

  const supportsFlash = device?.hasFlash ?? false;

  const onMediaCaptured = useCallback(
    (data: PhotoFile | VideoFile, type: MediaType) => {
      setMedia({ type, path: data.path });
      setIsShowCamera(false);
    },
    []
  );

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((position) => (position === 'back' ? 'front' : 'back'));
  }, []);

  const onFlashPressed = useCallback(() => {
    setFlash((currentFlash) => (currentFlash === 'off' ? 'on' : 'off'));
  }, []);

  const onSendPressed = useCallback(async () => {
    const extension = media.type === 'photo' ? 'jpg' : 'mp4';

    onSendMedia({ type: media.type, path: media.path, extension });
  }, [media, onSendMedia]);

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
        {media.type === 'photo' ? (
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
          <Image source={iconPaths.close} style={styles.iconClose} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSendPressed}>
          <Image
            source={iconPaths.send}
            style={[styles.icon, styles.iconColor]}
          />
        </TouchableOpacity>
      </View>
    );
  }, [media, onSendPressed]);

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
        {isVideoPress && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, isRecording && styles.redColor]}>
              {new Date(timer * 1000).toISOString().slice(11, 19)}
            </Text>
          </View>
        )}
        <CaptureButton
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
            <Image style={styles.icon} source={iconPaths.cameraChange} />
          </TouchableOpacity>
          {supportsFlash && (
            <TouchableOpacity style={styles.button} onPress={onFlashPressed}>
              <Image
                style={styles.icon}
                source={flash === 'on' ? iconPaths.flashOn : iconPaths.flashOff}
              />
            </TouchableOpacity>
          )}
        </View>
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
      </View>
    ),
    [
      device,
      flash,
      isRecording,
      isVideoPress,
      onFlashPressed,
      onFlipCameraPressed,
      onMediaCaptured,
      supportsFlash,
      timer,
    ]
  );

  return (
    <Modal visible={visible}>
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
    color: 'white',
    fontSize: 20,
  },
  bottomTextSelected: {
    fontWeight: '500',
  },
});

export default CameraView;
