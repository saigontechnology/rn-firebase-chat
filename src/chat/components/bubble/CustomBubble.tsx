import React, { useRef } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  MessageTypes,
  UploadingFile,
  type MessageProps,
} from '../../../interfaces';
import {
  Bubble,
  IMessage,
  isSameDay,
  isSameUser,
} from 'react-native-gifted-chat';
import {
  CustomImageVideoBubble,
  type CustomImageVideoBubbleProps,
} from './CustomImageVideoBubble';
import { CustomDocumentBubble } from './CustomDocumentBubble';
import { FirestoreServices } from '../../../services/firebase';
import { CustomBubbleVoice } from './CustomBubbleVoice';
import ViewUnRead from '../ViewUnRead';

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps?: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
  onSetCurrentId: (id: string) => void;
  isCurrentlyPlaying: boolean;
  renderCallBubble?(props: Bubble<MessageProps>['props']): React.ReactNode;
  uploadingFile?: UploadingFile;
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
  onSetCurrentId,
  isCurrentlyPlaying,
  renderCallBubble,
  uploadingFile,
  userUnreadMessage,
  customContainerStyle,
  customTextStyle,
  unReadSeenMessage,
  unReadSentMessage,
}) => {
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const styleBuble = {
    left: { backgroundColor: 'transparent' },
    right: { backgroundColor: 'transparent' },
  };

  const renderTime = (time: number | Date | undefined) => {
    return (
      <Text
        style={[
          styles.timeText,
          {
            alignSelf: position === 'right' ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        {time
          ? new Date(time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : ''}
      </Text>
    );
  };

  const renderUsername = () => {
    if (
      firebaseInstance.userId === bubbleMessage.currentMessage?.user?._id ||
      (isSameUser(
        bubbleMessage.currentMessage as IMessage,
        bubbleMessage.previousMessage
      ) &&
        isSameDay(
          bubbleMessage.currentMessage as IMessage,
          bubbleMessage.previousMessage
        ))
    ) {
      return null;
    }
    return (
      <Text style={styles.messageUsername}>
        {bubbleMessage?.currentMessage?.user?.name}
      </Text>
    );
  };

  const renderTextBubble = () => {
    return (
      <View>
        {renderUsername()}
        <Bubble
          {...bubbleMessage}
          renderTime={() => null}
          wrapperStyle={{ right: { padding: 4 }, left: { padding: 4 } }}
        />
        {renderTime(bubbleMessage.currentMessage?.createdAt)}
      </View>
    );
  };

  const renderUploadIndicator = () => {
    const messageId = bubbleMessage.currentMessage?._id;
    const isUploading =
      messageId === uploadingFile?.id && uploadingFile?.progress !== 100;

    return isUploading ? (
      <View style={styles.indicatorWrapper}>
        <Animated.View
          style={[
            styles.uploadIndicator,
            { width: `${uploadingFile?.progress}%` },
          ]}
        />
      </View>
    ) : null;
  };

  const renderBubble = (currentMessage: MessageProps) => {
    const isMyLatestMessage =
      !Object.keys(bubbleMessage.nextMessage ?? {}).length &&
      position === 'right';
    const ViewRead = isMyLatestMessage && (
      <ViewUnRead
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
          <Bubble
            {...bubbleMessage}
            renderTime={() => null}
            renderCustomView={() =>
              currentMessage && (
                <>
                  {renderUsername()}
                  <CustomImageVideoBubble
                    {...customImageVideoBubbleProps}
                    message={currentMessage}
                    onSelectImgVideoUrl={(message) =>
                      onSelectedMessage(message)
                    }
                    position={position}
                  />
                  {renderUploadIndicator()}
                  {renderTime(bubbleMessage.currentMessage?.createdAt)}
                </>
              )
            }
            wrapperStyle={styleBuble}
          />
        );
      case MessageTypes.document:
        return (
          <Bubble
            {...bubbleMessage}
            renderTime={() => null}
            renderCustomView={() =>
              currentMessage && (
                <>
                  {renderUsername()}
                  <CustomDocumentBubble
                    message={currentMessage}
                    position={position}
                  />
                  {renderUploadIndicator()}
                  {renderTime(bubbleMessage.currentMessage?.createdAt)}
                </>
              )
            }
            wrapperStyle={styleBuble}
          />
        );
      case MessageTypes.voice:
        return (
          <Bubble
            {...bubbleMessage}
            renderTime={() => null}
            renderCustomView={() =>
              currentMessage && (
                <>
                  {renderUsername()}
                  <CustomBubbleVoice
                    position={position}
                    currentMessage={currentMessage}
                    onSetCurrentId={onSetCurrentId}
                    isCurrentlyPlaying={isCurrentlyPlaying}
                  />
                  {renderUploadIndicator()}
                  {renderTime(bubbleMessage.currentMessage?.createdAt)}
                </>
              )
            }
            wrapperStyle={styleBuble}
          />
        );
      case MessageTypes.videoCall:
      case MessageTypes.voiceCall:
        return (
          <>
            {renderUsername()}
            {renderCallBubble?.(bubbleMessage)}
          </>
        );
      default:
        return renderTextBubble();
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
  messageUsername: {
    color: '#fff',
    marginBottom: 4,
  },
  indicatorWrapper: {
    height: 5,
    width: '70%',
    borderWidth: 1,
    borderRadius: 6,
    alignSelf: 'flex-end',
    borderColor: '#CCC',
  },
  uploadIndicator: {
    height: '100%',
    width: `0%`,
    backgroundColor: '#CCC',
  },
  timeText: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    marginRight: 10,
    marginLeft: 8,
  },
});
