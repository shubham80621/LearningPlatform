import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createLearner } from '../../api/users';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import TextField from '../../components/form/TextField';
import PasswordField from '../../components/form/PasswordField';
import { validateEmail, validatePassword } from '../../utils/validation';
import { useAppDispatch } from '../../store/hooks';
import { invalidateLearnerLists } from '../../store/invalidate';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export default function CreateLearnerPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const next: FieldErrors = {};
    if (!name.trim() || name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters.';
    }
    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) next.password = passwordError;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createLearner({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      invalidateLearnerLists(dispatch);
      navigate('/admin/learners');
    } catch {
      setError('Could not create learner. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Create learner"
        subtitle="Add a learner account that can log in and receive assigned lessons."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Learners', to: '/admin/learners' },
          { label: 'Create learner' },
        ]}
        actions={
          <Link
            to="/admin/learners"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
          >
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
            <h2 className="text-lg font-semibold text-ink">Account details</h2>
            <TextField
              label="Full name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={fieldErrors.name}
              placeholder="Asha Verma"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={fieldErrors.email}
              placeholder="asha@company.com"
            />
            <PasswordField
              label="Temporary password"
              name="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={fieldErrors.password}
              placeholder="At least 8 characters"
            />
            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create learner'}
              </button>
              <Link
                to="/admin/learners"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
              >
                Back to list
              </Link>
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
            <h2 className="text-lg font-semibold text-ink">Guidelines</h2>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              <li>
                Learners use the <span className="font-medium text-ink">same login page</span> as
                admins.
              </li>
              <li>After creation, assign videos from the Assignments page.</li>
              <li>Use a temporary password and share it securely with the learner.</li>
              <li>Email must be unique across the platform.</li>
            </ul>
          </aside>
        </div>
      </form>
    </div>
  );
}
