import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  title,
  className = '',
  priority = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 dark:from-stone-800 dark:via-stone-900 dark:to-stone-800 text-stone-500 dark:text-stone-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide uppercase opacity-75 line-clamp-2">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
