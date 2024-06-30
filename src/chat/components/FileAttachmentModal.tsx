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
  ScrollView,
  Image,
  ViewStyle,
  StyleProp,
  ImageStyle,
  Pressable,
  Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import type { IUserInfo, MessageProps } from '../../interfaces';
import { convertExtension, getMediaTypeFromExtension } from '../../utilities';
import uuid from 'react-native-uuid';
import RNFS from 'react-native-fs';
import { formatSize } from '../../utilities/misc';

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

type IDocument = {
  uri: string;
  type: string;
  name: string;
};

export interface FileAttachmentModalRef {
  show: () => void;
  hide: () => void;
}

const FileAttachmentModal = forwardRef<
  FileAttachmentModalRef,
  FileAttachmentModalProps
>((props, ref) => {
  const {
    buttonTitle = 'Choose files',
    shareIcon = require('../../images/file-sharing.png'),
    shareIconStyle,
    modalTitle = 'Share a file',
    modalDescription = 'Choose any file from your device to send directly to the chat.',
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

  const handleScroll = () => {
    setModalVisible(false);
  };

  const onSendMessage = useCallback(
    async (media: IDocument) => {
      try {
        const extension = convertExtension(media.uri);
        const type = getMediaTypeFromExtension(media.uri);
        const fileSize = await RNFS.stat(media.uri);
        const size = formatSize(fileSize.size);
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
      const media = result[0] as IDocument;
      if (media) {
        onSendMessage(media);
      } else {
        Alert.alert('Error', 'Something wrong.Please try again');
      }
      setModalVisible(false);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('Warning', 'Document Picker was cancelled');
      } else {
        throw err;
      }
    }
  }, [onSendMessage]);

  const renderModalView = () => {
    return (
      <View style={styles.modalContainer}>
        <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
          <View style={styles.modalContent}>
            <Image
              source={shareIcon}
              style={[styles.iconStyle, shareIconStyle]}
            />
            <Text style={[styles.modalTitle, modalTitleStyle]}>
              {modalTitle}
            </Text>
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
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={modalVisible}>
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
  },
  modalContainer: {
    height: 340,
    backgroundColor: '#222222',
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
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'white',
  },
  modalDescription: {
    fontSize: 16,
    color: '#868686',
    textAlign: 'center',
    marginBottom: 45,
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
