import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createVideo } from '../../api/videos';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration, readVideoDuration } from '../../utils/media';
import {
  validateRequiredText,
  validateThumbnailFile,
  validateVideoFile,
  validateVideoSelection,
} from '../../utils/mediaValidation';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import TextField from '../../components/form/TextField';
import MediaPicker from '../../components/form/MediaPicker';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from '../../components/form/fieldStyles';
import { useAppDispatch } from '../../store/hooks';
import { setVideosPage } from '../../store/uiSlice';
import { invalidateVideoLists } from '../../store/invalidate';

type FieldErrors = {
  title?: string;
  description?: string;
  thumbnail?: string;
  video?: string;
};

export default function CreateVideoPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [duration, setDuration] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const next: FieldErrors = {
      title: validateRequiredText(title, 'Title') || undefined,
      description: validateRequiredText(description, 'Description') || undefined,
      thumbnail: validateThumbnailFile(thumbnail) || undefined,
      video: validateVideoFile(videoFile, duration) || undefined,
    };
    setFieldErrors(next);
    return !next.title && !next.description && !next.thumbnail && !next.video;
  };

  const handleThumbnailChange = (file: File) => {
    const errorMessage = validateThumbnailFile(file);
    if (errorMessage) {
      setThumbnail(null);
      setThumbnailPreview('');
      setFieldErrors((prev) => ({ ...prev, thumbnail: errorMessage }));
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, thumbnail: undefined }));
  };

  const handleVideoChange = async (file: File) => {
    const selectionError = validateVideoSelection(file);
    if (selectionError) {
      setVideoFile(null);
      setVideoPreview('');
      setDuration(0);
      setFieldErrors((prev) => ({ ...prev, video: selectionError }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, video: undefined }));

    try {
      const seconds = await readVideoDuration(file);
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setDuration(seconds);
    } catch {
      setVideoFile(null);
      setVideoPreview('');
      setDuration(0);
      setFieldErrors((prev) => ({
        ...prev,
        video: 'Choose a valid video file. This one could not be read.',
      }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validateForm() || !thumbnail || !videoFile) return;

    setSubmitting(true);
    try {
      await createVideo({
        title: title.trim(),
        description: description.trim(),
        duration,
        thumbnail,
        video: videoFile,
      });
      invalidateVideoLists(dispatch);
      dispatch(setVideosPage(1));
      navigate('/admin/videos');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create video. Check files and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Create video"
        subtitle="Upload a thumbnail and lesson file. Files are stored locally for now."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Videos', to: '/admin/videos' },
          { label: 'Create video' },
        ]}
        actions={
          <Link
            to="/admin/videos"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
          >
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
            <h2 className="text-lg font-semibold text-ink">Lesson details</h2>
            <TextField
              label="Title"
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              error={fieldErrors.title}
              placeholder="Intro to Arrays"
            />
            <div>
              <label htmlFor="description" className={labelClassName}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                placeholder="What learners will practice in this lesson."
                className={fieldErrors.description ? fieldErrorClassName : fieldClassName}
                aria-invalid={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description && (
                <p className={errorTextClassName} role="alert">
                  {fieldErrors.description}
                </p>
              )}
            </div>
            <MediaPicker
              kind="image"
              label="Thumbnail"
              name="thumbnail"
              accept="image/jpeg,image/png,image/webp,image/gif"
              previewUrl={thumbnailPreview}
              fileName={thumbnail?.name}
              hint="JPEG, PNG, WebP, or GIF. Max 5 MB."
              error={fieldErrors.thumbnail}
              onFile={handleThumbnailChange}
            />
            <MediaPicker
              kind="video"
              label="Video"
              name="video"
              accept="video/mp4,video/webm,video/quicktime"
              previewUrl={videoPreview}
              fileName={
                videoFile
                  ? `${videoFile.name}${duration ? ` · ${formatDuration(duration)}` : ''}`
                  : undefined
              }
              hint="MP4, WebM, or MOV. Max 200 MB."
              error={fieldErrors.video}
              onFile={handleVideoChange}
            />
            {error && (
              <p className={errorTextClassName} role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {submitting ? 'Uploading…' : 'Create video'}
              </button>
              <Link
                to="/admin/videos"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
              >
                Back to list
              </Link>
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
            <h2 className="text-lg font-semibold text-ink">Guidelines</h2>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              <li>New lessons start as drafts. Publish them from the videos table.</li>
              <li>Duration is read from the video file and used later for quiz timestamps.</li>
              <li>Files save to the server uploads folder for this assignment.</li>
              <li>Later this can switch to AWS S3 without changing the rest of the form.</li>
            </ul>
            {duration > 0 && (
              <p className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-sm text-ink">
                Detected duration: <span className="font-medium">{formatDuration(duration)}</span>
              </p>
            )}
          </aside>
        </div>
      </form>
    </div>
  );
}
