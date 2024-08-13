import React, {
  ReactNode,
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
  Bubble,
} from 'react-native-gifted-chat';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
import { FirestoreServices } from '../services/firebase';
import type {
  ConversationData,
  ConversationProps,
  CustomConversationInfo,
  IUserInfo,
  MessageProps,
} from '../interfaces';
import { formatMessageText, isOtherUserTyping } from '../utilities';
import SelectedImageModal from './components/SelectedImage';
import { CustomBubble, CustomImageVideoBubbleProps } from './components/bubble';
import { clearConversation } from '../reducer';
import {
  DEFAULT_CLEAR_SEND_NOTIFICATION,
  DEFAULT_TYPING_TIMEOUT_SECONDS,
} from '../constants';
import { useChatContext, useChatSelector, useTypingIndicator } from '../hooks';
import { getConversation } from '../reducer/selectors';
import InputToolbar, { IInputToolbar } from './components/InputToolbar';

type ChildrenProps = {
  onSend: (messages: MessageProps) => Promise<void>;
  userInfo: IUserInfo | null;
};

interface ChatScreenProps extends GiftedChatProps {
  style?: StyleProp<ViewStyle>;
  memberIds: string[];
  partners: IUserInfo[];
  onStartLoad?: () => void;
  onLoadEnd?: () => void;
  maxPageSize?: number;
  inputToolbarProps?: IInputToolbar;
  hasCamera?: boolean;
  hasGallery?: boolean;
  onPressCamera?: () => void;
  customConversationInfo?: CustomConversationInfo;
  customImageVideoBubbleProps?: CustomImageVideoBubbleProps;
  customContainerStyle?: StyleProp<ViewStyle>;
  customTextStyle?: StyleProp<ViewStyle>;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
  sendMessageNotification?: () => void;
  timeoutSendNotify?: number;
  enableTyping?: boolean;
  typingTimeoutSeconds?: number;
  messageStatusEnable?: boolean;
  customMessageStatus?: (hasUnread: boolean) => JSX.Element;
  children?: (props: ChildrenProps) => ReactNode | ReactNode;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  style,
  memberIds,
  partners,
  onStartLoad,
  onLoadEnd,
  maxPageSize = 20,
  renderComposer,
  inputToolbarProps,
  customConversationInfo,
  customImageVideoBubbleProps,
  sendMessageNotification,
  timeoutSendNotify = DEFAULT_CLEAR_SEND_NOTIFICATION,
  enableTyping = true,
  typingTimeoutSeconds = DEFAULT_TYPING_TIMEOUT_SECONDS,
  messageStatusEnable = true,
  ...props
}) => {
  const { userInfo, chatDispatch } = useChatContext();
  const conversation = useChatSelector(getConversation);

  const conversationInfo = useMemo(() => {
    return conversation;
  }, [conversation]);

  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const [messagesList, setMessagesList] = useState<MessageProps[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const isLoadingRef = useRef(false);
  const [isImgVideoUrl, setImgVideoUrl] = useState('');
  const [userUnreadMessage, setUserUnreadMessage] = useState<boolean>(false);
  const timeoutMessageRef = useRef<NodeJS.Timeout | null>(null);

  const conversationRef = useRef<ConversationProps | undefined>(
    conversationInfo
  );
  const messageRef = useRef<MessageProps[]>(messagesList);
  messageRef.current = messagesList;

  // Fetch latest conversation and messages data
  useEffect(() => {
    if (conversationInfo?.id) {
      onStartLoad?.();
      firebaseInstance.setConversationInfo(
        conversationInfo?.id,
        memberIds,
        partners
      );
      firebaseInstance.getMessageHistory(maxPageSize).then((res) => {
        setMessagesList(res);
        setHasMoreMessages(res.length === maxPageSize);
        const firstMessage = res?.length > 0 && res[0];
        if (firstMessage && firstMessage.senderId !== userInfo?.id) {
          firebaseInstance.changeReadMessage(firstMessage.id, userInfo?.id);
        }
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
    maxPageSize,
    userInfo?.id,
  ]);

  const onSend = useCallback(
    async (messages: MessageProps) => {
      /** If the conversation not created yet. it will create at the first message sent */
      isLoadingRef.current = false;
      if (!conversationRef.current?.id) {
        const newConversationInfo = {
          id: '',
          name: partners[0]?.name,
          image: partners[0]?.avatar,
          ...(customConversationInfo || {}),
        };
        // We identify a group chat if the conversation have custom-info
        let isGroup = !!customConversationInfo;
        conversationRef.current = await firebaseInstance.createConversation(
          newConversationInfo.id,
          memberIds,
          newConversationInfo?.name,
          newConversationInfo?.image,
          isGroup
        );
        firebaseInstance.setConversationInfo(
          conversationRef.current?.id,
          memberIds,
          partners
        );
      }
      /** Add new message to message list  */
      const regexBlacklist = firebaseInstance.getRegexBlacklist();
      const convertMessage = regexBlacklist
        ? await formatMessageText(messages, regexBlacklist)
        : messages;
      setMessagesList((previousMessages) =>
        GiftedChat.append(previousMessages, [convertMessage as MessageProps])
      );

      await firebaseInstance.sendMessage(messages);

      timeoutMessageRef.current = setTimeout(() => {
        sendMessageNotification?.();
      }, timeoutSendNotify);
    },
    [
      firebaseInstance,
      timeoutSendNotify,
      customConversationInfo,
      memberIds,
      partners,
      sendMessageNotification,
    ]
  );

  const onLoadEarlier = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    if (conversationRef.current?.id) {
      const res = await firebaseInstance.getMoreMessage(maxPageSize);
      const isMoreMessage = res.length === maxPageSize;
      setHasMoreMessages(isMoreMessage);
      isLoadingRef.current = !isMoreMessage;
      setMessagesList((previousMessages) =>
        GiftedChat.prepend(previousMessages, res)
      );
    }
  }, [maxPageSize, firebaseInstance]);

  // Clear conversation data when exit ChatScreen
  useEffect(() => {
    return () => {
      firebaseInstance.clearConversationInfo();
      chatDispatch?.(clearConversation());
    };
  }, [chatDispatch, firebaseInstance]);

  // Listener of current conversation data
  useEffect(() => {
    let userConversation: () => void;
    if (conversationRef.current?.id) {
      userConversation = firebaseInstance.userConversationListener(
        (data: ConversationData | undefined) => {
          if (userInfo?.id) {
            const unReads = data?.unRead ?? {};
            const latestMessageID = unReads[userInfo.id];
            const hasUnreadMessages = Object.entries(unReads).some(
              ([_, value]) => value !== latestMessageID
            );
            setUserUnreadMessage(hasUnreadMessages);
            // Clear timeout message when push notification
            if (!hasUnreadMessages && timeoutMessageRef.current) {
              clearTimeout(timeoutMessageRef.current);
              timeoutMessageRef.current = null;
            }
            if (data?.typing) {
              const isOthersTyping = isOtherUserTyping(
                data.typing,
                userInfo.id
              );
              setIsTyping(isOthersTyping);
            }
          }
        }
      );
    }

    return () => {
      if (userConversation) {
        userConversation();
      }
    };
  }, [firebaseInstance, partners, userInfo?.id]);

  // Listener of current conversation list messages
  useEffect(() => {
    let receiveMessageRef: () => void;
    if (conversationRef.current?.id) {
      receiveMessageRef = firebaseInstance.receiveMessageListener(
        (message: MessageProps) => {
          if (userInfo && message.senderId !== userInfo.id) {
            setMessagesList((previousMessages) =>
              GiftedChat.append(previousMessages, [message])
            );
          }
          // await for unread number status to completely update before change unread data
          setTimeout(
            () => firebaseInstance.changeReadMessage(message.id, userInfo?.id),
            500
          );
        }
      );
    }

    return () => {
      if (receiveMessageRef) {
        receiveMessageRef();
      }
    };
  }, [firebaseInstance, userInfo, conversationRef.current?.id]);

  const inputToolbar = useCallback(
    (composeProps: ComposerProps) => {
      if (renderComposer) return renderComposer(composeProps);
      return (
        <InputToolbar
          onSend={onSend}
          {...composeProps}
          hasCamera={props.hasCamera}
          hasGallery={props.hasGallery}
          {...inputToolbarProps}
        />
      );
    },
    [
      renderComposer,
      onSend,
      props.hasCamera,
      props.hasGallery,
      inputToolbarProps,
    ]
  );

  const renderBubble = (bubble: Bubble<MessageProps>['props']) => {
    if (props.renderBubble) return props.renderBubble(bubble);
    return (
      <CustomBubble
        bubbleMessage={bubble}
        onSelectedMessage={() => {
          //TODO: handle image/video press
        }}
        customImageVideoBubbleProps={customImageVideoBubbleProps}
        position={bubble.position}
        userUnreadMessage={userUnreadMessage}
        customContainerStyle={props.customContainerStyle}
        customTextStyle={props.customTextStyle}
        unReadSentMessage={props.unReadSentMessage}
        unReadSeenMessage={props.unReadSeenMessage}
        customMessageStatus={props.customMessageStatus}
        messageStatusEnable={messageStatusEnable}
      />
    );
  };
  const changeUserConversationTyping = useCallback(
    (value: boolean, callback?: () => void) => {
      conversationRef.current?.id &&
        firebaseInstance.setUserConversationTyping(value).then(callback);
    },
    [firebaseInstance]
  );

  const { handleTextChange } = useTypingIndicator(
    enableTyping,
    changeUserConversationTyping,
    typingTimeoutSeconds
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
          keyboardShouldPersistTaps={'never'}
          infiniteScroll
          loadEarlier={hasMoreMessages}
          renderChatFooter={() => <TypingIndicator />}
          onLoadEarlier={onLoadEarlier}
          renderComposer={inputToolbar}
          renderBubble={renderBubble}
          onInputTextChanged={handleTextChange}
          isTyping={isTyping}
          {...props}
        />
      </KeyboardAvoidingView>
      <SelectedImageModal
        imageUrl={isImgVideoUrl}
        onClose={() => setImgVideoUrl('')}
      />
      {typeof props.children === 'function'
        ? props.children({ onSend, userInfo })
        : props.children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
