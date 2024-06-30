import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  ViewStyle,
  StyleProp,
  ImageStyle,
  Text,
  TextProps,
  NativeEventEmitter,
  NativeModules,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { MessageProps } from '../../../interfaces';
import OpenFile from 'react-native-doc-viewer';
import RNFS from 'react-native-fs';

export interface CustomDocumentBubbleProps {
  message: MessageProps;
  position: 'left' | 'right';
  icon?: string;
  bubbleContainerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextProps>;
  textSizeStyle?: StyleProp<TextProps>;
  doucmentStyle?: StyleProp<ViewStyle>;

  renderCustomDocument?: () => React.ReactNode;
}

export const CustomDocumentBubble: React.FC<CustomDocumentBubbleProps> = ({
  position,
  message,
  icon = require('../../../images/document.png'),
  iconStyle,
  bubbleContainerStyle,
  buttonStyle,
  doucmentStyle,
  textStyle,
  textSizeStyle,
  renderCustomDocument,
}) => {
  const [loading, setLoading] = useState(false);
  const doneEvent = () => {
    console.log('Closing QuickLook viewer');
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.RNReactNativeDocViewer
    );

    const doneButtonListener = eventEmitter.addListener(
      'DoneButtonEvent',
      doneEvent
    );

    return () => {
      doneButtonListener.remove();
    };
  }, []);

  const handleDocumentsPress = useCallback(async () => {
    setLoading(true);
    if (!message || !message.path) return;
    try {
      const downloadDest = `${RNFS.DocumentDirectoryPath}/${message.name}`;

      const fileExists = await RNFS.exists(downloadDest);

      if (!fileExists) {
        const result = await RNFS.downloadFile({
          fromUrl: message.path,
          toFile: downloadDest,
          cacheable: true,
        }).promise;

        if (result.statusCode !== 200) {
          throw new Error('Failed to download document');
        }
      }

      OpenFile.openDoc(
        [
          {
            url: downloadDest,
            fileNameOptional: message.name,
            fileName: message.name,
            fileType: message.type,
            cache: true,
          },
        ],
        (error_, url) => {
          console.log('url: ', url);
          if (error_) {
            Alert.alert('Error', 'Failed to open document');
          }
          setLoading(false);
        }
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to download document');
      setLoading(false);
    }
  }, [message]);

  const renderDocument = () => {
    return (
      <View style={[styles.wrapper, doucmentStyle]}>
        {loading ? (
          <ActivityIndicator color={'green'} animating size="small" />
        ) : (
          <Image source={icon} style={[styles.icon, iconStyle]} />
        )}
        <View style={[styles.groupText]}>
          <Text style={[styles.text, textStyle]}>{message.name}</Text>
          <Text style={[styles.size, textSizeStyle]}>{message.size}</Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.bubbleContainer,
        bubbleContainerStyle,
        position === 'left' ? styles.flexStart : styles.flexEnd,
      ]}
    >
      <Pressable onPress={handleDocumentsPress} style={buttonStyle}>
        {renderCustomDocument ? renderCustomDocument() : renderDocument()}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  icon: {
    width: 35,
    height: 35,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  groupText: {
    marginLeft: 10,
  },
  text: {
    fontSize: 15,
    color: 'black',
    fontWeight: 'bold',
  },
  size: {
    fontSize: 13,
    color: 'gray',
    marginTop: 5,
  },
});
