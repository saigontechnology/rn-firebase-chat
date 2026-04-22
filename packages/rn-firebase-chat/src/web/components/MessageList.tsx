import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Message, MessageListProps, IUser } from '../types';
import { UserAvatar } from './UserAvatar';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
  isFirstInGroup: boolean;
  showDateSeparator: boolean;
  isLastOwnMessage: boolean;
  isSeen: boolean;
  partnerUser?: IUser;
  onDelete?: (messageId: string) => void;
  onEdit?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onPreviewImage?: (url: string) => void;
  messageStatusEnable?: boolean;
  customMessageStatus?: (hasUnread: boolean) => React.ReactNode;
  sentMessageLabel?: string;
  seenMessageLabel?: string;
}

const ImagePreviewModal: React.FC<{ url: string; onClose: () => void }> = ({
  url,
  onClose,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none"
      >
        ×
      </button>
      <img
        src={url}
        alt="Preview"
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const DateSeparator: React.FC<{ date: number }> = ({ date }) => {
  const label = isToday(date)
    ? 'Today'
    : isYesterday(date)
      ? 'Yesterday'
      : format(date, 'MMM d, yyyy');

  return (
    <div className="flex justify-center my-3">
      <span className="bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
};

const MessageStatus: React.FC<{
  isSeen: boolean;
  sentLabel?: string;
  seenLabel?: string;
}> = ({ isSeen, sentLabel = 'Sent', seenLabel = 'Seen' }) => (
  <span
    className="flex items-center gap-0.5"
    title={isSeen ? seenLabel : sentLabel}
    aria-label={isSeen ? seenLabel : sentLabel}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isSeen ? '#3b82f6' : '#9ca3af'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>

    {isSeen && (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginLeft: '-8px' }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </span>
);

/** Reply quote preview inside a bubble (matching rn-firebase-chat) */
const ReplyPreview: React.FC<{
  replyMessage: Message['replyMessage'];
  isOwn: boolean;
}> = ({ replyMessage, isOwn }) => {
  if (!replyMessage) return null;
  return (
    <div
      className={`mb-1.5 px-2 py-1 rounded-lg border-l-4 text-xs max-w-full ${
        isOwn
          ? 'bg-blue-400/30 border-blue-200 text-blue-100'
          : 'bg-gray-200 border-gray-400 text-gray-600'
      }`}
    >
      {replyMessage.userName && (
        <div className="font-semibold mb-0.5 truncate">
          {replyMessage.userName}
        </div>
      )}
      <div className="truncate opacity-90">{replyMessage.text}</div>
    </div>
  );
};

const MessageItem = React.memo(function MessageItem({
  message,
  isOwn,
  showAvatar,
  isLastInGroup,
  isFirstInGroup,
  showDateSeparator,
  isLastOwnMessage,
  isSeen,
  partnerUser,
  onDelete,
  onEdit,
  onReply,
  onPreviewImage,
  messageStatusEnable = true,
  customMessageStatus,
  sentMessageLabel = 'Sent',
  seenMessageLabel = 'Seen',
}: MessageItemProps) {
  const formattedTime = useMemo(
    () => format(message.createdAt, 'h:mm a'),
    [message.createdAt]
  );

  const bubbleRadius = useMemo(() => {
    const base = '18px';
    const small = '4px';
    if (isOwn) {
      return {
        borderTopLeftRadius: base,
        borderBottomLeftRadius: base,
        borderTopRightRadius: isFirstInGroup ? base : small,
        borderBottomRightRadius: isLastInGroup ? base : small,
      };
    }
    return {
      borderTopRightRadius: base,
      borderBottomRightRadius: base,
      borderTopLeftRadius: isFirstInGroup ? base : small,
      borderBottomLeftRadius: isLastInGroup ? base : small,
    };
  }, [isOwn, isFirstInGroup, isLastInGroup]);

  const isMedia = message.type === 'image' || message.type === 'file';

  return (
    <div className="animate-fade-in">
      {showDateSeparator && <DateSeparator date={message.createdAt} />}

      {/* `group` enables CSS-only hover for timestamp + action buttons — no React state */}
      <div
        className={`group flex items-end ${
          isLastInGroup ? 'mb-4' : 'mb-0.5'
        } ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar slot for received messages */}
        {!isOwn && (
          <div className="w-8 h-8 mr-1.5 flex-shrink-0 self-end">
            {showAvatar && (
              <UserAvatar
                user={
                  partnerUser || { id: message.userId, name: message.userId }
                }
                size="small"
              />
            )}
          </div>
        )}

        <div
          className={`max-w-xs lg:max-w-sm relative flex flex-col ${
            isOwn ? 'items-end' : 'items-start'
          }`}
        >
          {/* Sender name for received group messages */}
          {!isOwn && isFirstInGroup && partnerUser?.name && (
            <span className="text-xs text-gray-500 mb-1 ml-1 hm-msg-sender-name">
              {partnerUser.name}
            </span>
          )}

          {/* Bubble — transparent (no padding / no background) for media so the
              attachment renders cleanly without the colored text-bubble behind it. */}
          <div
            className={
              isMedia
                ? 'relative'
                : `px-3 py-2 relative ${
                    isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`
            }
            style={isMedia ? undefined : bubbleRadius}
          >
            {/* Mid-group timestamp — above the bubble, no layout impact */}
            {!isLastInGroup && (
              <span
                className={`absolute -top-6 text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-sm ${
                  isOwn ? 'right-0' : 'left-0'
                }`}
              >
                {formattedTime}
              </span>
            )}

            {/* Reply preview (matching rn-firebase-chat) */}
            {message.replyMessage && (
              <ReplyPreview replyMessage={message.replyMessage} isOwn={isOwn} />
            )}

            {message.type === 'image' && message.metadata?.imageUrl ? (
              <div className="space-y-1">
                <img
                  src={message.metadata.imageUrl}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-xl cursor-zoom-in"
                  loading="lazy"
                  onClick={() => onPreviewImage?.(message.metadata!.imageUrl!)}
                />
                {message.text && <p className="text-sm">{message.text}</p>}
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words leading-snug">
                {message.text}
              </p>
            )}

            {/* (Edited) badge — matching rn-firebase-chat isEdited flag */}
            {message.isEdited && (
              <span
                className={`text-xs ml-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}
              >
                (Edited)
              </span>
            )}
          </div>

          {/* Timestamp — always visible on last of group */}
          {isLastInGroup && (
            <span
              className={`text-xs text-gray-500 mt-0.5 px-2 py-0.5 ${
                isOwn ? 'self-end' : 'self-start'
              }`}
            >
              {formattedTime}
            </span>
          )}

          {/* Message status */}
          {messageStatusEnable && isLastOwnMessage && (
            <div className="mt-0.5 mr-1 self-end">
              {customMessageStatus ? (
                customMessageStatus(!isSeen)
              ) : (
                <MessageStatus
                  isSeen={isSeen}
                  sentLabel={sentMessageLabel}
                  seenLabel={seenMessageLabel}
                />
              )}
            </div>
          )}
        </div>

        {/* Action buttons — CSS-only visibility, matching mobile long-press actions */}
        <div
          className={`flex space-x-1 mx-2 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
        >
          {/* Reply — available for all messages */}
          <button
            onClick={() => onReply?.(message)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Reply"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
          {/* Edit — own messages only (matching mobile onLongPressMessage) */}
          {isOwn && (
            <button
              onClick={() => onEdit?.(message)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Edit message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {/* Delete — own messages only */}
          {isOwn && (
            <button
              onClick={() => onDelete?.(message.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Delete message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export const MessageList: React.FC<
  MessageListProps & { partnerUsers?: IUser[] }
> = ({
  messages,
  currentUser,
  partnerUsers,
  onMessageUpdate: _onMessageUpdate,
  onMessageDelete,
  onEdit,
  onReply,
  className = '',
  messageStatusEnable = true,
  customMessageStatus,
  unReadSentMessage,
  unReadSeenMessage,
  maxPageSize,
  userUnreadMessage = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  // Saved scrollHeight before prepending older messages — used to restore position
  const prevScrollHeightRef = useRef(0);
  // Tracks the id of the last rendered message so we can detect new arrivals.
  const lastMessageIdRef = useRef<string | undefined>(undefined);

  // Reset pagination when conversation changes (messages go empty)
  useEffect(() => {
    if (messages.length === 0) setPageCount(1);
  }, [messages.length]);

  // Scroll to bottom when a new message arrives.
  // - Own messages (text or file) always scroll — the sender should see what they just sent.
  // - Messages from others only scroll if the user is already near the bottom.
  useEffect(() => {
    if (!containerRef.current || messages.length === 0) {
      lastMessageIdRef.current = messages[messages.length - 1]?.id;
      return;
    }
    const last = messages[messages.length - 1];
    const isNewMessage = last?.id !== lastMessageIdRef.current;
    lastMessageIdRef.current = last?.id;
    if (!isNewMessage) return;

    const isOwn = last?.userId === currentUser.id;
    if (isOwn || autoScroll) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll, currentUser.id]);

  const displayedMessages = useMemo(() => {
    if (!maxPageSize) return messages;
    return messages.slice(
      Math.max(0, messages.length - pageCount * maxPageSize)
    );
  }, [messages, pageCount, maxPageSize]);

  const hasMore = !!maxPageSize && messages.length > pageCount * maxPageSize;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    // Save scroll height before older messages are prepended so we can restore position
    if (containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
    }
    setPageCount((p) => p + 1);
  }, [hasMore]);

  // After older messages are prepended, restore scroll position so the view doesn't jump
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current && containerRef.current) {
      const added =
        containerRef.current.scrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop += added;
      prevScrollHeightRef.current = 0;
    }
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Auto-scroll is active when the user is near the bottom (newest messages)
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
    // Load older messages when the user scrolls near the top
    if (scrollTop < 40) loadMore();
  }, [loadMore]);

  // O(1) partner lookup — rebuilt only when partnerUsers reference changes
  const partnerUserMap = useMemo(() => {
    const map = new Map<string, IUser>();
    partnerUsers?.forEach((u) => map.set(u.id, u));
    return map;
  }, [partnerUsers]);

  // Render in natural order: oldest at top, newest at bottom
  const renderedMessages = displayedMessages;

  const isLastOwnMessageSeen = !userUnreadMessage;

  if (messages.length === 0) {
    return (
      <div
        className={`flex-1 flex items-center justify-center p-8 bg-white ${className}`}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto bg-white px-4 py-4 ${className}`}
    >
      {/* "Load earlier" sits at the top — that's where older messages live */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <button
            onClick={loadMore}
            className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}
      {renderedMessages.map((message, index) => {
        const isOwn = message.userId === currentUser.id;
        // Natural order: prevMessage is chronologically older (visually above),
        // nextMessage is chronologically newer (visually below).
        const prevMessage = index > 0 ? renderedMessages[index - 1] : null;
        const nextMessage =
          index < renderedMessages.length - 1
            ? renderedMessages[index + 1]
            : null;

        // isFirstInGroup: no message from the same user immediately above this one
        const isFirstInGroup =
          !prevMessage || prevMessage.userId !== message.userId;
        // isLastInGroup: no message from the same user immediately below this one
        const isLastInGroup =
          !nextMessage || nextMessage.userId !== message.userId;

        // Show a date separator above the first message of each day.
        // prevMessage is chronologically older (visually above); separator fires when the day changes.
        const showDateSeparator =
          !prevMessage ||
          !isSameDay(
            new Date(message.createdAt),
            new Date(prevMessage.createdAt)
          );

        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={isOwn}
            showAvatar={!isOwn && isLastInGroup}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            showDateSeparator={showDateSeparator}
            // last index = newest own message (chronologically last sent)
            isLastOwnMessage={isOwn && index === renderedMessages.length - 1}
            isSeen={isLastOwnMessageSeen}
            partnerUser={
              partnerUserMap.get(message.userId) ?? partnerUsers?.[0]
            }
            onDelete={onMessageDelete}
            onEdit={onEdit}
            onReply={onReply}
            onPreviewImage={setPreviewImageUrl}
            messageStatusEnable={messageStatusEnable}
            customMessageStatus={customMessageStatus}
            sentMessageLabel={unReadSentMessage}
            seenMessageLabel={unReadSeenMessage}
          />
        );
      })}
      {previewImageUrl && (
        <ImagePreviewModal
          url={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </div>
  );
};
