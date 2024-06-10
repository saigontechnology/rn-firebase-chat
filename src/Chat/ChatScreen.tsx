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
import {
  type ComposerProps,
  GiftedChat,
  type GiftedChatProps,
  User,
} from 'react-native-gifted-chat';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
import { FirestoreServices } from '../services/firebase';
import { useChatContext, useChatSelector } from '../hooks';
import type {
  ConversationProps,
  IUserInfo,
  MessageProps,
  SendPhotoVideoMessageProps,
} from '../interfaces';
import { formatMessageData } from '../utilities';
import { getConversation } from '../reducer/selectors';
import InputToolbar from './components/InputToolbar';
import { CameraView } from '../chat_obs/components/CameraView';

interface ChatScreenProps extends GiftedChatProps {
  style?: StyleProp<ViewStyle>;
  memberIds: string[];
  partners: IUserInfo[];
  onStartLoad?: () => void;
  onLoadEnd?: () => void;
  onPressCamera?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  style,
  memberIds,
  partners,
  onStartLoad,
  onLoadEnd,
  renderComposer,
  ...props
}) => {
  const { userInfo } = useChatContext();
  const conversation = useChatSelector(getConversation);

  const conversationInfo = useMemo(() => {
    return conversation;
  }, [conversation]);

  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const [messagesList, setMessagesList] = useState<MessageProps[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const isLoadingRef = useRef(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  const conversationRef = useRef<ConversationProps | undefined>(
    conversationInfo
  );
  const messageRef = useRef<MessageProps[]>(messagesList);
  messageRef.current = messagesList;

  useEffect(() => {
    if (conversationInfo?.id) {
      onStartLoad?.();
      firebaseInstance.setConversationInfo(
        conversationInfo?.id,
        memberIds,
        partners
      );
      firebaseInstance.getMessageHistory().then((res) => {
        setMessagesList(res);
        setHasMoreMessages(res.length >= 20);
        onLoadEnd?.();
      });
    }
  }, [
    conversationInfo?.id,
    firebaseInstance,
    onLoadEnd,
    onStartLoad,
    memberIds,
    partners,
  ]);

  const onSend = useCallback(
    async (messages: MessageProps) => {
      /** If the conversation not created yet. it will create at the first message sent */
      isLoadingRef.current = false;
      if (!conversationRef.current?.id) {
        conversationRef.current = await firebaseInstance.createConversation(
          memberIds,
          partners[0]?.name,
          partners[0]?.avatar
        );
        firebaseInstance.setConversationInfo(
          conversationRef.current?.id,
          memberIds,
          partners
        );
      }
      /** Add new message to message list  */
      setMessagesList((previousMessages) =>
        GiftedChat.append(previousMessages, [messages])
      );

      await firebaseInstance.sendMessage(messages.text);
    },
    [firebaseInstance, memberIds, partners]
  );

  useEffect(() => {
    return () => {
      firebaseInstance.clearConversationInfo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let receiveMessageRef: () => void;
    if (conversationRef.current?.id) {
      receiveMessageRef = firebaseInstance.receiveMessageListener(
        (message: MessageProps) => {
          if (userInfo && message.senderId !== userInfo.id) {
            const userInfoIncomming = {
              id: message.id,
              name: message.senderId,
            } as IUserInfo;
            const formatMessage = formatMessageData(message, userInfoIncomming);
            setMessagesList((previousMessages) =>
              GiftedChat.append(previousMessages, [formatMessage])
            );
          }
        }
      );
    }

    return () => {
      if (receiveMessageRef) {
        receiveMessageRef();
      }
    };
  }, [firebaseInstance, userInfo, conversationRef.current?.id]);

  const onPressCamera = useCallback(() => {
    if (props.onPressCamera) return props.onPressCamera?.();
    setIsCameraVisible(true);
  }, [props]);

  const customInputToolbar = useCallback(
    (composeProps: ComposerProps) => {
      if (renderComposer) return renderComposer(composeProps);
      return (
        <InputToolbar
          onPressCamera={onPressCamera}
          isShowCamera
          {...composeProps}
        />
      );
    },
    [renderComposer, onPressCamera]
  );

  const onLoadEarlier = useCallback(async () => {
    console.log('onLoadEarlier: ');
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    if (conversationRef.current?.id) {
      const res = await firebaseInstance.getMoreMessage();
      const isMoreMessage = res.length === 20;
      console.log('isMoreMessage: ', isMoreMessage, res.length);
      setHasMoreMessages(isMoreMessage); // if the length of the response is 20, it means there are more messages to load
      isLoadingRef.current = !isMoreMessage;
      setMessagesList((previousMessages) =>
        GiftedChat.prepend(previousMessages, res)
      );
    }
  }, [firebaseInstance]);

  const onSendMedia = useCallback(
    async (media: {
      type: 'photo' | 'video';
      path: string;
      extension: string;
    }) => {
      setIsCameraVisible(false);
      const message: SendPhotoVideoMessageProps = {
        type: media.type,
        fileUrl: media.path,
        readBy: {
          [userInfo?.id || '']: true,
        },
        extension: media.extension,
        text: '',
        senderId: userInfo?.id || '',
      };

      await firebaseInstance.sendMessageWithFile(message);
    },
    [firebaseInstance, userInfo]
  );

  if (isCameraVisible) {
    return <CameraView visible={isCameraVisible} onSendMedia={onSendMedia} />;
  }

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
          loadEarlier={hasMoreMessages}
          renderChatFooter={() => <TypingIndicator />}
          renderComposer={customInputToolbar}
          onLoadEarlier={onLoadEarlier}
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
