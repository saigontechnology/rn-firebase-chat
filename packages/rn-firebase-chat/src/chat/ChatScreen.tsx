import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GiftedChat,
  type ComposerProps,
  type BubbleProps,
} from 'react-native-gifted-chat';

type GiftedChatProps<_TMessage = unknown> = React.ComponentProps<
  typeof GiftedChat
>;
import MessageStatus from './components/MessageStatus';
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
import MessageSkeleton from './components/MessageSkeleton';
import { CustomBubble, CustomImageVideoBubbleProps } from './components/bubble';
import { clearConversation } from '../reducer';
import {
  DEFAULT_CLEAR_SEND_NOTIFICATION,
  DEFAULT_TYPING_TIMEOUT_SECONDS,
} from '../constants';
import { useChatContext, useChatSelector, useTypingIndicator } from '../hooks';
import { getConversation } from '../reducer/selectors';
import InputToolbar, { IInputToolbar } from './components/InputToolbar';

export type ChatScreenChildrenProps = {
  onSend: (messages: MessageProps) => Promise<void>;
};

type RenderChildren = (props: ChatScreenChildrenProps) => React.ReactNode;

interface ChatScreenProps extends GiftedChatProps<MessageProps> {
  style?: StyleProp<ViewStyle>;
  memberIds: string[];
  partners: IUserInfo[];
  onStartLoad?: () => void;
  onLoadEnd?: () => void;
  maxPageSize?: number;
  inputToolbarProps?: IInputToolbar;
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
  customMessageStatus?: (hasUnread: boolean) => React.JSX.Element;
  /** Render prop children to access onSend function */
  children?: RenderChildren;
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
  children,
  ...props
}) => {
  const { userInfo, chatDispatch } = useChatContext();
  const conversation = useChatSelector(getConversation);

  const conversationInfo = useMemo(() => {
    return conversation;
  }, [conversation]);

  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const [messagesList, setMessagesList] = useState<MessageProps[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const isLoadingRef = useRef(false);
  const [isImgVideoUrl, setImgVideoUrl] = useState('');
  const [userUnreadMessage, setUserUnreadMessage] = useState<boolean>(false);
  const timeoutMessageRef = useRef<NodeJS.Timeout | null>(null);

  const conversationRef = useRef<ConversationProps | undefined>(
    conversationInfo
  );
  // Keep conversationRef in sync with conversationInfo for listeners
  conversationRef.current = conversationInfo;
  const messageRef = useRef<MessageProps[]>(messagesList);
  messageRef.current = messagesList;

  const memberIdsRef = useRef(memberIds);
  memberIdsRef.current = memberIds;
  const partnersRef = useRef(partners);
  partnersRef.current = partners;
  const maxPageSizeRef = useRef(maxPageSize);
  maxPageSizeRef.current = maxPageSize;
  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;
  const onStartLoadRef = useRef(onStartLoad);
  onStartLoadRef.current = onStartLoad;
  const onLoadEndRef = useRef(onLoadEnd);
  onLoadEndRef.current = onLoadEnd;

  // Fetch latest conversation and messages data
  useEffect(() => {
    if (conversationInfo?.id) {
      onStartLoadRef.current?.();
      firebaseInstance.setConversationInfo(
        conversationInfo.id,
        memberIdsRef.current,
        partnersRef.current
      );
      setIsLoadingMessages(true);
      firebaseInstance
        .getMessageHistory(maxPageSizeRef.current)
        .then((res) => {
          setMessagesList(res);
          setIsLoadingMessages(false);
          setHasMoreMessages(res.length === maxPageSizeRef.current);
          const firstMessage = res?.length > 0 && res[0];
          if (
            firstMessage &&
            firstMessage.senderId !== userInfoRef.current?.id
          ) {
            firebaseInstance.changeReadMessage(
              firstMessage.id,
              userInfoRef.current?.id
            );
          }
          onLoadEndRef.current?.();
        })
        .catch((err) => {
          console.error('[ChatScreen] getMessageHistory error:', err);
          setIsLoadingMessages(false);
          onLoadEndRef.current?.();
        });
    } else {
      // No conversation yet (new chat) — skip loading and show empty chat
      // so the user can type and send the first message
      setIsLoadingMessages(false);
    }
  }, [conversationInfo?.id, firebaseInstance]);

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
        conversationRef.current = await firebaseInstance.createConversation(
          newConversationInfo.id,
          memberIds,
          newConversationInfo?.name,
          newConversationInfo?.image
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

      // Clear any existing notification timeout to prevent multiple notifications
      // when sending multiple messages (e.g., multi-image selection)
      if (timeoutMessageRef.current) {
        clearTimeout(timeoutMessageRef.current);
      }
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
      try {
        const res = await firebaseInstance.getMoreMessage(maxPageSize);
        const isMoreMessage = res.length === maxPageSize;
        setHasMoreMessages(isMoreMessage);
        isLoadingRef.current = !isMoreMessage;
        setMessagesList((previousMessages) =>
          GiftedChat.prepend(previousMessages, res)
        );
      } catch {
        isLoadingRef.current = false;
      }
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
    let userConversation: (() => void) | undefined;
    if (conversationRef.current?.id) {
      userConversation = firebaseInstance.userConversationListener(
        (data: ConversationData | undefined) => {
          if (userInfo?.id) {
            const unReads = data?.unRead ?? {};
            const latestMessageID = unReads[userInfo.id];
            const hasUnreadMessages = Object.entries(unReads).some(
              ([, value]) => value !== latestMessageID
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
  }, [firebaseInstance, partners, userInfo?.id, conversationInfo?.id]);

  // Listener of current conversation list messages
  useEffect(() => {
    let receiveMessageRef: (() => void) | undefined;
    if (conversationRef.current?.id) {
      receiveMessageRef = firebaseInstance.receiveMessageListener(
        (message: MessageProps) => {
          if (userInfo && message.senderId !== userInfo.id) {
            setMessagesList((previousMessages) =>
              GiftedChat.append(previousMessages, [message])
            );
          }
          // Use a more reliable timeout for read status update
          const timeoutId = setTimeout(
            () => firebaseInstance.changeReadMessage(message.id, userInfo?.id),
            500
          );

          // Cleanup timeout on unmount
          return () => clearTimeout(timeoutId);
        }
      );
    }

    return () => {
      if (receiveMessageRef) {
        receiveMessageRef();
      }
    };
  }, [firebaseInstance, userInfo, conversationInfo?.id]);

  const inputToolbar = useCallback(
    (composeProps: ComposerProps) => {
      if (renderComposer) return renderComposer(composeProps);
      return (
        <InputToolbar
          onSend={onSend}
          {...composeProps}
          {...inputToolbarProps}
        />
      );
    },
    [renderComposer, onSend, inputToolbarProps]
  );

  const renderBubble = (bubble: BubbleProps<MessageProps>) => {
    // Check if this is the user's latest message (for message status)
    const isMyLatestMessage =
      !Object.keys(bubble.nextMessage ?? {}).length &&
      bubble.position === 'right';

    // If custom renderBubble is provided, wrap it with message status if enabled
    if (props.renderBubble) {
      const customBubble = props.renderBubble(bubble as never);

      // Render message status for custom bubble if enabled
      if (messageStatusEnable && isMyLatestMessage) {
        return (
          <View>
            {customBubble}
            <MessageStatus
              userUnreadMessage={userUnreadMessage}
              customContainerStyle={props.customContainerStyle}
              customTextStyle={props.customTextStyle}
              unReadSentMessage={props.unReadSentMessage}
              unReadSeenMessage={props.unReadSeenMessage}
              customMessageStatus={props.customMessageStatus}
            />
          </View>
        );
      }

      return customBubble;
    }

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
      if (conversationRef.current?.id) {
        firebaseInstance?.setUserConversationTyping(value)?.then(callback);
      }
    },
    [firebaseInstance]
  );

  const keyboardVerticalOffset = useHeaderHeight();

  if (isLoadingMessages) {
    return (
      <SafeAreaView
        style={[styles.container, StyleSheet.flatten(style)]}
        edges={['bottom']}
      >
        <MessageSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, StyleSheet.flatten(style)]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messagesContainerStyle={styles.messagesContainer}
          messages={messagesList}
          onSend={(messages) => onSend(messages[0] as MessageProps)}
          user={{
            _id: userInfo?.id || '',
            ...userInfo,
          }}
          keyboardAvoidingViewProps={{ keyboardVerticalOffset }}
          loadEarlierMessagesProps={{
            isAvailable: true,
            isLoading: hasMoreMessages,
            onPress: onLoadEarlier,
          }}
          renderComposer={inputToolbar}
          isTyping={isTyping}
          {...props}
          isScrollToBottomEnabled
          renderBubble={
            renderBubble as unknown as GiftedChatProps['renderBubble']
          }
        />
      </KeyboardAvoidingView>
      <SelectedImageModal
        imageUrl={isImgVideoUrl}
        onClose={() => setImgVideoUrl('')}
      />
      {children?.({ onSend })}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesContainer: {
    backgroundColor: '#F5F5F5',
  },
});
