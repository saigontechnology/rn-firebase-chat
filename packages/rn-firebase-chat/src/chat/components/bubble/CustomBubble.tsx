import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble, type BubbleProps, Time } from 'react-native-gifted-chat';
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
}) => {
  const bubbleWrapperStyle = {
    left: {
      backgroundColor: '#E9E9EB',
      borderRadius: 18,
    },
    right: {
      backgroundColor: '#0084FF',
      borderRadius: 18,
    },
  };

  const bubbleTextStyle = {
    left: {
      color: '#000000',
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    right: {
      color: '#FFFFFF',
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500' as const,
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
          <View>
            <Bubble
              {...bubbleMessage}
              renderCustomView={() =>
                currentMessage && (
                  <CustomImageVideoBubble
                    {...customImageVideoBubbleProps}
                    message={currentMessage}
                    onSelectImgVideoUrl={() => {
                      //TODO: handle image/video press
                    }}
                    position={position}
                  />
                )
              }
              wrapperStyle={bubbleWrapperStyle}
              textStyle={bubbleTextStyle}
            />
            {ViewMessageStatus}
          </View>
        );

      default: {
        return (
          <View>
            <Bubble
              {...bubbleMessage}
              wrapperStyle={bubbleWrapperStyle}
              textStyle={bubbleTextStyle}
              renderTime={(timeProps) => (
                <View style={styles.timeContainer}>
                  {currentMessage.isEdited && (
                    <Text
                      style={[
                        styles.editedText,
                        {
                          color:
                            position === 'left'
                              ? '#666'
                              : 'rgba(255,255,255,0.7)',
                        },
                      ]}
                    >
                      (Edited)
                    </Text>
                  )}
                  <Time {...timeProps} />
                </View>
              )}
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
    flexShrink: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
  },
  editedText: {
    fontSize: 10,
    marginRight: 4,
  },
});
