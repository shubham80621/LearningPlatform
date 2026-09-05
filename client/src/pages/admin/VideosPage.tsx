import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Video } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import ThumbnailImage from '../../components/ThumbnailImage';
import ConfirmDialog from '../../components/ConfirmDialog';
import { InfiniteScrollSentinel } from '../../components/InfiniteScrollSentinel';
import {
  useListVideosQuery,
  useSetVideoPublishedMutation,
} from '../../store/api';

const PAGE_SIZE = 8;

export default function AdminVideosPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pendingUnpublish, setPendingUnpublish] = useState<Video | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, error: queryError } =
    useListVideosQuery({ page, limit: PAGE_SIZE });
  const [setPublished, { isLoading: isUpdating }] = useSetVideoPublishedMutation();

  useEffect(() => {
    if (data?.page != null && data.page > page) setPage(data.page);
  }, [data?.page, page]);

  const videos = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = Boolean(data && data.page < data.totalPages);
  const showInitialLoader = isLoading && !data;

  const publishVideo = async (video: Video) => {
    setError('');
    try {
      await setPublished({ id: video.id, isPublished: true }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not publish this video.'));
    }
  };

  const confirmUnpublish = async () => {
    if (!pendingUnpublish) return;
    setError('');
    try {
      await setPublished({
        id: pendingUnpublish.id,
        isPublished: false,
      }).unwrap();
      setPendingUnpublish(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not unpublish this video.'));
    }
  };

  const listError =
    error ||
    (isError ? getApiErrorMessage(queryError, 'Could not load videos.') : '');

  return (
    <div>
      <AdminPageHeader
        title="Videos"
        subtitle="Create and publish video lessons with timestamp questions."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Videos' },
        ]}
        actions={
          <Link
            to="/admin/videos/new"
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Create video
          </Link>
        }
      />

      {listError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listError}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
        {showInitialLoader ? (
          <p className="px-5 py-10 text-sm text-stone-500">Loading videos…</p>
        ) : total === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-stone-500">No videos yet.</p>
            <Link
              to="/admin/videos/new"
              className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
            >
              Create the first video
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Lesson</th>
                    <th className="px-5 py-3 font-medium">Duration</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {videos.map((video) => (
                    <tr
                      key={video.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/admin/videos/${video.id}/edit`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/admin/videos/${video.id}/edit`);
                        }
                      }}
                      className="cursor-pointer hover:bg-stone-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ThumbnailImage src={video.thumbnailUrl} alt="" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{video.title}</p>
                            <p className="truncate text-xs text-stone-500">
                              {video.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        {formatDuration(video.duration ?? 0)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            video.isPublished
                              ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                              : 'rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600'
                          }
                        >
                          {video.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td
                        className="px-5 py-4"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/admin/videos/${video.id}/edit?tab=questions`}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50"
                          >
                            Questions
                          </Link>
                          {video.isPublished ? (
                            <button
                              type="button"
                              onClick={() => setPendingUnpublish(video)}
                              disabled={isUpdating}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50 disabled:opacity-60"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => publishVideo(video)}
                              disabled={isUpdating}
                              className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-stone-100 px-5 py-2 text-xs text-stone-500">
              Showing {videos.length} of {total}
            </p>
            <InfiniteScrollSentinel
              hasMore={hasMore}
              loading={isFetching && page > 1}
              onLoadMore={() => {
                if (hasMore && !isFetching) setPage((current) => current + 1);
              }}
            />
          </>
        )}
      </section>

      {pendingUnpublish && (
        <ConfirmDialog
          title="Unpublish this video?"
          message={`“${pendingUnpublish.title}” will be hidden from learners until you publish it again.`}
          confirmLabel="Unpublish"
          busy={isUpdating}
          onConfirm={confirmUnpublish}
          onCancel={() => setPendingUnpublish(null)}
        />
      )}
    </div>
  );
}
