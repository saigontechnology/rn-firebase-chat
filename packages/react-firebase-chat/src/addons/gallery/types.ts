export interface GalleryViewProps {
  files: MediaFile[];
  onFileSelect?: (file: MediaFile) => void;
  onFileDelete?: (fileId: string) => void;
  className?: string;
  maxItems?: number;
  gridColumns?: number;
  showDeleteButton?: boolean;
}

export interface MediaViewerProps {
  file: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

export interface UseGalleryProps {
  files: MediaFile[];
  onFileSelect?: (file: MediaFile) => void;
  onFileDelete?: (fileId: string) => void;
}

export interface UseGalleryReturn {
  selectedFile: MediaFile | null;
  isViewerOpen: boolean;
  currentIndex: number;
  openViewer: (file: MediaFile) => void;
  closeViewer: () => void;
  nextFile: () => void;
  previousFile: () => void;
  deleteFile: (fileId: string) => void;
}

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size?: number;
  createdAt: Date;
  thumbnailUrl?: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // for video/audio in seconds
  format?: string;
}
