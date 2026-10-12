import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  User, 
  Filter, 
  Search, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Code
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, totalPages: 1 });

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: '30',
        action: actionFilter
      });
      const res = await apiRequest(`/supervisor/audit-logs?${query.toString()}`);
      setLogs(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[SUPERVISOR_AUDIT_LOGS_ERROR]', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, actionFilter]);

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Audit & Activity History"
        subtitle="Immutable security audit trail of maintenance decisions, completion approvals, SLA adjustments, and staff assignments."
        breadcrumbs={[{ label: 'Audit History' }]}
        onRefresh={loadAuditLogs}
        refreshing={loading}
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-500" />
          <span className="font-semibold text-stone-700">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Audit Actions</option>
            <option value="SUPERVISOR_APPROVAL">Supervisor Approvals</option>
            <option value="SUPERVISOR_RETURNED_FOR_REWORK">Returned for Rework</option>
            <option value="ESCALATION_DECISION_RECORDED">Escalation Decisions</option>
            <option value="POLICY_UPDATED">Policy SLA Updates</option>
            <option value="USER_ROLE_UPDATED">User Role Changes</option>
          </select>
        </div>

        <span className="text-stone-400 font-medium">
          Total Recorded Events: {pagination.total}
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={FileText}
              title="No audit events found"
              description="Administrative actions and supervisor decisions will appear in this immutable operational trail."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Recorded Decision & Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-stone-900">{log.actor?.full_name || 'System'}</p>
                      <p className="text-[10px] text-stone-400">{log.actor?.email || 'automated'}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-stone-700 font-medium">
                      {log.entity_type} <span className="font-mono text-[10px] text-stone-400">({log.entity_id})</span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="bg-stone-50 border border-stone-100 rounded-lg p-2 font-mono text-[11px] text-stone-700 break-words">
                        {typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : String(log.metadata)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div>
              Page <span className="font-bold text-stone-800">{pagination.page}</span> of <span className="font-bold text-stone-800">{pagination.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition flex items-center gap-1 font-medium"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
