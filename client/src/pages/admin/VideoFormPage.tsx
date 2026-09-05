import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createVideo, getVideo, updateVideo } from '../../api/videos';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration } from '../../utils/media';
import {
  validateRequiredText,
  validateThumbnailFile,
  validateVideoFile,
} from '../../utils/mediaValidation';
import { pickThumbnail, pickVideo } from '../../utils/videoMediaPick';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import VideoQuestionsPanel from '../../components/admin/VideoQuestionsPanel';
import FormBusyOverlay from '../../components/FormBusyOverlay';
import TextField from '../../components/form/TextField';
import MediaPicker from '../../components/form/MediaPicker';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from '../../components/form/fieldStyles';
import { useAppDispatch } from '../../store/hooks';
import { invalidateVideoLists } from '../../store/invalidate';

type FieldErrors = {
  title?: string;
  description?: string;
  thumbnail?: string;
  video?: string;
};

/** Shared create + edit video page (`/videos/new` and `/videos/:id/edit`). */
export default function VideoFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab =
    isEdit && searchParams.get('tab') === 'questions' ? 'questions' : 'info';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
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
      thumbnail: isEdit
        ? thumbnail
          ? validateThumbnailFile(thumbnail) || undefined
          : undefined
        : validateThumbnailFile(thumbnail) || undefined,
      video: isEdit
        ? videoFile
          ? validateVideoFile(videoFile, duration) || undefined
          : undefined
        : validateVideoFile(videoFile, duration) || undefined,
    };
    setFieldErrors(next);
    return !next.title && !next.description && !next.thumbnail && !next.video;
  };

  const handleThumbnailChange = (file: File) => {
    const result = pickThumbnail(file);
    if (!result.ok) {
      setThumbnail(null);
      setThumbnailPreview('');
      setFieldErrors((prev) => ({ ...prev, thumbnail: result.error }));
      return;
    }
    setThumbnail(result.file);
    setThumbnailPreview(result.previewUrl);
    setFieldErrors((prev) => ({ ...prev, thumbnail: undefined }));
  };

  const handleVideoChange = async (file: File) => {
    const result = await pickVideo(file);
    if (!result.ok) {
      setVideoFile(null);
      setVideoPreview('');
      if (!isEdit) setDuration(0);
      setFieldErrors((prev) => ({ ...prev, video: result.error }));
      return;
    }
    setVideoFile(result.file);
    setVideoPreview(result.previewUrl);
    setVideoUrl(result.previewUrl);
    setDuration(result.duration);
    setFieldErrors((prev) => ({ ...prev, video: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;
    if (!isEdit && (!thumbnail || !videoFile)) return;

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateVideo(id, {
          title: title.trim(),
          description: description.trim(),
          duration: videoFile ? duration : undefined,
          thumbnail,
          video: videoFile,
        });
      } else {
        await createVideo({
          title: title.trim(),
          description: description.trim(),
          duration,
          thumbnail: thumbnail!,
          video: videoFile!,
        });
      }
      invalidateVideoLists(dispatch);
      navigate('/admin/videos');
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          isEdit
            ? 'Could not update video. Try again.'
            : 'Could not create video. Check files and try again.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const thumbnailSrc = thumbnailPreview || thumbnailUrl;
  const videoSrc = videoPreview || videoUrl;

  return (
    <div>
      <AdminPageHeader
        title={isEdit ? 'Edit video' : 'Create video'}
        subtitle={
          isEdit
            ? 'Update lesson details. Leave files empty to keep the current media.'
            : 'Upload a thumbnail and lesson file. Files are stored locally for now.'
        }
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Videos', to: '/admin/videos' },
          { label: isEdit ? 'Edit video' : 'Create video' },
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

      {isEdit ? (
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
            className={`relative border border-stone-200 bg-white p-5 shadow-sm md:p-6 ${
              tab === 'info' ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
            }`}
            role="tabpanel"
          >
            <FormBusyOverlay busy={loading} label="Loading video…" />
            {tab === 'questions' && id ? (
              <fieldset disabled={loading} className="min-w-0 border-0 p-0">
                <VideoQuestionsPanel videoId={id} duration={duration} embedded />
              </fieldset>
            ) : (
              <VideoDetailsForm
                title={title}
                description={description}
                duration={duration}
                thumbnailSrc={thumbnailSrc}
                videoSrc={videoSrc}
                thumbnailName={thumbnail?.name}
                videoFile={videoFile}
                fieldErrors={fieldErrors}
                error={error}
                submitting={submitting}
                loading={loading}
                isEdit
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onClearTitleError={() =>
                  setFieldErrors((prev) => ({ ...prev, title: undefined }))
                }
                onClearDescriptionError={() =>
                  setFieldErrors((prev) => ({ ...prev, description: undefined }))
                }
                onThumbnail={handleThumbnailChange}
                onVideo={handleVideoChange}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
              <VideoDetailsFields
                title={title}
                description={description}
                duration={duration}
                thumbnailSrc={thumbnailSrc}
                videoSrc={videoSrc}
                thumbnailName={thumbnail?.name}
                videoFile={videoFile}
                fieldErrors={fieldErrors}
                error={error}
                submitting={submitting}
                isEdit={false}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onClearTitleError={() =>
                  setFieldErrors((prev) => ({ ...prev, title: undefined }))
                }
                onClearDescriptionError={() =>
                  setFieldErrors((prev) => ({ ...prev, description: undefined }))
                }
                onThumbnail={handleThumbnailChange}
                onVideo={handleVideoChange}
              />
            </section>
            <GuidelinesAside isEdit={false} duration={duration} />
          </div>
        </form>
      )}
    </div>
  );
}

type FormFieldsProps = {
  title: string;
  description: string;
  duration: number;
  thumbnailSrc: string;
  videoSrc: string;
  thumbnailName?: string;
  videoFile: File | null;
  fieldErrors: FieldErrors;
  error: string;
  submitting: boolean;
  loading?: boolean;
  isEdit: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClearTitleError: () => void;
  onClearDescriptionError: () => void;
  onThumbnail: (file: File) => void;
  onVideo: (file: File) => void | Promise<void>;
  onSubmit?: (event: FormEvent) => void;
};

function VideoDetailsForm(props: FormFieldsProps) {
  return (
    <form onSubmit={props.onSubmit} noValidate>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-ink">Lesson details</h2>
          <VideoDetailsFields {...props} />
        </section>
        <GuidelinesAside isEdit={props.isEdit} duration={props.duration} />
      </div>
    </form>
  );
}

function VideoDetailsFields({
  title,
  description,
  duration,
  thumbnailSrc,
  videoSrc,
  thumbnailName,
  videoFile,
  fieldErrors,
  error,
  submitting,
  loading = false,
  isEdit,
  onTitleChange,
  onDescriptionChange,
  onClearTitleError,
  onClearDescriptionError,
  onThumbnail,
  onVideo,
}: FormFieldsProps) {
  const disabled = submitting || loading;

  return (
    <>
      {!isEdit && <h2 className="text-lg font-semibold text-ink">Lesson details</h2>}
      <TextField
        label="Title"
        name="title"
        value={title}
        disabled={disabled}
        onChange={(event) => {
          onTitleChange(event.target.value);
          if (fieldErrors.title) onClearTitleError();
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
          disabled={disabled}
          onChange={(event) => {
            onDescriptionChange(event.target.value);
            if (fieldErrors.description) onClearDescriptionError();
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
        previewUrl={thumbnailSrc}
        fileName={thumbnailName}
        disabled={disabled}
        hint={
          isEdit
            ? 'Click Edit to replace. JPEG, PNG, WebP, or GIF. Max 5 MB.'
            : 'JPEG, PNG, WebP, or GIF. Max 5 MB.'
        }
        error={fieldErrors.thumbnail}
        onFile={onThumbnail}
      />
      <MediaPicker
        kind="video"
        label="Video"
        name="video"
        accept="video/mp4,video/webm,video/quicktime"
        previewUrl={videoSrc}
        disabled={disabled}
        fileName={
          videoFile
            ? `${videoFile.name}${duration ? ` · ${formatDuration(duration)}` : ''}`
            : undefined
        }
        hint={
          isEdit
            ? 'Click Edit to replace. MP4, WebM, or MOV. Max 200 MB.'
            : 'MP4, WebM, or MOV. Max 200 MB.'
        }
        error={fieldErrors.video}
        onFile={onVideo}
      />
      {error && (
        <p className={errorTextClassName} role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {loading
            ? 'Loading…'
            : submitting
              ? isEdit
                ? 'Saving…'
                : 'Uploading…'
              : isEdit
                ? 'Save changes'
                : 'Create video'}
        </button>
        <Link
          to="/admin/videos"
          className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
        >
          Back to list
        </Link>
      </div>
    </>
  );
}

function GuidelinesAside({
  isEdit,
  duration,
}: {
  isEdit: boolean;
  duration: number;
}) {
  return (
    <aside className={isEdit ? undefined : 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6'}>
      <h2 className="text-lg font-semibold text-ink">Guidelines</h2>
      <ul className="mt-4 space-y-3 text-sm text-stone-600">
        {isEdit ? (
          <>
            <li>Leave file fields empty to keep the current thumbnail and video.</li>
            <li>Replacing the video file updates the stored duration automatically.</li>
            <li>Publish or unpublish from the videos table after saving.</li>
          </>
        ) : (
          <>
            <li>New lessons start as drafts. Publish them from the videos table.</li>
            <li>Duration is read from the video file and used later for quiz timestamps.</li>
            <li>Files save to the server uploads folder for this assignment.</li>
            <li>Later this can switch to AWS S3 without changing the rest of the form.</li>
          </>
        )}
      </ul>
      {duration > 0 && (
        <p className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-sm text-ink">
          {isEdit ? 'Duration' : 'Detected duration'}:{' '}
          <span className="font-medium">{formatDuration(duration)}</span>
        </p>
      )}
    </aside>
  );
}
