import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot from './components/ChatBot';
import ErrorBoundary from './components/ErrorBoundary';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'));
const ChildProfile = lazy(() => import('./pages/parent/ChildProfile'));
const VaccinationSchedule = lazy(() => import('./pages/parent/VaccinationSchedule'));
const GrowthMonitoring = lazy(() => import('./pages/parent/GrowthMonitoring'));
const DietPlan = lazy(() => import('./pages/parent/DietPlan'));
const AIHealthPrediction = lazy(() => import('./pages/parent/AIHealthPrediction'));
const ParentSchemes = lazy(() => import('./pages/parent/GovernmentSchemes'));
const HealthReports = lazy(() => import('./pages/parent/HealthReports'));
const ParentNotifications = lazy(() => import('./pages/parent/Notifications'));
const ParentSettings = lazy(() => import('./pages/parent/Settings'));

const AshaDashboard = lazy(() => import('./pages/asha/Dashboard'));
const MyChildrenList = lazy(() => import('./pages/asha/MyChildrenList'));
const ChildDetailView = lazy(() => import('./pages/asha/ChildDetailView'));
const LogHomeVisit = lazy(() => import('./pages/asha/LogHomeVisit'));
const VaccinationTracker = lazy(() => import('./pages/asha/VaccinationTracker'));
const GrowthRecords = lazy(() => import('./pages/asha/GrowthRecords'));
const MalnutritionReport = lazy(() => import('./pages/asha/MalnutritionReport'));
const VisitHistoryLog = lazy(() => import('./pages/asha/VisitHistoryLog'));
const AreaCoverageMap = lazy(() => import('./pages/asha/AreaCoverageMap'));
const AshaNotifications = lazy(() => import('./pages/asha/NotificationsAlerts'));
const GenerateReport = lazy(() => import('./pages/asha/GenerateReport'));
const AshaProfileSettings = lazy(() => import('./pages/asha/ProfileSettings'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const DistrictHeatmap = lazy(() => import('./pages/admin/DistrictHeatmap'));
const AnalyticsReports = lazy(() => import('./pages/admin/AnalyticsReports'));
const ChildrenRegistry = lazy(() => import('./pages/admin/ChildrenRegistry'));
const AshaWorkerManagement = lazy(() => import('./pages/admin/AshaWorkerManagement'));
const HealthCentreDirectory = lazy(() => import('./pages/admin/HealthCentreDirectory'));
const VaccinationData = lazy(() => import('./pages/admin/VaccinationData'));
const MalnutritionCases = lazy(() => import('./pages/admin/MalnutritionCases'));
const AdminSchemes = lazy(() => import('./pages/admin/GovernmentSchemes'));
const BlockwiseReports = lazy(() => import('./pages/admin/BlockwiseReports'));
const NotificationsPanel = lazy(() => import('./pages/admin/NotificationsPanel'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminSettings = lazy(() => import('./pages/admin/SettingsConfiguration'));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      Loading...
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const hideChatBot = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Parent Portal */}
          <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/child-profile" element={<ChildProfile />} />
            <Route path="/parent/vaccination" element={<VaccinationSchedule />} />
            <Route path="/parent/growth" element={<GrowthMonitoring />} />
            <Route path="/parent/diet-plan" element={<DietPlan />} />
            <Route path="/parent/ai-prediction" element={<AIHealthPrediction />} />
            <Route path="/parent/schemes" element={<ParentSchemes />} />
            <Route path="/parent/reports" element={<HealthReports />} />
            <Route path="/parent/notifications" element={<ParentNotifications />} />
            <Route path="/parent/settings" element={<ParentSettings />} />
          </Route>

          {/* ASHA Worker Portal */}
          <Route element={<ProtectedRoute allowedRoles={['asha']} />}>
            <Route path="/asha/dashboard" element={<AshaDashboard />} />
            <Route path="/asha/children" element={<MyChildrenList />} />
            <Route path="/asha/child/:id" element={<ChildDetailView />} />
            <Route path="/asha/log-visit" element={<LogHomeVisit />} />
            <Route path="/asha/vaccination-tracker" element={<VaccinationTracker />} />
            <Route path="/asha/growth-records" element={<GrowthRecords />} />
            <Route path="/asha/malnutrition-report" element={<MalnutritionReport />} />
            <Route path="/asha/visit-history" element={<VisitHistoryLog />} />
            <Route path="/asha/area-map" element={<AreaCoverageMap />} />
            <Route path="/asha/notifications" element={<AshaNotifications />} />
            <Route path="/asha/generate-report" element={<GenerateReport />} />
            <Route path="/asha/settings" element={<AshaProfileSettings />} />
          </Route>

          {/* Admin Portal */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/heatmap" element={<DistrictHeatmap />} />
            <Route path="/admin/analytics" element={<AnalyticsReports />} />
            <Route path="/admin/children" element={<ChildrenRegistry />} />
            <Route path="/admin/asha-workers" element={<AshaWorkerManagement />} />
            <Route path="/admin/health-centres" element={<HealthCentreDirectory />} />
            <Route path="/admin/vaccination-data" element={<VaccinationData />} />
            <Route path="/admin/malnutrition" element={<MalnutritionCases />} />
            <Route path="/admin/schemes" element={<AdminSchemes />} />
            <Route path="/admin/block-reports" element={<BlockwiseReports />} />
            <Route path="/admin/notifications" element={<NotificationsPanel />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      {!hideChatBot ? <ChatBot /> : null}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
