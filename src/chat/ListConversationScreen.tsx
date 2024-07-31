/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ConversationItem,
  IConversationItemProps,
} from './components/ConversationItem';
import { MessageTypes, type ConversationProps } from '../interfaces';
import { useChatContext, useChatSelector } from '../hooks';
import { setConversation } from '../reducer';
import { getListConversation } from '../reducer/selectors';

type ListItem = {
  item: ConversationProps;
  index: number;
};

export interface IListConversationProps {
  hasSearchBar?: boolean;
  onPress?: (conversation: ConversationProps) => void;
  renderCustomItem?: ({ item, index }: ListItem) => JSX.Element | null;
  conversationItemProps?: Omit<IConversationItemProps, 'data' | 'onPress'>; // remove default prop 'data' and 'onPress'
}

export const ListConversationScreen: React.FC<IListConversationProps> = ({
  // hasSearchBar,
  onPress,
  renderCustomItem,
  conversationItemProps,
}) => {
  const { chatDispatch, userInfo } = useChatContext();
  const listConversation = useChatSelector(getListConversation);

  const data = useMemo(() => {
    //TODO: handle search
    return listConversation;
  }, [listConversation]);

  const handleConversationPressed = useCallback(
    (item: ConversationProps) => {
      chatDispatch?.(setConversation(item));
      onPress?.(item);
    },
    [chatDispatch, onPress]
  );

  const getInitialsChat = (item: ConversationProps): string => {
    if (!item?.latestMessage || !item?.latestMessage?.type) return '';

    const { latestMessage } = item;
    const { senderId, text } = latestMessage;
    const isCurrentUser = senderId === userInfo?.id;

    const getMessageText = (messageType: string): string => {
      const senderInfo = `${
        isCurrentUser ? 'You' : item.latestMessage?.name
      } sent a`;

      switch (messageType) {
        case MessageTypes.text:
          return text;
        case MessageTypes.image:
          return `${senderInfo} photo`;
        case MessageTypes.video:
          return `${senderInfo} video`;
        case MessageTypes.document:
          return `${senderInfo} file`;
        case MessageTypes.voice:
          return `${senderInfo} voice message`;
        default:
          return '';
      }
    };

    return getMessageText(item?.latestMessage?.type);
  };

  const renderItem = useCallback(
    ({ item, index }: ListItem) => {
      const formattedItem = {
        ...item,
        latestMessage: { ...item.latestMessage, text: getInitialsChat(item) },
      } as ConversationProps;
      if (renderCustomItem)
        return renderCustomItem({
          item: formattedItem,
          index,
        });
      return (
        <ConversationItem
          data={item}
          onPress={handleConversationPressed}
          {...(conversationItemProps || {})}
          userInfo={userInfo}
        />
      );
    },
    [
      conversationItemProps,
      getInitialsChat,
      handleConversationPressed,
      renderCustomItem,
      userInfo,
    ]
  );

  return (
    <View style={styles.container}>
      <FlatList<ConversationProps>
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        data={data}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 15,
  },
});
