import { Navigate } from 'react-router-dom';

/** Assignments live on each learner’s detail page. */
export default function AdminAssignmentsPage() {
  return <Navigate to="/admin/learners" replace />;
}
