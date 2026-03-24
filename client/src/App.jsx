import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot from './components/ChatBot';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Parent Pages
import ParentDashboard from './pages/parent/Dashboard';
import ChildProfile from './pages/parent/ChildProfile';
import VaccinationSchedule from './pages/parent/VaccinationSchedule';
import GrowthMonitoring from './pages/parent/GrowthMonitoring';
import DietPlan from './pages/parent/DietPlan';
import AIHealthPrediction from './pages/parent/AIHealthPrediction';
import ParentSchemes from './pages/parent/GovernmentSchemes';
import HealthReports from './pages/parent/HealthReports';
import ParentNotifications from './pages/parent/Notifications';
import ParentSettings from './pages/parent/Settings';

// ASHA Pages
import AshaDashboard from './pages/asha/Dashboard';
import MyChildrenList from './pages/asha/MyChildrenList';
import ChildDetailView from './pages/asha/ChildDetailView';
import LogHomeVisit from './pages/asha/LogHomeVisit';
import VaccinationTracker from './pages/asha/VaccinationTracker';
import GrowthRecords from './pages/asha/GrowthRecords';
import MalnutritionReport from './pages/asha/MalnutritionReport';
import VisitHistoryLog from './pages/asha/VisitHistoryLog';
import AreaCoverageMap from './pages/asha/AreaCoverageMap';
import AshaNotifications from './pages/asha/NotificationsAlerts';
import GenerateReport from './pages/asha/GenerateReport';
import AshaProfileSettings from './pages/asha/ProfileSettings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import DistrictHeatmap from './pages/admin/DistrictHeatmap';
import AnalyticsReports from './pages/admin/AnalyticsReports';
import ChildrenRegistry from './pages/admin/ChildrenRegistry';
import AshaWorkerManagement from './pages/admin/AshaWorkerManagement';
import HealthCentreDirectory from './pages/admin/HealthCentreDirectory';
import VaccinationData from './pages/admin/VaccinationData';
import MalnutritionCases from './pages/admin/MalnutritionCases';
import AdminSchemes from './pages/admin/GovernmentSchemes';
import BlockwiseReports from './pages/admin/BlockwiseReports';
import NotificationsPanel from './pages/admin/NotificationsPanel';
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/SettingsConfiguration';

function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <Router>
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
        <ChatBot />
      </Router>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
