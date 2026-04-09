import { Timestamp, serverTimestamp } from '@react-native-firebase/firestore';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

const formatDate = (date: number | string | Date) => {
  dayjs.extend(customParseFormat);
  return dayjs(date, 'DD/MM/YYYY HH:mm');
};

const timeFromNow = (date: number | string | Date) => {
  dayjs.extend(relativeTime);
  return dayjs(date).fromNow();
};

const getCurrentTimestamp = () => {
  const { seconds, nanoseconds } = Timestamp.now();
  const msCurrentTime = seconds * 1000 + nanoseconds / 1000000;
  return Math.floor(msCurrentTime);
};

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getServerTimestamp = () => serverTimestamp();

const formatConversationTime = (timestamp: number | unknown): string => {
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

export {
  formatDate,
  timeFromNow,
  formatTime,
  getCurrentTimestamp,
  getServerTimestamp,
  formatConversationTime,
};
