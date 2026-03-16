import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  ConversationItem,
  IConversationItemProps,
} from './components/ConversationItem';
import { SearchBar, ISearchBarProps } from './components/SearchBar';
import type { ConversationProps } from '../interfaces';
import { useChatContext, useChatSelector, useDebounce } from '../hooks';
import { setConversation } from '../reducer';
import { getListConversation } from '../reducer/selectors';
import { FirestoreServices } from '../services/firebase';

type ListItem = {
  item: ConversationProps;
  index: number;
};

export interface ISearchBarStyleProps {
  /** Style for the search bar container */
  searchBarContainerStyle?: StyleProp<ViewStyle>;
  /** Style for the search input */
  searchBarInputStyle?: StyleProp<TextStyle>;
  /** Style for the clear icon */
  searchBarClearIconStyle?: StyleProp<ImageStyle>;
}

/** Props managed internally by ListConversationScreen - these cannot be overridden */
type ManagedFlatListProps = 'data' | 'renderItem' | 'keyExtractor';

export interface IListConversationProps
  extends ISearchBarStyleProps,
    Omit<FlatListProps<ConversationProps>, ManagedFlatListProps> {
  /** Whether to show the search bar */
  hasSearchBar?: boolean;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Debounce delay in milliseconds for search (default: 300ms) */
  searchDebounceDelay?: number;
  /** Custom search bar props (excluding value and onChangeText which are managed internally) */
  searchBarProps?: Omit<ISearchBarProps, 'value' | 'onChangeText'>;
  /** Callback when a conversation is pressed */
  onPress?: (conversation: ConversationProps) => void;
  /** Custom render function for conversation items */
  renderCustomItem?: ({ item, index }: ListItem) => React.JSX.Element | null;
  /** Props for the default ConversationItem component */
  conversationItemProps?: Omit<IConversationItemProps, 'data' | 'onPress'>;
  /** Custom loading indicator component */
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
  const listConversation = useChatSelector(getListConversation);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationProps[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const firebaseInstance = useRef(FirestoreServices.getInstance()).current;

  // Debounce the search text
  const debouncedSearchText = useDebounce(searchText, searchDebounceDelay);

  // Perform search when debounced search text changes
  useEffect(() => {
    if (!hasSearchBar) {
      return;
    }

    if (!debouncedSearchText.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results =
          await firebaseInstance.searchConversations(debouncedSearchText);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchText, firebaseInstance, hasSearchBar]);

  // Determine which data to display
  const data =
    hasSearchBar && searchText.trim() ? searchResults : listConversation || [];

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
    <View style={styles.container}>
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
    </View>
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
