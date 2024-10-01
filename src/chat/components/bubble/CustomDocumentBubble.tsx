import React, { useCallback } from 'react';
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
  Share,
} from 'react-native';
import type { MessageProps } from '../../../interfaces';
import Images from '../../../asset';

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

  renderCustomDocument?: (
    message: MessageProps,
    position: 'left' | 'right'
  ) => React.ReactNode;
}

export const CustomDocumentBubble: React.FC<CustomDocumentBubbleProps> = ({
  position,
  message,
  icon = Images.document,
  iconStyle,
  bubbleContainerStyle,
  buttonStyle,
  doucmentStyle,
  textStyle,
  textSizeStyle,
  renderCustomDocument,
}) => {
  const handleDocumentsPress = useCallback(async () => {
    if (!message || !message.path) return;
    try {
      await Share.share({
        url: message.path,
        title: message.fileName,
        message: message.fileName,
      });
    } catch (err) {
      console.log('Error, Failed to download document');
    }
  }, [message]);

  const renderDocument = () => {
    return (
      <View style={[styles.wrapper, doucmentStyle]}>
        <Image source={icon} style={[styles.icon, iconStyle]} />
        <View style={[styles.groupText]}>
          <Text style={[styles.text, textStyle]}>{message.fileName}</Text>
          <Text style={[styles.size, textSizeStyle]}>{message.size}</Text>
        </View>
      </View>
    );
  };

  if (renderCustomDocument) {
    renderCustomDocument(message, position);
  }

  return (
    <View
      style={[
        styles.bubbleContainer,
        bubbleContainerStyle,
        position === 'left' ? styles.flexStart : styles.flexEnd,
      ]}
    >
      <Pressable onPress={handleDocumentsPress} style={buttonStyle}>
        {renderDocument()}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    paddingHorizontal: 5,
    marginTop: 5,
    flex: 1,
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
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
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
