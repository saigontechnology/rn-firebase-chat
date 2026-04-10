import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  FlatListProps,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ConversationItem,
  IConversationItemProps,
} from './components/ConversationItem';
import { SearchBar, ISearchBarProps } from './components/SearchBar';
import type { ConversationProps } from '../interfaces';
import { useChatContext, useChatSelector } from '../hooks';
import { setConversation } from '../reducer';
import { getListConversation } from '../reducer/selectors';
import { FirestoreServices } from '../services/firebase';
import { useListConversation } from '@saigontechnology/firebase-chat-shared';

type ListItem = {
  item: ConversationProps;
  index: number;
};

export interface ISearchBarStyleProps {
  searchBarContainerStyle?: StyleProp<ViewStyle>;
  searchBarInputStyle?: StyleProp<TextStyle>;
  searchBarClearIconStyle?: StyleProp<ImageStyle>;
}

type ManagedFlatListProps = 'data' | 'renderItem' | 'keyExtractor';

export interface IListConversationProps
  extends
    ISearchBarStyleProps,
    Omit<FlatListProps<ConversationProps>, ManagedFlatListProps> {
  hasSearchBar?: boolean;
  searchPlaceholder?: string;
  searchDebounceDelay?: number;
  searchBarProps?: Omit<ISearchBarProps, 'value' | 'onChangeText'>;
  onPress?: (conversation: ConversationProps) => void;
  renderCustomItem?: ({ item, index }: ListItem) => React.JSX.Element | null;
  conversationItemProps?: Omit<IConversationItemProps, 'data' | 'onPress'>;
  renderLoadingIndicator?: () => React.JSX.Element;
}

export const ListConversationScreen: React.FC<IListConversationProps> = ({
  hasSearchBar = false,
  searchPlaceholder = 'Search conversations...',
  searchDebounceDelay = 300,
  searchBarProps,
  searchBarContainerStyle,
  searchBarInputStyle,
  searchBarClearIconStyle,
  onPress,
  renderCustomItem,
  conversationItemProps,
  renderLoadingIndicator,
  contentContainerStyle,
  ...flatListProps
}) => {
  const { chatDispatch, userInfo } = useChatContext();
  const listConversation = useChatSelector(getListConversation) ?? [];
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

  const onSelect = useCallback(
    (item: ConversationProps) => {
      chatDispatch?.(setConversation(item));
      onPress?.(item);
    },
    [chatDispatch, onPress]
  );

  const {
    data,
    searchText,
    setSearchText,
    isSearching,
    handleConversationPressed,
  } = useListConversation<ConversationProps>({
    listConversation,
    service: firebaseInstance,
    hasSearchBar,
    searchDebounceDelay,
    onSelect,
  });

  const renderItem = useCallback(
    ({ item, index }: ListItem) => {
      if (renderCustomItem) return renderCustomItem({ item, index });
      return (
        <ConversationItem
          data={item}
          onPress={handleConversationPressed}
          {...(conversationItemProps ?? {})}
          userInfo={userInfo}
        />
      );
    },
    [
      conversationItemProps,
      handleConversationPressed,
      renderCustomItem,
      userInfo,
    ]
  );

  const defaultLoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#999" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {hasSearchBar && (
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder={searchPlaceholder}
          containerStyle={searchBarContainerStyle}
          inputStyle={searchBarInputStyle}
          clearIconStyle={searchBarClearIconStyle}
          {...searchBarProps}
        />
      )}
      {isSearching
        ? (renderLoadingIndicator ?? defaultLoadingIndicator)()
        : null}
      <FlatList<ConversationProps>
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        keyExtractor={(item, index) => item.id || index.toString()}
        data={data}
        renderItem={renderItem}
        {...flatListProps}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  contentContainer: {
    paddingTop: 15,
  },
});
