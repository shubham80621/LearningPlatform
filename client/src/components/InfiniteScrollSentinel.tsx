import { useEffect, useRef } from 'react';

type SentinelProps = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  root?: Element | null;
  rootMargin?: string;
  label?: string;
};

/** Fires `onLoadMore` when scrolled into view. */
export function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
  root = null,
  rootMargin = '240px',
  label = 'Loading more…',
}: SentinelProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, root, rootMargin]);

  if (!hasMore && !loading) return null;

  return (
    <div
      ref={nodeRef}
      className="flex items-center justify-center px-4 py-4 text-sm text-stone-500"
      aria-hidden={!loading}
    >
      {loading ? label : <span className="h-1 w-1" />}
    </div>
  );
}
