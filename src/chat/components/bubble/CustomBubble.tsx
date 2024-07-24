import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble } from 'react-native-gifted-chat';
import {
  CustomImageVideoBubble,
  CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
  userUnreadMessage: boolean;
}

export const CustomBubble: React.FC<CustomBubbleProps> = ({
  bubbleMessage,
  position,
  customImageVideoBubbleProps,
  onSelectedMessage,
  userUnreadMessage,
}) => {
  const styleBuble = {
    left: { backgroundColor: 'transparent' },
    right: { backgroundColor: 'transparent' },
  };

  const renderBubble = (currentMessage: MessageProps) => {
    const isMyLatestMessage =
      !Object.keys(bubbleMessage.nextMessage ?? {}).length &&
      position === 'right';
    const ViewRead = isMyLatestMessage && (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {userUnreadMessage ? 'Sent' : 'Seen'}
        </Text>
      </View>
    );

    switch (currentMessage?.type) {
      case MessageTypes.image:
      case MessageTypes.video:
        return (
          <View>
            <Bubble
              {...bubbleMessage}
              renderCustomView={() =>
                currentMessage && (
                  <CustomImageVideoBubble
                    {...customImageVideoBubbleProps}
                    message={currentMessage}
                    onSelectImgVideoUrl={(message) => {
                      console.log('message: ', message);
                      //TODO: handle image/video press
                    }}
                    position={position}
                  />
                )
              }
              wrapperStyle={styleBuble}
            />
            {ViewRead}
          </View>
        );

      default: {
        return (
          <View>
            <Bubble {...bubbleMessage} />
            {ViewRead}
          </View>
        );
      }
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
  statusContainer: {
    backgroundColor: '#a9a9a9',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 14,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
  },
});
