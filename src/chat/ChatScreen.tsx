import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { GiftedChat, type GiftedChatProps } from 'react-native-gifted-chat';
import {
  type ConversationProps,
  type MessageProps,
  MessageTypes,
} from '../interfaces';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
import { ChatContext } from './ChatProvider';
import { FirestoreServices } from '../services/firebase';

interface ChatScreenProps extends GiftedChatProps {
  style?: StyleProp<ViewStyle>;
  memberIds: string[];
  conversationInfo?: ConversationProps;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ style, memberIds }) => {
  const { userInfo } = useContext(ChatContext);

  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

  const [messagesList, setMessagesList] = useState<MessageProps[]>([]);

  const conversationRef = useRef<ConversationProps | null>(null);
  const messageRef = useRef<MessageProps[]>(messagesList);
  messageRef.current = messagesList;

  const onSend = useCallback(
    async (messages: MessageProps) => {
      /** If the conversation not created yet. it will create at the first message sent */
      if (!conversationRef.current?.id) {
        conversationRef.current = await firebaseInstance.createConversation(
          memberIds
        );
      }
      /** Add new message to message list  */
      setMessagesList((previousMessages) =>
        GiftedChat.append(previousMessages, [messages])
      );

      let file;
      const messageType = messages?.type;
      if (messageType) {
        switch (messageType) {
          case MessageTypes.image:
            file = {
              type: 'image',
              imageUrl: messages?.imageUrl,
              extension: messages?.extension,
            };
            break;
          default:
            file = {
              type: 'file',
              fileUrl: messages?.fileUrl,
              extension: messages?.extension,
            };
            break;
        }
      }
      await firebaseInstance.sendMessage(messages.text, file);
    },
    [firebaseInstance, memberIds]
  );

  return (
    <View style={[styles.container, style]}>
      <KeyboardAvoidingView style={styles.container}>
        <GiftedChat
          messages={messagesList}
          onSend={(messages) => onSend(messages[0] as MessageProps)}
          user={{
            _id: userInfo.id,
            ...userInfo,
          }}
          keyboardShouldPersistTaps={'always'}
          infiniteScroll
          renderChatFooter={() => <TypingIndicator />}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
