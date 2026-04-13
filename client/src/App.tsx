import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import ContentPage from './pages/ContentPage';
import SimplePage from './pages/SimplePage';
import GeneralChatPage from './pages/GeneralChatPage';
import PersonalChatPage from './pages/PersonalChatPage';
import DtpPage from './pages/DtpPage';
import CallTrackerPage from './pages/CallTrackerPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Вкладки с подкатегориями → ContentPage
const CONTENT_TABS = ['lectures', 'instructions', 'program-360', 'marathons'];
// Вкладки без подкатегорий → SimplePage
const SIMPLE_TABS = ['podcasts', 'books', 'films'];

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/beseda" replace />} />
                <Route path="beseda" element={<GeneralChatPage />} />
                <Route path="personal-chat" element={<PersonalChatPage />} />
                <Route path="dtp" element={<DtpPage />} />
                <Route path="call-tracker" element={<CallTrackerPage />} />
                <Route path="admin" element={<AdminPage />} />

                {CONTENT_TABS.map((slug) => (
                  <Route key={slug} path={slug} element={<ContentPage />} />
                ))}

                {SIMPLE_TABS.map((slug) => (
                  <Route key={slug} path={slug} element={<SimplePage />} />
                ))}

                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
