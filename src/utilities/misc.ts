import { LinksType, SectionData } from '../interfaces';

const isOtherUserTyping = (
  typingData: { [key: string]: boolean },
  currentUserId: string
): boolean => {
  return Object.keys(typingData).some(
    (userId) => userId !== currentUserId && typingData[userId] === true
  );
};

const extractLinks = (message: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = message.match(urlRegex) || null;
  return links;
};

const addLinkByDate = (
  links: LinksType,
  newLinks: string[] | null | undefined,
  date: string
): LinksType => {
  if (!newLinks) return links;
  if (links[date]) {
    return {
      ...links,
      [date]: [...(links[date] ?? []), ...newLinks],
    };
  } else {
    return {
      ...links,
      [date]: newLinks,
    };
  }
};

const transformLinksDataForSectionList = (links: LinksType): SectionData[] => {
  return Object.keys(links).map((date) => ({
    title: date,
    data: links[date] ?? [],
  }));
};

export {
  isOtherUserTyping,
  extractLinks,
  addLinkByDate,
  transformLinksDataForSectionList,
};
