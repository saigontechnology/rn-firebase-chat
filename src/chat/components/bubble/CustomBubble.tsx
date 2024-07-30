import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
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

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps?: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
  onSetCurrentId: (id: string) => void;
  isCurrentlyPlaying: boolean;
  renderCallBubble?(props: Bubble<MessageProps>['props']): React.ReactNode;
  uploadingFile?: UploadingFile;
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
}) => {
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const styleBuble = {
    left: { backgroundColor: 'transparent' },
    right: { backgroundColor: 'transparent' },
  };

  const renderTextBubble = () => {
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
      return <Bubble {...bubbleMessage} />;
    }
    return (
      <View>
        <Text style={styles.messageUsername}>
          {bubbleMessage?.currentMessage?.user?.name}
        </Text>
        <Bubble {...bubbleMessage} />
      </View>
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
    switch (currentMessage?.type) {
      case MessageTypes.image:
      case MessageTypes.video:
        return (
          <Bubble
            {...bubbleMessage}
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
            renderCustomView={() =>
              currentMessage && (
                <>
                  {renderUsername()}
                  <CustomDocumentBubble
                    message={currentMessage}
                    position={position}
                  />
                  {renderUploadIndicator()}
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
});
