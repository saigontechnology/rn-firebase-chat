export {
  sanitizeUserInput,
  validateFilePath,
  validateEncryptionKey,
  // shared names differ — re-export under the names this package has always used
  validateMessage as validateMessageContent,
  validateUserId as validateUserIdStrict,
  RateLimiter,
} from '@saigontechnology/firebase-chat-shared';

// shared's blacklist functions have different signatures (no optional-regex overload),
// so we keep these local implementations to preserve the existing API.

export const generateBadWordsRegex = (words: string[]): RegExp | undefined => {
  if (!words || words.length === 0) return undefined;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
};

export const filterBlackListWords = (text: string, regex?: RegExp): string => {
  if (!regex || !text) return text;
  return text.replace(regex, '***');
};
