import { Navigate, useParams } from 'react-router-dom';

export default function VideoQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/videos/${id}/edit?tab=questions`} replace />;
}
