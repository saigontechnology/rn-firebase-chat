import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageTextProps, MessageText } from 'react-native-gifted-chat';
import type { MessageProps } from '../../interfaces';
import { LinkPreview } from '@flyerhq/react-native-link-preview';

export const PreviewLink: React.FC<MessageTextProps<MessageProps>> = (
  props
) => {
  const { currentMessage } = props;
  const url = currentMessage?.text.match(/(https?:\/\/[^\s]+)/g);
  if (url) {
    return (
      <View style={styles.containerPreview}>
        <Text>{currentMessage?.text}</Text>
        {url.map((item, index) => (
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
});
