import React, { useRef, useState, useCallback } from 'react';
import { useFileUpload } from './useFileUpload';
import { FileUploaderProps } from './types';
import './FileUploader.css';

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onUploadProgress,
  onUploadComplete,
  onError,
  accept = '*/*',
  multiple = false,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className = '',
  disabled = false,
  children,
  customUploadFn,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    uploadFiles,
    uploading,
    progress,
    error: uploadError,
  } = useFileUpload({
    onUploadProgress,
    onUploadComplete: (url: string) => {
      onUploadComplete?.([url]);
    },
    onError,
    maxFileSize,
    customUploadFn,
  });

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const fileArray = Array.from(files);

      if (fileArray.length > maxFiles) {
        onError?.(new Error(`Maximum ${maxFiles} files allowed`));
        return [];
      }

      const validFiles = fileArray.filter((file) => {
        if (file.size > maxFileSize) {
          onError?.(
            new Error(
              `File "${file.name}" exceeds ${maxFileSize / (1024 * 1024)}MB limit`
            )
          );
          return false;
        }
        return true;
      });

      return validFiles;
    },
    [maxFiles, maxFileSize, onError]
  );

  const handleFileSelect = useCallback(
    (files: File[]) => {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onFileSelect(validFiles);
      }
    },
    [validateFiles, onFileSelect]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileSelect(Array.from(files));
      }
    },
    [handleFileSelect]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(Array.from(files));
      }
    },
    [disabled, handleFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length > 0) {
      try {
        const urls = await uploadFiles(selectedFiles);
        onUploadComplete?.(urls);
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        onError?.(error as Error);
      }
    }
  }, [selectedFiles, uploadFiles, onUploadComplete, onError]);

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
    },
    [selectedFiles, onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`file-uploader ${className} ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {children ? (
        <div onClick={handleClick}>{children}</div>
      ) : (
        <div
          className="upload-area"
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p>Uploading... {Math.round(progress)}%</p>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📁</div>
              <p>Click to select files or drag and drop</p>
              <small>
                Max {maxFiles} files, {formatFileSize(maxFileSize)} each
              </small>
            </div>
          )}
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <span className="file-name">{file.name}</span>
              <span className="file-size">({formatFileSize(file.size)})</span>
              <button
                className="remove-button"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                ✕
              </button>
            </div>
          ))}

          {!uploading && (
            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0}
            >
              Upload Files
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {uploadError && <div className="upload-error">{uploadError}</div>}
    </div>
  );
};
