const isOtherUserTyping = (
  typingData: { [key: string]: boolean },
  currentUserId: string
): boolean => {
  return Object.keys(typingData).some(
    (userId) => userId !== currentUserId && typingData[userId] === true
  );
};

export { isOtherUserTyping };
