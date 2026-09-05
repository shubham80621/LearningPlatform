import { FormEvent, useState } from 'react';
import {
  createQuestion,
  deleteQuestion,
  updateQuestion,
} from '../../api/questions';
import type { Question, QuestionType } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDuration, parseTimestamp } from '../../utils/media';
import ConfirmDialog from '../ConfirmDialog';
import TextField from '../form/TextField';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from '../form/fieldStyles';
import AdminDataTable, {
  type AdminTableColumn,
} from './AdminDataTable';
import Pagination from './Pagination';
import { useAdminPagedQuery } from '../../hooks/useAdminPagedQuery';
import { api, useListVideoQuestionsQuery } from '../../store/api';
import { useAppDispatch } from '../../store/hooks';

type FieldErrors = {
  timestamp?: string;
  questionText?: string;
  options?: string;
  answer?: string;
};

const typeLabels: Record<QuestionType, string> = {
  single: 'Single choice',
  multiple: 'Multiple choice',
  short: 'Short answer',
};

const PAGE_SIZE = 6;

const COLUMNS: AdminTableColumn[] = [
  { label: 'Time', skeleton: 'text' },
  { label: 'Question', skeleton: 'text' },
  { label: 'Type', skeleton: 'badge' },
  { label: 'Actions', skeleton: 'actions' },
];

type VideoQuestionsPanelProps = {
  videoId: string;
  duration: number;
  /** When true, skip outer card chrome (parent already provides the folder panel). */
  embedded?: boolean;
};

export default function VideoQuestionsPanel({
  videoId,
  duration,
  embedded = false,
}: VideoQuestionsPanelProps) {
  const dispatch = useAppDispatch();
  const {
    page,
    onPageChange,
    items: questions,
    total,
    showTableLoader,
    isError,
    error: queryError,
    refetch,
  } = useAdminPagedQuery<
    { videoId: string; page: number; limit: number },
    Question
  >(useListVideoQuestionsQuery, (nextPage) => ({
    videoId,
    page: nextPage,
    limit: PAGE_SIZE,
  }));

  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<QuestionType>('single');
  const [timestampInput, setTimestampInput] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndexes, setCorrectOptionIndexes] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const invalidateQuestions = () => {
    dispatch(api.util.invalidateTags([{ type: 'VideoQuestions', id: videoId }]));
  };

  const resetForm = () => {
    setEditingId('');
    setType('single');
    setTimestampInput('');
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndexes([]);
    setCorrectAnswer('');
    setFieldErrors({});
  };

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setType(question.type);
    setTimestampInput(formatDuration(question.timestamp));
    setQuestionText(question.questionText);
    setOptions(
      question.type === 'short'
        ? ['', '', '', '']
        : [...question.options, '', ''].slice(0, Math.max(4, question.options.length)),
    );
    setCorrectOptionIndexes(question.correctOptionIndexes);
    setCorrectAnswer(question.correctAnswer);
    setFieldErrors({});
  };

  const validateForm = () => {
    const next: FieldErrors = {};
    const timestamp = parseTimestamp(timestampInput);
    if (!Number.isFinite(timestamp)) {
      next.timestamp = 'Enter a timestamp in seconds or mm:ss.';
    } else if (timestamp >= duration) {
      next.timestamp = `Timestamp must be before ${formatDuration(duration)}.`;
    }
    if (!questionText.trim() || questionText.trim().length < 2) {
      next.questionText = 'Question text is required.';
    }
    if (type === 'short') {
      if (!correctAnswer.trim()) next.answer = 'An expected short answer is required.';
    } else {
      const filled = options.map((option) => option.trim());
      if (filled.filter(Boolean).length < 2) next.options = 'Add at least 2 options.';
      const validIndexes = correctOptionIndexes.filter((index) => filled[index]);
      if (type === 'single' && validIndexes.length !== 1) {
        next.answer = 'Select exactly one correct option.';
      }
      if (type === 'multiple' && validIndexes.length < 1) {
        next.answer = 'Select at least one correct option.';
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setError('');
    setSubmitting(true);
    const timestamp = parseTimestamp(timestampInput);
    const filled = options
      .map((option, index) => ({ text: option.trim(), index }))
      .filter((item) => item.text);
    const payload = {
      timestamp,
      type,
      questionText: questionText.trim(),
      options: type === 'short' ? [] : filled.map((item) => item.text),
      correctOptionIndexes:
        type === 'short'
          ? []
          : filled
              .map((item, newIndex) =>
                correctOptionIndexes.includes(item.index) ? newIndex : -1,
              )
              .filter((index) => index >= 0),
      correctAnswer: type === 'short' ? correctAnswer.trim() : '',
    };

    try {
      if (editingId) {
        await updateQuestion(videoId, editingId, payload);
      } else {
        await createQuestion(videoId, payload);
      }
      resetForm();
      invalidateQuestions();
      void refetch();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save this question.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setError('');
    try {
      await deleteQuestion(videoId, pendingDelete.id);
      if (editingId === pendingDelete.id) resetForm();
      setPendingDelete(null);
      invalidateQuestions();
      void refetch();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete this question.'));
    }
  };

  const toggleCorrect = (index: number) => {
    setCorrectOptionIndexes((current) => {
      if (type === 'single') return [index];
      return current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index];
    });
    if (fieldErrors.answer) setFieldErrors((prev) => ({ ...prev, answer: undefined }));
  };

  const formClassName = embedded
    ? 'space-y-4 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200/70 md:p-5'
    : 'space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6';

  const listError =
    error ||
    (isError ? getApiErrorMessage(queryError, 'Could not load questions.') : '');

  return (
    <>
      {listError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listError}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form onSubmit={handleSubmit} noValidate className={formClassName}>
          <h2 className="text-lg font-semibold text-ink">
            {editingId ? 'Edit question' : 'Add question'}
          </h2>
          <div>
            <label htmlFor="type" className={labelClassName}>
              Question type
            </label>
            <select
              id="type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as QuestionType);
                setCorrectOptionIndexes([]);
                setCorrectAnswer('');
                setFieldErrors((prev) => ({
                  ...prev,
                  options: undefined,
                  answer: undefined,
                }));
              }}
              className={fieldClassName}
            >
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
              <option value="short">Short answer</option>
            </select>
          </div>
          <TextField
            label={`Timestamp (max ${formatDuration(duration)})`}
            name="timestamp"
            value={timestampInput}
            placeholder="0:45 or 45"
            onChange={(event) => {
              setTimestampInput(event.target.value);
              if (fieldErrors.timestamp) {
                setFieldErrors((prev) => ({ ...prev, timestamp: undefined }));
              }
            }}
            error={fieldErrors.timestamp}
          />
          <div>
            <label htmlFor="questionText" className={labelClassName}>
              Question
            </label>
            <textarea
              id="questionText"
              rows={3}
              value={questionText}
              onChange={(event) => {
                setQuestionText(event.target.value);
                if (fieldErrors.questionText) {
                  setFieldErrors((prev) => ({ ...prev, questionText: undefined }));
                }
              }}
              className={fieldErrors.questionText ? fieldErrorClassName : fieldClassName}
            />
            {fieldErrors.questionText && (
              <p className={errorTextClassName} role="alert">
                {fieldErrors.questionText}
              </p>
            )}
          </div>
          {type === 'short' ? (
            <TextField
              label="Expected answer"
              name="correctAnswer"
              value={correctAnswer}
              onChange={(event) => {
                setCorrectAnswer(event.target.value);
                if (fieldErrors.answer) {
                  setFieldErrors((prev) => ({ ...prev, answer: undefined }));
                }
              }}
              error={fieldErrors.answer}
            />
          ) : (
            <div>
              <p className={labelClassName}>
                Options {type === 'single' ? '(pick one correct)' : '(pick all that apply)'}
              </p>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={type === 'single' ? 'radio' : 'checkbox'}
                      name="correct-option"
                      checked={correctOptionIndexes.includes(index)}
                      onChange={() => toggleCorrect(index)}
                      className="h-4 w-4 accent-teal-700"
                      aria-label={`Mark option ${index + 1} as correct`}
                    />
                    <input
                      value={option}
                      onChange={(event) => {
                        const next = [...options];
                        next[index] = event.target.value;
                        setOptions(next);
                        if (fieldErrors.options) {
                          setFieldErrors((prev) => ({ ...prev, options: undefined }));
                        }
                      }}
                      placeholder={`Option ${index + 1}`}
                      className={fieldClassName}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptions((current) => [...current, ''])}
                className="mt-2 text-sm font-medium text-teal-700 hover:underline"
              >
                Add option
              </button>
              {(fieldErrors.options || fieldErrors.answer) && (
                <p className={errorTextClassName} role="alert">
                  {fieldErrors.options || fieldErrors.answer}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : editingId ? 'Save question' : 'Add question'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <AdminDataTable
          columns={COLUMNS}
          loading={showTableLoader}
          loadingLabel="Loading questions"
          skeletonRows={PAGE_SIZE}
          framed={!embedded}
          empty={
            !showTableLoader && total === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-stone-500">
                No questions on this video yet.
              </div>
            ) : null
          }
          footer={
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={onPageChange}
            />
          }
        >
          {questions.map((question) => (
            <tr key={question.id}>
              <td className="px-5 py-4 font-medium text-teal-700">
                {formatDuration(question.timestamp)}
              </td>
              <td className="px-5 py-4">
                <p className="font-medium text-ink">{question.questionText}</p>
                {question.type === 'short' ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Answer: {question.correctAnswer}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-stone-500">
                    {question.options.length} options ·{' '}
                    {question.correctOptionIndexes.length} correct
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                  {typeLabels[question.type]}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(question)}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(question)}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-stone-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </div>
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this question?"
          message="Learners will no longer see it during playback. Past answers on learner progress will still be kept."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
