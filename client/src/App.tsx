import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LearnerLayout from './components/LearnerLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminVideosPage from './pages/admin/VideosPage';
import CreateVideoPage from './pages/admin/CreateVideoPage';
import EditVideoPage from './pages/admin/EditVideoPage';
import AdminLearnersPage from './pages/admin/LearnersPage';
import CreateLearnerPage from './pages/admin/CreateLearnerPage';
import LearnerDetailPage from './pages/admin/LearnerDetailPage';
import LearnerDashboardPage from './pages/learner/DashboardPage';
import LearnerLearnPage from './pages/learner/LearnPage';
import LearnerWatchPage from './pages/learner/WatchPage';

function VideoQuestionsRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/videos/${id}/edit?tab=questions`} replace />;
}

function App() {
  return (
    <Provider store={store}>
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
              <Route path="videos/new" element={<CreateVideoPage />} />
              <Route path="videos/:id/edit" element={<EditVideoPage />} />
              <Route path="videos/:id/questions" element={<VideoQuestionsRedirect />} />
              <Route path="learners" element={<AdminLearnersPage />} />
              <Route path="learners/new" element={<CreateLearnerPage />} />
              <Route path="learners/:id" element={<LearnerDetailPage />} />
              <Route
                path="assignments"
                element={<Navigate to="/admin/learners" replace />}
              />
            </Route>

            <Route
              path="/learner"
              element={
                <ProtectedRoute allowedRoles={['learner']}>
                  <LearnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<LearnerDashboardPage />} />
              <Route path="learn" element={<LearnerLearnPage />} />
              <Route path="learn/:assignmentId" element={<LearnerWatchPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;
