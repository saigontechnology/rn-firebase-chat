interface PreviewData {
  description?: string;
  image?: PreviewDataImage;
  link?: string;
  title?: string;
}

interface PreviewDataImage {
  height: number;
  url: string;
  width: number;
}

interface Size {
  height: number;
  width: number;
}

type LinksType = {
  [date: string]: string[];
};

type SectionData = {
  title: string;
  data: readonly string[];
};

export type { PreviewData, PreviewDataImage, Size, LinksType, SectionData };
