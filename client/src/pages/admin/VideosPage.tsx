import { Link } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';

export default function AdminVideosPage() {
  return (
    <div>
      <AdminPageHeader
        title="Videos"
        subtitle="Create and publish video lessons with timestamp questions."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Videos' },
        ]}
        actions={
          <button
            type="button"
            disabled
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white opacity-50"
          >
            Create video
          </button>
        }
      />

      <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200/70">
        <p className="text-sm text-stone-500">
          Video list and create form will follow the same table + form-page pattern.
        </p>
        <Link
          to="/admin/learners"
          className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
        >
          Go to learners
        </Link>
      </section>
    </div>
  );
}
