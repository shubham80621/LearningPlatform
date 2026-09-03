import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import LearnerDashboardPage from './pages/learner/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout
                  title="Admin Panel"
                  links={[
                    { to: '/admin', label: 'Dashboard' },
                    { to: '/admin/videos', label: 'Videos' },
                    { to: '/admin/assignments', label: 'Assignments' },
                    { to: '/admin/reports', label: 'Reports' },
                  ]}
                />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
