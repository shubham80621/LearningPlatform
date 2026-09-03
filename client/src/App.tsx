import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminVideosPage from './pages/admin/VideosPage';
import AdminLearnersPage from './pages/admin/LearnersPage';
import CreateLearnerPage from './pages/admin/CreateLearnerPage';
import AdminAssignmentsPage from './pages/admin/AssignmentsPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import LearnerDashboardPage from './pages/learner/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="videos" element={<AdminVideosPage />} />
            <Route path="learners" element={<AdminLearnersPage />} />
            <Route path="learners/new" element={<CreateLearnerPage />} />
            <Route path="assignments" element={<AdminAssignmentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          <Route
            path="/learner"
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <Layout
                  title="Learner Portal"
                  links={[{ to: '/learner', label: 'My Videos' }]}
                />
              </ProtectedRoute>
            }
          >
            <Route index element={<LearnerDashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
