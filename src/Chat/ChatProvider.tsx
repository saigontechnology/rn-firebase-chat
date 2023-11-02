import React, { Component } from 'react';
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

interface ChatScreenStates {
  messagesList: MessageProps[];
  loadEarlier: boolean;
  isLoadingEarlier: boolean;
  isTyping: boolean;
}

let typingTimeout: ReturnType<typeof setTimeout>;

export class ChatProvider extends Component<ChatScreenProps, ChatScreenStates> {
  conversationInfo;
  totalMessages = 0;
  receiveMessageRef;
  userConversation;
  constructor(props: ChatScreenProps) {
    super(props);
    this.state = {
      messagesList: [],
      loadEarlier: false,
      isLoadingEarlier: false,
      isTyping: false,
    };
    this.conversationInfo = props.conversationInfo;
    this.receiveMessageRef = () => {};
    this.userConversation = () => {};
  }

  onLoadEarlier = () => {
    const { enableEncrypt } = this.props;
    const { isLoadingEarlier, messagesList } = this.state;
    if (messagesList.length < this.totalMessages && !isLoadingEarlier) {
      setTimeout(() => {
        this.setState({
          isLoadingEarlier: true,
          loadEarlier: false,
        });
        getMoreMessage(this.conversationInfo.id, enableEncrypt).then(
          (data: MessageProps[]) => {
            this.setState({
              isLoadingEarlier: false,
              loadEarlier: true,
            });
            if (data.length > 0) {
              this.setState({
                messagesList: [...messagesList, ...data],
              });
            }
          }
        );
      }, 1000);
    } else {
      this.setState({
        loadEarlier: false,
      });
    }
  };

  onSend = async (messages: MessageProps) => {
    const { enableEncrypt, memberId, userInfo } = this.props;
    if (!this.conversationInfo?.id) {
      this.conversationInfo = (await createConversation(
        userInfo.id,
        memberId
      )) as ConversationProps;
    }
    clearTimeout(typingTimeout);
    this.setState((prevStates) => ({
      messagesList: GiftedChat.append(prevStates.messagesList, [messages]),
    }));

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
    } else if (messages.type) {
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
      this.conversationInfo.id,
      messages.text,
      this.conversationInfo.members,
      file,
      enableEncrypt
    );
  };

  changeUserConversationTyping = (value: boolean, callback?: () => void) => {
    const { userInfo } = this.props;
    setUserConversationTyping(
      this.conversationInfo?.id,
      userInfo.id,
      value
    ).then(callback);
  };

  onInputTextChanged = (text: string) => {
    const { enableTyping, typingTimeoutSeconds = TYPING_TIMEOUT_SECONDS } =
      this.props;
    if (enableTyping) {
      if (!text) {
        this.changeUserConversationTyping(false);
        clearTimeout(typingTimeout);
      } else {
        clearTimeout(typingTimeout);
        this.changeUserConversationTyping(true, () => {
          typingTimeout = setTimeout(() => {
            this.changeUserConversationTyping(false, () => {
              clearTimeout(typingTimeout);
            });
          }, typingTimeoutSeconds);
        });
      }
    }
  };

  componentDidMount() {
    const { enableEncrypt, memberId, userInfo } = this.props;
    if (this.conversationInfo?.id) {
      countAllMessages(this.conversationInfo?.id).then((total) => {
        this.totalMessages = total;
      });
      getMessageHistory(this.conversationInfo?.id, enableEncrypt).then(
        (res: any) => {
          changeReadMessage(this.conversationInfo.id);
          this.setState({
            loadEarlier: true,
            messagesList: res,
          });
        }
      );
    }

    this.receiveMessageRef = receiveMessageListener(
      this.conversationInfo.id,
      (message: MessageProps) => {
        if (message.senderId !== userInfo.id) {
          if (enableEncrypt) {
            formatEncryptedMessageData(message, userInfo.name).then(
              (formattedMessages: any) => {
                this.setState((prevStates) => ({
                  messagesList: [formattedMessages, ...prevStates.messagesList],
                }));
                changeReadMessage(this.conversationInfo.id);
              }
            );
          } else {
            const formatMessage = formatMessageData(message, userInfo.name);
            this.setState((prevStates) => ({
              messagesList: [
                formatMessage as MessageProps,
                ...prevStates.messagesList,
              ],
            }));
            changeReadMessage(this.conversationInfo.id);
          }
        }
      }
    );

    // //Build for chat 1-1
    this.userConversation = userConversationListener(
      this.conversationInfo?.id,
      (newConversation) => {
        this.conversationInfo = newConversation as ConversationProps;
        this.setState({
          isTyping: newConversation?.typing?.[memberId],
        });
      }
    );
  }

  componentWillUnmount() {
    if (this.receiveMessageRef) {
      this.receiveMessageRef();
    }
    if (this.userConversation) {
      this.userConversation();
    }
  }

  render() {
    const {
      style,
      enableTyping,
      userInfo,
      renderAvatar,
      renderBubble,
      renderInputToolbar,
      renderLoadEarlier,
      renderMessage,
    } = this.props;
    const { isLoadingEarlier, isTyping, loadEarlier, messagesList } =
      this.state;
    return (
      <View style={[styles.container, style]}>
        <KeyboardAvoidingView style={styles.container}>
          <GiftedChat
            messages={messagesList}
            onSend={(messages) => this.onSend(messages[0] as MessageProps)}
            user={{
              _id: userInfo.id,
              name: userInfo.name,
              avatar:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
            }}
            keyboardShouldPersistTaps={'always'}
            // renderCustomView={customMessageView}
            renderInputToolbar={renderInputToolbar}
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
            onLoadEarlier={this.onLoadEarlier}
            isLoadingEarlier={isLoadingEarlier}
            renderLoadEarlier={renderLoadEarlier}
            renderBubble={renderBubble}
            renderAvatar={renderAvatar}
            renderMessage={renderMessage}
            onInputTextChanged={this.onInputTextChanged}
            isTyping={enableTyping && isTyping}
            renderChatFooter={() => <TypingIndicator />}
            {...this.props}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
