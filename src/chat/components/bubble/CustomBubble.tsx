import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble } from 'react-native-gifted-chat';
import {
  CustomImageVideoBubble,
  CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';
import ViewUnaread from '../ViewUnRead';

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
  userUnreadMessage: boolean;
  customContainerStyle?: StyleProp<ViewStyle>;
  customTextStyle?: StyleProp<ViewStyle>;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
}

export const CustomBubble: React.FC<CustomBubbleProps> = ({
  bubbleMessage,
  position,
  customImageVideoBubbleProps,
  onSelectedMessage,
  userUnreadMessage,
  customContainerStyle,
  customTextStyle,
  unReadSeenMessage,
  unReadSentMessage,
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
      <ViewUnaread
        userUnreadMessage={userUnreadMessage}
        customContainerStyle={customContainerStyle}
        customTextStyle={customTextStyle}
        unReadSentMessage={unReadSentMessage}
        unReadSeenMessage={unReadSeenMessage}
      />
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
});
