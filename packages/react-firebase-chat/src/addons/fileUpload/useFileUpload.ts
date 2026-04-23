import { useState, useCallback } from 'react';
import {
  UseFileUploadProps,
  UseFileUploadReturn,
  FileUploadOptions,
} from './types';

export const useFileUpload = ({
  onUploadProgress,
  onUploadComplete,
  onError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [
    'image/*',
    'video/*',
    'application/pdf',
    '.doc',
    '.docx',
    '.txt',
  ],
  customUploadFn,
}: UseFileUploadProps = {}): UseFileUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxFileSize) {
        setError(`File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`);
        return false;
      }

      // Check file type
      const isAllowed = allowedTypes.some((type) => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0] ?? '';
          return file.type.startsWith(baseType);
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });

      if (!isAllowed) {
        setError(
          `File type not allowed. Supported types: ${allowedTypes.join(', ')}`
        );
        return false;
      }

      return true;
    },
    [maxFileSize, allowedTypes]
  );

  const compressImage = useCallback(
    (file: File, options: FileUploadOptions): Promise<File> => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || !options.compress) {
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File, options: FileUploadOptions = {}): Promise<string> => {
      try {
        setError(null);
        setUploading(true);
        setProgress(0);

        if (!validateFile(file)) {
          throw new Error('File validation failed');
        }

        // Compress image if needed
        const processedFile = await compressImage(file, options);

        // Use custom upload function when provided (e.g. Cloudinary provider)
        if (customUploadFn) {
          setProgress(50);
          onUploadProgress?.(50);
          const downloadURL = await customUploadFn(processedFile);
          setUploading(false);
          setProgress(100);
          onUploadComplete?.(downloadURL);
          return downloadURL;
        }

        throw new Error(
          'No upload method configured. Provide a customUploadFn (e.g. wrapping ' +
            'WebFirebaseStorageProvider or CloudinaryStorageProvider) to useFileUpload.'
        );
      } catch (error) {
        setUploading(false);
        setProgress(0);
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        throw error;
      }
    },
    [
      customUploadFn,
      validateFile,
      compressImage,
      onUploadProgress,
      onUploadComplete,
      onError,
    ]
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<string[]> => {
      const uploadPromises = files.map((file) => uploadFile(file));
      return Promise.all(uploadPromises);
    },
    [uploadFile]
  );

  return {
    uploadFile,
    uploadFiles,
    uploading,
    progress,
    error,
  };
};
