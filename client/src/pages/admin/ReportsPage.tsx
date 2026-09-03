import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';

export default function AdminReportsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Reports"
        subtitle="Review learner progress and quiz responses."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Reports' },
        ]}
      />

      <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200/70">
        <p className="text-sm text-stone-500">
          Progress reports will use the same full-width page layout once tracking is built.
        </p>
      </section>
    </div>
  );
}
