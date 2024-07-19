import React, { Suspense } from 'react';
import {
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const LazyFastImage = React.lazy(() => import('react-native-fast-image'));

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
        <Suspense fallback={<ActivityIndicator size="large" color="#0000ff" />}>
          <LazyFastImage
            style={styles.image}
            source={{
              uri: imageUrl,
              priority: 'high',
            }}
            resizeMode={'contain'}
          />
        </Suspense>
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
