import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, Component } from "react";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./hooks/useAuth";
import { DarkModeProvider } from "./hooks/useDarkMode";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const FaqsPage = lazy(() => import("./pages/FaqsPage"));
const QueuePage = lazy(() => import("./pages/QueuePage"));
const QuestionPage = lazy(() => import("./pages/QuestionPage"));
const AskPage = lazy(() => import("./pages/AskPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const MyQuestionsPage = lazy(() => import("./pages/MyQuestionsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#5E7A5A", borderTopColor: "transparent" }} />
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1F2937" }}>Something went wrong</h2>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "#6B7280" }}>
            We encountered an unexpected error. This has been logged and we're working to fix it.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center" style={{ background: "#F5F7F2" }}>
        <svg className="w-8 h-8" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "#1F2937" }}>Page Not Found</h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Layout Wrapper
function AppLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = location.pathname === "/login";
  const isAdminDashboard = location.pathname.startsWith("/admin");

  if (isAuthPage) {
    if (user) {
      return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
    }
    return children;
  }

  if (isAdminDashboard) {
    return children;
  }

  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  return (
    <DarkModeProvider>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AppLayout>
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />

              {/* Main Platform (Requires Login) */}
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/faqs" element={<ProtectedRoute><FaqsPage /></ProtectedRoute>} />
              <Route path="/faq/:id" element={<ProtectedRoute><FaqPage /></ProtectedRoute>} />
              <Route path="/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
              <Route path="/ask" element={<ProtectedRoute><AskPage /></ProtectedRoute>} />
              <Route path="/question/:id" element={<ProtectedRoute><QuestionPage /></ProtectedRoute>} />
              <Route path="/my-questions" element={<ProtectedRoute><MyQuestionsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              {/* Admin (Requires Admin Role) */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </Suspense>
      </ErrorBoundary>
    </DarkModeProvider>
  );
}