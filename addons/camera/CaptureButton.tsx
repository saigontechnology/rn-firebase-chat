import React, { useCallback, useRef } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Camera, PhotoFile, VideoFile } from 'react-native-vision-camera';
import type { OnOffType } from './interface';
import { CAPTURE_BUTTON_SIZE } from './constants';
import { MessageTypes } from '../../src/interfaces';

const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1;

interface Props extends ViewProps {
  camera: React.RefObject<Camera>;
  onMediaCaptured: (media: PhotoFile | VideoFile, type: MessageTypes) => void;
  flash: OnOffType;
  isPhoto: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const CaptureButton: React.FC<Props> = ({
  camera,
  onMediaCaptured,
  onStopRecording,
  onStartRecording,
  isPhoto,
  flash,
  style,
  ...props
}): React.ReactElement => {
  const isRecording = useRef(false);
  // #region Camera Capture
  const takePhoto = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error('Camera ref is null!');
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: false,
      });
      onMediaCaptured(photo, MessageTypes.image);
    } catch (e) {
      console.error('Failed to take photo!', e);
    }
  }, [camera, flash, onMediaCaptured]);

  const stopRecording = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error('Camera ref is null!');
      await camera.current.stopRecording();
      onStopRecording?.();
    } catch (e) {
      console.error('failed to stop recording!', e);
    }
  }, [camera, onStopRecording]);

  const startRecording = useCallback(() => {
    try {
      if (camera.current == null) throw new Error('Camera ref is null!');
      isRecording.current = true;
      onStartRecording?.();
      camera.current.startRecording({
        flash: flash,
        onRecordingError: (error) => {
          console.error('Recording failed!', error);
        },
        onRecordingFinished: (video) => {
          onMediaCaptured(video, MessageTypes.video);
        },
      });
    } catch (e) {
      console.error('failed to start recording!', e, 'camera');
    }
  }, [camera, flash, onMediaCaptured, onStartRecording]);

  const onPress = useCallback(() => {
    if (isPhoto) {
      takePhoto();
    } else {
      isRecording.current ? stopRecording() : startRecording();
    }
  }, [isPhoto, startRecording, stopRecording, takePhoto]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={style}
      {...props}
    >
      <View style={styles.button} />
    </TouchableOpacity>
  );
};

export const CaptureCameraButton = React.memo(CaptureButton);

const styles = StyleSheet.create({
  button: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: 'white',
    backgroundColor: '#e34077',
  },
});
