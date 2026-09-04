import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyAssignments } from '../../api/assignments';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';
import ThumbnailImage from '../../components/ThumbnailImage';
import type { LearnerAssignment } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';

export default function LearnerLearnPage() {
  const [assignments, setAssignments] = useState<LearnerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listMyAssignments()
      .then((data) => {
        if (!active) return;
        setAssignments(data);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load lessons.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const continueWatching = assignments.filter(
    (item) =>
      item.status !== 'completed' &&
      (item.status === 'in_progress' || item.completionPercentage > 0),
  );
  const notStarted = assignments.filter((item) => item.status === 'assigned');
  const completed = assignments.filter((item) => item.status === 'completed');

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Learning
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Open a lesson to watch and answer timestamp questions.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-200 px-5 py-12 text-center">
          <p className="font-medium text-ink">Nothing to learn yet</p>
          <p className="mt-2 text-sm text-stone-500">
            Assigned videos will appear here and on Home.
          </p>
          <Link
            to="/learner"
            className="mt-5 inline-flex rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white"
          >
            Go to Home
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <LessonGroup title="Continue watching" items={continueWatching} />
          <LessonGroup title="Not started" items={notStarted} />
          <LessonGroup title="Completed" items={completed} />
        </div>
      )}
    </div>
  );
}

function LessonGroup({
  title,
  items,
}: {
  title: string;
  items: LearnerAssignment[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={`/learner/learn/${item.id}`}
              className="flex gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-stone-300 hover:bg-stone-50 sm:gap-4 sm:p-4"
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
        ))}
      </ul>
    </section>
  );
}
