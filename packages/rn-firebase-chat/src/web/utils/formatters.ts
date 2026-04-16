import { MediaType, MessageProps, LatestMessageProps } from '../types';

/**
 * Formatting utilities matching RN-Firebase-Chat
 */

// Format timestamp for display
export const formatTimestamp = (
  date: Date | string | number,
  format: 'time' | 'date' | 'datetime' | 'relative' = 'relative'
): string => {
  const timestamp = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (!timestamp || isNaN(timestamp.getTime())) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  switch (format) {
    case 'time':
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    case 'date':
      return timestamp.toLocaleDateString();

    case 'datetime':
      return timestamp.toLocaleString();

    case 'relative':
    default:
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return timestamp.toLocaleDateString();
  }
};

// Format message text for display
export const formatMessageText = (message: MessageProps): string => {
  if (!message) return '';

  switch (message.type) {
    case MediaType.text:
      return message.text || '';

    case MediaType.image:
      return '📷 Image';

    case MediaType.video:
      return '🎥 Video';

    case MediaType.file: {
      const fileName = message.path?.split('/').pop() || 'File';
      return `📎 ${fileName}`;
    }

    case MediaType.system:
      return message.text || 'System message';

    default:
      return 'Unknown message type';
  }
};

export const convertToLatestMessage = (
  userId: string,
  name: string,
  message: string,
  type?: MediaType,
  path?: string,
  extension?: string
): LatestMessageProps => ({
  text: message ?? '',
  senderId: userId,
  name: name,
  readBy: {
    [userId]: true,
  },
  type: type ?? MediaType.text,
  path: path ?? '',
  extension: extension ?? '',
});

// Format latest message for conversation list
export const formatLatestMessage = (latestMessage: LatestMessageProps): string => {
  if (!latestMessage) return '';

  const senderName = latestMessage.name || 'Unknown';
  const messageText = formatMessageText({
    type: latestMessage.type || MediaType.text,
    text: latestMessage.text,
    path: latestMessage.path,
    senderId: latestMessage.senderId,
    createdAt: Date.now(),
    readBy: latestMessage.readBy,
  });

  return `${senderName}: ${messageText}`;
};

// Format file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format file extension
export const formatFileExtension = (filename: string): string => {
  if (!filename) return '';
  return filename.split('.').pop()?.toUpperCase() || '';
};

// Format user display name
export const formatUserDisplayName = (
  name: string | undefined | null,
  fallback: string = 'Unknown User'
): string => {
  if (!name || typeof name !== 'string') {
    return fallback;
  }

  return name.trim() || fallback;
};

// Format conversation name
export const formatConversationName = (
  name: string | undefined | null,
  members: string[] = [],
  currentUserId: string = ''
): string => {
  if (name && name.trim()) {
    return name.trim();
  }

  // For direct conversations, use other participant's name
  if (members.length === 2) {
    const otherMember = members.find(id => id !== currentUserId);
    return formatUserDisplayName(otherMember, 'Direct Chat');
  }

  // For group conversations
  if (members.length > 2) {
    return `Group Chat (${members.length} members)`;
  }

  return 'Conversation';
};

// Format message status
export const formatMessageStatus = (
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
): string => {
  switch (status) {
    case 'sending':
      return '⏳';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    case 'failed':
      return '❌';
    default:
      return '';
  }
};

// Format typing indicator
export const formatTypingIndicator = (userNames: string[]): string => {
  if (userNames.length === 0) return '';

  if (userNames.length === 1) {
    return `${userNames[0]} is typing...`;
  }

  if (userNames.length === 2) {
    return `${userNames[0]} and ${userNames[1]} are typing...`;
  }

  return `${userNames[0]} and ${userNames.length - 1} others are typing...`;
};

// Format unread count
export const formatUnreadCount = (count: number): string => {
  if (count <= 0) return '';
  if (count <= 99) return count.toString();
  return '99+';
};

// Format connection status
export const formatConnectionStatus = (
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
): string => {
  switch (status) {
    case 'connected':
      return '🟢 Connected';
    case 'connecting':
      return '🟡 Connecting...';
    case 'disconnected':
      return '🔴 Disconnected';
    case 'error':
      return '❌ Connection Error';
    default:
      return '⚪ Unknown';
  }
};

// Truncate text for display
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
};

// Format duration (for voice messages, etc.)
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `0:${seconds.toString().padStart(2, '0')}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
