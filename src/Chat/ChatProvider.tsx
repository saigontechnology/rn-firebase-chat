import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { GiftedChat, GiftedChatProps } from 'react-native-gifted-chat';
import {
  changeReadMessage,
  countAllMessages,
  getMessageHistory,
  getMoreMessage,
  receiveMessageListener,
  sendMessage,
  setUserConversationTyping,
  userConversationListener,
} from '../Services/Firestore';
import { createConversation } from '../Services/Firestore/conversation';
// import CustomMessageView from './Component/CustomMessageView';
import { formatEncryptedMessageData, formatMessageData } from '../Utilities';
import TypingIndicator from 'react-native-gifted-chat/lib/TypingIndicator';
// import { PhotoGalleryView } from './Component/PhotoGalleryView';
import { TYPING_TIMEOUT_SECONDS } from './constanst';
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

    // const customMessageView = (props: any) => {
    //   return <CustomMessageView {...props} />;
    // };

    // const isCloseToTop = ({
    //   layoutMeasurement,
    //   contentOffset,
    //   contentSize,
    // }: any) => {
    //   const paddingToTop = 80;
    //   return (
    //     contentSize.height - layoutMeasurement.height - paddingToTop <=
    //     contentOffset.y
    //   );
    // };

    const onLoadEarlier = useCallback(() => {
      if (messagesList.length < totalMessages.current && !isLoadingEarlier) {
        setTimeout(() => {
          setIsLoadingEarlier(true);
          setLoadEarlier(false);
          getMoreMessage(conversationRef.current.id, enableEncrypt).then(
            (data: MessageProps[]) => {
              setIsLoadingEarlier(false);
              setLoadEarlier(true);
              if (data.length > 0) {
                setMessagesList([...messagesList, ...data]);
              }
            }
          );
        }, 1000);
      } else {
        setLoadEarlier(false);
      }
    }, [enableEncrypt, isLoadingEarlier, messagesList]);

    const onSend = useCallback(
      async (messages: MessageProps) => {
        if (!conversationRef.current?.id) {
          conversationRef.current = (await createConversation(
            userInfo.id,
            memberId
          )) as ConversationProps;
        }
        clearTimeout(typingTimeout);
        setMessagesList((previousMessages) =>
          GiftedChat.append(previousMessages, [messages])
        );

        const messageData = {
          ...messages,
        };
        let file;

        if (messages?.type?.includes('image')) {
          file = {
            type: 'image',
            imageUrl: messages?.imageUrl,
            // fileUrl: fileUrl,
            // fileName: messages?.fileName,
            // fileSize: messages?.fileSize,
            extension: messages?.extension,
          };
        } else if (!!messages.type) {
          file = {
            type: 'image',
            fileUrl: messages?.fileUrl,
            // fileUrl: fileUrl,
            // fileName: messages?.fileName,
            // fileSize: messages?.fileSize,
            extension: messages?.extension,
          };
        }

        await sendMessage(
          conversationRef.current.id,
          messages.text,
          conversationRef.current.members,
          file,
          enableEncrypt
        );
      },
      [enableEncrypt, userInfo.id, memberId]
    );

    const changeUserConversationTyping = useCallback(
      (value: boolean, callback?: () => void) => {
        setUserConversationTyping(
          conversationRef.current?.id,
          userInfo.id,
          value
        ).then(callback);
      },
      [userInfo.id]
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
        countAllMessages(conversationInfo?.id).then((total) => {
          totalMessages.current = total;
        });
        getMessageHistory(conversationInfo?.id, enableEncrypt).then(
          (res: any) => {
            changeReadMessage(conversationRef.current.id);
            setLoadEarlier(true);
            setMessagesList(res);
          }
        );
      }
    }, [conversationInfo?.id, enableEncrypt]);

    useEffect(() => {
      let receiveMessageRef: () => void;
      let userConversation: () => void;
      receiveMessageRef = receiveMessageListener(
        conversationRef.current.id,
        (message: MessageProps) => {
          if (message.senderId !== userInfo.id) {
            if (enableEncrypt) {
              formatEncryptedMessageData(message, userInfo.name).then(
                (formattedMessages: any) => {
                  setMessagesList([formattedMessages, ...messageRef.current]);
                  changeReadMessage(conversationRef.current.id);
                }
              );
            } else {
              const formatMessage = formatMessageData(message, userInfo.name);
              const mergeMessageList = [
                formatMessage,
                ...messageRef.current,
              ] as MessageProps[];
              setMessagesList(mergeMessageList);
              changeReadMessage(conversationRef.current.id);
            }
          }
        }
      );
      // //Build for chat 1-1
      userConversation = userConversationListener(
        conversationRef.current?.id,
        (newConversation) => {
          conversationRef.current = newConversation as ConversationProps;
          typingRef.current = newConversation?.typing?.[memberId];
          setIsTyping(typingRef.current);
        }
      );

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
