import { useCallback, useState, useRef } from 'react';
import { Keyboard, Alert, Vibration, Platform } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import {
  launchImageLibrary,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import { cameraRef } from './CameraView';
import { MessageTypes } from '../../interfaces';
import {
  convertExtension,
  validateFileSize,
  validateImageFormat,
  validateVideoFormat,
  getErrorMessage,
  formatFileSize,
} from './utilities';
import { CAMERA_CONFIG } from './constants';
import type {
  ImagePickerValue,
  CameraHookConfig,
  CameraError,
  CameraAnalytics,
  MediaProcessingOptions,
} from './interface';

// Enhanced camera hook with modern features
export const useEnhancedCamera = (config?: CameraHookConfig, analytics?: CameraAnalytics) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<CameraError | null>(null);
  const lastOperationRef = useRef<string>('');

  const defaultConfig: CameraHookConfig = {
    enableAutoPermissionRequest: true,
    enableHapticFeedback: true,
    enableSoundEffects: false,
    compressionQuality: CAMERA_CONFIG.PHOTO_QUALITY,
    thumbnailQuality: 0.3,
    maxFileSize: CAMERA_CONFIG.MAX_FILE_SIZE,
    ...config,
  };

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    analytics?.trackEvent(event as any, properties);
  }, [analytics]);

  const showError = useCallback((error: CameraError) => {
    setLastError(error);
    Alert.alert('Camera Error', error.message);
    trackEvent('error_occurred', { errorType: error.type, message: error.message });
  }, [trackEvent]);

  const hapticFeedback = useCallback(() => {
    if (defaultConfig.enableHapticFeedback && Platform.OS === 'ios') {
      Vibration.vibrate(50);
    }
  }, [defaultConfig.enableHapticFeedback]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    if (hasPermission) return true;

    if (!defaultConfig.enableAutoPermissionRequest) {
      const error: CameraError = {
        type: 'permission-denied',
        message: getErrorMessage('PERMISSION_DENIED'),
      };
      showError(error);
      return false;
    }

    trackEvent('permission_requested');

    try {
      const granted = await requestPermission?.();
      if (granted) {
        trackEvent('permission_granted');
        return true;
      } else {
        trackEvent('permission_denied');
        const error: CameraError = {
          type: 'permission-denied',
          message: getErrorMessage('PERMISSION_DENIED'),
        };
        showError(error);
        return false;
      }
    } catch (error) {
      const cameraError: CameraError = {
        type: 'unknown',
        message: 'Failed to request camera permission',
      };
      showError(cameraError);
      return false;
    }
  }, [hasPermission, requestPermission, defaultConfig.enableAutoPermissionRequest, showError, trackEvent]);

  const onPressCamera = useCallback(async () => {
    lastOperationRef.current = 'camera';
    hapticFeedback();

    const hasPermissionGranted = await requestCameraPermission();
    if (!hasPermissionGranted) return;

    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      // Small delay to let keyboard dismiss
      setTimeout(() => {
        cameraRef?.current?.show();
        trackEvent('camera_opened');
      }, 300);
      return;
    }

    cameraRef?.current?.show();
    trackEvent('camera_opened');
  }, [requestCameraPermission, hapticFeedback, trackEvent]);

  const validateFile = useCallback((file: any): CameraError | null => {
    // File size validation
    if (file.fileSize && !validateFileSize(file.fileSize)) {
      return {
        type: 'file-too-large',
        message: `File size (${formatFileSize(file.fileSize)}) exceeds the maximum allowed size of ${formatFileSize(defaultConfig.maxFileSize!)}`,
      };
    }

    // Format validation
    const isVideo = file.type?.startsWith('video');
    const isValidFormat = isVideo
      ? validateVideoFormat(file.fileName)
      : validateImageFormat(file.fileName);

    if (!isValidFormat) {
      return {
        type: 'unsupported-format',
        message: getErrorMessage('UNSUPPORTED_FORMAT'),
      };
    }

    return null;
  }, [defaultConfig.maxFileSize]);

  const processMedia = useCallback(async (
    file: any,
    options?: MediaProcessingOptions
  ): Promise<ImagePickerValue | null> => {
    setIsProcessing(true);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        showError(validationError);
        return null;
      }

      const mediaType = file?.type?.startsWith('image')
        ? MessageTypes.image
        : MessageTypes.video;

      const extension = convertExtension(file);

      let processedPath = file?.uri ?? '';

      // Apply processing options if provided
      if (options?.compress && mediaType === MessageTypes.image) {
        // Image compression would be implemented here
        // processedPath = await compressImage(processedPath, defaultConfig.compressionQuality);
      }

      if (options?.generateThumbnail && mediaType === MessageTypes.video) {
        // Thumbnail generation would be implemented here
        // await generateVideoThumbnail(processedPath);
      }

      return {
        type: mediaType,
        path: processedPath,
        extension: extension,
      };
    } catch (error) {
      const cameraError: CameraError = {
        type: 'unknown',
        message: 'Failed to process media file',
      };
      showError(cameraError);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [validateFile, showError, defaultConfig.compressionQuality]);

  const onPressGallery = useCallback(async (
    options?: MediaProcessingOptions
  ): Promise<ImagePickerValue | void> => {
    lastOperationRef.current = 'gallery';
    hapticFeedback();
    setIsProcessing(true);

    try {
      const libraryOptions: ImageLibraryOptions = {
        mediaType: 'mixed',
        quality: defaultConfig.compressionQuality as any,
        maxWidth: CAMERA_CONFIG.MAX_PHOTO_WIDTH,
        maxHeight: CAMERA_CONFIG.MAX_PHOTO_HEIGHT,
        includeBase64: false,
        includeExtra: true,
      };

      const result: ImagePickerResponse = await launchImageLibrary(libraryOptions);

      if (result?.assets && result.assets.length > 0) {
        const file = result.assets[0];

        trackEvent('media_selected', {
          type: file?.type?.startsWith('image') ? 'image' : 'video',
          fileSize: file?.fileSize,
          source: 'gallery',
        });

        const processedResult = await processMedia(file, options);
        return processedResult || undefined;
      }

      return;
    } catch (error) {
      const cameraError: CameraError = {
        type: 'unknown',
        message: 'Error while opening gallery',
      };
      showError(cameraError);
      console.error('Error while opening gallery:', error);
      return;
    } finally {
      setIsProcessing(false);
    }
  }, [hapticFeedback, defaultConfig.compressionQuality, processMedia, showError, trackEvent]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const getLastOperation = useCallback(() => {
    return lastOperationRef.current;
  }, []);

  // Return enhanced hook interface
  return {
    // Core functions
    onPressCamera,
    onPressGallery,

    // Enhanced functions
    processMedia,
    requestCameraPermission,

    // State
    hasPermission,
    isProcessing,
    lastError,

    // Utilities
    clearError,
    getLastOperation,
    validateFile,

    // Configuration
    config: defaultConfig,
  };
};

// Backward compatibility export
export const useCamera = () => {
  const enhanced = useEnhancedCamera();
  return {
    onPressCamera: enhanced.onPressCamera,
    onPressGallery: enhanced.onPressGallery,
  };
};
