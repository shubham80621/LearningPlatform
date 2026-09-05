/** Dim overlay + spinner while an edit form loads its record. */
export default function FormBusyOverlay({
  busy,
  label = 'Loading…',
}: {
  busy: boolean;
  label?: string;
}) {
  if (!busy) return null;

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-[inherit] bg-white/70 backdrop-blur-[1px]"
      aria-busy="true"
      aria-live="polite"
    >
      <span
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-ink"
        aria-hidden
      />
      <span className="text-sm font-medium text-stone-600">{label}</span>
    </div>
  );
}
