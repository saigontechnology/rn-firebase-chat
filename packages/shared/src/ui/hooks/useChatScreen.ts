import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ConversationProps,
  CustomConversationInfo,
  IUserInfo,
  MessageProps,
} from '../../types';
import { isOtherUserTyping } from '../../utils/misc';

// ---------------------------------------------------------------------------
// Service interface — implemented by each platform's FirestoreServices
// ---------------------------------------------------------------------------

export interface ChatScreenConversationData {
  typing?: Record<string, number>;
  unRead?: Record<string, number | string>;
}

export interface ChatScreenService {
  setConversationInfo(
    conversationId: string,
    memberIds: string[],
    partners: IUserInfo[]
  ): void;
  clearConversationInfo(): void;
  getMessageHistory(maxPageSize: number): Promise<MessageProps[]>;
  getMoreMessage(maxPageSize: number): Promise<MessageProps[]>;
  changeReadMessage(messageId: string, userId?: string): Promise<void>;
  createConversation(
    id: string,
    memberIds: string[],
    name?: string,
    image?: string,
    names?: Record<string, string>
  ): Promise<ConversationProps>;
  sendMessage(
    message: MessageProps,
    replyMessage?: MessageProps['replyMessage']
  ): Promise<void>;
  updateMessage(message: MessageProps): Promise<void>;
  getRegexBlacklist(): RegExp | undefined;
  userConversationListener(
    callback: (data: ChatScreenConversationData | undefined) => void
  ): (() => void) | undefined;
  receiveMessageListener(callback: (message: MessageProps) => void): () => void;
  setUserConversationTyping(isTyping: boolean): Promise<void> | undefined;
}

// ---------------------------------------------------------------------------
// Hook params & return
// ---------------------------------------------------------------------------

export interface UseChatScreenParams<TMessage> {
  userInfo?: IUserInfo;
  /** Current conversation id — may be undefined for a brand-new conversation. */
  conversationId?: string;
  memberIds: string[];
  partners: IUserInfo[];
  maxPageSize?: number;
  customConversationInfo?: CustomConversationInfo;
  service: ChatScreenService;
  /**
   * Platform-specific transform: converts a raw Firestore MessageProps into the
   * display message type used by the platform UI (e.g. GiftedChat IMessage on RN,
   * or a plain object on web).
   */
  formatMessage: (raw: MessageProps) => Promise<TMessage>;
  onStartLoad?: () => void;
  onLoadEnd?: () => void;
}

export interface UseChatScreenReturn<TMessage> {
  messages: TMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  isLoadingEarlier: boolean;
  isTyping: boolean;
  userUnreadMessage: boolean;
  /** Send a raw MessageProps — formats optimistically and writes to Firestore. */
  sendMessage: (
    raw: MessageProps,
    replyMessage?: MessageProps['replyMessage']
  ) => Promise<void>;
  /** Update an existing message. */
  updateMessage: (raw: MessageProps) => Promise<void>;
  /** Load the next page of older messages and prepend them. */
  loadEarlier: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChatScreen<TMessage>({
  userInfo,
  conversationId,
  memberIds,
  partners,
  maxPageSize = 20,
  customConversationInfo,
  service,
  formatMessage,
  onStartLoad,
  onLoadEnd,
}: UseChatScreenParams<TMessage>): UseChatScreenReturn<TMessage> {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userUnreadMessage, setUserUnreadMessage] = useState(false);

  // Tracks the live conversation ID — may be set lazily on first send.
  const [resolvedConversationId, setResolvedConversationId] =
    useState(conversationId);

  const isLoadingRef = useRef(false);
  const timeoutMessageRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set to true when sendMessage creates a new conversation so the initial-load
  // effect skips the history fetch (messages are already in state optimistically).
  const conversationCreatedInternally = useRef(false);

  // Keep resolvedConversationId in sync when the prop changes (e.g. navigating
  // to an existing conversation from the list).
  useEffect(() => {
    setResolvedConversationId(conversationId);
  }, [conversationId]);

  // Stable refs so callbacks can read current values without re-subscribing
  const conversationIdRef = useRef(resolvedConversationId);
  conversationIdRef.current = resolvedConversationId;
  const memberIdsRef = useRef(memberIds);
  memberIdsRef.current = memberIds;
  const partnersRef = useRef(partners);
  partnersRef.current = partners;
  const maxPageSizeRef = useRef(maxPageSize);
  maxPageSizeRef.current = maxPageSize;
  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;
  const onStartLoadRef = useRef(onStartLoad);
  onStartLoadRef.current = onStartLoad;
  const onLoadEndRef = useRef(onLoadEnd);
  onLoadEndRef.current = onLoadEnd;
  const formatMessageRef = useRef(formatMessage);
  formatMessageRef.current = formatMessage;

  // ------------------------------------------------------------------
  // Initial load: set up conversation and fetch message history
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!resolvedConversationId) {
      setIsLoadingMessages(false);
      return;
    }

    service.setConversationInfo(
      resolvedConversationId,
      memberIdsRef.current,
      partnersRef.current
    );

    // When sendMessage creates a new conversation, messages are already in state
    // via the optimistic update. Skip the history fetch to avoid overwriting them
    // and showing a loading skeleton for a conversation the user just started.
    if (conversationCreatedInternally.current) {
      conversationCreatedInternally.current = false;
      return;
    }

    onStartLoadRef.current?.();
    setIsLoadingMessages(true);

    service
      .getMessageHistory(maxPageSizeRef.current)
      .then(async (raw) => {
        const formatted = await Promise.all(
          raw.map((m) => formatMessageRef.current(m))
        );
        setMessages(formatted);
        setIsLoadingMessages(false);
        setHasMoreMessages(raw.length === maxPageSizeRef.current);

        const first = raw[0];
        if (first && first.senderId !== userInfoRef.current?.id) {
          service.changeReadMessage(first.id, userInfoRef.current?.id);
        }
        onLoadEndRef.current?.();
      })
      .catch((err) => {
        console.error('[useChatScreen] getMessageHistory error:', err);
        setIsLoadingMessages(false);
        onLoadEndRef.current?.();
      });
  }, [resolvedConversationId, service]);

  // ------------------------------------------------------------------
  // Clean up when leaving the screen
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      service.clearConversationInfo();
      if (timeoutMessageRef.current) clearTimeout(timeoutMessageRef.current);
    };
  }, [service]);

  // ------------------------------------------------------------------
  // Real-time conversation listener (typing, unread counts)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!resolvedConversationId) return;

    const unsubscribe = service.userConversationListener((data) => {
      const userId = userInfoRef.current?.id;
      if (!userId) return;

      const unReads = data?.unRead ?? {};
      const myUnread = (unReads as Record<string, number | string>)[userId];
      const hasUnread = Object.entries(unReads).some(([, v]) => v !== myUnread);
      setUserUnreadMessage(hasUnread);

      if (!hasUnread && timeoutMessageRef.current) {
        clearTimeout(timeoutMessageRef.current);
        timeoutMessageRef.current = null;
      }

      if (data?.typing) {
        setIsTyping(isOtherUserTyping(data.typing, userId));
      }
    });

    return () => unsubscribe?.();
  }, [resolvedConversationId, service]);

  // ------------------------------------------------------------------
  // Real-time new-message listener
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!resolvedConversationId) return;

    const unsubscribe = service.receiveMessageListener(async (raw) => {
      if (userInfoRef.current && raw.senderId === userInfoRef.current.id)
        return;

      const formatted = await formatMessageRef.current(raw);
      setMessages((prev) => [formatted, ...prev]);

      const timeoutId = setTimeout(
        () => service.changeReadMessage(raw.id, userInfoRef.current?.id),
        500
      );
      return () => clearTimeout(timeoutId);
    });

    return () => unsubscribe();
  }, [resolvedConversationId, service]);

  // ------------------------------------------------------------------
  // sendMessage
  // ------------------------------------------------------------------
  const sendMessage = useCallback(
    async (raw: MessageProps, replyMessage?: MessageProps['replyMessage']) => {
      isLoadingRef.current = false;

      // Create conversation on first message if needed
      if (!conversationIdRef.current) {
        const isGroup = memberIdsRef.current.length > 1;
        const info = {
          id: '',
          // name is only meaningful for group conversations; 1:1 display uses the names map
          name: isGroup ? partnersRef.current[0]?.name : undefined,
          image: partnersRef.current[0]?.avatar,
          ...(customConversationInfo ?? {}),
        };
        const created = await service.createConversation(
          info.id,
          memberIdsRef.current,
          info.name,
          info.image,
          info.names
        );
        conversationIdRef.current = created.id;
        service.setConversationInfo(
          created.id,
          memberIdsRef.current,
          partnersRef.current
        );
        // Signal the initial-load effect to skip the history fetch; listeners
        // will be activated by their own effects reacting to resolvedConversationId.
        conversationCreatedInternally.current = true;
        setResolvedConversationId(created.id);
      }

      // Optimistic update — format and prepend immediately
      const regexBlacklist = service.getRegexBlacklist();
      const messageToDisplay = {
        ...raw,
        replyMessage,
        text: regexBlacklist
          ? raw.text.replace(regexBlacklist, (m) => '*'.repeat(m.length))
          : raw.text,
      };
      const formatted = await formatMessageRef.current(messageToDisplay);
      setMessages((prev) => [formatted, ...prev]);

      await service.sendMessage(raw, replyMessage);
    },
    [service, customConversationInfo]
  );

  // ------------------------------------------------------------------
  // updateMessage
  // ------------------------------------------------------------------
  const updateMessage = useCallback(
    async (raw: MessageProps) => {
      // Optimistic update
      const regexBlacklist = service.getRegexBlacklist();
      const messageToDisplay = {
        ...raw,
        text: regexBlacklist
          ? raw.text.replace(regexBlacklist, (m) => '*'.repeat(m.length))
          : raw.text,
      };
      const formatted = await formatMessageRef.current(messageToDisplay);

      setMessages((prev) =>
        prev.map((m) => {
          const mWithLegacy = m as MessageProps & { _id?: string };
          const rawWithLegacy = raw as MessageProps & { _id?: string };
          const mId = mWithLegacy._id || mWithLegacy.id;
          const rawId = rawWithLegacy.id || rawWithLegacy._id;
          return mId === rawId ? formatted : m;
        })
      );

      await service.updateMessage(raw);
    },
    [service]
  );

  // ------------------------------------------------------------------
  // loadEarlier
  // ------------------------------------------------------------------
  const loadEarlier = useCallback(async () => {
    if (isLoadingRef.current || !conversationIdRef.current) return;

    isLoadingRef.current = true;
    setIsLoadingEarlier(true);
    try {
      const raw = await service.getMoreMessage(maxPageSizeRef.current);
      const formatted = await Promise.all(
        raw.map((m) => formatMessageRef.current(m))
      );
      setHasMoreMessages(raw.length === maxPageSizeRef.current);
      setMessages((prev) => [...prev, ...formatted]);
    } catch {
      // intentionally empty
    } finally {
      isLoadingRef.current = false;
      setIsLoadingEarlier(false);
    }
  }, [service]);

  return {
    messages,
    isLoadingMessages,
    hasMoreMessages,
    isLoadingEarlier,
    isTyping,
    userUnreadMessage,
    sendMessage,
    updateMessage,
    loadEarlier,
  };
}
