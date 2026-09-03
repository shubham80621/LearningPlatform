import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import LessonCard, { type LessonCardData } from '../components/LessonCard';

const lessons: LessonCardData[] = [
  {
    id: '1',
    title: 'Giving useful feedback in 1:1s',
    topic: 'People management',
    duration: '18 min',
    questions: 3,
    assigned: true,
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    title: 'Writing a product spec that others can build',
    topic: 'Product',
    duration: '24 min',
    questions: 4,
    assigned: true,
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    title: 'SQL joins without the panic',
    topic: 'Data',
    duration: '32 min',
    questions: 5,
    assigned: false,
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    title: 'Customer calls: listening before solving',
    topic: 'Support',
    duration: '16 min',
    questions: 2,
    assigned: false,
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
  },
];

const topics = ['All', 'People management', 'Product', 'Data', 'Support'];

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [topic, setTopic] = useState('All');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const visibleLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesTopic = topic === 'All' || lesson.topic === topic;
      const matchesQuery =
        !q ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.topic.toLowerCase().includes(q);
      return matchesTopic && matchesQuery;
    });
  }, [query, topic]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <PublicNavbar />

      <section className="px-4 pb-8 pt-8 md:px-6 md:pt-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-[#1c1917] px-5 py-10 text-stone-100 md:px-10 md:py-14">
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
            Lessons assigned to your team. Watch, pause, answer, continue.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-stone-300 md:text-lg">
            Admins assign video lessons. Learners only see what they were given.
            Questions pause the video at timestamps — nothing is sold here.
          </p>

          <form onSubmit={onSearch} className="mt-8 max-w-xl">
            <label className="sr-only" htmlFor="hero-search">
              Search lessons
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="hero-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search assigned lessons"
                className="w-full rounded-2xl border border-stone-600 bg-stone-900 px-4 py-3 text-base text-white"
              />
              <button
                type="submit"
                className="rounded-2xl bg-teal-600 px-5 py-3 font-medium text-white hover:bg-teal-700 sm:shrink-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Explore lessons</h2>
            <p className="mt-1 text-sm text-stone-600">
              Sample catalog. After login, learners only get assigned items.
            </p>
          </div>
          <Link to="/login" className="text-sm font-medium text-brand hover:underline">
            Log in
          </Link>
        </div>

        <div className="-mx-4 mt-5 overflow-x-auto px-4">
          <div className="flex w-max gap-2 pb-1">
            {topics.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTopic(item)}
                className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${
                  topic === item
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink ring-1 ring-stone-200 hover:ring-stone-400'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {visibleLessons.length === 0 ? (
          <p className="mt-10 text-stone-600">No lessons match that search.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visibleLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
          <div>
            <p className="text-sm font-semibold text-brand">1. Admin assigns</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Create a video lesson, add timestamp questions, then assign it to
              specific learners. Nothing is purchased.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand">2. Learner watches</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Open My Lessons, resume from the last timestamp, and answer when
              the video pauses.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand">3. Progress is saved</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Completion and responses are stored so admins can review who
              finished and how they answered.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
