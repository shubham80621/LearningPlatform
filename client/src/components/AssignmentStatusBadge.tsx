import type { AssignmentStatus } from '../types';

const LABELS: Record<AssignmentStatus, string> = {
  assigned: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

const TONES: Record<AssignmentStatus, string> = {
  assigned: 'bg-stone-100 text-stone-600',
  in_progress: 'bg-teal-50 text-teal-800',
  completed: 'bg-emerald-50 text-emerald-800',
};

export default function AssignmentStatusBadge({
  status,
  className = '',
}: {
  status: AssignmentStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
}
