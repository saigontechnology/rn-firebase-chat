import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TextStyle,
  Alert,
} from 'react-native';
import {
  Composer,
  InputToolbarProps,
  SendProps,
} from 'react-native-gifted-chat';
import { PressableIcon } from './PressableIcon';
import {
  launchImageLibrary,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import ImagePicker, { Video } from 'react-native-image-crop-picker';
import {
  animateLayout,
  convertExtension,
  getMediaTypeFromExtension,
} from '../../utilities';
import type { FileAttachmentModalRef } from './FileAttachmentModal';
import type { VoiceRecorderModalRef } from './VoiceRecorderModal';

const MAX_FILE_SIZE = 200000000; // 200MB

const ImageURL = {
  camera: require('../../images/camera.png'),
  gallery: require('../../images/gallery.png'),
  send: require('../../images/send.png'),
  chevronRight: require('../../images/chevron_right.png'),
};

const defaultLibraryOptions: ImageLibraryOptions = {
  mediaType: 'mixed',
};
export interface IInputToolbar extends InputToolbarProps<any>, SendProps<any> {
  hasCamera?: boolean;
  hasGallery?: boolean;
  onPressCamera?: () => void;
  onPressGallery?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  composeWrapperStyle?: StyleProp<ViewStyle>;
  composerTextInputStyle?: StyleProp<TextStyle>;
  customViewStyle?: StyleProp<ViewStyle>;
  cameraIcon?: string;
  galleryIcon?: string;
  iconSend?: string;
  iconStyle?: StyleProp<ImageStyle>;
  libraryOptions?: ImageLibraryOptions;
  documentRef?: FileAttachmentModalRef | null;
  renderLeftCustomView?: ({
    documentRef,
    voiceRef,
  }: {
    documentRef: FileAttachmentModalRef | null;
    voiceRef: VoiceRecorderModalRef | null;
  }) => React.ReactNode;
  renderRightCustomView?: () => React.ReactNode;
  voiceRef?: VoiceRecorderModalRef | null;
}

const InputToolbar: React.FC<IInputToolbar> = ({
  hasCamera,
  hasGallery,
  onPressCamera,
  onPressGallery,
  containerStyle,
  composeWrapperStyle,
  composerTextInputStyle,
  cameraIcon = ImageURL.camera,
  galleryIcon = ImageURL.gallery,
  iconSend = ImageURL.send,
  iconStyle,
  libraryOptions = defaultLibraryOptions,
  renderLeftCustomView,
  renderRightCustomView,
  documentRef,
  voiceRef,
  ...props
}) => {
  const { onSend, text } = props;
  const [isTyping, setIsTyping] = useState(false);

  const flattenedIconStyle = StyleSheet.flatten([
    styles.iconStyleDefault,
    iconStyle,
  ]);

  const openGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: 1,
        mediaType: 'any',
      });

      if (result?.length) {
        const file = result[0];
        if (file?.size && file?.size > MAX_FILE_SIZE) {
          Alert.alert(
            'File is too large',
            'File size should not exceed 200 MB. Please try again'
          );
          return;
        }
        const mediaType = getMediaTypeFromExtension(
          file?.path || file.sourceURL
        );
        const extension = convertExtension(file);

        onSend?.(
          {
            type: mediaType,
            path: (file?.path || file.sourceURL) ?? '',
            extension: extension,
            duration: (file as Video)?.duration || 0,
          },
          true
        );
      }
    } catch (error) {
      console.log('Error while opening gallery:');
    }
  }, [onSend]);

  const handleShowLeftView = useCallback((focus: boolean) => {
    animateLayout();
    setIsTyping(focus);
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {isTyping ? (
        <PressableIcon
          icon={ImageURL.chevronRight}
          iconStyle={flattenedIconStyle}
          onPress={() => handleShowLeftView(false)}
        />
      ) : (
        <>
          {renderLeftCustomView &&
            documentRef &&
            voiceRef &&
            renderLeftCustomView({ documentRef, voiceRef })}
          {hasCamera && (
            <PressableIcon
              icon={cameraIcon}
              iconStyle={flattenedIconStyle}
              onPress={onPressCamera}
            />
          )}
          {hasGallery && (
            <PressableIcon
              onPress={onPressGallery || openGallery}
              icon={galleryIcon}
              iconStyle={flattenedIconStyle}
            />
          )}
        </>
      )}
      <View style={[styles.composeWrapper, composeWrapperStyle]}>
        <ScrollView scrollEnabled={false}>
          <Composer
            {...props}
            textInputProps={{
              onFocus: () => handleShowLeftView(true),
              onBlur: () => handleShowLeftView(false),
              onPressIn: () => handleShowLeftView(true),
            }}
            placeholder="Aa"
            textInputStyle={[styles.textInput, composerTextInputStyle]}
          />
        </ScrollView>
      </View>
      {!!text && (
        <PressableIcon
          iconStyle={flattenedIconStyle}
          onPress={() => onSend?.({ text: text }, true)}
          icon={iconSend}
        />
      )}
      {renderRightCustomView && renderRightCustomView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    marginTop: 12,
  },
  composeWrapper: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'lightgray',
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: 'row',
    marginRight: 10,
  },
  textInput: {
    marginHorizontal: 20,
    lineHeight: 20,
  },
  marginWrapperView: {
    marginRight: 10,
  },
  iconStyleDefault: {
    width: 28,
    height: 28,
    marginHorizontal: 12,
  },
});

export default InputToolbar;
