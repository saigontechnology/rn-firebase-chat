import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ConversationItem } from './components/ConversationItem';
import type { ConversationProps } from '../interfaces';
import { useChatContext } from '../hooks';
import { setConversation } from '../reducer';

export interface IListConversationProps {
  hasSearchBar?: boolean;
  onPress?: (conversation: ConversationProps) => void;
}

export const ListConversationScreen: React.FC<IListConversationProps> = ({
  hasSearchBar,
  onPress,
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
    ({ item }: { item: ConversationProps }) => {
      return (
        <ConversationItem data={item} onPress={handleConversationPressed} />
      );
    },
    [handleConversationPressed]
  );

  return (
    <View style={styles.container}>
      <FlatList
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
