const isOtherUserTyping = (
  typingData: { [key: string]: boolean },
  currentUserId: string
): boolean => {
  return Object.keys(typingData).some(
    (userId) => userId !== currentUserId && typingData[userId] === true
  );
};

/**
 * Generate a conversationId based on userIds and optional groupId.
 * If groupId is provided, returns it directly.
 * Otherwise, sorts userIds and joins them with '-' and a 'conversation' prefix.
 * @param userIds Array of userId strings
 * @param groupId Optional groupId string
 * @returns conversationId string
 */
const generateConversationId = (
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

const generateRandomUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c: string) => {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
};

export { isOtherUserTyping, generateConversationId, generateRandomUUID };
