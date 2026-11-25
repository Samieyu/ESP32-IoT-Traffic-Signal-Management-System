import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { DashboardLayout } from './components/common/DashboardLayout.js';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { TrafficPoliceManagementPage } from './pages/admin/TrafficPoliceManagementPage.js';
import { OfficerDetailsPage } from './pages/admin/OfficerDetailsPage.js';
import { IntersectionManagementPage } from './pages/admin/IntersectionManagementPage.js';
import { IntersectionDetailsPage } from './pages/admin/IntersectionDetailsPage.js';
import { SignalConfigurationPage } from './pages/admin/SignalConfigurationPage.js';
import { TrafficIncidentsPage } from './pages/admin/TrafficIncidentsPage.js';
import { TrafficProblemsPage } from './pages/admin/TrafficProblemsPage.js';
import { EmergencyHistoryPage } from './pages/admin/EmergencyHistoryPage.js';
import { AuditLogsPage } from './pages/admin/AuditLogsPage.js';

// Traffic Police Pages
import { PoliceDashboardPage } from './pages/traffic-police/PoliceDashboardPage.js';
import { AssignedIntersectionsPage } from './pages/traffic-police/AssignedIntersectionsPage.js';
import { RecordIncidentPage } from './pages/traffic-police/RecordIncidentPage.js';
import { ReportProblemPage } from './pages/traffic-police/ReportProblemPage.js';
import { MyIncidentsPage } from './pages/traffic-police/MyIncidentsPage.js';
import { MyProblemsPage } from './pages/traffic-police/MyProblemsPage.js';
import { EmergencyPriorityPage } from './pages/traffic-police/EmergencyPriorityPage.js';

// Shared Pages
import { LiveMonitorPage } from './pages/monitoring/LiveMonitorPage.js';
import { ReportsPage } from './pages/reports/ReportsPage.js';
import { NotificationsPage } from './pages/notifications/NotificationsPage.js';
import { ProfileSettingsPage } from './pages/settings/ProfileSettingsPage.js';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Role Guard Wrapper
const RoleGuard: React.FC<{
  allowedRoles: ('ADMIN' | 'TRAFFIC_POLICE')[];
  children: React.ReactElement;
}> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Root Redirect Component
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/police/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Routes (Dashboard Layout) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Administrator Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/monitoring"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <LiveMonitorPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/intersections"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <IntersectionManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/intersections/:id"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <IntersectionDetailsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/signal-configuration"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <SignalConfigurationPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/traffic-police"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TrafficPoliceManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/traffic-police/:id"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <OfficerDetailsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/incidents"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TrafficIncidentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/problems"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <TrafficProblemsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/emergency-history"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <EmergencyHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <ReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <NotificationsPage />
            </RoleGuard>
          }
        />

        {/* Traffic Police Routes */}
        <Route
          path="/police/dashboard"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <PoliceDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/monitoring"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <LiveMonitorPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/intersections"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <AssignedIntersectionsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/emergency-priority"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <EmergencyPriorityPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/emergency-history"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <EmergencyHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/incidents"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <MyIncidentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/incidents/new"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <RecordIncidentPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/problems"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <MyProblemsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/problems/new"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <ReportProblemPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/reports"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <ReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/police/notifications"
          element={
            <RoleGuard allowedRoles={['TRAFFIC_POLICE']}>
              <NotificationsPage />
            </RoleGuard>
          }
        />

        {/* Common Profile & Settings */}
        <Route path="/profile" element={<ProfileSettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
export default App;
