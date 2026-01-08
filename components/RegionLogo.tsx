import React from 'react';

interface RegionLogoProps {
  slug: string; // e.g. 'old-world'
  alt?: string;
  title?: string;
  size?: number; // px
  className?: string; // optional width/height classes can be used instead of size
  baseUrl: string; // explicitly require caller to pass baseUrl to avoid import.meta types
}

export const RegionLogo: React.FC<RegionLogoProps> = ({ slug, alt, title, size = 14, className, baseUrl }) => {
  const url = `${baseUrl}logos/${slug}.svg`;
  const style: React.CSSProperties = {
    display: 'inline-block',
    width: className ? undefined : size,
    height: className ? undefined : size,
    backgroundColor: 'currentColor',
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    verticalAlign: 'middle',
  };
  return (
    <span
      role="img"
      aria-label={alt || slug}
      title={title || alt}
      className={className}
      style={style}
    />
  );
};

export default RegionLogo;
