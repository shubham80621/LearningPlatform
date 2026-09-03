import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';

export default function AdminAssignmentsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Assignments"
        subtitle="Assign published videos to specific learners."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Assignments' },
        ]}
        actions={
          <button
            type="button"
            disabled
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white opacity-50"
          >
            Create assignment
          </button>
        }
      />

      <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200/70">
        <p className="text-sm text-stone-500">
          Assignment table will appear here after videos and assignment APIs are ready.
        </p>
      </section>
    </div>
  );
}
