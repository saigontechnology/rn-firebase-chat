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
  Bubble,
} from 'react-native-gifted-chat';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
import { FirestoreServices } from '../services/firebase';
import { useChatContext, useChatSelector } from '../hooks';
import {
  ChatTypes,
  type ConversationProps,
  type CustomConversationInfo,
  type IUserInfo,
  type MessageProps,
} from '../interfaces';
import { formatMessageText } from '../utilities';
import { getConversation } from '../reducer/selectors';
import InputToolbar, { IInputToolbar } from './components/InputToolbar';
import { CameraView, CameraViewRef } from '../chat_obs/components/CameraView';
import SelectedImageModal from './components/SelectedImage';
import { CustomBubble, CustomImageVideoBubbleProps } from './components/bubble';
import { clearConversation } from '../reducer';

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
  onPressGallery?: () => void;
  customConversationInfo?: CustomConversationInfo;
  customImageVideoBubbleProps: CustomImageVideoBubbleProps;
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
  const isLoadingRef = useRef(false);
  const cameraViewRef = useRef<CameraViewRef>(null);
  const [isImgVideoUrl, setImgVideoUrl] = useState('');
  const [isChatType, setChatType] = useState(
    ChatTypes.TextWithImageVideoAndAudio
  );

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
      firebaseInstance.getMessageHistory(maxPageSize).then((res) => {
        setMessagesList(res);
        setHasMoreMessages(res.length === maxPageSize);
        onLoadEnd?.();
      });
      setChatType(firebaseInstance.getChatType());
    }
  }, [
    conversationInfo?.id,
    firebaseInstance,
    onLoadEnd,
    onStartLoad,
    memberIds,
    partners,
    maxPageSize,
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
    },
    [firebaseInstance, customConversationInfo, memberIds, partners]
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

  useEffect(() => {
    return () => {
      firebaseInstance.clearConversationInfo();
      chatDispatch?.(clearConversation());
    };
  }, [chatDispatch, firebaseInstance]);

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
          hasCamera={props.hasCamera}
          hasGallery={props.hasGallery}
          onPressCamera={props.onPressCamera}
          onPressGallery={props.onPressGallery}
          onSend={onSend}
          cameraViewRef={cameraViewRef?.current}
          {...composeProps}
          {...inputToolbarProps}
        />
      );
    },
    [
      renderComposer,
      props.hasCamera,
      props.hasGallery,
      props.onPressCamera,
      props.onPressGallery,
      onSend,
      inputToolbarProps,
    ]
  );

  const renderBubble = (bubble: Bubble<MessageProps>['props']) => {
    if (props.renderBubble) return props.renderBubble(bubble);
    return (
      <CustomBubble
        bubbleMessage={bubble}
        onSelectedMessage={(url) => {
          setImgVideoUrl(url);
        }}
        customImageVideoBubbleProps={customImageVideoBubbleProps}
        position={bubble.position}
      />
    );
  };

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
          {...props}
        />
      </KeyboardAvoidingView>
      <SelectedImageModal
        imageUrl={isImgVideoUrl}
        onClose={() => setImgVideoUrl('')}
      />
      {isChatType !== ChatTypes.TextOnly && (
        <CameraView onSend={onSend} userInfo={userInfo} ref={cameraViewRef} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
