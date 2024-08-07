import React, { useCallback, useMemo } from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Bubble, BubbleProps } from 'react-native-gifted-chat';
import type { MessageProps } from '../../interfaces';
import { LinkPreview } from '@flyerhq/react-native-link-preview';

export interface customPreviewLinkStyles {
  customContainerStyle?: StyleProp<ViewStyle>;
  customPreviewContainerStyle?: StyleProp<ViewStyle>;
  customLinkTextStyle?: StyleProp<ViewStyle>;
  customMessagePreviewStyle?: StyleProp<ViewStyle>;
}
interface PreviewLinkProps {
  bubbleMessage: BubbleProps<MessageProps>;
  customPreviewLinkStyles?: customPreviewLinkStyles;
  customPreviewLink: (
    urls: string[],
    bubbleMessage: BubbleProps<MessageProps>
  ) => JSX.Element;
}

const urlRegex = /(https?:\/\/[^\s]+)/g;

const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
};

export const PreviewLink: React.FC<PreviewLinkProps> = (props) => {
  const { bubbleMessage, customPreviewLinkStyles, customPreviewLink } = props;
  const { currentMessage } = bubbleMessage;
  const urls = currentMessage?.text.match(urlRegex);

  const {
    customContainerStyle,
    customPreviewContainerStyle,
    customLinkTextStyle,
    customMessagePreviewStyle,
  } = customPreviewLinkStyles || {};

  const renderTextWithLinks = useCallback(
    (text: string) => {
      const parts = text.split(urlRegex);
      return parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Text
              key={index}
              onPress={() => handleLinkPress(part)}
              style={[styles.linkText, customLinkTextStyle]}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      });
    },
    [customLinkTextStyle]
  );

  const renderPreview = useCallback(
    (urlsLink: string[]) => {
      const firstUrl = urlsLink[0];

      return (
        <View
          style={[
            styles.bubbleContainer,
            customContainerStyle,
            bubbleMessage.position === 'left'
              ? styles.flexStart
              : styles.flexEnd,
          ]}
        >
          <View style={styles.bubble}>
            <Text style={[styles.messagePreview, customMessagePreviewStyle]}>
              {!!currentMessage?.text &&
                renderTextWithLinks(currentMessage.text)}
            </Text>
            {!!firstUrl && (
              <LinkPreview
                containerStyle={[
                  styles.previewContainer,
                  customPreviewContainerStyle,
                ]}
                enableAnimation
                text={firstUrl}
                renderText={() => null}
              />
            )}
          </View>
        </View>
      );
    },
    [
      bubbleMessage.position,
      currentMessage?.text,
      customContainerStyle,
      customMessagePreviewStyle,
      customPreviewContainerStyle,
      renderTextWithLinks,
    ]
  );

  if (!urls) {
    return <Bubble {...bubbleMessage} />;
  }

  return customPreviewLink
    ? customPreviewLink(urls, bubbleMessage)
    : renderPreview(urls);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bubble: {
    padding: 15,
    maxWidth: '70%',
    backgroundColor: '#e1ffc7',
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: '#d3d3d3',
    borderWidth: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  containerPreview: {
    padding: 10,
  },
  previewContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 16,
  },
  messagePreview: {
    color: 'black',
    fontSize: 16,
  },
  textPreview: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  linkText: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});
