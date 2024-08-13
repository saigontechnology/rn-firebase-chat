import type { Asset } from 'react-native-image-picker';

export const convertExtension = (file: Asset | undefined): string => {
  if (!file || file.type?.startsWith('image')) {
    return 'jpg';
  } else {
    return 'mp4';
  }
};
