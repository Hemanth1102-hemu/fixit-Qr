import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  QrCode, 
  Wrench, 
  Building2, 
  BarChart3, 
  Users, 
  FileText, 
  ClipboardCheck,
  History,
  ShieldCheck,
  FileCheck2,
  FolderOpen,
  AlertOctagon,
  Activity,
  Bell,
  Sliders,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { role, signOut } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'faculty':
        return [
          { to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { to: '/student/report', label: 'Report Laboratory Issue', icon: PlusCircle },
          { to: '/faculty/complaints', label: 'My Reported Issues', icon: ClipboardCheck },
          { to: '/student/scan', label: 'Scan Equipment QR', icon: QrCode },
        ];
      case 'technician':
        return [
          { to: '/maintenance/dashboard', label: 'Work Orders Queue', icon: Wrench },
          { to: '/maintenance/jobs', label: 'Active Repairs', icon: ClipboardCheck },
          { to: '/maintenance/history', label: 'Repair History', icon: History },
          { to: '/student/scan', label: 'Scan Equipment QR', icon: QrCode },
        ];
      case 'maintenance_admin':
      case 'admin':
        return [
          { to: '/maintenance-admin/dashboard', label: 'Operations Overview', icon: LayoutDashboard },
          { to: '/maintenance-admin/inbox', label: 'Complaint Inbox & Triage', icon: ClipboardCheck },
          { to: '/maintenance-admin/equipment', label: 'Equipment & QR Labels', icon: QrCode },
          { to: '/maintenance-admin/buildings', label: 'Buildings & Classrooms', icon: Building2 },
          { to: '/maintenance-admin/reports', label: 'Maintenance Reports', icon: BarChart3 },
        ];
      case 'supervisor':
      case 'system_admin':
        return [
          { to: '/supervisor/dashboard', label: 'Operations Overview', icon: LayoutDashboard },
          { to: '/supervisor/complaints', label: 'All Complaints', icon: ClipboardCheck },
          { to: '/supervisor/escalations', label: 'Urgent & Escalations', icon: AlertOctagon },
          { to: '/supervisor/completion-review', label: 'Completion Reviews', icon: FileCheck2 },
          { to: '/supervisor/team-performance', label: 'Team Performance', icon: Users },
          { to: '/supervisor/equipment-health', label: 'Equipment Health', icon: Activity },
          { to: '/supervisor/locations', label: 'Campus Locations', icon: Building2 },
          { to: '/supervisor/analytics', label: 'Analytics & Reports', icon: BarChart3 },
          { to: '/supervisor/notifications', label: 'Supervisor Alerts', icon: Bell },
          { to: '/supervisor/audit-logs', label: 'Audit History', icon: FileText },
          { to: '/supervisor/policies', label: 'Policy Settings', icon: Sliders },
          { to: '/supervisor/profile', label: 'Supervisor Profile', icon: User },
        ];
      case 'student':
      default:
        return [
          { to: '/student/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { to: '/student/report', label: 'Report a Problem', icon: PlusCircle },
          { to: '/student/complaints', label: 'My Complaints', icon: ClipboardCheck },
          { to: '/student/scan', label: 'Scan Equipment QR', icon: QrCode },
        ];
    }
  };

  const links = getLinks();
  const isSupervisor = role === 'supervisor' || role === 'system_admin';

  return (
    <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex md:flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {isSupervisor ? 'Supervisor Executive Suite' : 'Navigation Portal'}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-semibold border-l-4 border-amber-600'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-stone-100">
        <div className="bg-stone-50 rounded-lg p-3 text-[11px] text-stone-500 border border-stone-200/60 flex items-center justify-between">
          <div>
            <p className="font-semibold text-stone-800">SRMIST Estate Office</p>
            <p className="text-[10px] text-stone-400">Kattankulathur Campus</p>
          </div>
          {isSupervisor && (
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
