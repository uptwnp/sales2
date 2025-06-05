import { format, isToday, formatDistanceToNow } from 'date-fns';

export const formatDateTime = (dateString: string, formatStr: string = 'PPp') => {
  const date = new Date(dateString);
  return format(date, formatStr);
};

export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDateForInput = (dateString: string) => {
  return format(new Date(dateString), 'yyyy-MM-dd');
};

export const formatTimeForInput = (dateString: string) => {
  return format(new Date(dateString), 'HH:mm');
};