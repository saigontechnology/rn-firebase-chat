export interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: Error) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface UseFileUploadProps {
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  storagePath?: string;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<string>;
  uploadFiles: (files: File[]) => Promise<string[]>;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export interface UploadedFile {
  file: File;
  url: string;
  uploadedAt: Date;
}

export interface FileUploadOptions {
  compress?: boolean;
  quality?: number; // 0-1 for image compression
  maxWidth?: number;
  maxHeight?: number;
}
