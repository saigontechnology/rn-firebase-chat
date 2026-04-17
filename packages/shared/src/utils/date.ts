import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

export const formatDate = (date: number | string | Date): dayjs.Dayjs => {
  dayjs.extend(customParseFormat);
  return dayjs(date, 'DD/MM/YYYY HH:mm');
};

export const timeFromNow = (date: number | string | Date): string => {
  dayjs.extend(relativeTime);
  return dayjs(date).fromNow();
};

export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Platform-agnostic current timestamp in milliseconds.
// For server-side timestamps, use your platform's Firebase SDK:
//   RN:  firestore.FieldValue.serverTimestamp()
//   Web: serverTimestamp() from 'firebase/firestore'
export const getCurrentTimestamp = (): number => Date.now();
