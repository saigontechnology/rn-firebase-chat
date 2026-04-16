import React from 'react';
import { clsx } from 'clsx';
import { UserAvatarProps } from '../types';
import { randomColor } from '../utils/color';

const sizeClasses = {
  small: 'w-8 h-8 text-xs',
  medium: 'w-12 h-12 text-sm',
  large: 'w-16 h-16 text-lg',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'small',
  className,
}) => {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((name) => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Deterministic color from user name/id (matching rn-firebase-chat)
  const avatarColor = randomColor(user.name || user.id || 'default');

  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-medium text-white overflow-hidden',
          sizeClasses[size]
        )}
        style={user.avatar ? undefined : { backgroundColor: avatarColor }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
};
