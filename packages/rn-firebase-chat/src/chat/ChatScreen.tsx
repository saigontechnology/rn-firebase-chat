import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
  Text,
  Pressable,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GiftedChat,
  type ComposerProps,
  type BubbleProps,
  type IMessage,
  type ReplyMessage,
} from 'react-native-gifted-chat';

import MessageStatusView from './components/MessageStatus';
import { FirestoreServices } from '../services/firebase';
import type {
  CustomConversationInfo,
  IUserInfo,
  MessageProps,
} from '../interfaces';
import { MessageStatus } from '../interfaces';
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

type GiftedChatMessageProps = Omit<
  React.ComponentProps<typeof GiftedChat<IMessage>>,
  'messages' | 'user'
>;

interface ChatScreenProps extends GiftedChatMessageProps {
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
  const [isImgVideoUrl, setImgVideoUrl] = useState('');
  const [replyMessage, setReplyMessage] = useState<ReplyMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageProps | null>(
    null
  );
  const [inputText, setInputText] = useState('');

  const messagesContainerRef = useRef<{
    scrollToIndex?: (params: { index: number }) => void;
  } | null>(null);

  const scrollToMessage = useCallback((messageId: string | number) => {
    // Basic implementation: find index and scroll
    // GiftedChat FlatList can be accessed via ref
    //console.log('Scroll to message:', messageId);
  }, []);

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
    updateMessage,
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
      if (editingMessage) {
        await updateMessage({ ...editingMessage, text: message.text });
        setEditingMessage(null);
      } else {
        const replyMsg = replyMessage
          ? {
              id: String(
                (replyMessage as ReplyMessage & { id?: string }).id ||
                  replyMessage._id ||
                  ''
              ),
              text: replyMessage.text,
              userId: String(replyMessage.user?._id || ''),
              userName: replyMessage.user?.name || '',
            }
          : undefined;

        await sendMessage(message, replyMsg);
        setReplyMessage(null);
      }
      setInputText('');

      if (timeoutMessageRef.current) clearTimeout(timeoutMessageRef.current);
      timeoutMessageRef.current = setTimeout(() => {
        sendMessageNotification?.();
      }, timeoutSendNotify);
    },
    [
      sendMessage,
      updateMessage,
      editingMessage,
      replyMessage,
      sendMessageNotification,
      timeoutSendNotify,
    ]
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

  const onInputTextChanged = useCallback(
    (newText: string) => {
      setInputText(newText);
      handleTextChange(newText);
    },
    [handleTextChange]
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

  const renderBubble = (bubble: BubbleProps<IMessage>) => {
    const isMyLatestMessage =
      !Object.keys(bubble.nextMessage ?? {}).length &&
      bubble.position === 'right';

    if (props.renderBubble) {
      const customBubble = props.renderBubble(bubble as never);
      if (messageStatusEnable && isMyLatestMessage) {
        return (
          <View>
            {customBubble}
            <MessageStatusView
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
        bubbleMessage={bubble as never}
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

  const onLongPressMessage = useCallback(
    (_context: unknown, message: MessageProps) => {
      // Only allow editing confirmed messages (Firestore id present), owned by current user, not yet seen
      if (
        message.id &&
        message.user._id === userInfo?.id &&
        message.status !== MessageStatus.seen
      ) {
        setEditingMessage(message);
        setInputText(message.text);
        setReplyMessage(null);
      }
    },
    [userInfo?.id]
  );

  const renderAccessory = useCallback(() => {
    if (!editingMessage) return null;
    return (
      <View style={styles.editingBanner}>
        <View style={styles.editingBannerContent}>
          <View style={styles.editingIndicator} />
          <View style={styles.editingTextContainer}>
            <Text style={styles.editingTitle}>Editing Message</Text>
            <Text style={styles.editingMessageText} numberOfLines={1}>
              {editingMessage.text}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [editingMessage]);

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
        <GiftedChat<IMessage>
          {...props}
          messagesContainerStyle={styles.messagesContainer}
          messages={messages as unknown as IMessage[]}
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
          isTyping={isTyping}
          isScrollToBottomEnabled
          renderBubble={
            renderBubble as (props: BubbleProps<IMessage>) => React.ReactNode
          }
          reply={{
            swipe: {
              isEnabled: true,
              direction: 'left',
              onSwipe: setReplyMessage,
            },
            message: replyMessage,
            onClear: () => setReplyMessage(null),
            onPress: (msg) => scrollToMessage(msg._id),
            messageStyle: {
              containerStyleLeft: styles.replyContainerLeft,
              containerStyleRight: styles.replyContainerRight,
              textStyleLeft: styles.replyTextLeft,
              textStyleRight: styles.replyTextRight,
              ...props.reply?.messageStyle,
            },
            previewStyle: {
              containerStyle: {
                backgroundColor: '#E9E9EB',
              },
              ...props.reply?.previewStyle,
            },
            ...props.reply,
          }}
          onLongPressMessage={onLongPressMessage as never}
          text={inputText}
          textInputProps={{
            ...props.textInputProps,
            onChangeText: onInputTextChanged,
          }}
          messagesContainerRef={messagesContainerRef as never}
          renderAccessory={renderAccessory}
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
  editingBanner: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  editingBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editingIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginRight: 10,
  },
  editingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  editingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  editingMessageText: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 8,
    marginLeft: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
    fontWeight: '300',
  },
  replyContainerLeft: {
    backgroundColor: '#0084FF',
    borderRightWidth: 3,
    borderRightColor: '#222222',
    marginLeft: 4,
    marginTop: 4,
  },
  replyContainerRight: {
    backgroundColor: '#E9E9EB',
    borderLeftWidth: 3,
    borderLeftColor: '#222222',
    marginRight: 4,
    marginTop: 4,
  },
  replyTextLeft: {
    color: '#E9E9EB',
    fontSize: 13,
    lineHeight: 18,
  },
  replyTextRight: {
    color: '#222222',
    fontSize: 13,
    lineHeight: 18,
  },
});
