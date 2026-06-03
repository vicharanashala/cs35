import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'

// Layouts
import MainLayout from './layouts/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AskPage from './pages/AskPage'
import FaqsPage from './pages/FaqsPage'
import FaqPage from './pages/FaqPage'
import QuestionPage from './pages/QuestionPage'
import QueuePage from './pages/QueuePage'
import MyQuestionsPage from './pages/MyQuestionsPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import AdminPage from './pages/AdminPage'

function AuthSetter() {
  const { loadUser } = useAuth() || {};
  useEffect(() => { loadUser?.(); }, [loadUser]);
  return null;
}


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth() || { isAuthenticated: false, loading: false };
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth() || { isAuthenticated: false, loading: false };
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <>
      <AuthSetter />
      <Routes>
        <Route
          path="login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="ask" element={<AskPage />} />
          <Route path="faqs" element={<FaqsPage />} />
          <Route path="faqs/:id" element={<FaqPage />} />
          <Route path="faq/:id" element={<FaqPage />} />
          <Route path="questions/:id" element={<QuestionPage />} />
          <Route path="question/:id" element={<QuestionPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="my-questions" element={<ProfilePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}