import { Platform } from 'react-native';

export const formatSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const getAbsoluteFilePath = (downloadedDestination: string) => {
  if (Platform.OS === 'ios') return downloadedDestination;
  return 'file://' + downloadedDestination;
};
