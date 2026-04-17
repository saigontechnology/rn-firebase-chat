import React, { useCallback, useEffect, useRef } from 'react';
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

import MessageStatus from './components/MessageStatus';
import { FirestoreServices } from '../services/firebase';
import type {
  CustomConversationInfo,
  IUserInfo,
  MessageProps,
} from '../interfaces';
import { formatMessageData } from '../utilities';
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
import {
  useChatScreen,
  type MessageProps as SharedMessageProps,
} from '@saigontechnology/firebase-chat-shared';

export type ChatScreenChildrenProps = {
  onSend: (messages: MessageProps) => Promise<void>;
};

type RenderChildren = (props: ChatScreenChildrenProps) => React.ReactNode;

interface ChatScreenProps extends React.ComponentProps<typeof GiftedChat> {
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
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;
  const timeoutMessageRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isImgVideoUrl, setImgVideoUrl] = React.useState('');

  /** RN-specific formatMessage: decrypts + adds GiftedChat fields (_id, user, createdAt). */
  const formatMessage = useCallback(
    (raw: SharedMessageProps) => {
      const userInfo_ = userInfo ?? { id: '', name: '', avatar: '' };
      const partner = firebaseInstance.partners?.[raw.senderId] as
        | IUserInfo
        | undefined;
      const sender =
        raw.senderId === userInfo_?.id ? userInfo_ : (partner ?? userInfo_);
      return formatMessageData(
        raw as MessageProps,
        sender,
        firebaseInstance.regexBlacklist,
        firebaseInstance.encryptKey,
        firebaseInstance.decryptFunctionProp
      );
    },
    [userInfo, firebaseInstance]
  );

  const {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isTyping,
    userUnreadMessage,
    sendMessage,
    loadEarlier,
  } = useChatScreen<MessageProps>({
    userInfo,
    conversationId: conversation?.id,
    memberIds,
    partners,
    maxPageSize,
    customConversationInfo,
    service: firebaseInstance,
    formatMessage,
    onStartLoad,
    onLoadEnd,
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      chatDispatch?.(clearConversation());
    };
  }, [chatDispatch]);

  const onSend = useCallback(
    async (message: MessageProps) => {
      await sendMessage(message);
      if (timeoutMessageRef.current) clearTimeout(timeoutMessageRef.current);
      timeoutMessageRef.current = setTimeout(() => {
        sendMessageNotification?.();
      }, timeoutSendNotify);
    },
    [sendMessage, sendMessageNotification, timeoutSendNotify]
  );

  const changeUserConversationTyping = useCallback(
    (value: boolean, callback?: () => void) => {
      if (conversation?.id) {
        firebaseInstance.setUserConversationTyping(value)?.then(callback);
      }
    },
    [firebaseInstance, conversation?.id]
  );

  const { handleTextChange } = useTypingIndicator(
    enableTyping,
    changeUserConversationTyping,
    typingTimeoutSeconds
  );

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
    const isMyLatestMessage =
      !Object.keys(bubble.nextMessage ?? {}).length &&
      bubble.position === 'right';

    if (props.renderBubble) {
      const customBubble = props.renderBubble(bubble as never);
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
          messages={messages}
          onSend={(msgs) => onSend(msgs[0] as MessageProps)}
          user={{
            _id: userInfo?.id || '',
            ...userInfo,
          }}
          keyboardAvoidingViewProps={{ keyboardVerticalOffset }}
          loadEarlierMessagesProps={{
            isAvailable: true,
            isLoading: hasMoreMessages,
            onPress: loadEarlier,
          }}
          renderComposer={inputToolbar}
          textInputProps={{ onChangeText: handleTextChange }}
          isTyping={isTyping}
          {...props}
          isScrollToBottomEnabled
          renderBubble={
            renderBubble as unknown as React.ComponentProps<
              typeof GiftedChat
            >['renderBubble']
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
