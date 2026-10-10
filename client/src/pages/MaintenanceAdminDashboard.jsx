import React from 'react';
import { AdminDashboard } from './AdminDashboard';

export function MaintenanceAdminDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Maintenance Admin Portal
        </span>
      </div>
      <AdminDashboard />
    </div>
  );
}
