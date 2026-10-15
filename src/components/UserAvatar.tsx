import React from 'react';
import { getAvatarUrl } from '../lib/api';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  className = '',
  size = 'md',
}) => {
  const url = getAvatarUrl(avatarUrl);
  const initial = (name || 'Curious Learner').trim().charAt(0).toUpperCase();

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-16 h-16 text-lg font-bold',
  }[size];

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#6D5CAE] via-purple-500 to-indigo-400 text-white flex items-center justify-center font-bold tracking-tight shadow-sm select-none ${className}`}
      title={name}
    >
      {initial}
    </div>
  );
};
