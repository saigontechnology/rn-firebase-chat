import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble } from 'react-native-gifted-chat';
import {
  CustomImageBubble,
  CustomImageVideoBubbleProps,
  CustomVideoBubble,
} from '.';

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
}

export const CustomBubble: React.FC<CustomBubbleProps> = ({
  bubbleMessage,
  position,
  customImageVideoBubbleProps,
  onSelectedMessage,
}) => {
  const styleBubble = {
    left: { backgroundColor: 'transparent' },
    right: { backgroundColor: 'transparent' },
  };

  const renderBubble = (currentMessage: MessageProps) => {
    switch (currentMessage?.type) {
      case MessageTypes.image:
        return (
          <Bubble
            {...bubbleMessage}
            renderCustomView={() =>
              currentMessage && (
                <CustomImageBubble
                  {...customImageVideoBubbleProps}
                  message={currentMessage}
                  onSelectImgVideoUrl={(message) => {
                    console.log('message: ', message);
                    //TODO: handle image press
                  }}
                  position={position}
                />
              )
            }
            wrapperStyle={styleBubble}
          />
        );
      case MessageTypes.video:
        return (
          <Bubble
            {...bubbleMessage}
            renderCustomView={() =>
              currentMessage && (
                <CustomVideoBubble
                  {...customImageVideoBubbleProps}
                  message={currentMessage}
                  onSelectImgVideoUrl={(message) => {
                    console.log('message: ', message);
                    //TODO: handle video press
                  }}
                  position={position}
                />
              )
            }
            wrapperStyle={styleBubble}
          />
        );

      default:
        return <Bubble {...bubbleMessage} />;
    }
  };

  return (
    <View style={styles.container}>
      {bubbleMessage.currentMessage &&
        renderBubble(bubbleMessage.currentMessage)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
