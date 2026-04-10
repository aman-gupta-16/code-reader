import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ClientProjectPage from './pages/ClientProjectPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/project/:projectId" element={<ProjectDetailPage />} />
      <Route path="/view/:projectSlug/:token" element={<ClientProjectPage />} />
      {/* Legacy client route */}
      <Route path="/client/:token" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
