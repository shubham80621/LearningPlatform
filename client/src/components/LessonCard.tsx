import { Link } from 'react-router-dom';

export interface LessonCardData {
  id: string;
  title: string;
  topic: string;
  duration: string;
  questions: number;
  image: string;
  assigned?: boolean;
}

export default function LessonCard({ lesson }: { lesson: LessonCardData }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
      <img src={lesson.image} alt="" className="h-40 w-full object-cover" />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm font-medium text-brand">{lesson.topic}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-ink">{lesson.title}</h3>
        <p className="mt-3 text-sm text-stone-600">
          {lesson.duration} · {lesson.questions} in-video questions
        </p>
        <p className="mt-2 text-xs font-medium text-stone-500">
          {lesson.assigned ? 'Assigned by admin' : 'Available to assign'}
        </p>
        <Link
          to="/login"
          className="mt-4 text-sm font-medium text-ink underline-offset-2 hover:underline"
        >
          Open lesson
        </Link>
      </div>
    </article>
  );
}
