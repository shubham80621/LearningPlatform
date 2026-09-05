import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';
import ThumbnailImage from '../../components/ThumbnailImage';
import type { LearnerAssignment } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import { InfiniteScrollSentinel } from '../../components/InfiniteScrollSentinel';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setLearnerLearnStatus } from '../../store/uiSlice';
import { useListMyAssignmentsQuery } from '../../store/api';

const PAGE_SIZE = 8;

const FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'continue' as const, label: 'Continue' },
  { id: 'assigned' as const, label: 'Not started' },
  { id: 'completed' as const, label: 'Completed' },
];

export default function LearnerLearnPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.ui.learnerLearnStatus);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const { data, isLoading, isFetching, isError, error } = useListMyAssignmentsQuery({
    page,
    limit: PAGE_SIZE,
    status,
  });

  useEffect(() => {
    if (data?.page != null && data.page > page) setPage(data.page);
  }, [data?.page, page]);

  const assignments = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = Boolean(data && data.page < data.totalPages);
  const showInitialLoader = isLoading && !data;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Learning
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Open a lesson to watch and answer timestamp questions.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => dispatch(setLearnerLearnStatus(filter.id))}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              status === filter.id
                ? 'bg-ink text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(error, 'Could not load lessons.')}
        </p>
      )}

      {showInitialLoader ? (
        <div className="mt-6 space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-200 px-5 py-12 text-center">
          <p className="font-medium text-ink">
            {status === 'all' ? 'Nothing to learn yet' : 'No lessons in this filter'}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {status === 'all'
              ? 'Assigned videos will appear here and on Home.'
              : 'Try another filter, or check Home for everything assigned to you.'}
          </p>
          <Link
            to="/learner"
            className="mt-5 inline-flex rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white"
          >
            Go to Home
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <ul className="divide-y divide-stone-100">
            {assignments.map((item) => (
              <LessonRow key={item.id} item={item} />
            ))}
          </ul>
          <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
            Showing {assignments.length} of {total}
          </p>
          <InfiniteScrollSentinel
            hasMore={hasMore}
            loading={isFetching && page > 1}
            onLoadMore={() => {
              if (hasMore && !isFetching) setPage((current) => current + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}

function LessonRow({ item }: { item: LearnerAssignment }) {
  return (
    <li>
      <Link
        to={`/learner/learn/${item.id}`}
        className="flex gap-3 p-3 transition hover:bg-stone-50 sm:gap-4 sm:p-4"
      >
        <div className="relative w-36 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:w-44">
          <ThumbnailImage
            src={item.video.thumbnailUrl}
            alt=""
            className="aspect-video w-full object-cover"
          />
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {formatDuration(item.video.duration)}
          </span>
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold text-ink sm:text-base">
              {item.video.title}
            </h3>
            <AssignmentStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            {item.completionPercentage}% watched
            {item.questionCount > 0 &&
              ` · ${item.answeredCount}/${item.questionCount} questions`}
          </p>
          {item.completionPercentage > 0 && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-teal-600"
                style={{ width: `${item.completionPercentage}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
