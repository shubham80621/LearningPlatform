import { Link, useParams } from 'react-router-dom';

/** Placeholder until the interactive player ships. */
export default function LearnerWatchPage() {
  const { assignmentId } = useParams();

  return (
    <div className="mx-auto w-full max-w-3xl py-6 sm:py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Ready to learn
      </h1>
      <p className="mt-2 text-sm text-stone-500 sm:text-base">
        Player for this lesson is coming next
        {assignmentId ? ` (assignment ${assignmentId.slice(0, 8)}…)` : ''}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/learner"
          className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
        >
          Back to Home
        </Link>
        <Link
          to="/learner/learn"
          className="inline-flex rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Learning
        </Link>
      </div>
    </div>
  );
}
