import React, { useCallback } from 'react';
import {
  Image,
  ImageRequireSource,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { MessageTypes } from '../../../interfaces';
import Images from '../../../asset';
import { VideoRef } from 'react-native-video';
import { VideoPlayer } from './VideoPlayer';

interface SelectedViewModalProps {
  url?: string;
  type?: string;
  onClose: () => void;
  iconClose?: ImageRequireSource;
  customSlider?: (
    currentTime: number,
    duration: number,
    paused: boolean,
    videoRef: VideoRef | null
  ) => React.ReactNode;
}

export const SelectedViewModal: React.FC<SelectedViewModalProps> = ({
  url,
  type,
  onClose,
  iconClose,
  customSlider,
}) => {
  const renderPlayVideo = useCallback(() => {
    return (
      !!url && (
        <View style={styles.contain}>
          <VideoPlayer customSlider={customSlider} videoUri={url} />
        </View>
      )
    );
  }, [customSlider, url]);

  const renderImage = useCallback(
    () => (
      <FastImage
        style={styles.image}
        source={{
          uri: url ?? Images.placeHolder,
          priority: FastImage.priority.high,
        }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
    [url]
  );

  return (
    <Modal visible={!!url} transparent={true}>
      <View style={styles.modalContainer}>
        {type === MessageTypes.video ? renderPlayVideo() : renderImage()}
      </View>
      <TouchableOpacity style={styles.onClose} onPress={onClose}>
        <Image source={iconClose ?? Images.close} style={styles.iconClose} />
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onClose: {
    position: 'absolute',
    right: 10,
    top: 50,
  },
  image: {
    width: '100%',
    height: '80%',
  },
  iconClose: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
  contain: {
    flex: 1,
  },
});
