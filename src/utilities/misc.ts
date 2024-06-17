const isOtherUserTyping = (
  typingData: { [key: string]: boolean },
  currentUserId: string
): boolean => {
  return Object.keys(typingData)
    .filter((userId) => userId !== currentUserId)
    .some((userId) => typingData[userId] === true);
};

export { isOtherUserTyping };
