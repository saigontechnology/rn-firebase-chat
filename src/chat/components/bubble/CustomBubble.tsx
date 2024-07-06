import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageTypes, type MessageProps } from '../../../interfaces';
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

interface CustomBubbleProps {
  bubbleMessage: Bubble<MessageProps>['props'];
  position: 'left' | 'right';
  customImageVideoBubbleProps?: CustomImageVideoBubbleProps;
  onSelectedMessage: (message: MessageProps) => void;
}

export const CustomBubble: React.FC<CustomBubbleProps> = ({
  bubbleMessage,
  position,
  customImageVideoBubbleProps,
  onSelectedMessage,
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

  const renderBubble = (currentMessage: MessageProps) => {
    switch (currentMessage?.type) {
      case MessageTypes.image:
      case MessageTypes.video:
        return (
          <Bubble
            {...bubbleMessage}
            renderCustomView={() =>
              currentMessage && (
                <CustomImageVideoBubble
                  {...customImageVideoBubbleProps}
                  message={currentMessage}
                  onSelectImgVideoUrl={(message) => onSelectedMessage(message)}
                  position={position}
                />
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
                <CustomDocumentBubble
                  message={currentMessage}
                  position={position}
                />
              )
            }
            wrapperStyle={styleBuble}
          />
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
});
