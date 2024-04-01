import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { GiftedChat, type GiftedChatProps } from 'react-native-gifted-chat';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
import { FirestoreServices } from '../services/firebase';
import { useChatContext } from '../hooks';
import type { ConversationProps, MessageProps } from '../interfaces';

interface ChatScreenProps extends GiftedChatProps {
  style?: StyleProp<ViewStyle>;
  memberIds: string[];
  partnerInfo?: ConversationProps;
  onStartLoad?: () => void;
  onLoadEnd?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  style,
  memberIds,
  partnerInfo,
  onStartLoad,
  onLoadEnd,
  ...props
}) => {
  const { userInfo, chatState } = useChatContext();

  const conversationInfo = useMemo(() => {
    return chatState?.conversation;
  }, [chatState]);

  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const [messagesList, setMessagesList] = useState<MessageProps[]>([]);

  const conversationRef = useRef<ConversationProps | undefined>(
    conversationInfo
  );
  const messageRef = useRef<MessageProps[]>(messagesList);
  messageRef.current = messagesList;

  useEffect(() => {
    if (conversationInfo?.id) {
      onStartLoad?.();
      firebaseInstance.setConversationId(conversationInfo?.id);
      firebaseInstance.getMessageHistory().then((res) => {
        console.log(res);
        setMessagesList(res);
        onLoadEnd?.();
      });
    }
  }, [conversationInfo?.id, firebaseInstance, onLoadEnd, onStartLoad]);

  const onSend = useCallback(
    async (messages: MessageProps) => {
      /** If the conversation not created yet. it will create at the first message sent */
      if (!conversationRef.current?.id) {
        conversationRef.current = await firebaseInstance.createConversation(
          memberIds,
          partnerInfo?.name,
          partnerInfo?.image
        );
      }
      /** Add new message to message list  */
      setMessagesList((previousMessages) =>
        GiftedChat.append(previousMessages, [messages])
      );

      await firebaseInstance.sendMessage(messages.text);
    },
    [firebaseInstance, memberIds, partnerInfo]
  );

  return (
    <View style={[styles.container, style]}>
      <KeyboardAvoidingView style={styles.container}>
        <GiftedChat
          messages={messagesList}
          onSend={(messages) => onSend(messages[0] as MessageProps)}
          user={{
            _id: userInfo?.id || '',
            ...userInfo,
          }}
          keyboardShouldPersistTaps={'always'}
          infiniteScroll
          renderChatFooter={() => <TypingIndicator />}
          {...props}
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
