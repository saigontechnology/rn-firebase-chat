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
  /** Upload function — typically wraps a StorageProvider (Cloudinary, WebFirebase, etc.). */
  customUploadFn?: (file: File) => Promise<string>;
}

export interface UseFileUploadProps {
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  /**
   * Upload function — required. Typically wraps a StorageProvider
   * (WebFirebaseStorageProvider, CloudinaryStorageProvider, etc.) and
   * returns the public download URL.
   */
  customUploadFn?: (file: File) => Promise<string>;
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
