import { Link, useNavigate } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import AdminDataTable, {
  adminTableRowClassName,
  type AdminTableColumn,
} from '../../components/admin/AdminDataTable';
import Pagination from '../../components/admin/Pagination';
import { useAdminPagedQuery } from '../../hooks/useAdminPagedQuery';
import { useListLearnersQuery } from '../../store/api';

const PAGE_SIZE = 8;

const COLUMNS: AdminTableColumn[] = [
  { label: 'Name', skeleton: 'avatar' },
  { label: 'Email', skeleton: 'text' },
  { label: 'Assigned videos', skeleton: 'stat' },
  { label: 'Questions', skeleton: 'stat' },
  { label: 'Completed videos', skeleton: 'stat' },
];

export default function AdminLearnersPage() {
  const navigate = useNavigate();

  const {
    page,
    onPageChange,
    items: learners,
    total,
    showTableLoader,
    isError,
  } = useAdminPagedQuery(useListLearnersQuery, (nextPage) => ({
    page: nextPage,
    limit: PAGE_SIZE,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Learners"
        subtitle="Accounts that can receive assigned video lessons."
      />

      <AdminSectionToolbar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Learners' },
        ]}
        actions={
          <Link
            to="/admin/learners/new"
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Create learner
          </Link>
        }
      />

      {isError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load learners.
        </p>
      )}

      <AdminDataTable
        columns={COLUMNS}
        loading={showTableLoader}
        loadingLabel="Loading learners"
        skeletonRows={PAGE_SIZE}
        empty={
          !showTableLoader && total === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-stone-500">No learners yet.</p>
              <Link
                to="/admin/learners/new"
                className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
              >
                Create the first learner
              </Link>
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
        {learners.map((learner) => (
          <tr
            key={learner.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/admin/learners/${learner.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(`/admin/learners/${learner.id}`);
              }
            }}
            className={adminTableRowClassName}
          >
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-ink">
                  {learner.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="font-medium text-ink">{learner.name}</span>
              </div>
            </td>
            <td className="px-5 py-4 text-stone-600">{learner.email}</td>
            <td className="px-5 py-4 font-medium text-ink">
              {learner.assignedVideos ?? 0}
            </td>
            <td className="px-5 py-4 font-medium text-ink">
              {learner.questions ?? 0}
            </td>
            <td className="px-5 py-4">
              <span className="font-medium text-ink">
                {learner.completed ?? 0}
              </span>
              <span className="text-stone-400">
                {' '}
                / {learner.assignedVideos ?? 0}
              </span>
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
