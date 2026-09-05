import { Link } from 'react-router-dom';
import type { LearnerAssignment } from '../types';
import { formatDuration } from '../utils/media';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import ThumbnailImage from './ThumbnailImage';

type Variant = 'row' | 'grid' | 'playlist';

type Props = {
  item: LearnerAssignment;
  variant?: Variant;
  /** Highlight the currently playing lesson (playlist). */
  current?: boolean;
};

function questionLabel(item: LearnerAssignment) {
  if (item.stats && item.stats.totalQuestions > 0) {
    return `${item.stats.answered}/${item.stats.totalQuestions} answered`;
  }
  if (item.questionCount > 0) {
    return `${item.answeredCount}/${item.questionCount} questions`;
  }
  return null;
}

export default function AssignmentLessonCard({
  item,
  variant = 'row',
  current = false,
}: Props) {
  const progress = Math.min(Math.max(item.completionPercentage ?? 0, 0), 100);
  const questions = questionLabel(item);
  const href = `/learner/learn/${item.id}`;

  if (variant === 'grid') {
    return (
      <Link to={href} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-stone-100">
          <ThumbnailImage
            src={item.video.thumbnailUrl}
            alt=""
            className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {formatDuration(item.video.duration ?? 0)}
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
            {item.video.title.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-teal-800">
              {item.video.title}
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              {progress}% watched
              {questions ? ` · ${questions}` : ''}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'playlist') {
    return (
      <Link
        to={href}
        className={`flex gap-2 rounded-xl p-1.5 transition hover:bg-stone-50 ${
          current ? 'bg-stone-50 ring-1 ring-stone-200' : ''
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
          {progress > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-stone-300/80">
              <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5 pr-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
            {item.video.title}
          </p>
          <p className="mt-1 text-xs text-stone-500">{progress}% watched</p>
          <div className="mt-1.5">
            <AssignmentStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {questions ?? 'No questions'}
          </p>
          {current && (
            <p className="mt-1 text-[11px] font-semibold text-teal-700">Now playing</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
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
          {progress}% watched
          {questions ? ` · ${questions}` : ''}
        </p>
        {progress > 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
