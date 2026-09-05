import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DonutChart from '../../components/DonutChart';
import ThumbnailImage from '../../components/ThumbnailImage';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import type { LearnerAssignment } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import { InfiniteScrollSentinel } from '../../components/InfiniteScrollSentinel';
import {
  useListMyAssignmentsQuery,
  useMyProgressSummaryQuery,
} from '../../store/api';

const PAGE_SIZE = 8;
const silentRefresh = { refetchOnMountOrArgChange: true as const };

export default function LearnerDashboardPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const summaryQuery = useMyProgressSummaryQuery(undefined, silentRefresh);
  const listQuery = useListMyAssignmentsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  useEffect(() => {
    if (listQuery.data?.page != null && listQuery.data.page > page) {
      setPage(listQuery.data.page);
    }
  }, [listQuery.data?.page, page]);

  const summary = summaryQuery.data;
  const assignments = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const hasMore = Boolean(
    listQuery.data && listQuery.data.page < listQuery.data.totalPages,
  );
  const showInitialLoader =
    (summaryQuery.isLoading && !summaryQuery.data) ||
    (listQuery.isLoading && !listQuery.data);
  const error =
    summaryQuery.isError || listQuery.isError
      ? getApiErrorMessage(
          summaryQuery.error ?? listQuery.error,
          'Could not load your videos.',
        )
      : '';

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const avgWatchPercent = summary?.avgWatchPercent ?? 0;
  const progressTotals = summary ?? {
    videos: 0,
    videosCompleted: 0,
    videosInProgress: 0,
    videosAssigned: 0,
    totalQuestions: 0,
    answered: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Hi {firstName}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Track your progress, then jump into an assigned lesson.
        </p>
      </div>

      {error && !summary && assignments.length === 0 && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {showInitialLoader ? (
        <div className="space-y-6">
          <div className="grid animate-pulse gap-4 lg:grid-cols-2">
            <div className="h-56 rounded-xl bg-stone-100" />
            <div className="h-56 rounded-xl bg-stone-100" />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-video rounded-xl bg-stone-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-stone-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink sm:text-lg">Your progress</h2>
              <p className="mt-0.5 text-sm text-stone-500">
                Overview of assigned lessons and quiz answers.
              </p>
            </div>

            {progressTotals.videos === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 px-5 py-10 text-center">
                <p className="text-base font-medium text-ink">No videos assigned yet</p>
                <p className="mt-2 text-sm text-stone-500">
                  When your admin assigns a lesson, progress and videos will show up here.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <DonutChart
                    title="Video watch progress"
                    centerValue={`${avgWatchPercent}%`}
                    centerLabel="avg watched"
                    size={148}
                    thickness={16}
                    segments={[
                      {
                        label: 'Completed',
                        value: progressTotals.videosCompleted,
                        color: '#059669',
                      },
                      {
                        label: 'In progress',
                        value: progressTotals.videosInProgress,
                        color: '#0f766e',
                      },
                      {
                        label: 'Not started',
                        value: progressTotals.videosAssigned,
                        color: '#d6d3d1',
                      },
                    ]}
                  />
                  <DonutChart
                    title="Question answers"
                    centerValue={
                      progressTotals.totalQuestions === 0
                        ? '0%'
                        : `${Math.round(
                            (progressTotals.answered / progressTotals.totalQuestions) * 100,
                          )}%`
                    }
                    centerLabel="answered"
                    size={148}
                    thickness={16}
                    segments={
                      progressTotals.totalQuestions === 0
                        ? [{ label: 'No questions', value: 1, color: '#e7e5e4' }]
                        : [
                            {
                              label: 'Correct',
                              value: progressTotals.correct,
                              color: '#059669',
                            },
                            {
                              label: 'Incorrect',
                              value: progressTotals.incorrect,
                              color: '#dc2626',
                            },
                            {
                              label: 'Unanswered',
                              value: progressTotals.unanswered,
                              color: '#d6d3d1',
                            },
                          ]
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    {
                      label: 'Completed',
                      value: progressTotals.videosCompleted,
                      tone: 'bg-emerald-50 text-emerald-800',
                    },
                    {
                      label: 'Assigned',
                      value: progressTotals.videos,
                      tone: 'bg-stone-50 text-ink',
                    },
                    {
                      label: 'Questions',
                      value: progressTotals.totalQuestions,
                      tone: 'bg-teal-50 text-teal-800',
                    },
                    {
                      label: 'Answered',
                      value: progressTotals.answered,
                      tone: 'bg-sky-50 text-sky-800',
                    },
                    {
                      label: 'Correct',
                      value: progressTotals.correct,
                      tone: 'bg-emerald-50 text-emerald-800',
                    },
                    {
                      label: 'Incorrect',
                      value: progressTotals.incorrect,
                      tone: 'bg-red-50 text-red-800',
                    },
                  ].map((card) => (
                    <div key={card.label} className={`rounded-xl px-3 py-3 sm:px-4 ${card.tone}`}>
                      <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                        {card.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold sm:text-2xl">{card.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {progressTotals.videos > 0 && (
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-ink sm:text-lg">Your videos</h2>
                  <p className="mt-0.5 text-sm text-stone-500">
                    Tap a lesson to open Learning.
                  </p>
                </div>
                <label className="relative block w-full sm:max-w-xs">
                  <span className="sr-only">Search videos</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 3.5 3.5" />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search videos"
                    className="w-full rounded-full border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-stone-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20"
                  />
                </label>
              </div>

              {total === 0 && search ? (
                <div className="rounded-2xl border border-dashed border-stone-200 px-5 py-12 text-center">
                  <p className="text-sm text-stone-500">
                    No videos match “{search}”.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {assignments.map((item) => (
                      <VideoCard key={item.id} item={item} />
                    ))}
                  </div>
                  <p className="mt-4 text-center text-xs text-stone-500">
                    Showing {assignments.length} of {total}
                  </p>
                  <InfiniteScrollSentinel
                    hasMore={hasMore}
                    loading={listQuery.isFetching && page > 1}
                    onLoadMore={() => {
                      if (hasMore && !listQuery.isFetching) {
                        setPage((current) => current + 1);
                      }
                    }}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function VideoCard({ item }: { item: LearnerAssignment }) {
  const video = item.video;
  const progress = Math.min(Math.max(item.completionPercentage ?? 0, 0), 100);
  const stats = item.stats;

  return (
    <Link to={`/learner/learn/${item.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-stone-100">
        <ThumbnailImage
          src={video.thumbnailUrl}
          alt=""
          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {formatDuration(video.duration ?? 0)}
        </span>
        <div className="absolute left-2 top-2">
          <AssignmentStatusBadge status={item.status} />
        </div>
        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-300/80">
            <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
          {video.title.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-teal-800">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            {progress}% watched
            {stats && stats.totalQuestions > 0 && (
              <>
                {' '}
                · {stats.answered}/{stats.totalQuestions} answered
              </>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
