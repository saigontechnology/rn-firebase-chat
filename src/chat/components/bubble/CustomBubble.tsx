import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble, BubbleProps } from 'react-native-gifted-chat';
import {
  CustomImageVideoBubble,
  CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';
import MessageStatus from '../MessageStatus';
import {
  ICustomBubbleWithLinkPreviewStyles,
  CustomBubbleWithLinkPreview,
} from './CustomBubbleWithLinkPreview';

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps?: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
  userUnreadMessage: boolean;
  customContainerStyle?: StyleProp<ViewStyle>;
  customTextStyle?: StyleProp<ViewStyle>;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
  messageStatusEnable: boolean;
  customMessageStatus?: (hasUnread: boolean) => JSX.Element;
  customLinkPreviewStyles?: ICustomBubbleWithLinkPreviewStyles;
  customLinkPreview: (
    urls: string[],
    bubbleMessage: BubbleProps<MessageProps>
  ) => JSX.Element;
  enableLinkPreview: boolean;
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
  messageStatusEnable,
  customMessageStatus,
  customLinkPreviewStyles,
  customLinkPreview,
  enableLinkPreview,
}) => {
  const styleBuble = {
    left: { backgroundColor: 'transparent' },
    right: { backgroundColor: 'transparent' },
  };

  const renderMessageStatus = (
    isMyLatestMsg: boolean,
    msgStatusEnable: boolean,
    customMessageStatusUI?: (hasUnread: boolean) => JSX.Element
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
            {ViewMessageStatus}
          </View>
        );

      default: {
        return (
          <View>
            <CustomBubbleWithLinkPreview
              bubbleMessage={bubbleMessage}
              customBubbleWithLinkPreviewStyles={customLinkPreviewStyles}
              customBubbleWithLinkPreview={customLinkPreview}
              enableLinkPreview={enableLinkPreview}
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
  },
});
