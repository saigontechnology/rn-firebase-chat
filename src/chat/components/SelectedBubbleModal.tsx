import React from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import type { MessageProps } from '../../interfaces';
import VideoPlayer from '../../chat_obs/components/VideoPlayer';

interface SelectedBubbleModalProps {
  message: MessageProps | null;
  onClose: () => void;
}

const HIT_SLOP = { top: 16, left: 16, bottom: 16, right: 16 };

const SelectedBubbleModal: React.FC<SelectedBubbleModalProps> = ({
  message,
  onClose,
}) => {
  const renderPlayVideo = () => {
    if (!message || !message.path) return <View />;
    return <VideoPlayer videoUri={message.path} />;
  };

  const renderCloseIcon = () => {
    return (
      <SafeAreaView style={styles.root}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  if (message?.type === 'image') {
    return (
      <ImageView
        images={[{ uri: message?.path }]}
        imageIndex={0}
        backgroundColor="#323F4B"
        visible={!!message?.path}
        onRequestClose={onClose}
        presentationStyle="fullScreen"
      />
    );
  }

  return (
    <Modal visible={!!message} transparent={false} onRequestClose={onClose}>
      {message && renderPlayVideo()}
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
  root: {
    right: 0,
    position: 'absolute',
    alignItems: 'flex-end',
  },
  closeButton: {
    marginRight: 8,
    marginTop: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#00000077',
  },
  closeText: {
    lineHeight: 22,
    fontSize: 19,
    textAlign: 'center',
    color: '#FFF',
    includeFontPadding: false,
  },
});

export default SelectedBubbleModal;
