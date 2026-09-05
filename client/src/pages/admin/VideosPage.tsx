import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Video } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import AdminDataTable, {
  adminTableRowClassName,
  type AdminTableColumn,
} from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import ThumbnailImage from '../../components/ThumbnailImage';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAdminPagedQuery } from '../../hooks/useAdminPagedQuery';
import {
  useListVideosQuery,
  useSetVideoPublishedMutation,
} from '../../store/api';

const PAGE_SIZE = 8;

const COLUMNS: AdminTableColumn[] = [
  { label: 'Lesson', skeleton: 'media' },
  { label: 'Duration', skeleton: 'text' },
  { label: 'Status', skeleton: 'badge' },
  { label: 'Actions', skeleton: 'actions' },
];

export default function AdminVideosPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pendingUnpublish, setPendingUnpublish] = useState<Video | null>(null);

  const {
    page,
    onPageChange,
    items: videos,
    total,
    showTableLoader,
    isError,
    error: queryError,
  } = useAdminPagedQuery<{ page: number; limit: number }, Video>(
    useListVideosQuery,
    (nextPage) => ({
      page: nextPage,
      limit: PAGE_SIZE,
    }),
  );

  const [setPublished, { isLoading: isUpdating }] = useSetVideoPublishedMutation();

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

      <AdminDataTable
        columns={COLUMNS}
        loading={showTableLoader}
        loadingLabel="Loading videos"
        skeletonRows={PAGE_SIZE}
        empty={
          !showTableLoader && total === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-stone-500">No videos yet.</p>
              <Link
                to="/admin/videos/new"
                className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
              >
                Create the first video
              </Link>
            </div>
          ) : null
        }
        footer={
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={onPageChange}
          />
        }
      >
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
            className={adminTableRowClassName}
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
      </AdminDataTable>

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
