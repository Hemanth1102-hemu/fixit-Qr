import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CameraScannerModal } from './components/CameraScannerModal';

// Pages
import { Login } from './pages/Login';
import { QrEquipmentLanding } from './pages/QrEquipmentLanding';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { MaintenanceDashboard } from './pages/MaintenanceDashboard';
import { MaintenanceAdminDashboard } from './pages/MaintenanceAdminDashboard';
import { EquipmentManagement } from './pages/EquipmentManagement';
import { SystemAdminDashboard } from './pages/SystemAdminDashboard';
import { BuildingsManagement } from './pages/BuildingsManagement';
import { ReportProblem } from './pages/ReportProblem';
import { QrTestSheet } from './pages/QrTestSheet';
import { AccountNotProvisioned } from './pages/AccountNotProvisioned';
import { AccountDisabled } from './pages/AccountDisabled';
import { UnauthorizedAccess } from './pages/UnauthorizedAccess';

// Supervisor 12-Page Suite
import { SupervisorOverview } from './pages/supervisor/SupervisorOverview';
import { SupervisorComplaints } from './pages/supervisor/SupervisorComplaints';
import { SupervisorEscalations } from './pages/supervisor/SupervisorEscalations';
import { SupervisorTeamPerformance } from './pages/supervisor/SupervisorTeamPerformance';
import { SupervisorCompletionReview } from './pages/supervisor/SupervisorCompletionReview';
import { SupervisorAnalytics } from './pages/supervisor/SupervisorAnalytics';
import { SupervisorEquipmentHealth } from './pages/supervisor/SupervisorEquipmentHealth';
import { SupervisorLocations } from './pages/supervisor/SupervisorLocations';
import { SupervisorAuditLogs } from './pages/supervisor/SupervisorAuditLogs';
import { SupervisorNotifications } from './pages/supervisor/SupervisorNotifications';
import { SupervisorProfile } from './pages/supervisor/SupervisorProfile';
import { SupervisorPolicies } from './pages/supervisor/SupervisorPolicies';

export default function App() {
  const { user, defaultDestination, loading } = useAuth();
  const [scannerOpen, setScannerOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Standalone public routes (QR camera landing, Login, unprovisioned notice)
  const isPublicStandalone = 
    location.pathname.startsWith('/equipment/') || 
    location.pathname === '/login' ||
    location.pathname === '/account-not-provisioned' ||
    location.pathname === '/account-disabled';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {!isPublicStandalone && (
        <Navbar onOpenScanner={() => setScannerOpen(true)} />
      )}

      <div className="flex-1 flex">
        {!isPublicStandalone && <Sidebar />}

        <main className={`flex-1 ${!isPublicStandalone ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          <Routes>
            {/* Public and Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/equipment/:qrToken" element={<QrEquipmentLanding />} />
            <Route path="/qr-test" element={<QrTestSheet />} />
            <Route path="/account-not-provisioned" element={<AccountNotProvisioned />} />
            <Route path="/account-disabled" element={<AccountDisabled />} />
            <Route path="/unauthorized" element={<UnauthorizedAccess />} />

            {/* Root Route: Automatically redirects authenticated users to their trusted role dashboard */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to={defaultDestination || '/student/dashboard'} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Student Portal */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/complaints" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/report" 
              element={
                <ProtectedRoute allowedRoles={['student', 'faculty']}>
                  <ReportProblem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/scan" 
              element={<ScanModalTrigger onOpen={() => setScannerOpen(true)} />} 
            />

            {/* Faculty Portal */}
            <Route 
              path="/faculty/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty/complaints" 
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Maintenance Staff Portal */}
            <Route 
              path="/maintenance/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['technician', 'maintenance_admin', 'admin', 'supervisor']}>
                  <MaintenanceDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance/jobs" 
              element={
                <ProtectedRoute allowedRoles={['technician', 'maintenance_admin', 'admin', 'supervisor']}>
                  <MaintenanceDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance/history" 
              element={
                <ProtectedRoute allowedRoles={['technician', 'maintenance_admin', 'admin', 'supervisor']}>
                  <MaintenanceDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Maintenance Admin Portal */}
            <Route 
              path="/maintenance-admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['maintenance_admin', 'admin', 'supervisor', 'system_admin']}>
                  <MaintenanceAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-admin/inbox" 
              element={
                <ProtectedRoute allowedRoles={['maintenance_admin', 'admin', 'supervisor', 'system_admin']}>
                  <MaintenanceAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-admin/equipment" 
              element={
                <ProtectedRoute allowedRoles={['maintenance_admin', 'admin', 'supervisor', 'system_admin']}>
                  <EquipmentManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-admin/buildings" 
              element={
                <ProtectedRoute allowedRoles={['maintenance_admin', 'admin', 'supervisor', 'system_admin']}>
                  <BuildingsManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance-admin/reports" 
              element={
                <ProtectedRoute allowedRoles={['maintenance_admin', 'admin', 'supervisor', 'system_admin']}>
                  <MaintenanceAdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* ----------------------------------------------------------- */}
            {/* Dedicated Supervisor 12-Page Suite (Strict Access Control) */}
            {/* ----------------------------------------------------------- */}
            <Route 
              path="/supervisor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorOverview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/complaints" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorComplaints />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/escalations" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorEscalations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/team-performance" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorTeamPerformance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/completion-review" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorCompletionReview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/analytics" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/equipment-health" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorEquipmentHealth />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/locations" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorLocations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/audit-logs" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorAuditLogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/notifications" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorNotifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/profile" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/policies" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorPolicies />
                </ProtectedRoute>
              } 
            />

            {/* Supervisor Legacy Aliases */}
            <Route path="/supervisor/reviews" element={<Navigate to="/supervisor/completion-review" replace />} />
            <Route path="/supervisor/operations" element={<Navigate to="/supervisor/dashboard" replace />} />

            {/* System Admin Directory & Logs */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SystemAdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audit-logs" 
              element={
                <Navigate to="/supervisor/audit-logs" replace />
              } 
            />

            {/* Legacy & Shortcut Redirects */}
            <Route path="/report" element={<Navigate to="/student/report" replace />} />
            <Route path="/complaints" element={<Navigate to="/maintenance-admin/dashboard" replace />} />
            <Route path="/equipment" element={<Navigate to="/maintenance-admin/equipment" replace />} />
            <Route path="/buildings" element={<Navigate to="/maintenance-admin/buildings" replace />} />
            <Route path="/analytics" element={<Navigate to="/supervisor/analytics" replace />} />
            <Route path="/scan" element={<ScanModalTrigger onOpen={() => setScannerOpen(true)} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <CameraScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}

function ScanModalTrigger({ onOpen }) {
  React.useEffect(() => {
    onOpen();
  }, [onOpen]);
  return <Navigate to="/" replace />;
}
