import { mediaUrl } from '../../utils/media';

type VideoPreviewDialogProps = {
  title: string;
  videoUrl: string;
  onClose: () => void;
};

export default function VideoPreviewDialog({
  title,
  videoUrl,
  onClose,
}: VideoPreviewDialogProps) {
  const src = mediaUrl(videoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-preview-title"
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-stone-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
          <h2 id="video-preview-title" className="truncate text-base font-semibold text-ink">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50"
            >
              Open in new tab
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
        <div className="bg-black">
          <video src={src} controls autoPlay className="max-h-[70vh] w-full" />
        </div>
      </div>
    </div>
  );
}
