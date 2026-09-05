import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import TextField from '../components/form/TextField';
import PasswordField from '../components/form/PasswordField';
import { loginRequest } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

type FieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setFieldErrors({
      email: nextErrors.email || undefined,
      password: nextErrors.password || undefined,
    });

    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await loginRequest(email.trim(), password);
      login(result.user);
      navigate(result.user.role === 'admin' ? '/admin' : '/learner', { replace: true });
    } catch {
      setFormError('Could not log in. Check your email and password, then try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <PublicNavbar variant="logo" />

      <div className="mx-auto max-w-md px-4 py-8 md:py-12">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 md:p-8">
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Log in</h1>
          <p className="mt-2 text-sm text-stone-600">
            Admins and learners use the same login. After you sign in, your
            account role opens the right workspace.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={fieldErrors.email}
            />
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={fieldErrors.password}
            />
            {formError && (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-ink px-4 py-2.5 font-medium text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
