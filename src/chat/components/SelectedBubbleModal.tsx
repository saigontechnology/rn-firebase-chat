import React from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { MessageTypes, type MessageProps } from '../../interfaces';
import VideoPlayer from '../../chat_obs/components/VideoPlayer';

interface SelectedBubbleModalProps {
  message: MessageProps | null;
  onClose: () => void;
}

const SelectedBubbleModal: React.FC<SelectedBubbleModalProps> = ({
  message,
  onClose,
}) => {
  const renderFullScreenImage = () => {
    if (!message || !message.path) return <View />;
    return (
      <TouchableOpacity style={styles.modalContainer} onPress={onClose}>
        <FastImage
          style={styles.image}
          source={{
            uri: message.path,
            priority: FastImage.priority.high,
          }}
          resizeMode={FastImage.resizeMode.contain}
        />
      </TouchableOpacity>
    );
  };

  const renderPlayVideo = () => {
    if (!message || !message.path) return <View />;
    return <VideoPlayer videoUri={message.path} />;
  };

  const renderFullScreenBubble = (messageBubble: MessageProps) => {
    switch (messageBubble.type) {
      case MessageTypes.video:
        return renderPlayVideo();
      default:
        return renderFullScreenImage();
    }
  };

  const renderCloseIcon = () => {
    return (
      <TouchableOpacity style={styles.onClose} onPress={onClose}>
        <Image
          source={require('../../images/close.png')}
          style={styles.iconClose}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={!!message} transparent={false} onRequestClose={onClose}>
      {message && renderFullScreenBubble(message)}
      {renderCloseIcon()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#323F4B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  onClose: {
    position: 'absolute',
    right: 10,
    top: 50,
  },
  iconClose: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
});

export default SelectedBubbleModal;
