import { useEffect, useState } from 'react';
import { mediaUrl } from '../utils/media';

const PLACEHOLDER = '/video-thumbnail-placeholder.svg';

type ThumbnailImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

export default function ThumbnailImage({
  src,
  alt = '',
  className = 'h-12 w-16 rounded-lg object-cover ring-1 ring-stone-200',
}: ThumbnailImageProps) {
  const resolved = src ? mediaUrl(src) : '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  const showPlaceholder = !resolved || failed;

  return (
    <img
      src={showPlaceholder ? PLACEHOLDER : resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
