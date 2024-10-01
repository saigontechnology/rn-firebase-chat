import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageText } from 'react-native-gifted-chat';
import type { MessageProps } from '../../../interfaces';
import { LinkPreview } from './LinkPreview';

type PreviewLinkProps = {
  link?: string;
  currentMessage?: MessageProps;
  customPreviewLink?: (link: string) => JSX.Element;
  iconDefault?: string;
};

export const LinkCard: React.FC<PreviewLinkProps> = (props) => {
  const { currentMessage, link, customPreviewLink } = props;
  const urls = currentMessage?.text.match(/(https?:\/\/[^\s]+)/g);

  const renderPreview = (url: string, index: number = 0) => {
    return <LinkPreview key={index} enableAnimation text={url} />;
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
        {urls.map((item, index) => (
          <LinkPreview
            key={index}
            containerStyle={styles.previewContainer}
            enableAnimation
            text={item}
          />
        ))}
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
  textPreview: {
    color: 'blue',
    textDecorationLine: 'underline',
  },

  renderImage: {
    width: 100,
    height: 100,
    backgroundColor: 'green',
    position: 'absolute',
    left: 8,
    top: 20,
  },
  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: 'stretch',
  },
  viewTitle: {
    marginLeft: 100,
  },
  title: {
    color: 'black',
    fontWeight: 'bold',
  },
  viewDetail: {
    marginLeft: 100,
    marginTop: 10,
  },
  textDetails: {
    color: 'black',
  },
});
