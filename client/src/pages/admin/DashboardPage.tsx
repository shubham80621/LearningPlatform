import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listLearners } from '../../api/users';
import { listVideos } from '../../api/videos';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Video } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSectionToolbar from '../../components/admin/AdminSectionToolbar';

const kpiCards = [
  {
    key: 'learners',
    label: 'Total Learners',
    tone: 'bg-[#e8f8ef] text-[#166534]',
    hint: 'Ready for assignments',
  },
  {
    key: 'videos',
    label: 'Published Videos',
    tone: 'bg-[#fff4e5] text-[#9a3412]',
    hint: 'Ready to assign',
  },
  {
    key: 'assignments',
    label: 'Active Assignments',
    tone: 'bg-[#e8f1ff] text-[#1d4ed8]',
    hint: 'Assigned lesson count',
    placeholder: '—',
  },
  {
    key: 'completion',
    label: 'Avg Completion',
    tone: 'bg-[#f3e8ff] text-[#6b21a8]',
    hint: 'Tracked after playback',
    placeholder: '—',
  },
] as const;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [learners, setLearners] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([listLearners(), listVideos()])
      .then(([learnerData, videoData]) => {
        if (!active) return;
        setLearners(learnerData);
        setVideos(videoData);
      })
      .catch(() => {
        if (active) setError('Could not load dashboard data.');
      });

    return () => {
      active = false;
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div>
      <AdminPageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening with your learning platform today."
      />

      <AdminSectionToolbar
        breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Link
              to="/admin/learners/new"
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
            >
              Create learner
            </Link>
            <Link
              to="/admin/videos/new"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-stone-50"
            >
              Create video
            </Link>
          </>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const value =
            card.key === 'learners'
              ? String(learners.length)
              : card.key === 'videos'
                ? String(videos.filter((video) => video.isPublished).length)
                : card.placeholder;

          return (
            <article key={card.key} className={`rounded-2xl p-5 ${card.tone}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-3 text-xs font-medium opacity-70">{card.hint}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Learning workflow</h2>
            <p className="text-sm text-stone-500">Your admin path for this product</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                step: '01',
                title: 'Create learners',
                body: 'Add accounts from Learners. They use the same login page.',
                to: '/admin/learners',
              },
              {
                step: '02',
                title: 'Publish videos',
                body: 'Add video lessons and timestamp questions.',
                to: '/admin/videos',
              },
              {
                step: '03',
                title: 'Assign lessons',
                body: 'Send published videos to specific learners.',
                to: '/admin/assignments',
              },
              {
                step: '04',
                title: 'Review progress',
                body: 'Track completion and quiz answers in Reports.',
                to: '/admin/reports',
              },
            ].map((item) => (
              <Link
                key={item.step}
                to={item.to}
                className="rounded-2xl border border-stone-200 p-4 transition hover:border-stone-300 hover:bg-stone-50"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">
                  {item.step}
                </p>
                <h3 className="mt-2 font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{item.body}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent learners</h2>
            <Link to="/admin/learners" className="text-sm font-medium text-teal-700 hover:underline">
              View all
            </Link>
          </div>

          {learners.length === 0 ? (
            <div className="rounded-2xl bg-stone-50 px-4 py-10 text-center">
              <p className="text-sm text-stone-500">No learners yet.</p>
              <Link
                to="/admin/learners/new"
                className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline"
              >
                Create the first learner
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {learners.slice(0, 6).map((learner) => (
                <li key={learner.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-ink">
                    {learner.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{learner.name}</p>
                    <p className="truncate text-xs text-stone-500">{learner.email}</p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                    Learner
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
