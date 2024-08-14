import { Keyboard } from 'react-native';
// Camera
import { useCameraPermission } from 'react-native-vision-camera';
import { cameraRef } from './CameraView';
// Image Picker
import {
  launchImageLibrary,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { MessageTypes } from '../../interfaces';
import { convertExtension } from './utilities';
import { ImagePickerValue } from './interface';

const useCamera = () => {
  const { hasPermission, requestPermission } = useCameraPermission();

  const onPressCamera = () => {
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
    try {
      const options: ImageLibraryOptions = {
        mediaType: 'mixed',
      };

      const result: ImagePickerResponse = await launchImageLibrary(options);

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
