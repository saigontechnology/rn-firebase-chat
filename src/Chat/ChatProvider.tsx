import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { GiftedChat, GiftedChatProps } from 'react-native-gifted-chat';
import { FirestoreServices } from '../Services/Firestore';
import { formatEncryptedMessageData, formatMessageData } from '../Utilities';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
import { MEDIA_FILE_TYPE, TYPING_TIMEOUT_SECONDS } from './constanst';
import type { ConversationProps, MessageProps } from '../interfaces';

interface IUserInfo {
  id: string;
  name: string;
}

interface ChatScreenProps extends GiftedChatProps {
  userInfo: IUserInfo;
  conversationInfo: ConversationProps;
  memberId: string;
  style?: StyleProp<ViewStyle>;
  enableEncrypt?: boolean;
  enableTyping?: boolean;
  typingTimeoutSeconds?: number;
}

let typingTimeout: ReturnType<typeof setTimeout>;

const FirestoreServicesInstance = FirestoreServices.getInstance();
export const ChatProvider = React.forwardRef<any, ChatScreenProps>(
  ({
    userInfo,
    memberId,
    conversationInfo,
    style,
    renderLoadEarlier,
    renderAvatar,
    renderBubble,
    renderMessage,
    enableEncrypt,
    enableTyping,
    typingTimeoutSeconds = TYPING_TIMEOUT_SECONDS,
    renderInputToolbar,
    ...props
  }) => {
    const [messagesList, setMessagesList] = useState<MessageProps[]>([]);
    // const [isShowPhotoGallery, setIsShowPhotoGallery] =
    //   useState<boolean>(false);
    const [loadEarlier, setLoadEarlier] = useState<boolean>(false);
    const [isLoadingEarlier, setIsLoadingEarlier] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    const conversationRef = useRef<ConversationProps>(conversationInfo);
    const messageRef = useRef<MessageProps[]>(messagesList);
    messageRef.current = messagesList;
    const totalMessages = useRef<number>(0);
    const typingRef = useRef(isTyping);

    const onLoadEarlier = useCallback(() => {
      if (messagesList.length < totalMessages.current && !isLoadingEarlier) {
        setTimeout(() => {
          setIsLoadingEarlier(true);
          setLoadEarlier(false);

          FirestoreServicesInstance.getMoreMessage().then(
            (data: MessageProps[]) => {
              setIsLoadingEarlier(false);
              setLoadEarlier(true);
              if (data?.length) {
                setMessagesList((prevState) => {
                  return prevState.concat(...data);
                });
              }
            }
          );
        }, 1000);
      } else {
        setLoadEarlier(false);
      }
    }, [isLoadingEarlier, messagesList]);

    const onSend = useCallback(async (messages: MessageProps) => {
      if (!conversationRef.current?.id) {
        conversationRef.current =
          (await FirestoreServicesInstance.createConversation()) as ConversationProps;
      }
      clearTimeout(typingTimeout);
      setMessagesList((previousMessages) =>
        GiftedChat.append(previousMessages, [messages])
      );

      let file;
      const messageType = messages?.type;

      if (messageType) {
        file = {
          imageUrl: messages?.imageUrl,
          extension: messages?.extension,
          type: ''
        };
        switch (messageType) {
          case MEDIA_FILE_TYPE.image:
            file['type'] = MEDIA_FILE_TYPE.image
            break;
          case MEDIA_FILE_TYPE.video:
            file['type'] = MEDIA_FILE_TYPE.video
            break;
          default:
            file['type'] = MEDIA_FILE_TYPE.file
            break;
        }
      }
      await FirestoreServicesInstance.sendMessage(messages.text, file);
    }, []);

    const changeUserConversationTyping = useCallback(
      (value: boolean, callback?: () => void) => {
        FirestoreServicesInstance.setUserConversationTyping(value).then(
          callback
        );
      },
      []
    );

    const onInputTextChanged = useCallback(
      (text: string) => {
        if (enableTyping) {
          if (!text) {
            changeUserConversationTyping(false);
            clearTimeout(typingTimeout);
          } else {
            clearTimeout(typingTimeout);
            changeUserConversationTyping(true, () => {
              typingTimeout = setTimeout(() => {
                changeUserConversationTyping(false, () => {
                  clearTimeout(typingTimeout);
                });
              }, typingTimeoutSeconds);
            });
          }
        }
      },
      [enableTyping, changeUserConversationTyping, typingTimeoutSeconds]
    );

    useEffect(() => {
      if (conversationInfo?.id) {
        setLoadEarlier(true);
        FirestoreServicesInstance.countAllMessages().then((total) => {
          totalMessages.current = total;
        });
        FirestoreServicesInstance.getMessageHistory().then((res) => {
          FirestoreServicesInstance.changeReadMessage();
          setLoadEarlier(false);
          setMessagesList(res);
        });
      }
    }, [conversationInfo?.id, enableEncrypt]);

    useEffect(() => {
      let receiveMessageRef: () => void;
      let userConversation: () => void;
      try {
        receiveMessageRef = FirestoreServicesInstance.receiveMessageListener(
          (message: MessageProps) => {
            if (message.senderId !== userInfo.id) {
              if (enableEncrypt) {
                formatEncryptedMessageData(message, userInfo.name).then(
                  (formattedMessages: any) => {
                    setMessagesList([formattedMessages, ...messageRef.current]);
                    FirestoreServicesInstance.changeReadMessage();
                  }
                );
              } else {
                const formatMessage = formatMessageData(message, userInfo.name);
                const mergeMessageList = [
                  formatMessage,
                  ...messageRef.current,
                ] as MessageProps[];
                setMessagesList(mergeMessageList);
                FirestoreServicesInstance.changeReadMessage();
              }
            }
          }
        );
        // //Build for chat 1-1
        userConversation = FirestoreServicesInstance.userConversationListener(
          (newConversation) => {
            conversationRef.current = newConversation as ConversationProps;
            typingRef.current = newConversation?.typing?.[memberId];
            setIsTyping(typingRef.current);
          }
        );
      } catch (error) { }

      return () => {
        if (receiveMessageRef) {
          receiveMessageRef();
        }
        if (userConversation) {
          userConversation();
        }
      };
    }, [userInfo.id, loadEarlier, memberId, enableEncrypt, userInfo.name]);

    return (
      <View style={[styles.container, style]}>
        <KeyboardAvoidingView style={styles.container}>
          <GiftedChat
            messages={messagesList}
            onSend={(messages) => onSend(messages[0] as MessageProps)}
            user={{
              _id: userInfo.id,
              name: userInfo.name,
              avatar:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
            }}
            keyboardShouldPersistTaps={'always'}
            // renderCustomView={customMessageView}
            renderInputToolbar={renderInputToolbar}
            // renderBubble={renderBubble}
            // listViewProps={{
            //   scrollEventThrottle: 5000,
            //   onScroll: ({nativeEvent}: any) => {
            //     if (isCloseToTop(nativeEvent)) {
            //       onLoadEarlier();
            //     }
            //   },
            // }}
            infiniteScroll
            loadEarlier={loadEarlier}
            onLoadEarlier={onLoadEarlier}
            isLoadingEarlier={isLoadingEarlier}
            renderLoadEarlier={renderLoadEarlier}
            renderBubble={renderBubble}
            renderAvatar={renderAvatar}
            renderMessage={renderMessage}
            onInputTextChanged={onInputTextChanged}
            isTyping={enableTyping && isTyping}
            renderChatFooter={() => <TypingIndicator />}
            {...props}
          />
        </KeyboardAvoidingView>
        {/*{isShowPhotoGallery && (*/}
        {/*  <PhotoGalleryView*/}
        {/*    conversationId={conversationRef.current.id}*/}
        {/*    onSendImage={(message) => {*/}
        {/*      giftedChatRef.current?.onSend({*/}
        {/*        ...message,*/}
        {/*      });*/}
        {/*    }}*/}
        {/*  />*/}
        {/*)}*/}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
