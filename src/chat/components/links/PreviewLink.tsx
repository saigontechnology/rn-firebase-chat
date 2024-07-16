import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MessageText } from 'react-native-gifted-chat';
import type { MessageProps } from '../../../interfaces';
import { LinkPreview } from '@flyerhq/react-native-link-preview';

type PreviewLinkProps = {
  link?: string;
  currentMessage?: MessageProps;
  customPreviewLink?: (link: string) => JSX.Element;
  iconDefault?: string;
};

export const PreviewLink: React.FC<PreviewLinkProps> = (props) => {
  const { currentMessage, link, customPreviewLink } = props;
  const urls = currentMessage?.text.match(/(https?:\/\/[^\s]+)/g);

  const renderPreview = (url: string, index: number = 0) => {
    return (
      <LinkPreview
        key={index}
        enableAnimation
        text={url}
        renderImage={(image) => {
          return (
            <View style={styles.renderImage}>
              <Image style={styles.imageStyle} source={{ uri: image.url }} />
            </View>
          );
        }}
        renderTitle={(title) => (
          <View style={styles.viewTitle}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        renderText={(text) => (
          <View style={styles.viewTitle}>
            <Text style={styles.textPreview}>{text}</Text>
          </View>
        )}
        renderDescription={(description) => (
          <View style={styles.viewDetail}>
            <Text style={styles.textDetails}>{description}</Text>
          </View>
        )}
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
        {urls.map((item, index) => (
          <LinkPreview
            key={index}
            containerStyle={styles.previewContainer}
            enableAnimation
            text={item}
            renderText={(text) => (
              <Text style={styles.textPreview}>{text}</Text>
            )}
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
