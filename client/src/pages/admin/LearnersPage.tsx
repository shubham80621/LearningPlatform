import { Link, useNavigate } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import { InfiniteScrollSentinel } from '../../components/InfiniteScrollSentinel';
import {
  useInfinitePage,
  useSyncInfinitePage,
} from '../../hooks/infiniteQuery';
import { useListLearnersQuery } from '../../store/api';

const PAGE_SIZE = 8;

export default function AdminLearnersPage() {
  const navigate = useNavigate();
  const { page, loadMore, syncCachedPage } = useInfinitePage();

  const { data, isLoading, isFetching, isError } = useListLearnersQuery({
    page,
    limit: PAGE_SIZE,
  });
  useSyncInfinitePage(syncCachedPage, data?.page);

  const learners = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = Boolean(data && data.page < data.totalPages);
  const showInitialLoader = isLoading && !data;

  return (
    <div>
      <AdminPageHeader
        title="Learners"
        subtitle="Accounts that can receive assigned video lessons."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Learners' },
        ]}
        actions={
          <Link
            to="/admin/learners/new"
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Create learner
          </Link>
        }
      />

      {isError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load learners.
        </p>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
        {showInitialLoader ? (
          <p className="px-5 py-10 text-sm text-stone-500">Loading learners…</p>
        ) : total === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-stone-500">No learners yet.</p>
            <Link
              to="/admin/learners/new"
              className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
            >
              Create the first learner
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Assigned videos</th>
                    <th className="px-5 py-3 font-medium">Questions</th>
                    <th className="px-5 py-3 font-medium">Completed videos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {learners.map((learner) => (
                    <tr
                      key={learner.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/admin/learners/${learner.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/admin/learners/${learner.id}`);
                        }
                      }}
                      className="cursor-pointer hover:bg-stone-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-ink">
                            {learner.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-medium text-ink">{learner.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-600">{learner.email}</td>
                      <td className="px-5 py-4 font-medium text-ink">
                        {learner.assignedVideos ?? 0}
                      </td>
                      <td className="px-5 py-4 font-medium text-ink">
                        {learner.questions ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-ink">
                          {learner.completed ?? 0}
                        </span>
                        <span className="text-stone-400">
                          {' '}
                          / {learner.assignedVideos ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-stone-100 px-5 py-2 text-xs text-stone-500">
              Showing {learners.length} of {total}
            </p>
            <InfiniteScrollSentinel
              hasMore={hasMore}
              loading={isFetching && page > 1}
              onLoadMore={() => {
                if (hasMore && !isFetching) loadMore();
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
