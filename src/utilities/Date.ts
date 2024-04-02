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

export { formatDate, timeFromNow };
