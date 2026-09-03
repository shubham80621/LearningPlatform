import { useState, type InputHTMLAttributes } from 'react';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from './fieldStyles';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
};

export default function PasswordField({
  label,
  id,
  error,
  className = '',
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? props.name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <div>
      <label htmlFor={fieldId} className={labelClassName}>
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={`${error ? fieldErrorClassName : fieldClassName} pr-12 ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((open) => !open)}
          className="absolute inset-y-0 right-1 my-auto flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a11.6 11.6 0 01-4.2 5.1" />
              <path d="M6.7 6.7C4.2 8.3 2.5 10.6 1 12.5c1.6 2.3 4.4 5.5 8.2 6.7 1.2.4 2.5.6 3.8.6 1 0 2-.1 2.9-.4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M1 12.5C2.6 10.2 6.5 5 12 5s9.4 5.2 11 7.5c-1.6 2.3-5.5 7.5-11 7.5S2.6 14.8 1 12.5z" />
              <circle cx="12" cy="12.5" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className={errorTextClassName} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
