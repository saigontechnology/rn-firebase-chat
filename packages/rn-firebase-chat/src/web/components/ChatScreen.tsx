import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useChatContext } from '../context/ChatProvider';
import { FileUploader } from '../addons/fileUpload/FileUploader';
import { useChat } from '../hooks/useChat';
import { useTyping } from '../hooks/useTyping';
import {
  Message,
  MediaType,
  ReplyMessagePreview,
  IUser,
  ConversationProps,
  InputToolbarProps,
  CustomConversationInfo,
} from '../types';
import { ChatService } from '../services/chat';
import { UserService } from '../services/user';
import { ButtonMaterialIcon } from './ButtonMaterialIcon';
import './ChatScreen.css';
import { ChatHeader } from './ChatHeader';
import { generateConversationId } from '../utils/conversation';
import { decryptedMessageData } from '../utils/encryption';
import ChatList, { ChatListProps } from './ChatList';
import { ChatNewModal, ChatNewModalRef } from './ChatNewModal';
import {
  DEFAULT_TYPING_TIMEOUT_SECONDS,
  DEFAULT_CLEAR_SEND_NOTIFICATION,
} from '../utils/constants';

export interface ChatScreenProps {
  conversationId?: string;
  partners?: Array<IUser>;
  style?: React.CSSProperties;
  className?: string;
  onSend?: (messages: Message[]) => void;
  showFileUpload?: boolean;
  isGroup?: boolean;
  renderHeader?: () => React.ReactNode;
  renderChatList?: (props: ChatListProps) => React.ReactNode;
  renderChatNewModal?: (props: {
    onUserSelect: (user: { id: string; name: string; avatar?: string }) => void;
  }) => React.ReactNode;

  // --- RN-compatible props ---

  /** Custom input toolbar configuration (matching rn-firebase-chat) */
  inputToolbarProps?: InputToolbarProps;
  /** Override conversation id/name/image (matching rn-firebase-chat) */
  customConversationInfo?: CustomConversationInfo;
  /** Message pagination size (default: 50, matching rn-firebase-chat maxPageSize) */
  maxPageSize?: number;
  /** Toggle read receipt display (default: true) */
  messageStatusEnable?: boolean;
  /** Custom JSX for sent/seen indicators */
  customMessageStatus?: (hasUnread: boolean) => React.ReactNode;
  /** Custom text for "Sent" status */
  unReadSentMessage?: string;
  /** Custom text for "Seen" status */
  unReadSeenMessage?: string;
  /** Enable typing indicator (default: true) */
  enableTyping?: boolean;
  /** Typing indicator timeout in ms (default: 3000) */
  typingTimeoutSeconds?: number;
  /** Callback when messages start loading */
  onStartLoad?: () => void;
  /** Callback when messages finish loading */
  onLoadEnd?: () => void;
  /** Callback to trigger push notifications after send */
  sendMessageNotification?: () => void;
  /** Delay before sending notification in ms (default: 3000) */
  timeoutSendNotify?: number;
  /** Enable search bar in conversation list */
  hasSearchBar?: boolean;
  /** Search bar placeholder */
  searchPlaceholder?: string;
  /** Search debounce delay in ms */
  searchDebounceDelay?: number;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  partners = [],
  style,
  className = '',
  onSend: _onSend,
  showFileUpload = true,
  isGroup = false,
  renderHeader,
  renderChatList,
  renderChatNewModal,
  inputToolbarProps,
  customConversationInfo,
  maxPageSize = 50,
  messageStatusEnable = true,
  customMessageStatus,
  unReadSentMessage,
  unReadSeenMessage,
  enableTyping = true,
  typingTimeoutSeconds = DEFAULT_TYPING_TIMEOUT_SECONDS,
  onStartLoad,
  onLoadEnd,
  sendMessageNotification,
  timeoutSendNotify = DEFAULT_CLEAR_SEND_NOTIFICATION,
  hasSearchBar = true,
  searchPlaceholder,
  searchDebounceDelay,
}) => {
  const { currentUser, derivedKey, blackListRegex, prefix, storageProvider } =
    useChatContext();
  const [showUploader, setShowUploader] = useState(false);
  // Edit/reply state (matching rn-firebase-chat ChatScreen pattern)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyMessage, setReplyMessage] = useState<ReplyMessagePreview | null>(
    null
  );
  const [inputText, setInputText] = useState('');

  const chatNewModalRef = useRef<ChatNewModalRef>(null);

  // Keep a ref so the subscription callback always reads the latest key
  const derivedKeyRef = useRef(derivedKey);
  // Track whether we've already auto-selected the first conversation
  const hasAutoSelectedRef = useRef(!!conversationId);
  useEffect(() => {
    derivedKeyRef.current = derivedKey;
  }, [derivedKey]);

  // Configure ChatService with userInfo, prefix, blacklist, and storageProvider.
  // userInfo MUST be set before setConversationInfo/sendMessage run — those
  // methods access this.userId which throws if userInfo is missing.
  useEffect(() => {
    const chatService = ChatService.getInstance();
    if (currentUser) {
      chatService.configuration({
        userInfo: {
          id: `${currentUser.id}`,
          name: currentUser.name ?? '',
          avatar: currentUser.avatar,
        },
      });
    }
    chatService.setPrefix(prefix);
    chatService.setBlackListRegex(blackListRegex);
    if (storageProvider) {
      chatService.setStorageProvider(storageProvider);
    }
  }, [currentUser, prefix, blackListRegex, storageProvider]);

  // Resolve effective conversationId from customConversationInfo
  const effectiveConversationId = customConversationInfo?.id || conversationId;

  // Conversations list from users/{userId}/conversations
  const [conversations, setConversations] = useState<Array<ConversationProps>>(
    []
  );
  const rawConversationsRef = useRef<ConversationProps[]>([]);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(effectiveConversationId);
  const selectedConversationIdRef = useRef(selectedConversationId);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);
  const [selectedName, setSelectedName] = useState<string>(
    customConversationInfo?.name || ''
  );

  // Selected partners in the selected conversation
  const [selectedPartners, setSelectedPartners] =
    useState<Array<IUser>>(partners);

  // Resolve partner info (name + avatar) from a conversation object
  const resolvePartners = useCallback(
    (conversation: ConversationProps) => {
      const partnerIds = conversation.members.filter(
        (m: string) => m !== `${currentUser?.id}`
      );

      if (conversation.image) {
        // Conversation has avatar image — use it directly, no async needed
        setSelectedPartners(
          partnerIds.map((m: string) => ({
            id: m,
            name: conversation.name,
            avatar: conversation.image,
          }))
        );
      } else if (partnerIds.length > 0) {
        // No image — look up user docs (single setState to avoid flicker)
        const userService = UserService.getInstance();
        Promise.all(partnerIds.map((pid) => userService.getUserById(pid))).then(
          (users) => {
            const resolved = users
              .filter((u): u is NonNullable<typeof u> => u !== null)
              .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));
            if (resolved.length > 0) {
              setSelectedPartners(resolved);
            } else {
              // Fallback: use conversation data if user lookup returned nothing
              setSelectedPartners(
                partnerIds.map((m: string) => ({
                  id: m,
                  name: conversation.name,
                  avatar: undefined,
                }))
              );
            }
          }
        );
      }
    },
    [currentUser?.id]
  );

  const memberIds = useMemo(
    () => [
      ...new Set([`${currentUser.id}`, ...selectedPartners.map((p) => p.id)]),
    ],
    [currentUser.id, selectedPartners]
  );

  // Keep ChatService.conversationId in sync with the UI-selected conversation so
  // stateful methods (sendMessage, sendMessageWithFile, etc.) know where to write.
  useEffect(() => {
    const convId = selectedConversationId || effectiveConversationId;
    const chatService = ChatService.getInstance();
    if (convId) {
      const myId = `${currentUser.id}`;
      const others = memberIds.filter((id) => id !== myId);
      const partnersForService = selectedPartners.map((p) => ({
        id: p.id,
        name: p.name ?? '',
        avatar: p.avatar,
      }));
      chatService.setConversationInfo(convId, others, partnersForService);
    } else {
      chatService.clearConversationInfo();
    }
  }, [
    selectedConversationId,
    effectiveConversationId,
    memberIds,
    selectedPartners,
    currentUser.id,
  ]);

  const partnerUserMap = useMemo(() => {
    const map = new Map<string, IUser>();
    selectedPartners.forEach((u) => map.set(u.id, u));
    return map;
  }, [selectedPartners]);

  /**
   * Derived from the already-live conversations list — no extra Firestore listener needed.
   * Same logic as rn-firebase-chat useChatScreen: true when any other member has a
   * different unRead count than me (they haven't read my last message yet → "Sent").
   */
  const userUnreadMessage = useMemo(() => {
    const convId = selectedConversationId || effectiveConversationId;
    if (!convId || !currentUser?.id) return false;
    const conv = conversations.find((c) => c.id === convId);
    if (!conv?.unRead) return false;
    const myId = String(currentUser.id);
    const myUnread = conv.unRead[myId] ?? 0;
    return Object.entries(conv.unRead).some(
      ([uid, v]) => uid !== myId && v !== myUnread
    );
  }, [
    conversations,
    selectedConversationId,
    effectiveConversationId,
    currentUser?.id,
  ]);

  const chatName = useMemo(
    () =>
      isGroup
        ? `group_${currentUser.name},${selectedPartners.map((p) => p.name).join(',')}`
        : selectedPartners.find((p) => p.id !== currentUser.id)?.name ||
          selectedName,
    [isGroup, currentUser.id, currentUser.name, selectedPartners, selectedName]
  );

  const { messages, loading, error, sendMessage, updateMessage, markAsRead } =
    useChat({
      user: currentUser,
      conversationId: selectedConversationId || effectiveConversationId,
      memberIds,
      name: chatName,
    });

  // Derive typing data from the already-live conversations state (no extra listener)
  const selectedConversationTyping = useMemo(() => {
    const convId = selectedConversationId || effectiveConversationId;
    if (!convId) return undefined;
    return conversations.find((c) => c.id === convId)?.typing;
  }, [conversations, selectedConversationId, effectiveConversationId]);

  // Typing hook — write side only; read side comes from subscribeToUserConversations
  const { typingUsers, setTyping } = useTyping(
    selectedConversationId || effectiveConversationId || '',
    `${currentUser.id}`,
    typingTimeoutSeconds,
    selectedConversationTyping
  );

  // Lifecycle callbacks
  useEffect(() => {
    if (loading) {
      onStartLoad?.();
    } else {
      onLoadEnd?.();
    }
  }, [loading, onStartLoad, onLoadEnd]);

  const convertedUser = useMemo<IUser>(
    () =>
      currentUser
        ? {
            id: currentUser.id.toString(),
            name: currentUser.name || 'Unknown User',
            avatar: currentUser.avatar,
          }
        : { id: '', name: 'Unknown User', avatar: undefined },
    [currentUser]
  );

  // Re-decrypt cached conversations when derivedKey first resolves
  useEffect(() => {
    if (!derivedKey || rawConversationsRef.current.length === 0) return;
    Promise.all(
      rawConversationsRef.current.map(async (c) => {
        if (!c.latestMessage?.text) return c;
        return {
          ...c,
          latestMessage: {
            ...c.latestMessage,
            text: await decryptedMessageData(c.latestMessage.text, derivedKey),
          },
        };
      })
    ).then(setConversations);
  }, [derivedKey]);

  // Stable subscription — never torn down unless currentUser changes
  useEffect(() => {
    const chatService = ChatService.getInstance();
    if (!currentUser?.id) return;
    const unsubscribe = chatService.subscribeToUserConversations(
      `${currentUser.id}`,
      async (items) => {
        rawConversationsRef.current = items;
        const key = derivedKeyRef.current;
        const decrypted = await Promise.all(
          items.map(async (c) => {
            if (!c.latestMessage?.text || !key) return c;
            return {
              ...c,
              latestMessage: {
                ...c.latestMessage,
                text: await decryptedMessageData(c.latestMessage.text, key),
              },
            };
          })
        );
        setConversations(decrypted);
        // Auto-select first conversation only once
        if (!hasAutoSelectedRef.current && decrypted.length > 0) {
          hasAutoSelectedRef.current = true;
          const first = decrypted[0];
          setSelectedConversationId(first?.id);
          setSelectedName(first?.name || '');
          setSelectedPartners(
            (first?.members ?? [])
              .filter((m: string) => m !== `${currentUser?.id}`)
              .map((m: string) => ({ id: m }))
          );
        }
      }
    );
    return () => unsubscribe?.();
  }, [currentUser?.id]);

  // Mark as read when the conversation is selected or when new messages arrive while viewing.
  // This ensures unread is never incremented for a user who is actively on the screen.
  useEffect(() => {
    const convId = selectedConversationId || effectiveConversationId;
    if (!convId || messages.length === 0) return;
    markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, effectiveConversationId, messages.length]);

  // Track which conversation ID we've already resolved partners for.
  // Without this, the effect would fire on every conversation-list update
  // (new message, unread change, etc.) and trigger N getUserById reads each time.
  const resolvedConvIdRef = useRef<string | undefined>(undefined);

  // Resolve partner avatars — only when the selected conversation actually changes,
  // not on every conversations-list update (which would re-fire on every message).
  useEffect(() => {
    const convId = selectedConversationId || effectiveConversationId;
    if (!convId || conversations.length === 0) return;
    // Skip if we already resolved this exact conversation
    if (resolvedConvIdRef.current === convId) return;
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      resolvedConvIdRef.current = convId;
      resolvePartners(conv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, selectedConversationId, effectiveConversationId]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      try {
        await sendMessage(text, replyMessage ?? undefined);

        // Notification callback with configurable delay
        if (sendMessageNotification) {
          setTimeout(() => {
            sendMessageNotification();
          }, timeoutSendNotify);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [sendMessage, replyMessage, sendMessageNotification, timeoutSendNotify]
  );

  const handleSendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (editingMessage) {
        // Edit mode: update the existing message (matching rn-firebase-chat onSend with editingMessage)
        await updateMessage(editingMessage.id, text.trim());
        setEditingMessage(null);
        setInputText('');
      } else {
        // Normal send — attach reply data if present (matching rn-firebase-chat)
        await handleSendMessage(text);
        if (replyMessage) {
          setReplyMessage(null);
        }
        markAsRead();
      }
    },
    [editingMessage, replyMessage, updateMessage, handleSendMessage, markAsRead]
  );

  // Handle edit request from MessageList (matching mobile onLongPressMessage)
  const handleEditMessage = useCallback((message: Message) => {
    setEditingMessage(message);
    setInputText(message.text);
    setReplyMessage(null);
  }, []);

  // Handle reply request from MessageList (matching mobile swipe reply)
  const handleReplyMessage = useCallback(
    (message: Message) => {
      const partner = partnerUserMap.get(message.userId);
      setReplyMessage({
        id: message.id,
        text: message.text,
        userId: message.userId,
        userName:
          message.userId === String(currentUser.id)
            ? currentUser.name
            : partner?.name,
      });
      setEditingMessage(null);
    },
    [partnerUserMap, currentUser]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (enableTyping) {
        setTyping(isTyping);
      }
    },
    [enableTyping, setTyping]
  );

  const startChatWithUser = useCallback(
    async (targetUser: IUser) => {
      try {
        const chatService = ChatService.getInstance();
        const memberAvatars: Record<string, string> = {};
        if (currentUser.avatar)
          memberAvatars[`${currentUser.id}`] = currentUser.avatar;
        if (targetUser.avatar) memberAvatars[targetUser.id] = targetUser.avatar;
        const newId = await chatService.createConversation(
          [`${currentUser.id}`, targetUser.id],
          `${currentUser.id}`,
          'private',
          currentUser.name,
          targetUser.name,
          generateConversationId([`${currentUser.id}`, targetUser.id]),
          memberAvatars
        );
        chatNewModalRef.current?.hide();
        setSelectedConversationId(newId);
        setSelectedName(targetUser.name || '');
        setSelectedPartners([targetUser]);
      } catch (e) {
        console.error('Failed to start chat', e);
      }
    },
    [currentUser?.id, currentUser?.name, currentUser?.avatar]
  );

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      setShowUploader(false);
      const convId = selectedConversationId || effectiveConversationId;
      if (!convId) return;

      // Attach the active reply (if any) to the first file only, then clear it
      // so subsequent files in the batch don't re-quote the same message.
      const replyToAttach = replyMessage ?? undefined;
      if (replyMessage) setReplyMessage(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        try {
          const { downloadURL } = await ChatService.getInstance().uploadFile(
            file,
            convId
          );
          const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
          const type = file.type.startsWith('image/')
            ? MediaType.image
            : file.type.startsWith('video/')
              ? MediaType.video
              : MediaType.file;

          await ChatService.getInstance().sendMessage(
            {
              text: '',
              type,
              path: downloadURL,
              extension: ext,
              senderId: currentUser.id.toString(),
              readBy: { [currentUser.id]: true },
            },
            i === 0 ? replyToAttach : undefined
          );
        } catch (err) {
          console.error('Failed to upload file:', err);
        }
      }
    },
    [
      selectedConversationId,
      effectiveConversationId,
      currentUser,
      memberIds,
      replyMessage,
      chatName,
    ]
  );

  const handleSelectConversation = useCallback(
    (conversation: ConversationProps) => {
      resolvedConvIdRef.current = conversation.id; // mark resolved before resolvePartners sets state
      setSelectedConversationId(conversation.id);
      setSelectedName(conversation.name || '');
      resolvePartners(conversation);
    },
    [resolvePartners]
  );

  if (error) {
    return (
      <div className={`chat-screen error ${className}`} style={style}>
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Determine whether to show camera/gallery buttons from inputToolbarProps
  const showCamera = inputToolbarProps?.hasCamera ?? false;
  const showGallery = inputToolbarProps?.hasGallery ?? false;
  const showFileUploadBtn = showFileUpload && !inputToolbarProps;

  return (
    <div className={`chat-screen ${className}`} style={style}>
      {/* Main Content */}
      <div
        className={`main-content${selectedConversationId ? ' has-conversation' : ''}`}
      >
        {/* Sidebar - Conversations */}
        {renderChatList ? (
          renderChatList({
            openNewChatFunc: () => chatNewModalRef.current?.show(),
            conversations,
            selectedConversationId: selectedConversationId || '',
            handleSelectConversation,
            hasSearchBar,
            searchPlaceholder,
            searchDebounceDelay,
          })
        ) : (
          <ChatList
            openNewChatFunc={() => chatNewModalRef.current?.show()}
            conversations={conversations}
            selectedConversationId={selectedConversationId || ''}
            handleSelectConversation={handleSelectConversation}
            hasSearchBar={hasSearchBar}
            searchPlaceholder={searchPlaceholder}
            searchDebounceDelay={searchDebounceDelay}
          />
        )}

        {/* Chat Panel */}
        <section className="chat-panel">
          {!selectedConversationId ? (
            <div className="chat-panel-empty">
              <div className="chat-panel-empty-icon">
                <svg
                  width="64"
                  height="64"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#d1d5db"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="chat-panel-empty-title">Select a conversation</p>
              <p className="chat-panel-empty-subtitle">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          ) : (
            <>
              {/* App Header */}
              {renderHeader ? (
                renderHeader()
              ) : (
                <ChatHeader
                  name={
                    customConversationInfo?.name ||
                    selectedName ||
                    selectedPartners[0]?.name ||
                    '...'
                  }
                  partner={selectedPartners[0] ?? null}
                  onBack={() => setSelectedConversationId(undefined)}
                />
              )}

              <div className="messages-container">
                {loading ? (
                  <div className="panel-loading">
                    <div className="spinner" />
                  </div>
                ) : (
                  <>
                    <MessageList
                      messages={messages}
                      currentUser={convertedUser}
                      partnerUsers={selectedPartners}
                      onMessageUpdate={(message) =>
                        console.log('Message updated:', message)
                      }
                      onMessageDelete={(messageId) =>
                        console.log('Delete message:', messageId)
                      }
                      onEdit={handleEditMessage}
                      onReply={handleReplyMessage}
                      messageStatusEnable={messageStatusEnable}
                      customMessageStatus={customMessageStatus}
                      unReadSentMessage={unReadSentMessage}
                      unReadSeenMessage={unReadSeenMessage}
                      maxPageSize={maxPageSize}
                      userUnreadMessage={userUnreadMessage}
                    />
                    {enableTyping && (
                      <TypingIndicator typingUsers={typingUsers} />
                    )}
                  </>
                )}
              </div>

              <div className="panel-input">
                {/* Editing banner — matching rn-firebase-chat renderAccessory */}
                {editingMessage && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 15px',
                      backgroundColor: '#fff',
                      borderTop: '1px solid #EEE',
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        alignSelf: 'stretch',
                        backgroundColor: '#007AFF',
                        borderRadius: 2,
                        marginRight: 10,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#007AFF',
                          marginBottom: 2,
                        }}
                      >
                        Editing Message
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: '#666',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {editingMessage.text}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingMessage(null);
                        setInputText('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: 20,
                        padding: '0 0 0 10px',
                        lineHeight: 1,
                      }}
                      title="Cancel editing"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Reply banner — matching rn-firebase-chat reply.message preview */}
                {!editingMessage && replyMessage && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 15px',
                      backgroundColor: '#fff',
                      borderTop: '1px solid #EEE',
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        alignSelf: 'stretch',
                        backgroundColor: '#34C759',
                        borderRadius: 2,
                        marginRight: 10,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#34C759',
                          marginBottom: 2,
                        }}
                      >
                        Replying to {replyMessage.userName || ''}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: '#666',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {replyMessage.text}
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyMessage(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: 20,
                        padding: '0 0 0 10px',
                        lineHeight: 1,
                      }}
                      title="Cancel reply"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div
                  className="input-box"
                  style={inputToolbarProps?.containerStyle}
                >
                  {/* Camera button from inputToolbarProps */}
                  {showCamera && (
                    <ButtonMaterialIcon
                      className="attach-btn"
                      title="Camera"
                      icon={inputToolbarProps?.cameraIcon || 'photo_camera'}
                      onClick={inputToolbarProps?.onPressCamera}
                    />
                  )}
                  {/* Gallery button from inputToolbarProps */}
                  {showGallery && (
                    <ButtonMaterialIcon
                      className="attach-btn"
                      title="Gallery"
                      icon={inputToolbarProps?.galleryIcon || 'photo_library'}
                      onClick={inputToolbarProps?.onPressGallery}
                    />
                  )}
                  {/* Default file upload button */}
                  {showFileUploadBtn && (
                    <ButtonMaterialIcon
                      className="attach-btn"
                      title="Attach file"
                      icon="attach_file"
                      onClick={() => setShowUploader(true)}
                    />
                  )}
                  <div className="input-flex">
                    <MessageInput
                      onSendMessage={handleSendTextMessage}
                      onTyping={handleTyping}
                      placeholder={
                        editingMessage
                          ? 'Edit your message...'
                          : 'Type your message...'
                      }
                      className="message-input-reset"
                      value={editingMessage ? inputText : undefined}
                      onValueChange={editingMessage ? setInputText : undefined}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* File Uploader Modal */}
      {showUploader && (
        <div className="uploader-modal">
          <div className="uploader-content">
            <FileUploader
              onFileSelect={handleFileUpload}
              onUploadComplete={(urls) => console.log('Upload complete:', urls)}
              onError={(error) => console.error('Upload error:', error)}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              multiple
              maxFiles={5}
              customUploadFn={
                storageProvider
                  ? (file) =>
                      ChatService.getInstance()
                        .uploadFile(
                          file,
                          selectedConversationId ||
                            effectiveConversationId ||
                            ''
                        )
                        .then((r) => r.downloadURL)
                  : undefined
              }
            />
            <ButtonMaterialIcon
              className="close-uploader"
              title="Close uploader"
              icon="close"
              onClick={() => setShowUploader(false)}
            />
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {renderChatNewModal ? (
        renderChatNewModal({
          onUserSelect: startChatWithUser,
        })
      ) : (
        <ChatNewModal ref={chatNewModalRef} onUserSelect={startChatWithUser} />
      )}
    </div>
  );
};
