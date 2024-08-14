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
