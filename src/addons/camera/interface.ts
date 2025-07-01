import { ImageSourcePropType } from 'react-native';
import { MessageTypes } from 'rn-firebase-chat';

export type OnOffType = 'off' | 'on';
export type FrontBackType = 'front' | 'back';

export type IconPaths = {
  close?: ImageSourcePropType;
  send?: ImageSourcePropType;
  cameraChange?: ImageSourcePropType;
  flashOn?: ImageSourcePropType;
  flashOff?: ImageSourcePropType;
  back?: ImageSourcePropType;
};

export type ImagePickerValue = {
  type: MessageTypes.image | MessageTypes.video;
  path: string;
  extension: string;
};

export interface CameraViewMethods {
  show: () => void;
  hide: () => void;
}

// Enhanced camera configuration types
export interface CameraSettings {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  enableHighQualityModeWhenRecording?: boolean;
  enableBufferCompression?: boolean;
}

export interface VideoSettings {
  quality: 'low' | 'medium' | 'high' | 'hd1280x720' | 'hd1920x1080';
  maxDuration?: number;
  bitrate?: number;
  frameRate?: number;
}

export interface CameraCapabilities {
  hasFlash: boolean;
  hasTorch: boolean;
  canSwitchBetweenCameras: boolean;
  supportedVideoQualities: VideoSettings['quality'][];
  maxZoom: number;
  minZoom: number;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  orientation?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface EnhancedImagePickerValue extends ImagePickerValue {
  metadata?: MediaMetadata;
  thumbnail?: string;
  isCompressed?: boolean;
}

// Camera error types
export type CameraErrorType =
  | 'permission-denied'
  | 'camera-unavailable'
  | 'recording-failed'
  | 'photo-failed'
  | 'file-too-large'
  | 'unsupported-format'
  | 'storage-full'
  | 'unknown';

export interface CameraError {
  type: CameraErrorType;
  message: string;
  code?: string;
}

// Advanced camera hook configuration
export interface CameraHookConfig {
  enableAutoPermissionRequest?: boolean;
  enableHapticFeedback?: boolean;
  enableSoundEffects?: boolean;
  compressionQuality?: number;
  thumbnailQuality?: number;
  maxFileSize?: number;
}

// Media processing options
export interface MediaProcessingOptions {
  compress?: boolean;
  generateThumbnail?: boolean;
  watermark?: {
    text?: string;
    image?: ImageSourcePropType;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  filters?: string[]; // Array of filter names
}

// Camera analytics events
export type CameraAnalyticsEvent =
  | 'camera_opened'
  | 'photo_taken'
  | 'video_started'
  | 'video_stopped'
  | 'camera_closed'
  | 'permission_requested'
  | 'permission_granted'
  | 'permission_denied'
  | 'error_occurred';

export interface CameraAnalytics {
  trackEvent: (event: CameraAnalyticsEvent, properties?: Record<string, any>) => void;
}
