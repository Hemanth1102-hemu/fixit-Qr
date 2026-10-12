import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  UserPlus, 
  Activity, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { apiRequest } from '../lib/api';

export function SystemAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [searchUser, setSearchUser] = useState('');
  
  // Role change modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('student');
  const [isActiveStatus, setIsActiveStatus] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        apiRequest('/admin/users').catch(() => ({ data: [] })),
        apiRequest('/admin/audit-logs').catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data || []);
      setAuditLogs(logsRes.data || []);
    } catch {
      setUsers([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateUserRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdating(true);
    try {
      await apiRequest(`/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: newRole,
          is_active: isActiveStatus
        })
      });
      setMsg(`Updated role for ${selectedUser.full_name} to ${newRole}`);
      setTimeout(() => setMsg(''), 3000);
      setSelectedUser(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">System Administration & Audit Logs</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Role-based provisioning, campus account permissions, and immutable security audit trails
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-amber-600 text-amber-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Roles ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-amber-600 text-amber-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name, email, or role..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No campus users found"
                description={searchUser ? "No users match your search criteria." : "No provisioned campus profiles registered in the system yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Campus User</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-stone-900">{u.full_name}</td>
                      <td className="px-4 py-3 text-stone-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-stone-100 text-stone-800 border border-stone-200 capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${u.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRole(u.role);
                            setIsActiveStatus(u.is_active);
                          }}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded text-[11px] transition"
                        >
                          Edit Role & Permissions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Audit Logs Table */
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No security audit events"
                description="The audit log is empty. Security transitions, equipment modifications, and role updates will be logged here automatically."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Security Action</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition">
                      <td className="px-4 py-3 text-stone-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {log.entity_type} ({log.entity_id})
                      </td>
                      <td className="px-4 py-3 text-amber-800">
                        {log.actor?.full_name || 'System Daemon'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Role Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Modify User Permissions</h3>
                <p className="text-xs text-stone-500">{selectedUser.full_name} ({selectedUser.email})</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleUpdateUserRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select System Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="student">Student (Report & Track)</option>
                  <option value="faculty">Faculty (Priority Reporting & Track)</option>
                  <option value="technician">Technician (Work Orders & Repairs)</option>
                  <option value="admin">College Admin (Assignments & Facility Management)</option>
                  <option value="system_admin">System Admin (Full Access & User Roles)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActiveStatus}
                  onChange={(e) => setIsActiveStatus(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-stone-800">
                  Account Active and Enabled
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
