import { useCallback, useEffect, useState } from 'react';
import type { Paginated } from '../types';

/**
 * RTK Query infinite-list helpers.
 * Cache key ignores `page` so pages merge into one list per filter set.
 */
export function infiniteSerializeArgs<T extends { page?: number }>({
  endpointName,
  queryArgs,
}: {
  endpointName: string;
  queryArgs: T | void;
}) {
  const { page: _page, ...filters } = (queryArgs ?? {}) as T;
  return `${endpointName}(${JSON.stringify(filters)})`;
}

export function infiniteMerge<T>(
  currentCache: Paginated<T>,
  response: Paginated<T>,
) {
  if (response.page <= 1) {
    currentCache.items = response.items;
    currentCache.page = response.page;
    currentCache.total = response.total;
    currentCache.limit = response.limit;
    currentCache.totalPages = response.totalPages;
    return;
  }
  const seen = new Set(
    currentCache.items.map((item) => (item as { id: string }).id),
  );
  for (const item of response.items) {
    const id = (item as { id: string }).id;
    if (!seen.has(id)) {
      currentCache.items.push(item);
      seen.add(id);
    }
  }
  currentCache.page = response.page;
  currentCache.total = response.total;
  currentCache.limit = response.limit;
  currentCache.totalPages = response.totalPages;
}

export function infiniteForceRefetch<T extends { page?: number }>({
  currentArg,
  previousArg,
}: {
  currentArg: T | void;
  previousArg: T | void;
}) {
  return (currentArg?.page ?? 1) !== (previousArg?.page ?? 1);
}

/**
 * Page cursor for infinite lists.
 * After each query result, call `syncCachedPage(data?.page)` so a warm RTK
 * cache resumes at the highest loaded page.
 * Call `reset()` when filters/search change.
 */
export function useInfinitePage() {
  const [page, setPage] = useState(1);

  const reset = useCallback(() => setPage(1), []);
  const loadMore = useCallback(() => {
    setPage((current) => current + 1);
  }, []);
  const syncCachedPage = useCallback((cachedPage?: number) => {
    if (cachedPage == null) return;
    setPage((current) => (cachedPage > current ? cachedPage : current));
  }, []);

  return { page, reset, loadMore, syncCachedPage };
}

/** Convenience: keep local page in sync with RTK's merged `data.page`. */
export function useSyncInfinitePage(
  syncCachedPage: (cachedPage?: number) => void,
  cachedPage?: number,
) {
  useEffect(() => {
    syncCachedPage(cachedPage);
  }, [cachedPage, syncCachedPage]);
}
