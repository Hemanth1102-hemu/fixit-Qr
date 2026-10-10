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
import { SupervisorDashboard } from './pages/SupervisorDashboard';
import { EquipmentManagement } from './pages/EquipmentManagement';
import { SystemAdminDashboard } from './pages/SystemAdminDashboard';
import { BuildingsManagement } from './pages/BuildingsManagement';
import { ReportProblem } from './pages/ReportProblem';
import { AccountNotProvisioned } from './pages/AccountNotProvisioned';
import { AccountDisabled } from './pages/AccountDisabled';
import { UnauthorizedAccess } from './pages/UnauthorizedAccess';

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

            {/* Supervisor Portal */}
            <Route 
              path="/supervisor/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/reviews" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor/operations" 
              element={
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              } 
            />

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
                <ProtectedRoute allowedRoles={['supervisor', 'system_admin']}>
                  <SystemAdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Legacy & Shortcut Redirects */}
            <Route path="/report" element={<Navigate to="/student/report" replace />} />
            <Route path="/complaints" element={<Navigate to="/maintenance-admin/dashboard" replace />} />
            <Route path="/equipment" element={<Navigate to="/maintenance-admin/equipment" replace />} />
            <Route path="/buildings" element={<Navigate to="/maintenance-admin/buildings" replace />} />
            <Route path="/analytics" element={<Navigate to="/maintenance-admin/dashboard" replace />} />
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
