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
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { role } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'technician':
        return [
          { to: '/', label: 'Assigned Work Orders', icon: Wrench, end: true },
          { to: '/history', label: 'My Repair History', icon: History },
          { to: '/scan', label: 'Scan Equipment', icon: QrCode },
        ];
      case 'admin':
        return [
          { to: '/', label: 'Campus Overview', icon: LayoutDashboard, end: true },
          { to: '/complaints', label: 'Complaints Queue', icon: ClipboardCheck },
          { to: '/equipment', label: 'Equipment & QR Labels', icon: QrCode },
          { to: '/buildings', label: 'Buildings & Rooms', icon: Building2 },
          { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
        ];
      case 'system_admin':
        return [
          { to: '/', label: 'System Overview', icon: LayoutDashboard, end: true },
          { to: '/users', label: 'User Directory & Roles', icon: Users },
          { to: '/equipment', label: 'Equipment & QR Labels', icon: QrCode },
          { to: '/audit-logs', label: 'System Audit Logs', icon: FileText },
          { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
        ];
      case 'student':
      case 'faculty':
      default:
        return [
          { to: '/', label: 'My Complaints', icon: LayoutDashboard, end: true },
          { to: '/report', label: 'Report a Problem', icon: PlusCircle },
          { to: '/scan', label: 'Scan Equipment QR', icon: QrCode },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex md:flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
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
        <div className="bg-stone-50 rounded-lg p-3 text-[11px] text-stone-500 border border-stone-200/60">
          <p className="font-semibold text-stone-800">Campus Helpdesk</p>
          <p className="mt-0.5">Emergency electrical hazards: Dial 100 or notify campus security immediately.</p>
        </div>
      </div>
    </aside>
  );
}
