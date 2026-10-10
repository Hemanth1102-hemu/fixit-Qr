import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CameraScannerModal } from './components/CameraScannerModal';

// Pages
import { Login } from './pages/Login';
import { QrEquipmentLanding } from './pages/QrEquipmentLanding';
import { StudentDashboard } from './pages/StudentDashboard';
import { MaintenanceDashboard } from './pages/MaintenanceDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { EquipmentManagement } from './pages/EquipmentManagement';
import { SystemAdminDashboard } from './pages/SystemAdminDashboard';
import { BuildingsManagement } from './pages/BuildingsManagement';
import { ReportProblem } from './pages/ReportProblem';

export default function App() {
  const { user, role, loading } = useAuth();
  const [scannerOpen, setScannerOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Standalone routes that do not need full campus shell layout
  const isPublicStandalone = location.pathname.startsWith('/equipment/') || location.pathname === '/login';

  const renderRoleDashboard = () => {
    switch (role) {
      case 'technician':
        return <MaintenanceDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'system_admin':
        return <SystemAdminDashboard />;
      case 'student':
      case 'faculty':
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {!isPublicStandalone && (
        <Navbar onOpenScanner={() => setScannerOpen(true)} />
      )}

      <div className="flex-1 flex">
        {!isPublicStandalone && <Sidebar />}

        <main className={`flex-1 ${!isPublicStandalone ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/equipment/:qrToken" element={<QrEquipmentLanding />} />
            <Route path="/scan" element={<ScanRedirect onOpen={() => setScannerOpen(true)} />} />
            
            {/* Authenticated routes */}
            <Route path="/" element={renderRoleDashboard()} />
            <Route path="/report" element={<ReportProblem />} />
            <Route path="/complaints" element={<AdminDashboard />} />
            <Route path="/equipment" element={<EquipmentManagement />} />
            <Route path="/buildings" element={<BuildingsManagement />} />
            <Route path="/analytics" element={<AdminDashboard />} />
            <Route path="/users" element={<SystemAdminDashboard />} />
            <Route path="/audit-logs" element={<SystemAdminDashboard />} />
            <Route path="/history" element={<MaintenanceDashboard />} />
            
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

function ScanRedirect({ onOpen }) {
  React.useEffect(() => {
    onOpen();
  }, [onOpen]);
  return <Navigate to="/" replace />;
}
