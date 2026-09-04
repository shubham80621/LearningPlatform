import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getMyAssignment,
  listMyAssignments,
  saveMyProgress,
  submitMyAnswer,
} from '../../api/assignments';
import ThumbnailImage from '../../components/ThumbnailImage';
import type {
  LearnerAssignment,
  LearnerWatchQuestion,
  LearnerWatchSession,
} from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration, mediaUrl } from '../../utils/media';
import {
  beaconSaveProgress,
  clearBufferedProgress,
  readBufferedProgress,
  writeBufferedProgress,
} from '../../utils/watchProgress';

/** Min gap between normal event flushes (pause/seek/etc.). Close always bypasses. */
const PROGRESS_EVENT_THROTTLE_MS = 5000;

export default function LearnerWatchPage() {
  const { assignmentId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastFlushedAt = useRef(0);
  const lastFlushedSeconds = useRef(-1);
  const latestSeconds = useRef(0);
  const dirtyRef = useRef(false);
  const assignmentIdRef = useRef(assignmentId);
  const promptedIds = useRef(new Set<string>());
  const resumeApplied = useRef(false);

  assignmentIdRef.current = assignmentId;

  const [session, setSession] = useState<LearnerWatchSession | null>(null);
  const [playlist, setPlaylist] = useState<LearnerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<LearnerWatchQuestion | null>(
    null,
  );
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [shortAnswer, setShortAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [answerPhase, setAnswerPhase] = useState<'idle' | 'checking' | 'revealed'>(
    'idle',
  );
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [playlistFilter, setPlaylistFilter] = useState<
    'all' | 'in_progress' | 'not_started' | 'completed'
  >('all');

  useEffect(() => {
    if (!assignmentId) return;
    let active = true;
    setLoading(true);
    setError('');
    resumeApplied.current = false;
    promptedIds.current = new Set();
    dirtyRef.current = false;
    lastFlushedAt.current = 0;
    lastFlushedSeconds.current = -1;
    latestSeconds.current = 0;
    setActiveQuestion(null);
    setFeedback(null);
    setAnswerPhase('idle');

    Promise.all([getMyAssignment(assignmentId), listMyAssignments()])
      .then(([data, feed]) => {
        if (!active) return;
        setSession(data);
        setPlaylist(feed);
        latestSeconds.current = data.lastWatchedTimestamp || 0;
        lastFlushedSeconds.current = data.lastWatchedTimestamp || 0;
        for (const question of data.questions) {
          if (question.answered) promptedIds.current.add(question.id);
        }
        // Prefer newer local buffer if the tab crashed before a successful flush.
        const buffered = readBufferedProgress(assignmentId);
        if (
          buffered &&
          buffered.lastWatchedTimestamp > (data.lastWatchedTimestamp || 0)
        ) {
          latestSeconds.current = buffered.lastWatchedTimestamp;
          dirtyRef.current = true;
        }
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, 'Could not load this lesson.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assignmentId]);

  const unansweredGate = useMemo(() => {
    if (!session) return null;
    return (
      session.questions
        .filter((question) => !question.answered)
        .sort((a, b) => a.timestamp - b.timestamp)[0] ?? null
    );
  }, [session]);

  const noteLocalProgress = useCallback(
    (seconds: number) => {
      if (!assignmentId) return;
      const next = Math.max(0, Math.floor(seconds));
      if (next === latestSeconds.current) return;
      latestSeconds.current = next;
      dirtyRef.current = true;
      writeBufferedProgress(assignmentId, next);
    },
    [assignmentId],
  );

  const flushProgress = useCallback(
    async (options?: { force?: boolean; seconds?: number }) => {
      if (!assignmentId) return;
      const force = options?.force ?? false;
      if (typeof options?.seconds === 'number') {
        const secondsInput = Math.max(0, Math.floor(options.seconds));
        latestSeconds.current = secondsInput;
        if (secondsInput !== lastFlushedSeconds.current) {
          dirtyRef.current = true;
          writeBufferedProgress(assignmentId, secondsInput);
        }
      }

      const seconds = Math.floor(latestSeconds.current ?? 0);
      const now = Date.now();

      if (!force) {
        if (!dirtyRef.current && seconds <= lastFlushedSeconds.current) return;
        if (now - lastFlushedAt.current < PROGRESS_EVENT_THROTTLE_MS) return;
      } else if (!dirtyRef.current && seconds <= lastFlushedSeconds.current) {
        return;
      }

      lastFlushedAt.current = now;
      lastFlushedSeconds.current = Math.max(lastFlushedSeconds.current, seconds);
      dirtyRef.current = false;
      setSaving(true);
      try {
        const updated = await saveMyProgress(assignmentId, {
          lastWatchedTimestamp: seconds,
        });
        clearBufferedProgress(assignmentId);
        setSession((current) =>
          current
            ? {
                ...current,
                status: updated.status as LearnerWatchSession['status'],
                lastWatchedTimestamp: updated.lastWatchedTimestamp,
                completionPercentage: updated.completionPercentage,
              }
            : current,
        );
        setPlaylist((current) =>
          current.map((item) =>
            item.id === assignmentId
              ? {
                  ...item,
                  status: updated.status as LearnerAssignment['status'],
                  lastWatchedTimestamp: updated.lastWatchedTimestamp,
                  completionPercentage: updated.completionPercentage,
                }
              : item,
          ),
        );
      } catch {
        dirtyRef.current = true;
        writeBufferedProgress(assignmentId, seconds);
      } finally {
        setSaving(false);
      }
    },
    [assignmentId, noteLocalProgress],
  );

  // Tab/browser close or background: best-effort keepalive flush (bypasses 5s throttle).
  useEffect(() => {
    const flushForUnload = () => {
      const id = assignmentIdRef.current;
      if (!id) return;
      const video = videoRef.current;
      if (video) {
        noteLocalProgress(video.currentTime);
      }
      const seconds = latestSeconds.current;
      if (!dirtyRef.current && seconds <= lastFlushedSeconds.current) return;
      beaconSaveProgress(id, seconds);
      dirtyRef.current = false;
      lastFlushedAt.current = Date.now();
      lastFlushedSeconds.current = Math.max(lastFlushedSeconds.current, seconds);
      clearBufferedProgress(id);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushForUnload();
      }
    };

    window.addEventListener('pagehide', flushForUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flushForUnload);
      document.removeEventListener('visibilitychange', onVisibility);
      // Leaving this lesson / switching assignment: force a normal flush.
      const id = assignmentIdRef.current;
      const seconds = latestSeconds.current;
      if (id && (dirtyRef.current || seconds > lastFlushedSeconds.current)) {
        beaconSaveProgress(id, seconds);
        clearBufferedProgress(id);
      }
    };
  }, [noteLocalProgress]);

  const openQuestion = useCallback((question: LearnerWatchQuestion) => {
    const video = videoRef.current;
    if (video) {
      noteLocalProgress(video.currentTime);
      void flushProgress({ force: false, seconds: video.currentTime });
      video.pause();
      if (Math.abs(video.currentTime - question.timestamp) > 0.35) {
        video.currentTime = question.timestamp;
      }
    }
    promptedIds.current.add(question.id);
    setActiveQuestion(question);
    setSelectedIndexes(question.selectedOptionIndexes ?? []);
    setShortAnswer(question.shortAnswer ?? '');
    setFeedback(
      question.answered && question.isCorrect != null
        ? {
            isCorrect: question.isCorrect,
            message: question.isCorrect ? 'Correct' : 'Incorrect',
          }
        : null,
    );
    setAnswerPhase(
      question.answered && question.isCorrect != null ? 'revealed' : 'idle',
    );
  }, [flushProgress, noteLocalProgress]);

  const checkQuestionsAt = useCallback(
    (time: number) => {
      if (!session || activeQuestion) return;
      const due = session.questions
        .filter(
          (question) =>
            !question.answered &&
            !promptedIds.current.has(question.id) &&
            time >= question.timestamp,
        )
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      if (due) openQuestion(due);
    },
    [session, activeQuestion, openQuestion],
  );

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !session || resumeApplied.current) return;
    resumeApplied.current = true;
    const resumeAt = Math.min(
      Math.max(session.lastWatchedTimestamp || 0, latestSeconds.current || 0),
      Math.max(video.duration - 1, 0),
    );
    if (resumeAt > 1) {
      video.currentTime = resumeAt;
    }
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !session) return;
    noteLocalProgress(video.currentTime);
    checkQuestionsAt(video.currentTime);
  };

  const onSeeked = () => {
    const video = videoRef.current;
    if (!video || !session) return;
    noteLocalProgress(video.currentTime);
    void flushProgress({ seconds: video.currentTime });
  };

  const onSeeking = () => {
    const video = videoRef.current;
    if (!video || !session || activeQuestion) return;

    const blocked = unansweredGate;
    if (blocked && video.currentTime > blocked.timestamp + 0.25) {
      video.currentTime = blocked.timestamp;
      openQuestion(blocked);
      return;
    }

    const crossed = session.questions
      .filter(
        (question) =>
          !question.answered &&
          video.currentTime >= question.timestamp &&
          !promptedIds.current.has(question.id),
      )
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    if (crossed) openQuestion(crossed);
  };

  const onPause = () => {
    const video = videoRef.current;
    if (!video) return;
    void flushProgress({ seconds: video.currentTime });
  };

  const onEnded = () => {
    const video = videoRef.current;
    const seconds = video?.currentTime || session?.video.duration || 0;
    void flushProgress({ force: true, seconds });
  };

  const toggleOption = (index: number) => {
    if (!activeQuestion || activeQuestion.answered || answerPhase !== 'idle') {
      return;
    }
    if (activeQuestion.type === 'single') {
      setSelectedIndexes([index]);
      return;
    }
    setSelectedIndexes((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index].sort((a, b) => a - b),
    );
  };

  const handleSubmitAnswer = async () => {
    if (
      !assignmentId ||
      !activeQuestion ||
      activeQuestion.answered ||
      answerPhase !== 'idle'
    ) {
      return;
    }
    setSubmitting(true);
    setAnswerPhase('checking');
    setError('');
    setFeedback(null);

    const startedAt = Date.now();
    const minRevealMs = 1100;

    try {
      const payload =
        activeQuestion.type === 'short'
          ? { questionId: activeQuestion.id, shortAnswer }
          : {
              questionId: activeQuestion.id,
              selectedOptionIndexes: selectedIndexes,
            };
      const next = await submitMyAnswer(assignmentId, payload);

      const waitMs = Math.max(0, minRevealMs - (Date.now() - startedAt));
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      setSession(next);
      setPlaylist((current) =>
        current.map((item) =>
          item.id === assignmentId
            ? {
                ...item,
                status: next.status,
                completionPercentage: next.completionPercentage,
                answeredCount: next.stats.answered,
                questionCount: next.stats.totalQuestions,
                stats: next.stats,
              }
            : item,
        ),
      );
      const updated = next.questions.find((item) => item.id === activeQuestion.id);
      if (updated) {
        setActiveQuestion(updated);
        setFeedback({
          isCorrect: Boolean(updated.isCorrect),
          message: updated.isCorrect ? 'Correct!' : 'Not quite.',
        });
      }
      setAnswerPhase('revealed');
      const video = videoRef.current;
      if (video) {
        void flushProgress({ force: true, seconds: video.currentTime });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit your answer.'));
      setAnswerPhase('idle');
    } finally {
      setSubmitting(false);
    }
  };

  const continueAfterQuestion = () => {
    setActiveQuestion(null);
    setFeedback(null);
    setAnswerPhase('idle');
    setSelectedIndexes([]);
    setShortAnswer('');
    const video = videoRef.current;
    if (video) {
      void video.play().catch(() => undefined);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto grid w-full max-w-[1800px] gap-4 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_402px] lg:gap-6 lg:px-6 lg:py-4">
        <div className="animate-pulse space-y-3">
          <div className="aspect-video rounded-xl bg-stone-100" />
          <div className="h-7 w-3/4 rounded bg-stone-100" />
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-stone-100" />
            <div className="h-10 flex-1 rounded-full bg-stone-100" />
          </div>
        </div>
        <div className="hidden animate-pulse space-y-2 lg:block">
          <div className="mb-3 flex gap-2">
            <div className="h-8 w-12 rounded-lg bg-stone-100" />
            <div className="h-8 w-24 rounded-lg bg-stone-100" />
          </div>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex gap-2">
              <div className="aspect-video w-40 rounded-lg bg-stone-100" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-full rounded bg-stone-100" />
                <div className="h-3 w-2/3 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Link
          to="/learner"
          className="mt-4 inline-flex rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (!session) return null;

  const src = mediaUrl(session.video.videoUrl);
  const answeredCount = session.stats.answered;
  const totalQuestions = session.stats.totalQuestions;
  const statusLabel =
    session.status === 'completed'
      ? 'Completed'
      : session.status === 'in_progress'
        ? 'In progress'
        : 'Not started';

  const filteredPlaylist = playlist.filter((item) => {
    if (playlistFilter === 'all') return true;
    if (playlistFilter === 'completed') return item.status === 'completed';
    if (playlistFilter === 'in_progress') {
      return (
        item.status === 'in_progress' ||
        (item.status !== 'completed' && item.completionPercentage > 0)
      );
    }
    return item.status === 'assigned' && item.completionPercentage === 0;
  });

  return (
    <div className="mx-auto w-full max-w-[1800px] px-3 py-3 sm:px-4 lg:px-6 lg:py-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_402px] lg:items-start lg:gap-6">
        {/* LEFT — player + title + actions (YouTube primary column) */}
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              key={session.id}
              src={src}
              controls
              playsInline
              className="aspect-video w-full bg-black"
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              onSeeking={onSeeking}
              onSeeked={onSeeked}
              onPause={onPause}
              onEnded={onEnded}
            />

            {activeQuestion && (
              <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-6">
                <div className="max-h-[90%] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                        Question · {formatDuration(activeQuestion.timestamp)}
                      </p>
                      <h2 className="mt-1 text-base font-semibold text-ink sm:text-lg">
                        {activeQuestion.questionText}
                      </h2>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium capitalize text-stone-600">
                      {activeQuestion.type}
                    </span>
                  </div>

                  {activeQuestion.type === 'short' ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-stone-600">
                        Your answer
                      </label>
                      <input
                        type="text"
                        value={shortAnswer}
                        disabled={answerPhase !== 'idle'}
                        onChange={(event) => setShortAnswer(event.target.value)}
                        className={`mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-50 ${
                          answerPhase === 'checking' ? 'quiz-checking' : ''
                        } ${answerPhase === 'revealed' ? 'quiz-option-reveal' : ''}`}
                        placeholder="Type your answer"
                      />
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {activeQuestion.options.map((option, index) => {
                        const selected = selectedIndexes.includes(index);
                        const showKey = answerPhase === 'revealed';
                        const isCorrectOption =
                          activeQuestion.correctOptionIndexes?.includes(index) ??
                          false;
                        let tone =
                          'border-stone-200 hover:border-stone-300 hover:bg-stone-50';
                        if (selected && answerPhase !== 'revealed') {
                          tone =
                            answerPhase === 'checking'
                              ? 'border-teal-600 bg-teal-50 quiz-checking'
                              : 'border-teal-600 bg-teal-50';
                        }
                        if (showKey && isCorrectOption) {
                          tone =
                            'border-emerald-600 bg-emerald-50 quiz-option-reveal';
                        } else if (showKey && selected && !isCorrectOption) {
                          tone = 'border-red-500 bg-red-50 quiz-option-reveal';
                        }

                        return (
                          <li key={`${activeQuestion.id}-${index}`}>
                            <button
                              type="button"
                              disabled={answerPhase !== 'idle'}
                              onClick={() => toggleOption(index)}
                              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${tone} disabled:cursor-default`}
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="text-ink">{option}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {answerPhase === 'checking' && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-3 text-sm font-medium text-stone-600">
                      <span
                        className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-teal-600"
                        aria-hidden
                      />
                      Checking your answer…
                    </div>
                  )}

                  {answerPhase === 'revealed' && feedback && (
                    <div
                      className={`quiz-reveal mt-4 rounded-xl px-3 py-3 text-sm font-medium ${
                        feedback.isCorrect
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="text-base font-semibold">{feedback.message}</p>
                      {!feedback.isCorrect && activeQuestion.correctAnswer ? (
                        <span className="mt-1 block font-normal">
                          Correct answer: {activeQuestion.correctAnswer}
                        </span>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {answerPhase === 'idle' ? (
                      <button
                        type="button"
                        disabled={
                          submitting ||
                          (activeQuestion.type === 'short'
                            ? !shortAnswer.trim()
                            : selectedIndexes.length === 0)
                        }
                        onClick={() => {
                          void handleSubmitAnswer();
                        }}
                        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                      >
                        Submit answer
                      </button>
                    ) : answerPhase === 'checking' ? (
                      <button
                        type="button"
                        disabled
                        className="rounded-full bg-stone-200 px-4 py-2.5 text-sm font-medium text-stone-500"
                      >
                        Checking…
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={continueAfterQuestion}
                        className="quiz-reveal rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
                      >
                        Continue watching
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title + action row (YouTube style) */}
          <div className="mt-3 px-0.5 sm:mt-3.5">
            <h1 className="text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
              {session.video.title}
            </h1>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  {session.video.title.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">LearnPulse</p>
                  <p className="text-xs text-stone-500">
                    {formatDuration(session.video.duration)}
                    {saving ? ' · Saving…' : ''}
                  </p>
                </div>
                <Link
                  to="/learner"
                  className="ml-1 rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-stone-800"
                >
                  Home
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-ink">
                  {session.completionPercentage}% watched
                </span>
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-ink">
                  {statusLabel}
                </span>
                {totalQuestions > 0 && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-ink">
                    {answeredCount}/{totalQuestions} answered
                  </span>
                )}
              </div>
            </div>

            {session.video.description ? (
              <div className="mt-3 rounded-xl bg-stone-100 px-3 py-3 text-sm leading-relaxed text-stone-700">
                {session.video.description}
              </div>
            ) : null}
          </div>

          {session.questions.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 text-base font-semibold text-ink">Questions</h2>
              <QuestionList
                questions={session.questions}
                onOpen={openQuestion}
                videoRef={videoRef}
              />
            </section>
          )}

          {error && session ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        {/* RIGHT — related/playlist only (YouTube suggestions column) */}
        <aside className="min-w-0 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto lg:pr-1">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'in_progress', label: 'In progress' },
                { id: 'not_started', label: 'Not started' },
                { id: 'completed', label: 'Completed' },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setPlaylistFilter(chip.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  playlistFilter === chip.id
                    ? 'bg-ink text-white'
                    : 'bg-stone-100 text-ink hover:bg-stone-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {filteredPlaylist.length === 0 ? (
              <li className="py-6 text-center text-sm text-stone-500">
                No lessons in this filter.
              </li>
            ) : (
              filteredPlaylist.map((item) => {
                const isCurrent = item.id === session.id;
                return (
                  <li key={item.id}>
                    <Link
                      to={`/learner/learn/${item.id}`}
                      className={`flex gap-2 rounded-xl p-1.5 transition hover:bg-stone-50 ${
                        isCurrent ? 'bg-stone-50 ring-1 ring-stone-200' : ''
                      }`}
                    >
                      <div className="relative w-[168px] shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        <ThumbnailImage
                          src={item.video.thumbnailUrl}
                          alt=""
                          className="aspect-video w-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-semibold text-white">
                          {formatDuration(item.video.duration)}
                        </span>
                        {item.completionPercentage > 0 && (
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-stone-300/80">
                            <div
                              className="h-full bg-teal-600"
                              style={{
                                width: `${item.completionPercentage}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5 pr-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                          {item.video.title}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {item.completionPercentage}% watched
                        </p>
                        <p className="text-xs text-stone-500">
                          {item.status === 'completed'
                            ? 'Completed'
                            : item.status === 'in_progress' ||
                                item.completionPercentage > 0
                              ? 'In progress'
                              : 'Not started'}
                          {item.questionCount > 0
                            ? ` · ${item.answeredCount}/${item.questionCount} Q`
                            : ''}
                        </p>
                        {isCurrent && (
                          <p className="mt-1 text-[11px] font-semibold text-teal-700">
                            Now playing
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function QuestionList({
  questions,
  onOpen,
  videoRef,
}: {
  questions: LearnerWatchQuestion[];
  onOpen: (question: LearnerWatchQuestion) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
      {questions.map((question, index) => (
        <li key={question.id}>
          <button
            type="button"
            onClick={() => {
              if (question.answered) {
                onOpen(question);
                return;
              }
              const video = videoRef.current;
              if (video) {
                video.currentTime = question.timestamp;
                onOpen(question);
              }
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-50"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-600">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {question.questionText}
              </p>
              <p className="text-xs text-stone-500">
                At {formatDuration(question.timestamp)}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs font-medium ${
                question.answered
                  ? question.isCorrect
                    ? 'text-emerald-700'
                    : 'text-red-600'
                  : 'text-stone-400'
              }`}
            >
              {question.answered
                ? question.isCorrect
                  ? 'Correct'
                  : 'Incorrect'
                : 'Pending'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
