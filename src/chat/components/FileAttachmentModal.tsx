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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import DocumentPicker, {
  type DocumentPickerResponse,
} from 'react-native-document-picker';
import {
  type MediaType,
  type IUserInfo,
  type MessageProps,
} from '../../interfaces';
import uuid from 'react-native-uuid';
import { formatSize, getAbsoluteFilePathWithName } from '../../utilities';
import Images from '../../asset';

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
    buttonTitle = 'Choose files',
    shareIcon = Images.fileSharing,
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

  const handleOutsidePress = useCallback(
    () => () => {
      setModalVisible(false);
    },
    []
  );

  const handleScroll = useCallback(
    () => () => {
      setModalVisible(false);
    },
    []
  );

  const checkPermissionAndroid = async () => {
    if (
      Platform.OS === 'android' &&
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    ) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Write External Storage Permission',
          message: 'This app needs access to your storage to download files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('WRITE_EXTERNAL_STORAGE permission denied');
        return false;
      }
      return true;
    } else {
      return true;
    }
  };

  const onSendMessage = useCallback(
    async (media: DocumentPickerResponse) => {
      try {
        const extension = media?.name?.split('.').pop() ?? 'pdf';
        const type = 'document' as MediaType;
        const id = uuid.v4();
        const user = {
          _id: userInfo?.id || '',
          ...userInfo,
        };
        const message = {
          id: id,
          _id: id,
          text: '',
          type: type,
          path: await getAbsoluteFilePathWithName(media.uri, media.name ?? ''),
          extension,
          size: formatSize(media.size),
          fileName: media.name || '',
          user: user,
        } as MessageProps;
        onSend(message);
      } catch (error) {
        console.log('error: ', error);
      }
    },
    [onSend, userInfo]
  );

  const handleDocumentPick = useCallback(async () => {
    if (!(await checkPermissionAndroid())) return;
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
      const media = result?.[0];
      if (media) {
        onSendMessage(media);
      } else {
        console.log('Something wrong.Please try again');
      }
      setModalVisible(false);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Warning', 'Document Picker was cancelled');
      } else {
        throw err;
      }
    }
  }, [onSendMessage]);

  const renderModalView = useCallback(() => {
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
  }, [
    buttonTitle,
    handleDocumentPick,
    handleScroll,
    modalButtonStyle,
    modalButtonTextStyle,
    modalDescription,
    modalDescriptionStyle,
    modalTitle,
    modalTitleStyle,
    shareIcon,
    shareIconStyle,
  ]);

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
