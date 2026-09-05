import { useRef } from 'react';
import ThumbnailImage from '../ThumbnailImage';
import { mediaUrl } from '../../utils/media';
import { errorTextClassName, labelClassName } from './fieldStyles';

type MediaPickerProps = {
  kind: 'image' | 'video';
  label: string;
  name: string;
  accept: string;
  previewUrl?: string;
  fileName?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
};

function EditIconButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Edit"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    </button>
  );
}

export default function MediaPicker({
  kind,
  label,
  name,
  accept,
  previewUrl,
  fileName,
  hint,
  error,
  disabled = false,
  onFile,
}: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${name}-error`;
  const hasPreview = Boolean(previewUrl);
  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };
  const isImage = kind === 'image';

  return (
    <div className={disabled ? 'opacity-70' : undefined}>
      <p className={labelClassName}>{label}</p>
      <div
        className={`relative overflow-hidden rounded-xl bg-stone-100 ring-1 ${
          error ? 'ring-red-400' : 'ring-stone-200'
        } ${isImage ? 'h-24 w-40' : 'h-36 w-64 max-w-full'}`}
      >
        <EditIconButton onClick={openPicker} disabled={disabled} />
        {isImage ? (
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="block h-full w-full disabled:cursor-not-allowed"
          >
            <ThumbnailImage
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ) : hasPreview ? (
          <video
            src={mediaUrl(previewUrl!)}
            className="h-full w-full bg-stone-900 object-contain"
            controls={!disabled}
            preload="metadata"
          />
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="flex h-full w-full flex-col items-center justify-center px-3 text-center text-xs text-stone-500 disabled:cursor-not-allowed"
          >
            No video yet
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />

      {fileName && !error && (
        <p className="mt-1 max-w-64 truncate text-sm text-stone-500">{fileName}</p>
      )}
      {hint && !error && !fileName && (
        <p className="mt-1 text-sm text-stone-500">{hint}</p>
      )}
      {error && (
        <p id={errorId} className={errorTextClassName} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
