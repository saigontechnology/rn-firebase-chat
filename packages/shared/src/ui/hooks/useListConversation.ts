import { useCallback, useEffect, useState } from 'react';
import type { ConversationProps } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

// ---------------------------------------------------------------------------
// Service interface — implemented by each platform's FirestoreServices
// ---------------------------------------------------------------------------

export interface ListConversationService<
  TConversation extends ConversationProps = ConversationProps,
> {
  searchConversations(text: string): Promise<TConversation[]>;
}

// ---------------------------------------------------------------------------
// Hook params & return
// ---------------------------------------------------------------------------

export interface UseListConversationParams<
  TConversation extends ConversationProps = ConversationProps,
> {
  listConversation: TConversation[];
  service: ListConversationService<TConversation>;
  hasSearchBar?: boolean;
  searchDebounceDelay?: number;
  onSelect?: (conversation: TConversation) => void;
}

export interface UseListConversationReturn<
  TConversation extends ConversationProps = ConversationProps,
> {
  data: TConversation[];
  searchText: string;
  setSearchText: (text: string) => void;
  isSearching: boolean;
  handleConversationPressed: (item: TConversation) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useListConversation<
  TConversation extends ConversationProps = ConversationProps,
>({
  listConversation,
  service,
  hasSearchBar = false,
  searchDebounceDelay = 300,
  onSelect,
}: UseListConversationParams<TConversation>): UseListConversationReturn<TConversation> {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<TConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchText = useDebounce(searchText, searchDebounceDelay);

  useEffect(() => {
    if (!hasSearchBar || !debouncedSearchText.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    service
      .searchConversations(debouncedSearchText)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch((err) => {
        console.error('[useListConversation] search error:', err);
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchText, hasSearchBar, service]);

  const data =
    hasSearchBar && searchText.trim() ? searchResults : listConversation;

  const handleConversationPressed = useCallback(
    (item: TConversation) => {
      onSelect?.(item);
    },
    [onSelect]
  );

  return {
    data,
    searchText,
    setSearchText,
    isSearching,
    handleConversationPressed,
  };
}
