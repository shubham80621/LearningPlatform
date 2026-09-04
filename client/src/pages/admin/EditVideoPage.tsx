import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getVideo, updateVideo } from '../../api/videos';
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
import VideoQuestionsPanel from '../../components/admin/VideoQuestionsPanel';
import TextField from '../../components/form/TextField';
import MediaPicker from '../../components/form/MediaPicker';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from '../../components/form/fieldStyles';

type FieldErrors = {
  title?: string;
  description?: string;
  thumbnail?: string;
  video?: string;
};

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'questions' ? 'questions' : 'info';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    getVideo(id)
      .then((video) => {
        if (!active) return;
        setTitle(video.title);
        setDescription(video.description ?? '');
        setThumbnailUrl(video.thumbnailUrl);
        setVideoUrl(video.videoUrl);
        setDuration(video.duration ?? 0);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load this video.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const validateForm = () => {
    const next: FieldErrors = {
      title: validateRequiredText(title, 'Title') || undefined,
      description: validateRequiredText(description, 'Description') || undefined,
      thumbnail: thumbnail ? validateThumbnailFile(thumbnail) || undefined : undefined,
      video: videoFile ? validateVideoFile(videoFile, duration) || undefined : undefined,
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
      setFieldErrors((prev) => ({ ...prev, video: selectionError }));
      return;
    }

    try {
      const seconds = await readVideoDuration(file);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setDuration(seconds);
      setFieldErrors((prev) => ({ ...prev, video: undefined }));
    } catch {
      setVideoFile(null);
      setFieldErrors((prev) => ({
        ...prev,
        video: 'Choose a valid video file. This one could not be read.',
      }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!id || !validateForm()) return;

    setSubmitting(true);
    try {
      await updateVideo(id, {
        title: title.trim(),
        description: description.trim(),
        duration: videoFile ? duration : undefined,
        thumbnail,
        video: videoFile,
      });
      navigate('/admin/videos');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update video. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Edit video"
        subtitle="Update lesson details. Leave files empty to keep the current media."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Videos', to: '/admin/videos' },
          { label: 'Edit video' },
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

      <div>
        <div
          role="tablist"
          aria-label="Edit video sections"
          className="flex items-end gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'info'}
            onClick={() => setSearchParams({})}
            className={
              tab === 'info'
                ? 'relative z-10 -mb-px rounded-t-lg border border-b-0 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink'
                : 'relative -mb-px rounded-t-lg border border-b-0 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-ink'
            }
          >
            Basic info
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'questions'}
            onClick={() => setSearchParams({ tab: 'questions' })}
            className={
              tab === 'questions'
                ? 'relative z-10 -mb-px rounded-t-lg border border-b-0 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink'
                : 'relative -mb-px rounded-t-lg border border-b-0 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-ink'
            }
          >
            Questions
          </button>
        </div>

        <div
          className={`border border-stone-200 bg-white p-5 shadow-sm md:p-6 ${
            tab === 'info' ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
          }`}
          role="tabpanel"
        >
          {loading ? (
            <p className="py-6 text-sm text-stone-500">Loading video…</p>
          ) : tab === 'questions' && id ? (
            <VideoQuestionsPanel videoId={id} duration={duration} embedded />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-8 lg:grid-cols-2">
                <section className="space-y-4">
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
                    previewUrl={thumbnailPreview || thumbnailUrl}
                    fileName={thumbnail?.name}
                    hint="Click Edit to replace. JPEG, PNG, WebP, or GIF. Max 5 MB."
                    error={fieldErrors.thumbnail}
                    onFile={handleThumbnailChange}
                  />
                  <MediaPicker
                    kind="video"
                    label="Video"
                    name="video"
                    accept="video/mp4,video/webm,video/quicktime"
                    previewUrl={videoUrl}
                    fileName={
                      videoFile
                        ? `${videoFile.name}${duration ? ` · ${formatDuration(duration)}` : ''}`
                        : undefined
                    }
                    hint="Click Edit to replace. MP4, WebM, or MOV. Max 200 MB."
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
                      {submitting ? 'Saving…' : 'Save changes'}
                    </button>
                    <Link
                      to="/admin/videos"
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
                    >
                      Back to list
                    </Link>
                  </div>
                </section>

                <aside>
                  <h2 className="text-lg font-semibold text-ink">Guidelines</h2>
                  <ul className="mt-4 space-y-3 text-sm text-stone-600">
                    <li>Leave file fields empty to keep the current thumbnail and video.</li>
                    <li>Replacing the video file updates the stored duration automatically.</li>
                    <li>Publish or unpublish from the videos table after saving.</li>
                  </ul>
                  {duration > 0 && (
                    <p className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-sm text-ink">
                      Duration: <span className="font-medium">{formatDuration(duration)}</span>
                    </p>
                  )}
                </aside>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
