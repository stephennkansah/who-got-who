import React from 'react';
import { BRAND_ICON, BRAND_ICON_LARGE } from '../../branding';

interface BrandMarkProps {
  size?: number;
  className?: string;
  /** Leave empty when the game name is already present beside the image. */
  alt?: string;
}

export default function BrandMark({ size = 48, className = '', alt = '' }: BrandMarkProps) {
  return (
    <img
      className={`brand-mark ${className}`.trim()}
      src={BRAND_ICON}
      srcSet={`${BRAND_ICON} 192w, ${BRAND_ICON_LARGE} 512w`}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
    />
  );
}
