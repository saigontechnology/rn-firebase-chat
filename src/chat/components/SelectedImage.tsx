import React from 'react';
import { Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomImage } from './CustomImage';

interface SelectedImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const SelectedImageModal: React.FC<SelectedImageModalProps> = ({
  imageUrl,
  onClose,
}) => {
  return (
    <Modal visible={!!imageUrl} transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalContainer} onPress={onClose}>
        <CustomImage
          style={styles.image}
          source={{
            uri: imageUrl,
          }}
          resizeMode="contain"
        />
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
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SelectedImageModal;
