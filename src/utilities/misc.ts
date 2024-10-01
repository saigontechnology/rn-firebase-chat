const isOtherUserTyping = (
  typingData: { [key: string]: boolean },
  currentUserId: string
): boolean => {
  return Object.keys(typingData).some(
    (userId) => userId !== currentUserId && typingData[userId] === true
  );
};

const formatSize = (bytes?: number | null): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0 || !bytes) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export { isOtherUserTyping, formatSize };
