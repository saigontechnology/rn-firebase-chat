import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import DocumentPicker, {
  type DocumentPickerResponse,
} from 'react-native-document-picker';
import uuid from 'react-native-uuid';
import { formatSize, getAbsoluteFilePathWithName } from '../../utilities';
import { type MediaType, type MessageProps } from '../../interfaces';
import { useChatContext } from '../../hooks';

interface FileAttachmentProps {
  onSend: (message: MessageProps) => void;
}

export interface FileAttachmentRef {
  pickDocument: () => Promise<void>;
}

const FileAttachment = forwardRef<FileAttachmentRef, FileAttachmentProps>(
  ({ onSend }, ref) => {
    const { userInfo } = useChatContext();

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
            path: await getAbsoluteFilePathWithName(
              media.uri,
              media.name ?? ''
            ),
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
          console.log('Something went wrong. Please try again.');
        }
      } catch (err) {
        if (DocumentPicker.isCancel(err)) {
          console.log('Document Picker was cancelled');
        } else {
          throw err;
        }
      }
    }, [onSendMessage]);

    useImperativeHandle(ref, () => ({
      pickDocument: handleDocumentPick,
    }));

    return null;
  }
);

export default FileAttachment;
