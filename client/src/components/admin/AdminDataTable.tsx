import type { ReactNode } from 'react';
import Shimmer from '../Shimmer';

export type AdminTableSkeleton =
  | 'media'
  | 'avatar'
  | 'text'
  | 'badge'
  | 'actions'
  | 'stat';

export type AdminTableColumn = {
  label: string;
  /** Loading placeholder shape for this column (defaults to text). */
  skeleton?: AdminTableSkeleton;
};

export const adminTableRowClassName =
  'cursor-pointer hover:bg-stone-50/70';

function SkeletonCell({ type = 'text' }: { type?: AdminTableSkeleton }) {
  switch (type) {
    case 'media':
      return (
        <div className="flex items-center gap-3">
          <Shimmer className="h-12 w-16 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-4 w-2/3 max-w-56" />
            <Shimmer className="h-3 w-1/2 max-w-40" />
          </div>
        </div>
      );
    case 'avatar':
      return (
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 shrink-0 rounded-full" />
          <Shimmer className="h-4 w-28" />
        </div>
      );
    case 'badge':
      return <Shimmer className="h-6 w-20 rounded-full" />;
    case 'actions':
      return (
        <div className="flex gap-2">
          <Shimmer className="h-8 w-20 rounded-lg" />
          <Shimmer className="h-8 w-20 rounded-lg" />
        </div>
      );
    case 'stat':
      return <Shimmer className="h-4 w-10" />;
    case 'text':
    default:
      return <Shimmer className="h-4 w-24" />;
  }
}

type AdminDataTableProps = {
  columns: AdminTableColumn[];
  /** Fill body cells with shimmers (same table / columns — no separate loader table). */
  loading?: boolean;
  loadingLabel?: string;
  empty?: ReactNode;
  skeletonRows?: number;
  footer?: ReactNode;
  /** When false, skip the outer card chrome (already inside a panel). */
  framed?: boolean;
  children: ReactNode;
};

/**
 * Shared admin list table. Loading only swaps tbody cells for shimmers —
 * header and column layout stay mounted to avoid flicker.
 */
export default function AdminDataTable({
  columns,
  loading = false,
  loadingLabel = 'Loading',
  empty,
  skeletonRows = 8,
  footer,
  framed = true,
  children,
}: AdminDataTableProps) {
  const showEmpty = !loading && Boolean(empty);

  const table = showEmpty ? (
    empty
  ) : (
    <div
      className="overflow-x-auto"
      aria-busy={loading || undefined}
      aria-label={loading ? loadingLabel : undefined}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="bg-stone-50 text-stone-500">
          <tr>
            {columns.map((column) => (
              <th key={column.label} className="px-5 py-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {loading
            ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.label} className="px-5 py-4">
                      <SkeletonCell type={column.skeleton} />
                    </td>
                  ))}
                </tr>
              ))
            : children}
        </tbody>
      </table>
    </div>
  );

  const body = (
    <>
      {table}
      {!showEmpty && footer}
    </>
  );

  if (!framed) {
    return (
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {body}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
      {body}
    </section>
  );
}
