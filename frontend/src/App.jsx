import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './context/useAuth'
import { useDarkMode } from './hooks/useDarkMode'

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
  const { loadUser } = useAuth()
  useEffect(() => { loadUser() }, [loadUser])
  return null
}

function ThemeSetter() {
  const { theme } = useDarkMode()
  useEffect(() => {
    document.documentElement.style.colorScheme = theme
  }, [theme])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthSetter />
      <ThemeSetter />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="ask" element={<AskPage />} />
          <Route path="faqs" element={<FaqsPage />} />
          <Route path="faqs/:id" element={<FaqPage />} />
          <Route path="questions/:id" element={<QuestionPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="my-questions" element={<MyQuestionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}