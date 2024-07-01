import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ConversationItem } from './components/ConversationItem';
import type { ConversationProps } from '../interfaces';
import { useChatContext, useChatSelector } from '../hooks';
import { setConversation } from '../reducer';
import { getListConversation } from '../reducer/selectors';
import { FirestoreServices } from '../services/firebase';

type ListItem = {
  item: ConversationProps;
  index: number;
};

export interface IListConversationProps {
  hasSearchBar?: boolean;
  onPress?: (conversation: ConversationProps) => void;
  renderCustomItem?: ({
    item,
    index,
  }: ListItem & {
    onDeleteConversation: (softDelete?: boolean) => Promise<void>;
  }) => JSX.Element | null;
}

export const ListConversationScreen: React.FC<IListConversationProps> = ({
  // hasSearchBar,
  onPress,
  renderCustomItem,
}) => {
  const { chatDispatch } = useChatContext();
  const listConversation = useChatSelector(getListConversation);
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

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

  const handleDeleteConversation = useCallback(
    async (item: ConversationProps, softDelete?: boolean) => {
      await firebaseInstance.deleteConversation(item.id, softDelete);
    },
    [firebaseInstance]
  );

  const renderItem = useCallback(
    ({ item, index }: ListItem) => {
      if (renderCustomItem)
        return renderCustomItem({
          item,
          index,
          onDeleteConversation: (softDelete) =>
            handleDeleteConversation(item, softDelete),
        });
      return (
        <ConversationItem data={item} onPress={handleConversationPressed} />
      );
    },
    [handleConversationPressed, handleDeleteConversation, renderCustomItem]
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
