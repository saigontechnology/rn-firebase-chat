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

export { PreviewData, PreviewDataImage, Size };
