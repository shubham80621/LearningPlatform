import { type InputHTMLAttributes } from 'react';
import {
  errorTextClassName,
  fieldClassName,
  fieldErrorClassName,
  labelClassName,
} from './fieldStyles';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export default function TextField({
  label,
  id,
  error,
  className = '',
  ...props
}: TextFieldProps) {
  const fieldId = id ?? props.name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <div>
      <label htmlFor={fieldId} className={labelClassName}>
        {label}
      </label>
      <input
        id={fieldId}
        className={`${error ? fieldErrorClassName : fieldClassName} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className={errorTextClassName} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
