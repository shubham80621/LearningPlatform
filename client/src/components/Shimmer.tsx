/** Neutral pulse block for table/card loading placeholders. */
export default function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-stone-200/90 ${className}`}
    />
  );
}
