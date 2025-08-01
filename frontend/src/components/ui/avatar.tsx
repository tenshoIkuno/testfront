// src/components/ui/avatar.tsx

import React from 'react';

type AvatarProps = {
  src?: string;
  alt?: string;
  fallback?: string; // 画像がない場合の代替テキスト（例: "JS"）
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
}) => {
  const sizeClass = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gray-200 overflow-hidden ${sizeClass}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-gray-600">{fallback || '?'}</span>
      )}
    </div>
  );
};

export default Avatar;
