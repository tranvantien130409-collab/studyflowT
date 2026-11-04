import React, { useState } from 'react';
import { isImageAvatar } from '../utils/avatarUtils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
  className?: string;
  sizeClassName?: string;
  bgClassName?: string;
  textClassName?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallbackText = 'SF',
  className = '',
  sizeClassName = 'w-10 h-10 rounded-2xl',
  bgClassName = 'bg-emerald-600',
  textClassName = 'text-white font-black text-xs'
}) => {
  const [hasError, setHasError] = useState(false);

  const isImg = !hasError && isImageAvatar(src);

  // Compute initials fallback (up to 2 characters)
  const displayFallback = (fallbackText || 'SF')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SF';

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center shrink-0 select-none ${sizeClassName} ${bgClassName} ${className}`}
    >
      {isImg ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-inherit"
          loading="lazy"
        />
      ) : (
        <span className={`${textClassName} tracking-tight leading-none`}>
          {displayFallback}
        </span>
      )}
    </div>
  );
};
