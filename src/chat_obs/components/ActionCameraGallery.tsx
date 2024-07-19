import { lazy } from 'react';
import {
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { MessageProps, MessageTypes } from '../../interfaces';
import { convertExtension } from '../../utilities';
import { CameraViewRef } from './CameraView';

interface onSendProps {
  onSend?(
    messages: Partial<MessageProps> | Partial<MessageProps>[],
    shouldResetInputToolbar: boolean
  ): void;
}

const openGallery = async (onSend: onSendProps['onSend']) => {
  try {
    const options: ImageLibraryOptions = {
      mediaType: 'mixed',
    };

    const { launchImageLibrary } = await import('react-native-image-picker');

    const result: ImagePickerResponse = await launchImageLibrary(options);

    if (result?.assets) {
      const file = result?.assets[0];
      const mediaType = file?.type?.startsWith('image')
        ? MessageTypes.image
        : MessageTypes.video;
      const extension = convertExtension(file);

      onSend?.(
        {
          type: mediaType,
          path: file?.uri ?? '',
          extension: extension,
        },
        true
      );
    }
  } catch (error) {
    console.error('Error while opening gallery:', error);
  }
};

const openCamera = async (cameraViewRef?: CameraViewRef | null) => {
  try {
    const { Camera } = await import('react-native-vision-camera');
    const { getCameraPermissionStatus, requestCameraPermission } = Camera;
    if (getCameraPermissionStatus()) {
      cameraViewRef?.show();
    } else {
      const hasPermission = await requestCameraPermission();
      if (hasPermission) {
        cameraViewRef?.show();
      }
    }
  } catch (error) {
    console.error('Failed to get or request camera permission:', error);
  }
};

export { openGallery, openCamera };
