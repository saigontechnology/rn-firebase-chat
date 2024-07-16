import { LinksType, SectionData } from '../chat/components/links/Links';

const extractLinks = (message: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = message.match(urlRegex) || null;
  return links;
};

export interface Links {
  [date: string]: string[];
}

const addLinkByDate = (
  links: Links,
  newLinks: string[] | null | undefined,
  date: string
): Links => {
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

export { extractLinks, addLinkByDate, transformLinksDataForSectionList };
