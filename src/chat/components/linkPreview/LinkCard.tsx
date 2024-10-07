import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageText } from 'react-native-gifted-chat';
import type { MessageProps } from '../../../interfaces';
import { LinkPreview, LinkPreviewProps } from './LinkPreview';

interface LinkCardProps extends LinkPreviewProps {
  link?: string;
  currentMessage?: MessageProps;
  customPreviewLink?: (link: string) => JSX.Element;
  iconDefault?: string;
}

export type LinkCardPropsWithoutText = Omit<LinkCardProps, 'text'>;

export const LinkCard: React.FC<LinkCardPropsWithoutText> = (props) => {
  const { currentMessage, link, customPreviewLink } = props;
  const urls = currentMessage?.text.match(/(https?:\/\/[^\s]+)/g);

  const renderPreview = (url: string, index: number = 0) => {
    return (
      <LinkPreview
        key={index}
        enableAnimation
        text={url}
        thumbnailResizeMode="cover"
        thumbnailStyle={styles.thumbnail}
        textContainerStyle={styles.textContainer}
        metadataContainerStyle={styles.metadataContainer}
        metadataTextContainerStyle={styles.metadataTextContainer}
        contentStyle={styles.content}
        {...props}
      />
    );
  };

  if (customPreviewLink) {
    if (link) return customPreviewLink(link);
  }

  if (link) {
    return renderPreview(link);
  }

  if (urls) {
    return (
      <View style={styles.containerPreview}>
        <Text>{currentMessage?.text}</Text>
        {urls.map((item, index) => renderPreview(item, index))}
      </View>
    );
  }
  return <MessageText {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerPreview: {
    padding: 10,
  },
  previewContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginTop: 16,
  },
  thumbnail: {
    width: 140,
    height: 80,
    alignSelf: 'flex-start',
  },
  textContainer: {
    flexShrink: 1,
    marginLeft: 16,
    marginVertical: 0,
  },
  metadataContainer: {
    marginTop: 0,
  },
  metadataTextContainer: {
    flex: 0,
  },
  content: {
    flexDirection: 'row',
  },
});
