import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ConversationItem } from './components/ConversationItem';
import type { ConversationProps } from '../interfaces';
import { useChatContext } from '../hooks';
import { setConversation } from '../reducer';

type ListItem = {
  item: ConversationProps;
  index: number;
};

export interface IListConversationProps {
  hasSearchBar?: boolean;
  onPress?: (conversation: ConversationProps) => void;
  renderCustomItem?: ({ item, index }: ListItem) => JSX.Element | null;
}

export const ListConversationScreen: React.FC<IListConversationProps> = ({
  hasSearchBar,
  onPress,
  renderCustomItem,
}) => {
  const { chatState, chatDispatch } = useChatContext();

  const data = useMemo(() => {
    //TODO: handle search
    return chatState?.listConversation;
  }, [chatState]);

  const handleConversationPressed = useCallback(
    (item: ConversationProps) => {
      chatDispatch?.(setConversation(item));
      onPress?.(item);
    },
    [chatDispatch, onPress]
  );

  const renderItem = useCallback(
    ({ item, index }: ListItem) => {
      if (renderCustomItem) return renderCustomItem({ item, index });
      return (
        <ConversationItem data={item} onPress={handleConversationPressed} />
      );
    },
    [handleConversationPressed, renderCustomItem]
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
