import { MessageTypes } from '../../interfaces';

export const initialMediaState = {
  type: MessageTypes.image,
  path: '',
};

export const CAPTURE_BUTTON_SIZE = 78;

// Enhanced Camera Configuration
export const CAMERA_CONFIG = {
  // Photo settings
  PHOTO_QUALITY: 0.8,
  MAX_PHOTO_WIDTH: 1920,
  MAX_PHOTO_HEIGHT: 1080,

  // Video settings
  VIDEO_QUALITY: 'hd1280x720' as const,
  MAX_VIDEO_DURATION: 60, // seconds
  VIDEO_BITRATE: 2000000, // 2Mbps

  // UI settings
  TIMER_UPDATE_INTERVAL: 1000,
  CAMERA_ANIMATION_DURATION: 300,
  FLASH_ANIMATION_DURATION: 200,

  // File settings
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'heic'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'avi'],
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
};

// Camera permissions and error messages
export const CAMERA_MESSAGES = {
  PERMISSION_DENIED: 'Camera permission is required to take photos and videos',
  CAMERA_UNAVAILABLE: 'Camera is not available on this device',
  RECORDING_ERROR: 'Failed to record video. Please try again.',
  PHOTO_ERROR: 'Failed to take photo. Please try again.',
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  UNSUPPORTED_FORMAT: 'File format is not supported.',
};

// Enhanced UI constants
export const UI_CONSTANTS = {
  HEADER_HEIGHT: 80,
  BOTTOM_BAR_HEIGHT: 120,
  BUTTON_SIZE: 60,
  ICON_SIZE: 24,
  BORDER_RADIUS: 12,
  ANIMATION_SPRING_CONFIG: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },
};
