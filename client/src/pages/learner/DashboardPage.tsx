import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyAssignments } from '../../api/assignments';
import DonutChart from '../../components/DonutChart';
import ThumbnailImage from '../../components/ThumbnailImage';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import type { LearnerAssignment } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';

export default function LearnerDashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<LearnerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    listMyAssignments()
      .then((data) => {
        if (!active) return;
        setAssignments(data);
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, 'Could not load your videos.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const progressTotals = useMemo(() => {
    return assignments.reduce(
      (acc, item) => {
        const stats = item.stats ?? {
          totalQuestions: item.questionCount ?? 0,
          answered: item.answeredCount ?? 0,
          unanswered: Math.max((item.questionCount ?? 0) - (item.answeredCount ?? 0), 0),
          correct: 0,
          incorrect: 0,
        };
        acc.videos += 1;
        if (item.status === 'completed') acc.videosCompleted += 1;
        else if (item.status === 'in_progress') acc.videosInProgress += 1;
        else acc.videosAssigned += 1;
        acc.watchSum += item.completionPercentage ?? 0;
        acc.totalQuestions += stats.totalQuestions;
        acc.answered += stats.answered;
        acc.correct += stats.correct;
        acc.incorrect += stats.incorrect;
        acc.unanswered += stats.unanswered;
        return acc;
      },
      {
        videos: 0,
        videosCompleted: 0,
        videosInProgress: 0,
        videosAssigned: 0,
        watchSum: 0,
        totalQuestions: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
      },
    );
  }, [assignments]);

  const avgWatchPercent =
    progressTotals.videos === 0
      ? 0
      : Math.round(progressTotals.watchSum / progressTotals.videos);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((item) => {
      const title = item.video?.title?.toLowerCase() ?? '';
      const description = item.video?.description?.toLowerCase() ?? '';
      return title.includes(q) || description.includes(q);
    });
  }, [assignments, query]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

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

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
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
          {/* Progress — same idea as admin learner progress */}
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink sm:text-lg">Your progress</h2>
              <p className="mt-0.5 text-sm text-stone-500">
                Overview of assigned lessons and quiz answers.
              </p>
            </div>

            {assignments.length === 0 ? (
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

          {/* Videos — YouTube-style grid */}
          {assignments.length > 0 && (
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

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 px-5 py-12 text-center">
                  <p className="text-sm text-stone-500">
                    No videos match “{query.trim()}”.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((item) => (
                    <VideoCard key={item.id} item={item} />
                  ))}
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
