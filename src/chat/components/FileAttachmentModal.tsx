import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
  Image,
  ViewStyle,
  StyleProp,
  ImageStyle,
  Pressable,
  Alert,
} from 'react-native';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import type { IUserInfo, MessageProps } from '../../interfaces';
import { convertExtension, getMediaTypeFromExtension } from '../../utilities';
import uuid from 'react-native-uuid';
import RNFS from 'react-native-fs';
import { formatSize } from '../../utilities/misc';

const MAX_FILE_SIZE = 200000000; // 200MB

interface FileAttachmentModalProps {
  isVisible?: boolean;
  buttonTitle?: string;
  shareIcon?: number;
  shareIconStyle?: StyleProp<ImageStyle>;
  modalTitle?: string;
  modalDescription?: string;
  modalTitleStyle?: StyleProp<ViewStyle>;
  modalDescriptionStyle?: StyleProp<ViewStyle>;
  modalButtonStyle?: StyleProp<ViewStyle>;
  modalButtonTextStyle?: StyleProp<ViewStyle>;
  onSend: (message: MessageProps) => void;
  userInfo?: IUserInfo | null;
}

export interface FileAttachmentModalRef {
  show: () => void;
  hide: () => void;
}

const FileAttachmentModal = forwardRef<
  FileAttachmentModalRef,
  FileAttachmentModalProps
>((props, ref) => {
  const {
    buttonTitle = 'Select file',
    shareIcon = require('../../images/file-sharing.png'),
    shareIconStyle,
    modalTitle = 'Share a file',
    modalDescription = 'Choose any file from your device to send directly to the chat.\n(Max size: 200 MB)',
    modalTitleStyle,
    modalDescriptionStyle,
    modalButtonStyle,
    modalButtonTextStyle,
    userInfo,
    onSend,
  } = props;

  const [modalVisible, setModalVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    show: () => setModalVisible(true),
    hide: () => setModalVisible(false),
  }));

  const handleOutsidePress = () => {
    setModalVisible(false);
  };

  const onSendMessage = useCallback(
    async (media: DocumentPickerResponse) => {
      try {
        const extension = convertExtension(media.uri);
        const type = getMediaTypeFromExtension(media.uri);
        const size = formatSize(media.size || 0);
        const id = uuid.v4();
        const message = {
          id: id,
          _id: id,
          type: type,
          path: media.uri,
          extension,
          size,
          name: media.name,
        } as MessageProps;
        const user = {
          _id: userInfo?.id || '',
          ...userInfo,
        };
        message.user = user;
        onSend(message);
      } catch (error) {
        console.log('error: ', error);
      }
    },
    [onSend, userInfo]
  );

  const handleDocumentPick = useCallback(async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.zip,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.pptx,
          DocumentPicker.types.ppt,
          DocumentPicker.types.xls,
          DocumentPicker.types.xlsx,
        ],
      });
      const media = result[0] as DocumentPickerResponse;
      if (media && media.size) {
        if (media.size > MAX_FILE_SIZE) {
          setModalVisible(false);
          Alert.alert(
            'File is too large',
            'File size should not exceed 200 MB. Please try again'
          );
          return;
        }
        if (media.uri.startsWith('content://')) {
          const destPath = `${RNFS.DocumentDirectoryPath}/${media.name}`;
          await RNFS.copyFile(media.uri, destPath);
          media.uri = destPath;
        }
        onSendMessage(media);
      } else {
        Alert.alert('Error', 'Something wrong. Please try again');
      }
      setModalVisible(false);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        setModalVisible(false);
        // Alert.alert('Warning', 'Document Picker was cancelled');
      } else {
        throw err;
      }
    }
  }, [onSendMessage]);

  const renderModalView = () => {
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image
            source={shareIcon}
            style={[styles.iconStyle, shareIconStyle]}
          />
          <Text style={[styles.modalTitle, modalTitleStyle]}>{modalTitle}</Text>
          <Text style={[styles.modalDescription, modalDescriptionStyle]}>
            {modalDescription}
          </Text>
          <TouchableOpacity
            onPress={handleDocumentPick}
            style={[styles.modalButton, modalButtonStyle]}
          >
            <Text style={[styles.modalButtonText, modalButtonTextStyle]}>
              {buttonTitle}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal animationType="none" transparent={true} visible={modalVisible}>
      <Pressable style={styles.overlay} onPress={handleOutsidePress}>
        {renderModalView()}
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: 340,
    backgroundColor: '#323F4B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalContent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  iconStyle: {
    width: 50,
    height: 50,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'white',
  },
  modalDescription: {
    fontSize: 16,
    color: '#CBD2D9',
    textAlign: 'center',
    marginBottom: 36,
  },
  modalButton: {
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
  },
  plusIcon: {
    width: 30,
    height: 30,
  },
});

export default FileAttachmentModal;
