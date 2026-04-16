import React, { useEffect } from 'react';
import { MediaViewerProps } from './types';
import './MediaViewer.css';

export const MediaViewer: React.FC<MediaViewerProps> = ({
  file,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  className = '',
}) => {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderMediaContent = () => {
    switch (file.type) {
      case 'image':
        return (
          <img
            src={file.url}
            alt={file.name}
            className="media-content"
          />
        );

      case 'video':
        return (
          <video
            src={file.url}
            controls
            className="media-content"
            autoPlay
          />
        );

      case 'audio':
        return (
          <div className="audio-player">
            <div className="audio-info">
              <h3>{file.name}</h3>
              <p>Audio File</p>
            </div>
            <audio
              src={file.url}
              controls
              autoPlay
            />
          </div>
        );

      default:
        return (
          <div className="document-viewer">
            <div className="document-info">
              <h3>{file.name}</h3>
              <p>Document</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
              >
                Open File
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`media-viewer ${className}`} onClick={handleBackdropClick}>
      <div className="media-viewer-content">
        {renderMediaContent()}

        <div className="media-viewer-controls">
          <button
            className="viewer-button close-button"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>

          {onPrevious && (
            <button
              className="viewer-button nav-button"
              onClick={onPrevious}
              title="Previous"
            >
              ◀
            </button>
          )}

          {onNext && (
            <button
              className="viewer-button nav-button"
              onClick={onNext}
              title="Next"
            >
              ▶
            </button>
          )}

          <a
            href={file.url}
            download={file.name}
            className="viewer-button download-button"
            title="Download"
          >
            ⬇
          </a>
        </div>

        <div className="media-info">
          <h3>{file.name}</h3>
          {file.size && (
            <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          )}
        </div>
      </div>
    </div>
  );
};
