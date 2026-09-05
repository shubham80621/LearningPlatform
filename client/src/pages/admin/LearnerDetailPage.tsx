import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  assignVideosToLearner,
  listLearnerAssignments,
  removeAssignment,
} from '../../api/assignments';
import { getLearner, updateLearner } from '../../api/users';
import type { Assignment, User, Video } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import { validateEmail, validatePassword } from '../../utils/validation';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import DonutChart from '../../components/DonutChart';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';
import VideoPreviewDialog from '../../components/admin/VideoPreviewDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import TextField from '../../components/form/TextField';
import PasswordField from '../../components/form/PasswordField';
import { fieldClassName } from '../../components/form/fieldStyles';
import ThumbnailImage from '../../components/ThumbnailImage';
import { InfiniteScrollSentinel } from '../../components/InfiniteScrollSentinel';
import { useListVideosQuery } from '../../store/api';
import { useAppDispatch } from '../../store/hooks';
import { invalidateLearnerLists } from '../../store/invalidate';

const ASSIGN_PAGE_SIZE = 6;

type LearnerTab = 'info' | 'assign' | 'progress';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

function tabClass(active: boolean) {
  return active
    ? 'relative z-10 -mb-px rounded-t-lg border border-b-0 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink'
    : 'relative -mb-px rounded-t-lg border border-b-0 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-ink';
}

export default function LearnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: LearnerTab =
    rawTab === 'assign' || rawTab === 'progress' ? rawTab : 'info';

  const [learner, setLearner] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoQuery, setVideoQuery] = useState('');
  const [assignPage, setAssignPage] = useState(1);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [nextLearner, nextAssignments] = await Promise.all([
        getLearner(id),
        listLearnerAssignments(id),
      ]);
      setLearner(nextLearner);
      setName(nextLearner.name);
      setEmail(nextLearner.email);
      setAssignments(nextAssignments);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load learner details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    if (!id || tab !== 'progress') return;
    let active = true;
    listLearnerAssignments(id)
      .then((nextAssignments) => {
        if (active) setAssignments(nextAssignments);
      })
      .catch(() => {
        /* keep existing list if refresh fails */
      });
    return () => {
      active = false;
    };
  }, [id, tab]);

  useEffect(() => {
    const timer = setTimeout(() => setVideoQuery(videoSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [videoSearch]);

  useEffect(() => {
    setAssignPage(1);
  }, [videoQuery]);

  const assignQuery = useListVideosQuery(
    {
      page: assignPage,
      limit: ASSIGN_PAGE_SIZE,
      status: 'published',
      unassignedFor: id,
      search: videoQuery || undefined,
    },
    { skip: !id || tab !== 'assign' },
  );

  useEffect(() => {
    if (assignQuery.data?.page != null && assignQuery.data.page > assignPage) {
      setAssignPage(assignQuery.data.page);
    }
  }, [assignQuery.data?.page, assignPage]);

  const assignVideos = assignQuery.data?.items ?? [];
  const assignTotal = assignQuery.data?.total ?? 0;
  const assignLoading = assignQuery.isLoading && !assignQuery.data;
  const assignHasMore = Boolean(
    assignQuery.data && assignQuery.data.page < assignQuery.data.totalPages,
  );

  const progressTotals = useMemo(() => {
    return assignments.reduce(
      (acc, item) => {
        const stats = item.stats ?? {
          totalQuestions: 0,
          answered: 0,
          unanswered: 0,
          correct: 0,
          incorrect: 0,
        };
        acc.videos += 1;
        acc.watchSum += item.completionPercentage ?? 0;
        acc.totalQuestions += stats.totalQuestions;
        acc.answered += stats.answered;
        acc.correct += stats.correct;
        acc.incorrect += stats.incorrect;
        acc.unanswered += stats.unanswered;
        if (item.status === 'completed') acc.videosCompleted += 1;
        else if (item.status === 'in_progress') acc.videosInProgress += 1;
        else acc.videosAssigned += 1;
        return acc;
      },
      {
        videos: 0,
        watchSum: 0,
        videosCompleted: 0,
        videosInProgress: 0,
        videosAssigned: 0,
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

  const setTab = (next: LearnerTab) => {
    setError('');
    setMessage('');
    if (next === 'info') setSearchParams({});
    else setSearchParams({ tab: next });
  };

  const validateInfo = () => {
    const next: FieldErrors = {};
    if (!name.trim() || name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters.';
    }
    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;
    if (password) {
      const passwordError = validatePassword(password);
      if (passwordError) next.password = passwordError;
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveInfo = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setError('');
    setMessage('');
    if (!validateInfo()) return;

    setSubmitting(true);
    try {
      const updated = await updateLearner(id, {
        name: name.trim(),
        email: email.trim(),
        ...(password ? { password } : {}),
      });
      setLearner(updated);
      setPassword('');
      setMessage('Learner details saved.');
      invalidateLearnerLists(dispatch);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update learner.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVideo = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId)
        ? prev.filter((item) => item !== videoId)
        : [...prev, videoId],
    );
  };

  const handleAssign = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || selectedVideoIds.length === 0) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const count = selectedVideoIds.length;
      const next = await assignVideosToLearner({
        learnerId: id,
        videoIds: selectedVideoIds,
      });
      setAssignments(next);
      setSelectedVideoIds([]);
      setMessage(`Assigned ${count} video${count === 1 ? '' : 's'}.`);
      invalidateLearnerLists(dispatch);
      void assignQuery.refetch();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not assign videos.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!pendingRemoveId) return;
    setSubmitting(true);
    setError('');
    try {
      await removeAssignment(pendingRemoveId);
      setAssignments((prev) => prev.filter((item) => item.id !== pendingRemoveId));
      setPendingRemoveId(null);
      setMessage('Assignment removed.');
      invalidateLearnerLists(dispatch);
      if (tab === 'assign') void assignQuery.refetch();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not remove assignment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={learner ? `Edit ${learner.name}` : 'Edit learner'}
        subtitle="Update account details, assign published videos, and review progress."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Learners', to: '/admin/learners' },
          { label: learner?.name ?? 'Edit learner' },
        ]}
        actions={
          <Link
            to="/admin/learners"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
          >
            Cancel
          </Link>
        }
      />

      <div>
        <div role="tablist" aria-label="Edit learner sections" className="flex items-end gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'info'}
            onClick={() => setTab('info')}
            className={tabClass(tab === 'info')}
          >
            Basic info
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'assign'}
            onClick={() => setTab('assign')}
            className={tabClass(tab === 'assign')}
          >
            Assign videos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'progress'}
            onClick={() => setTab('progress')}
            className={tabClass(tab === 'progress')}
          >
            Progress
          </button>
        </div>

        <div
          className={`border border-stone-200 bg-white p-5 shadow-sm md:p-6 ${
            tab === 'info' ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
          }`}
          role="tabpanel"
        >
          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          )}

          {loading ? (
            <p className="py-6 text-sm text-stone-500">Loading learner…</p>
          ) : tab === 'info' ? (
            <form onSubmit={handleSaveInfo} noValidate className="max-w-xl space-y-4">
              <h2 className="text-lg font-semibold text-ink">Account details</h2>
              <TextField
                label="Name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={fieldErrors.name}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={fieldErrors.email}
              />
              <div>
                <PasswordField
                  label="New password"
                  name="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  error={fieldErrors.password}
                />
                <p className="mt-1.5 text-xs text-stone-500">
                  Leave blank to keep the current password.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          ) : tab === 'assign' ? (
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Assign videos</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Only published videos that are not already assigned appear here.
                  </p>
                </div>
                <div className="w-full sm:max-w-xs">
                  <label htmlFor="assign-video-search" className="sr-only">
                    Search videos
                  </label>
                  <input
                    id="assign-video-search"
                    type="search"
                    value={videoSearch}
                    onChange={(event) => setVideoSearch(event.target.value)}
                    placeholder="Search videos…"
                    className={fieldClassName}
                  />
                </div>
              </div>

              {assignLoading && assignVideos.length === 0 ? (
                <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  Loading videos…
                </p>
              ) : assignTotal === 0 && videoQuery ? (
                <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  No videos match “{videoQuery}”.
                </p>
              ) : assignTotal === 0 ? (
                <p className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  No published videos left to assign. Publish a video first, or this learner already
                  has all of them.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <ul className="divide-y divide-stone-100">
                    {assignVideos.map((video) => {
                      const checked = selectedVideoIds.includes(video.id);
                      return (
                        <li
                          key={video.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleVideo(video.id)}
                              className="h-4 w-4 shrink-0 accent-teal-700"
                            />
                            <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                              <ThumbnailImage
                                src={video.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-ink">
                                {video.title}
                              </span>
                              <span className="text-xs text-stone-500">
                                {formatDuration(video.duration)}
                              </span>
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(video)}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50 sm:shrink-0"
                          >
                            Play
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
                    Showing {assignVideos.length} of {assignTotal}
                  </p>
                  <InfiniteScrollSentinel
                    hasMore={assignHasMore}
                    loading={assignQuery.isFetching && assignPage > 1}
                    onLoadMore={() => {
                      if (assignHasMore && !assignQuery.isFetching) {
                        setAssignPage((current) => current + 1);
                      }
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || selectedVideoIds.length === 0}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {submitting
                  ? 'Assigning…'
                  : `Assign ${selectedVideoIds.length || ''} video${
                      selectedVideoIds.length === 1 ? '' : 's'
                    }`.trim()}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Progress</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Overview of assigned lessons, quiz answers, and correct vs incorrect results.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void load();
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stone-100"
                >
                  Refresh
                </button>
              </div>

              {assignments.length === 0 ? (
                <p className="py-6 text-sm text-stone-500">
                  No assignments yet. Use the Assign videos tab to add lessons.
                </p>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <DonutChart
                      title="Video watch progress"
                      centerValue={`${avgWatchPercent}%`}
                      centerLabel="avg watched"
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

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        label: 'Assigned videos',
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
                      {
                        label: 'Unanswered',
                        value: progressTotals.unanswered,
                        tone: 'bg-amber-50 text-amber-900',
                      },
                    ].map((card) => (
                      <div key={card.label} className={`rounded-xl px-4 py-3 ${card.tone}`}>
                        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                          {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-stone-200">
                    <ul className="divide-y divide-stone-200">
                      {assignments.map((assignment) => {
                      const stats = assignment.stats ?? {
                        totalQuestions: 0,
                        answered: 0,
                        unanswered: 0,
                        correct: 0,
                        incorrect: 0,
                      };
                      const questions = assignment.questions ?? [];

                      return (
                        <li key={assignment.id}>
                          <div className="flex flex-col gap-3 border-b border-stone-100 bg-stone-50/70 px-4 py-4 sm:flex-row sm:items-center">
                            <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                              <ThumbnailImage
                                src={assignment.video?.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-ink">
                                  {assignment.video?.title ?? 'Video unavailable'}
                                </p>
                                <AssignmentStatusBadge status={assignment.status} />
                              </div>
                              <p className="mt-1 text-sm text-stone-500">
                                {assignment.completionPercentage}% watched ·{' '}
                                {stats.correct}/{stats.totalQuestions} correct
                                {assignment.lastWatchedTimestamp > 0
                                  ? ` · last at ${formatDuration(assignment.lastWatchedTimestamp)}`
                                  : ''}
                                {assignment.status === 'completed' &&
                                assignment.completedAt
                                  ? ` · completed ${new Date(assignment.completedAt).toLocaleString()}`
                                  : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingRemoveId(assignment.id)}
                              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50 sm:shrink-0"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid gap-2 border-b border-stone-100 px-4 py-3 sm:grid-cols-4">
                            <p className="text-sm text-stone-600">
                              Questions:{' '}
                              <span className="font-medium text-ink">{stats.totalQuestions}</span>
                            </p>
                            <p className="text-sm text-stone-600">
                              Answered:{' '}
                              <span className="font-medium text-ink">{stats.answered}</span>
                            </p>
                            <p className="text-sm text-emerald-700">
                              Correct:{' '}
                              <span className="font-medium">{stats.correct}</span>
                            </p>
                            <p className="text-sm text-red-700">
                              Incorrect:{' '}
                              <span className="font-medium">{stats.incorrect}</span>
                            </p>
                          </div>

                          {questions.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-stone-500">
                              This video has no questions yet. Add them under Videos → Edit →
                              Questions, then click Refresh.
                            </p>
                          ) : (
                            <ul className="divide-y divide-stone-100">
                              {questions.map((question, index) => (
                                <li key={question.questionId} className="px-4 py-3">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-ink">
                                      Q{index + 1} · {formatDuration(question.timestamp)} ·{' '}
                                      {question.questionText}
                                    </p>
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        !question.answered
                                          ? 'bg-stone-100 text-stone-600'
                                          : question.isCorrect
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-red-50 text-red-700'
                                      }`}
                                    >
                                      {!question.answered
                                        ? 'Unanswered'
                                        : question.isCorrect
                                          ? 'Correct'
                                          : 'Incorrect'}
                                    </span>
                                  </div>
                                  <div className="mt-2 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
                                    <p>
                                      <span className="font-medium text-ink">Learner: </span>
                                      {question.learnerAnswer ?? '—'}
                                    </p>
                                    <p>
                                      <span className="font-medium text-ink">Expected: </span>
                                      {question.correctAnswer}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {previewVideo && (
        <VideoPreviewDialog
          title={previewVideo.title}
          videoUrl={previewVideo.videoUrl}
          onClose={() => setPreviewVideo(null)}
        />
      )}

      {pendingRemoveId && (
        <ConfirmDialog
          title="Remove assignment?"
          message="The learner will lose access to this video. Saved progress and answers for this assignment will be deleted."
          confirmLabel="Remove"
          busy={submitting}
          onCancel={() => setPendingRemoveId(null)}
          onConfirm={() => {
            void handleRemove();
          }}
        />
      )}
    </div>
  );
}
