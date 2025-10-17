import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble } from 'react-native-gifted-chat';
import type { BubbleProps } from 'react-native-gifted-chat/lib/Bubble/types';
import {
  CustomImageVideoBubble,
  CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';
import MessageStatus from '../MessageStatus';

interface CustomBubbleProps {
  bubbleMessage: BubbleProps<MessageProps>;
  position: 'left' | 'right';
  customImageVideoBubbleProps?: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
  userUnreadMessage: boolean;
  customContainerStyle?: StyleProp<ViewStyle>;
  customTextStyle?: StyleProp<ViewStyle>;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
  messageStatusEnable: boolean;
  customMessageStatus?: (hasUnread: boolean) => React.JSX.Element;
  customBubbleWrapperStyle?: StyleProp<ViewStyle>;
}

export const CustomBubble: React.FC<CustomBubbleProps> = ({
  bubbleMessage,
  position,
  customImageVideoBubbleProps,
  userUnreadMessage,
  customContainerStyle,
  customTextStyle,
  unReadSeenMessage,
  unReadSentMessage,
  messageStatusEnable,
  customMessageStatus,
  customBubbleWrapperStyle,
}) => {
  const styleBubble = {
    left: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderBottomLeftRadius: 2,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    right: {
      backgroundColor: '#7cb518',
      borderRadius: 16,
      borderBottomRightRadius: 2,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
  };

  const textStyle = {
    left: {
      color: '#1F1F1F',
      fontSize: 16,
      lineHeight: 20,
    },
    right: {
      color: '#FFFFFF',
      fontSize: 16,
      lineHeight: 20,
    },
  };

  const containerStyle = {
    left: {
      marginRight: 8,
    },
    right: {
      marginLeft: 8,
    },
  };

  const renderMessageStatus = (
    isMyLatestMsg: boolean,
    msgStatusEnable: boolean,
    customMessageStatusUI?: (hasUnread: boolean) => React.JSX.Element
  ) => {
    if (!isMyLatestMsg || !msgStatusEnable) return null;

    return (
      <MessageStatus
        userUnreadMessage={userUnreadMessage}
        customContainerStyle={customContainerStyle}
        customTextStyle={customTextStyle}
        unReadSentMessage={unReadSentMessage}
        unReadSeenMessage={unReadSeenMessage}
        customMessageStatus={customMessageStatusUI}
      />
    );
  };

  const renderBubble = (currentMessage: MessageProps) => {
    const isMyLatestMessage =
      !Object.keys(bubbleMessage.nextMessage ?? {}).length &&
      position === 'right';
    const ViewMessageStatus = renderMessageStatus(
      isMyLatestMessage,
      messageStatusEnable,
      customMessageStatus
    );

    switch (currentMessage?.type) {
      case MessageTypes.image:
      case MessageTypes.video:
        return (
          <View style={styles.bubbleWrapper}>
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
              wrapperStyle={styleBubble}
            />
            {ViewMessageStatus}
          </View>
        );

      default: {
        return (
          <View style={[styles.bubbleWrapper, customBubbleWrapperStyle]}>
            <Bubble
              {...bubbleMessage}
              wrapperStyle={styleBubble}
              textStyle={textStyle}
              containerStyle={containerStyle}
            />
            {ViewMessageStatus}
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
    marginBottom: 4,
  },
  bubbleWrapper: {
    marginVertical: 2,
  },
});
