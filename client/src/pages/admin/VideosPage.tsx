import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVideos, setVideoPublished } from '../../api/videos';
import type { Video } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import Pagination from '../../components/admin/Pagination';
import ThumbnailImage from '../../components/ThumbnailImage';
import ConfirmDialog from '../../components/ConfirmDialog';

const PAGE_SIZE = 8;

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState('');
  const [pendingUnpublish, setPendingUnpublish] = useState<Video | null>(null);

  useEffect(() => {
    let active = true;

    listVideos()
      .then((data) => {
        if (!active) return;
        setVideos(data);
        setPage(1);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load videos.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = videos.slice(start, start + PAGE_SIZE);

  const applyUpdated = (updated: Video) => {
    setVideos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const publishVideo = async (video: Video) => {
    setError('');
    setUpdatingId(video.id);
    try {
      applyUpdated(await setVideoPublished(video.id, true));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not publish this video.'));
    } finally {
      setUpdatingId('');
    }
  };

  const confirmUnpublish = async () => {
    if (!pendingUnpublish) return;
    setError('');
    setUpdatingId(pendingUnpublish.id);
    try {
      applyUpdated(await setVideoPublished(pendingUnpublish.id, false));
      setPendingUnpublish(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not unpublish this video.'));
    } finally {
      setUpdatingId('');
    }
  };

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

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
        {loading ? (
          <p className="px-5 py-10 text-sm text-stone-500">Loading videos…</p>
        ) : videos.length === 0 ? (
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
                  {pageItems.map((video) => (
                    <tr key={video.id} className="hover:bg-stone-50/70">
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
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/admin/videos/${video.id}/edit`}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50"
                          >
                            Edit
                          </Link>
                          {video.isPublished ? (
                            <button
                              type="button"
                              onClick={() => setPendingUnpublish(video)}
                              disabled={updatingId === video.id}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50 disabled:opacity-60"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => publishVideo(video)}
                              disabled={updatingId === video.id}
                              className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                            >
                              {updatingId === video.id ? 'Publishing…' : 'Publish'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={videos.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      {pendingUnpublish && (
        <ConfirmDialog
          title="Unpublish this video?"
          message={`“${pendingUnpublish.title}” will be hidden from learners until you publish it again.`}
          confirmLabel="Unpublish"
          busy={updatingId === pendingUnpublish.id}
          onConfirm={confirmUnpublish}
          onCancel={() => setPendingUnpublish(null)}
        />
      )}
    </div>
  );
}
