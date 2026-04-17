import { Timestamp, serverTimestamp } from '@react-native-firebase/firestore';
import dayjs from 'dayjs';

// Re-export platform-agnostic date helpers from shared
export {
  formatDate,
  timeFromNow,
  formatTime,
} from '@saigontechnology/firebase-chat-shared';

/** RN-specific: uses Firebase Timestamp for millisecond-accurate current time. */
export const getCurrentTimestamp = (): number => {
  const { seconds, nanoseconds } = Timestamp.now();
  return Math.floor(seconds * 1000 + nanoseconds / 1000000);
};

/** RN-specific: Firestore server timestamp FieldValue. */
export const getServerTimestamp = () => serverTimestamp();

/** Formats a Firestore timestamp (number | { toMillis() }) for conversation list display. */
export const formatConversationTime = (timestamp: number | unknown): string => {
  if (!timestamp) return '';
  const ms =
    typeof timestamp === 'number'
      ? timestamp
      : typeof (timestamp as { toMillis?: () => number }).toMillis ===
          'function'
        ? (timestamp as { toMillis: () => number }).toMillis()
        : null;
  if (!ms) return '';
  const date = dayjs(ms);
  const now = dayjs();
  if (date.isSame(now, 'day')) {
    return date.format('hh:mm A');
  }
  if (now.diff(date, 'day') < 7) {
    return date.format('ddd');
  }
  return date.format('MMM D');
};
