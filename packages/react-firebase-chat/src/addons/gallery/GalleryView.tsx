import React from 'react';
import { useGallery } from './useGallery';
import { GalleryViewProps, MediaFile } from './types';
import './GalleryView.css';

export const GalleryView: React.FC<GalleryViewProps> = ({
  files,
  onFileSelect,
  onFileDelete,
  className = '',
  maxItems = 20,
  gridColumns = 4,
  showDeleteButton = true,
}) => {
  const { openViewer, deleteFile } = useGallery({
    files,
    onFileSelect,
    onFileDelete,
  });

  const displayFiles = files.slice(0, maxItems);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      default:
        return '📎';
    }
  };

  const handleFileClick = (file: MediaFile) => {
    openViewer(file);
    onFileSelect?.(file);
  };

  const handleDelete = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteFile(fileId);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <div className={`gallery-view empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>No files to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`gallery-view ${className}`}>
      <div
        className="gallery-grid"
        style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
      >
        {displayFiles.map((file) => (
          <div
            key={file.id}
            className="gallery-item"
            onClick={() => handleFileClick(file)}
          >
            {file.type === 'image' ? (
              <img
                src={file.thumbnailUrl || file.url}
                alt={file.name}
                className="media-thumbnail"
                loading="lazy"
              />
            ) : file.type === 'video' ? (
              <div className="video-thumbnail">
                <video
                  src={file.url}
                  className="media-thumbnail"
                  muted
                  preload="metadata"
                />
                <div className="play-overlay">
                  <div className="play-button">▶️</div>
                </div>
              </div>
            ) : file.type === 'audio' ? (
              <div className="audio-thumbnail">
                <div className="audio-icon">🎵</div>
                <p>{file.name}</p>
                <small>{formatFileSize(file.size)}</small>
              </div>
            ) : (
              <div className="file-thumbnail">
                <div className="file-icon">{getFileIcon(file.type)}</div>
                <p>{file.name}</p>
                <small>{formatFileSize(file.size)}</small>
              </div>
            )}

            {showDeleteButton && (
              <button
                className="delete-button"
                onClick={(e) => handleDelete(e, file.id)}
                title="Delete file"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {files.length > maxItems && (
        <div className="gallery-footer">
          <p>
            Showing {maxItems} of {files.length} files
          </p>
        </div>
      )}
    </div>
  );
};
