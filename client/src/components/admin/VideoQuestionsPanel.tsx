import { FormEvent, useEffect, useState } from 'react';
import {
  createQuestion,
  deleteQuestion,
  listQuestions,
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let active = true;
    listQuestions(videoId)
      .then((data) => {
        if (active) setQuestions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load questions.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [videoId]);

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
      const saved = editingId
        ? await updateQuestion(videoId, editingId, payload)
        : await createQuestion(videoId, payload);
      setQuestions((current) => {
        const without = current.filter((item) => item.id !== saved.id);
        return [...without, saved].sort((a, b) => a.timestamp - b.timestamp);
      });
      resetForm();
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
      setQuestions((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
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

  if (loading) {
    return (
      <p className={embedded ? 'py-6 text-sm text-stone-500' : 'rounded-2xl bg-white px-5 py-10 text-sm text-stone-500 shadow-sm ring-1 ring-stone-200/70'}>
        Loading questions…
      </p>
    );
  }

  const formClassName = embedded
    ? 'space-y-4 rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200/70 md:p-5'
    : 'space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6';
  const listClassName = embedded
    ? 'overflow-hidden rounded-xl bg-stone-50 ring-1 ring-stone-200/70'
    : 'overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70';

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className={formClassName}
        >
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
                setFieldErrors((prev) => ({ ...prev, options: undefined, answer: undefined }));
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
                if (fieldErrors.answer) setFieldErrors((prev) => ({ ...prev, answer: undefined }));
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

        <section className={listClassName}>
          {questions.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-stone-500">
              No questions on this video yet.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {questions.map((question) => (
                <li key={question.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                        {formatDuration(question.timestamp)} · {typeLabels[question.type]}
                      </p>
                      <p className="mt-1 font-medium text-ink">{question.questionText}</p>
                      {question.type === 'short' ? (
                        <p className="mt-1 text-sm text-stone-500">
                          Answer: {question.correctAnswer}
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-sm text-stone-600">
                          {question.options.map((option, index) => (
                            <li key={`${question.id}-${index}`}>
                              {question.correctOptionIndexes.includes(index) ? '✓ ' : '• '}
                              {option}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this question?"
          message="Learners will no longer see it during playback. Past answers in reports will still be kept later."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
