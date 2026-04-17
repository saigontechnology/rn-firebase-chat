export const isOtherUserTyping = (
  typingData: Record<string, boolean>,
  currentUserId: string
): boolean => {
  return Object.keys(typingData).some(
    (userId) => userId !== currentUserId && typingData[userId] === true
  );
};

/**
 * Generates a deterministic conversation ID from participant user IDs.
 * If a groupId is provided it is returned directly (group conversations).
 */
export const generateConversationId = (
  userIds: string[],
  groupId?: string
): string => {
  if (groupId && typeof groupId === 'string' && groupId.trim().length > 0) {
    return groupId;
  }
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds must be a non-empty array');
  }
  const sortedIds = [...userIds].sort();
  return `conversation-${sortedIds.join('-')}`;
};

export const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c: string) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
};
