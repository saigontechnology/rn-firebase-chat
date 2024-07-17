import firestore from '@react-native-firebase/firestore';
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
  const { seconds, nanoseconds } = firestore.Timestamp.now();
  const msCurrentTime = seconds * 1000 + nanoseconds / 1000000;
  return Math.floor(msCurrentTime);
};

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const getCurrentFormattedDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export { formatDate, timeFromNow, formatTime, getCurrentTimestamp };
