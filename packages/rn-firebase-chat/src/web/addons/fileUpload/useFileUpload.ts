import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '../../../services/firebase';
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
  storagePath = 'chat-files',
}: UseFileUploadProps = {}): UseFileUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const storage = getFirebaseStorage();

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
          const baseType = type.split('/')[0];
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

        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const fileName = `${timestamp}-${randomString}-${processedFile.name}`;

        const fileRef = ref(storage, `${storagePath}/${fileName}`);
        const uploadTask = uploadBytesResumable(fileRef, processedFile);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progressValue =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(progressValue);
              onUploadProgress?.(progressValue);
            },
            (error) => {
              setUploading(false);
              setProgress(0);
              const errorMessage = `Upload failed: ${error.message}`;
              setError(errorMessage);
              onError?.(new Error(errorMessage));
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                setUploading(false);
                setProgress(100);
                onUploadComplete?.(downloadURL);
                resolve(downloadURL);
              } catch (error) {
                setUploading(false);
                setProgress(0);
                const errorMessage = 'Failed to get download URL';
                setError(errorMessage);
                onError?.(new Error(errorMessage));
                reject(error);
              }
            }
          );
        });
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
      storage,
      storagePath,
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
