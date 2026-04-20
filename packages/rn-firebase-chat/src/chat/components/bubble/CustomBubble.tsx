import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, Text } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import {
  Bubble,
  type BubbleProps,
  type IMessage,
  Time,
} from 'react-native-gifted-chat';
import {
  CustomImageVideoBubble,
  CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';
import MessageStatus from '../MessageStatus';

interface CustomBubbleProps {
  bubbleMessage: BubbleProps<IMessage>;
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

/**
 * Returns whether the bubble is at the top, middle, bottom, or is a single
 * message in a group (consecutive messages from the same sender).
 * Used to mirror GiftedChat's own corner-radius logic for the inner reply container.
 */
const getGroupPosition = (
  currentMsg: IMessage | undefined,
  prevMsg: IMessage | undefined,
  nextMsg: IMessage | undefined
): 'top' | 'middle' | 'bottom' | 'single' => {
  const samePrev =
    !!prevMsg?.user && prevMsg.user._id === currentMsg?.user?._id;
  const sameNext =
    !!nextMsg?.user && nextMsg.user._id === currentMsg?.user?._id;
  if (!samePrev && sameNext) return 'top';
  if (samePrev && sameNext) return 'middle';
  if (samePrev && !sameNext) return 'bottom';
  return 'single';
};

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
  const currentMessage = bubbleMessage.currentMessage as
    | MessageProps
    | undefined;

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

  // Mirror the bubble's own top-corner logic: the "chain side" corner gets
  // flattened when a bubble is in the middle or bottom of a group.
  const groupPos = getGroupPosition(
    bubbleMessage.currentMessage,
    bubbleMessage.previousMessage,
    bubbleMessage.nextMessage
  );
  const isGrouped = groupPos === 'middle' || groupPos === 'bottom';
  const replyTopLeftRadius = position === 'left' && isGrouped ? 4 : 18;
  const replyTopRightRadius = position === 'right' && isGrouped ? 4 : 18;

  const bubbleProps: BubbleProps<IMessage> = {
    ...bubbleMessage,
    messageReply: {
      ...bubbleMessage.messageReply,
      ...(position === 'left'
        ? {
            containerStyleLeft: [
              bubbleMessage.messageReply?.containerStyleLeft,
              {
                borderTopLeftRadius: replyTopLeftRadius,
                borderTopRightRadius: replyTopRightRadius,
              },
            ],
          }
        : {
            containerStyleRight: [
              bubbleMessage.messageReply?.containerStyleRight,
              {
                borderTopLeftRadius: replyTopLeftRadius,
                borderTopRightRadius: replyTopRightRadius,
              },
            ],
          }),
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

  const renderBubble = (msg: MessageProps) => {
    const isMyLatestMessage =
      !Object.keys(bubbleMessage.nextMessage ?? {}).length &&
      position === 'right';
    const ViewMessageStatus = renderMessageStatus(
      isMyLatestMessage,
      messageStatusEnable,
      customMessageStatus
    );

    switch (msg?.type) {
      case MessageTypes.image:
      case MessageTypes.video:
        return (
          <View>
            <Bubble
              {...bubbleProps}
              renderCustomView={() =>
                msg && (
                  <CustomImageVideoBubble
                    {...customImageVideoBubbleProps}
                    message={msg}
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
              {...bubbleProps}
              wrapperStyle={bubbleWrapperStyle}
              textStyle={bubbleTextStyle}
              renderTime={(timeProps) => (
                <View style={styles.timeContainer}>
                  {msg.isEdited && (
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
      {currentMessage && renderBubble(currentMessage)}
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
