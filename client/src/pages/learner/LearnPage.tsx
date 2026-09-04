import { Link } from 'react-router-dom';

export default function LearnerLearnPage() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6 sm:py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Learning
      </h1>
      <p className="mt-2 text-sm text-stone-500 sm:text-base">
        Pick a video from Home to open the player. The watch + quiz experience
        will live here next.
      </p>
      <Link
        to="/learner"
        className="mt-6 inline-flex rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
      >
        Browse Home
      </Link>
    </div>
  );
}
