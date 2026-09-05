import { useEffect, useRef, useState } from 'react';
import type { Paginated } from '../types';

type QueryOptions = {
  skip?: boolean;
};

const SKELETON_DELAY_MS = 120;

/**
 * Admin list pagination:
 * - Next / Previous → always refetch (fresh admin data)
 * - Tab remount → reuse RTK cache, no forced call
 * - Keep prior rows while the next page loads; delay skeleton so fast APIs don't flicker
 */
export function useAdminPagedQuery<TArg, TItem>(
  // RTK query hooks have overload signatures; keep this wrapper loosely typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useQuery: (arg: TArg, options?: QueryOptions) => any,
  buildArgs: (page: number) => TArg,
  options?: QueryOptions,
) {
  const [page, setPage] = useState(1);
  const [showTableLoader, setShowTableLoader] = useState(false);
  const forceNetworkRef = useRef(false);
  const knownTotalRef = useRef(0);
  const previousItemsRef = useRef<TItem[]>([]);
  const filterKeyRef = useRef('');

  const args = buildArgs(page);
  const result = useQuery(args, { skip: options?.skip }) as {
    data?: Paginated<TItem>;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error?: unknown;
    refetch: () => unknown;
  };

  // Drop carried rows when filters change (search, etc.), not when only `page` changes.
  const filterKey = JSON.stringify({ ...(args as object), page: undefined });
  if (filterKeyRef.current !== filterKey) {
    filterKeyRef.current = filterKey;
    previousItemsRef.current = [];
  }

  useEffect(() => {
    if (!forceNetworkRef.current) return;
    forceNetworkRef.current = false;
    void result.refetch();
  }, [page, result.refetch]);

  const onPageChange = (nextPage: number) => {
    if (nextPage === page) return;
    forceNetworkRef.current = true;
    setPage(nextPage);
  };

  const freshItems = (result.data?.items ?? []) as TItem[];
  if (freshItems.length > 0) {
    previousItemsRef.current = freshItems;
  }

  if (typeof result.data?.total === 'number') {
    knownTotalRef.current = result.data.total;
  }

  const items =
    freshItems.length > 0
      ? freshItems
      : result.isFetching
        ? previousItemsRef.current
        : [];

  const needsLoader =
    !options?.skip &&
    (result.isLoading || result.isFetching) &&
    items.length === 0;

  useEffect(() => {
    if (!needsLoader) {
      setShowTableLoader(false);
      return;
    }
    const timer = window.setTimeout(() => setShowTableLoader(true), SKELETON_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [needsLoader]);

  return {
    page,
    setPage,
    onPageChange,
    data: result.data,
    items,
    total: result.data?.total ?? knownTotalRef.current,
    showTableLoader,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}
