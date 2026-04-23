import { MediaType, MessageProps, ConversationProps } from '../types';

/**
 * Validation utilities matching RN-Firebase-Chat
 */

// Validate message data
export const validateMessage = (message: Partial<MessageProps>): boolean => {
  if (!message.senderId || !message.type || !message.createdAt) {
    return false;
  }

  // Validate based on message type
  switch (message.type) {
    case MediaType.text:
      return Boolean(message.text && message.text.trim().length > 0);
    case MediaType.image:
    case MediaType.video:
    case MediaType.file:
      return Boolean(message.path);
    case MediaType.system:
      return Boolean(message.text);
    default:
      return false;
  }
};

// Validate conversation data
export const validateConversation = (
  conversation: Partial<ConversationProps>
): boolean => {
  return Boolean(
    conversation.id &&
    conversation.members &&
    Array.isArray(conversation.members) &&
    conversation.members.length > 0 &&
    conversation.updatedAt
  );
};

// Validate user ID
export const validateUserId = (userId: string): boolean => {
  return Boolean(
    userId && typeof userId === 'string' && userId.trim().length > 0
  );
};

// Validate conversation ID
export const validateConversationId = (conversationId: string): boolean => {
  return Boolean(
    conversationId &&
    typeof conversationId === 'string' &&
    conversationId.trim().length > 0
  );
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate file extension
export const validateFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  if (!filename || !allowedExtensions || allowedExtensions.length === 0) {
    return false;
  }

  const extension = filename.split('.').pop()?.toLowerCase();
  return Boolean(extension && allowedExtensions.includes(extension));
};

// Validate file size
export const validateFileSize = (
  fileSize: number,
  maxSize: number
): boolean => {
  return fileSize > 0 && fileSize <= maxSize;
};

// Validate message text length
export const validateMessageLength = (
  text: string,
  maxLength: number = 1000
): boolean => {
  return Boolean(text && text.length <= maxLength);
};

// Validate array of user IDs
export const validateUserIds = (userIds: string[]): boolean => {
  return (
    Array.isArray(userIds) &&
    userIds.length > 0 &&
    userIds.every((id) => validateUserId(id))
  );
};

// Validate date
export const validateDate = (date: unknown): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Sanitize text input
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 10000); // Limit length for safety
};

// Validate and sanitize conversation name
export const validateConversationName = (
  name: string
): { isValid: boolean; sanitized: string } => {
  const sanitized = sanitizeText(name);
  const isValid = sanitized.length >= 1 && sanitized.length <= 100;

  return { isValid, sanitized };
};
