/**
 * Generate a conversationId based on userIds and optional groupId.
 * If groupId is provided, returns it directly.
 * Otherwise, sorts userIds and joins them with '-' and a 'conversation' prefix.
 * @param userIds Array of userId strings
 * @param groupId Optional groupId string
 * @returns conversationId string
 */
export function generateConversationId(userIds: string[], groupId?: string): string {
  if (groupId && typeof groupId === 'string' && groupId.trim().length > 0) {
    return groupId;
  }
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds must be a non-empty array');
  }
  const sortedIds = [...userIds].sort();
  return `conversation-${sortedIds.join('-')}`;
}
