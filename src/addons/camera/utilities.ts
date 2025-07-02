import type { Asset } from 'react-native-image-picker';
import { CAMERA_CONFIG, CAMERA_MESSAGES } from './constants';

export const convertExtension = (file: Asset | undefined): string => {
  if (!file || file.type?.startsWith('image')) {
    return 'jpg';
  } else {
    return 'mp4';
  }
};

// Enhanced file validation utilities
export const validateFileSize = (fileSize?: number): boolean => {
  if (!fileSize) return true;
  return fileSize <= CAMERA_CONFIG.MAX_FILE_SIZE;
};

export const validateImageFormat = (fileName?: string): boolean => {
  if (!fileName) return true;
  const extension = getFileExtension(fileName).toLowerCase();
  return CAMERA_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(extension);
};

export const validateVideoFormat = (fileName?: string): boolean => {
  if (!fileName) return true;
  const extension = getFileExtension(fileName).toLowerCase();
  return CAMERA_CONFIG.SUPPORTED_VIDEO_FORMATS.includes(extension);
};

export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop() || '';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Media compression utilities
export const shouldCompressImage = (width?: number, height?: number): boolean => {
  if (!width || !height) return false;
  return width > CAMERA_CONFIG.MAX_PHOTO_WIDTH || height > CAMERA_CONFIG.MAX_PHOTO_HEIGHT;
};

export const calculateCompressedDimensions = (
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } => {
  const maxWidth = CAMERA_CONFIG.MAX_PHOTO_WIDTH;
  const maxHeight = CAMERA_CONFIG.MAX_PHOTO_HEIGHT;

  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
};

// Permission utilities
export const getCameraPermissionMessage = (): string => {
  return CAMERA_MESSAGES.PERMISSION_DENIED;
};

export const getErrorMessage = (errorType: keyof typeof CAMERA_MESSAGES): string => {
  return CAMERA_MESSAGES[errorType];
};

// Media type detection utilities
export const isVideoFile = (fileName?: string, mimeType?: string): boolean => {
  if (mimeType?.startsWith('video/')) return true;
  if (!fileName) return false;
  const extension = getFileExtension(fileName).toLowerCase();
  return CAMERA_CONFIG.SUPPORTED_VIDEO_FORMATS.includes(extension);
};

export const isImageFile = (fileName?: string, mimeType?: string): boolean => {
  if (mimeType?.startsWith('image/')) return true;
  if (!fileName) return false;
  const extension = getFileExtension(fileName).toLowerCase();
  return CAMERA_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(extension);
};

// Thumbnail generation utilities
export const generateThumbnailPath = (originalPath: string): string => {
  const pathParts = originalPath.split('.');
  const extension = pathParts.pop();
  const basePath = pathParts.join('.');
  return `${basePath}_thumb.${extension}`;
};

// File cleanup utilities
export const cleanupTempFile = async (filePath: string): Promise<void> => {
  try {
    // Note: This would need react-native-fs or similar library for actual implementation
    console.log('Cleaning up temp file:', filePath);
  } catch (error) {
    console.warn('Failed to cleanup temp file:', error);
  }
};
