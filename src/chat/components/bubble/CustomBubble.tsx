import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
import { Bubble } from 'react-native-gifted-chat';
import {
  CustomImageVideoBubble,
  CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';
import MessageStatus from '../MessageStatus';
import { CustomBubbleVoice } from './CustomBubbleVoice';
import { formatSendMessage } from '../../../utilities';
import { FirestoreServices } from '../../../services/firebase';

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
  onSetCurrentId: (id: string) => void;
  isCurrentlyPlaying: boolean;
  mediaMessageIds: string[];
  finishUploadCallback: (id: string) => void;
  sendMessageNotification?: () => void;
  timeoutSendNotify?: number;
  notifyRef?: React.MutableRefObject<NodeJS.Timeout | null>;
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
  onSetCurrentId,
  isCurrentlyPlaying,
  mediaMessageIds,
  finishUploadCallback,
  sendMessageNotification,
  timeoutSendNotify,
  notifyRef,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

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
      case MessageTypes.voice:
        return (
          <View>
            <Bubble
              {...bubbleMessage}
              renderCustomView={() =>
                currentMessage && (
                  <CustomBubbleVoice
                    position={position}
                    currentMessage={currentMessage}
                    onSetCurrentId={onSetCurrentId}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                  />
                )
              }
              wrapperStyle={styleBuble}
            />
          </View>
        );

      default: {
        return (
          <View>
            <Bubble {...bubbleMessage} />
            {ViewMessageStatus}
          </View>
        );
      }
    }
  };

  const uploadFileToStorage = useCallback(async () => {
    if (bubbleMessage.currentMessage) {
      const { text, type, path, extension, fileName, size, duration } =
        bubbleMessage.currentMessage || {};
      const messageData = formatSendMessage(
        firebaseInstance.userId,
        text,
        type,
        path,
        extension,
        fileName,
        size,
        duration
      );

      await firebaseInstance.sendMessageWithFile(messageData);
      finishUploadCallback(bubbleMessage.currentMessage._id.toString());
      setIsUploading(false);

      if (notifyRef) {
        notifyRef.current = setTimeout(() => {
          sendMessageNotification?.();
        }, timeoutSendNotify);
      }
    }
  }, [
    bubbleMessage.currentMessage,
    finishUploadCallback,
    firebaseInstance,
    notifyRef,
    sendMessageNotification,
    timeoutSendNotify,
  ]);

  useEffect(() => {
    if (
      !isUploading &&
      bubbleMessage.currentMessage?._id &&
      mediaMessageIds.includes(bubbleMessage.currentMessage._id.toString())
    ) {
      setIsUploading(true);
      uploadFileToStorage();
    }
  }, [
    bubbleMessage?.currentMessage?._id,
    isUploading,
    mediaMessageIds,
    uploadFileToStorage,
  ]);

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
