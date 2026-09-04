import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listLearners } from '../../api/users';
import type { User } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';
import Pagination from '../../components/admin/Pagination';

const PAGE_SIZE = 8;

export default function AdminLearnersPage() {
  const navigate = useNavigate();
  const [learners, setLearners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    listLearners()
      .then((data) => {
        if (!active) return;
        setLearners(data);
        setPage(1);
      })
      .catch(() => {
        if (active) setError('Could not load learners.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = learners.slice(start, start + PAGE_SIZE);

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

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
        {loading ? (
          <p className="px-5 py-10 text-sm text-stone-500">Loading learners…</p>
        ) : learners.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-stone-500">No learners yet.</p>
            <Link
              to="/admin/learners/new"
              className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
            >
              Create the first learner
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Assigned videos</th>
                    <th className="px-5 py-3 font-medium">Questions</th>
                    <th className="px-5 py-3 font-medium">Completed videos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pageItems.map((learner) => (
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
                      className="cursor-pointer hover:bg-stone-50/70"
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
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={learners.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
