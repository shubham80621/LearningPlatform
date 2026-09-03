import { type InputHTMLAttributes } from 'react';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from './fieldStyles';

type FileFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: string;
  error?: string;
  fileName?: string;
};

export default function FileField({
  label,
  hint,
  error,
  fileName,
  id,
  className = '',
  ...props
}: FileFieldProps) {
  const fieldId = id ?? props.name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <div>
      <label htmlFor={fieldId} className={labelClassName}>
        {label}
      </label>
      <input
        id={fieldId}
        type="file"
        className={`${error ? fieldErrorClassName : fieldClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {fileName && !error && (
        <p className="mt-1 truncate text-sm text-stone-500">{fileName}</p>
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
