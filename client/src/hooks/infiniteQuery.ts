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
