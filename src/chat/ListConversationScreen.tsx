import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ChatContext } from 'rn-firebase-chat';
import { ConversationItem } from './components/ConversationItem';
import type { ConversationProps } from '../interfaces';

export interface IListConversationProps {
  hasSearchBar?: boolean;
}

export const ListConversationScreen: React.FC<IListConversationProps> = () => {
  const { listConversation } = useContext(ChatContext);
  const data = useMemo(() => {
    //TODO: handle search
    return listConversation;
  }, []);

  const renderItem = useCallback(({ item }: { item: ConversationProps }) => {
    return <ConversationItem data={item} />;
  }, []);

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
