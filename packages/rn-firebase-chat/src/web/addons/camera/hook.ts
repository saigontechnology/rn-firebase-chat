import { Keyboard } from 'react-native';
import { cameraRef } from './CameraView';
import { MessageTypes } from '../../../interfaces';
import { convertExtension } from './utilities';
import { ImagePickerValue } from './interface';

let useCameraPermissionHook:
  | (() => {
      hasPermission: boolean;
      requestPermission: () => Promise<boolean>;
    })
  | null = null;
interface ImagePickerAsset {
  uri?: string;
  type?: string;
  fileSize?: number;
  fileName?: string;
}

let launchImageLibraryFn:
  | ((options: unknown) => Promise<{ assets?: ImagePickerAsset[] }>)
  | null = null;

try {
  useCameraPermissionHook =
    require('react-native-vision-camera').useCameraPermission;
} catch {
  // react-native-vision-camera not installed
}

try {
  launchImageLibraryFn =
    require('react-native-image-picker').launchImageLibrary;
} catch {
  // react-native-image-picker not installed
}

const useCamera = () => {
  const cameraPermission = useCameraPermissionHook?.();
  const hasPermission = cameraPermission?.hasPermission ?? false;
  const requestPermission = cameraPermission?.requestPermission;

  const onPressCamera = () => {
    if (!useCameraPermissionHook) {
      console.warn(
        'react-native-vision-camera is not installed. Camera is unavailable.'
      );
      return;
    }
    if (!hasPermission) {
      requestPermission?.();
      return;
    }
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    cameraRef?.current?.show();
  };

  const onPressGallery = async (): Promise<ImagePickerValue | void> => {
    if (!launchImageLibraryFn) {
      console.warn(
        'react-native-image-picker is not installed. Gallery is unavailable.'
      );
      return;
    }
    try {
      const options = {
        mediaType: 'mixed' as const,
      };

      const result = await launchImageLibraryFn(options);

      if (result?.assets) {
        const file = result?.assets[0];
        const mediaType = file?.type?.startsWith('image')
          ? MessageTypes.image
          : MessageTypes.video;
        const extension = convertExtension(file);

        return {
          type: mediaType,
          path: file?.uri ?? '',
          extension: extension,
        };
      }
      return;
    } catch (error) {
      console.error('Error while opening gallery:', error);
      return;
    }
  };

  return {
    onPressCamera,
    onPressGallery,
  };
};

export { useCamera };
