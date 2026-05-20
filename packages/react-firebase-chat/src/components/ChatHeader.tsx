import React from 'react';
import { IUser } from '../types';
import { UserAvatar } from './UserAvatar';
import { ButtonMaterialIcon } from './ButtonMaterialIcon';

export interface ChatHeaderProps {
  /** Display name of the conversation / partner */
  name: string;
  /** Partner user — shows avatar when provided */
  partner?: IUser | null;
  /** Called when the back arrow is tapped (mobile) */
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  partner,
  onBack,
}) => {
  return (
    <div className="chat-panel-header">
      <div className="chat-target">
        <button
          className="chat-back-btn"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {partner && <UserAvatar user={partner} size="small" />}

        <div className="chat-target-info">
          <span className="target-name">{name}</span>
          <span className="target-status">Active now</span>
        </div>
      </div>

      <div className="chat-actions">
        <ButtonMaterialIcon
          className="icon-btn"
          title="Voice call"
          icon="call"
        />
        <ButtonMaterialIcon
          className="icon-btn"
          title="Video call"
          icon="videocam"
        />
      </div>
    </div>
  );
};

export default ChatHeader;
