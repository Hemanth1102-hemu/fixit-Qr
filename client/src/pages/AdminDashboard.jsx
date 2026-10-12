import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Download, 
  UserCheck, 
  Wrench, 
  Search, 
  Building2, 
  Repeat,
  ArrowUpDown
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
import { apiRequest } from '../lib/api';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Assignment modal
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, complaintsRes, usersRes] = await Promise.all([
        apiRequest('/admin/analytics'),
        apiRequest('/complaints/mine'), // Or admin complaints
        apiRequest('/admin/users?role=technician').catch(() => ({ data: [] }))
      ]);
      setAnalytics(analyticsRes.data);
      setComplaints(complaintsRes.data || []);
      setTechnicians(usersRes.data || []);
    } catch {
      setAnalytics({
        metrics: {
          totalComplaints: 0,
          openComplaints: 0,
          pendingAssignments: 0,
          urgentIssues: 0,
          resolvedComplaints: 0,
          avgResolutionTimeHours: 0
        },
        repeatFailures: []
      });
      setComplaints([]);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!assignModalComplaint || !selectedTechId) return;
    setAssignLoading(true);
    try {
      await apiRequest(`/complaints/${assignModalComplaint.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          technician_id: selectedTechId,
          note: assignmentNote
        })
      });
      setSuccessMsg('Technician assigned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setAssignModalComplaint(null);
      setSelectedTechId('');
      setAssignmentNote('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to assign technician');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (complaints.length === 0) return;
    const headers = ['Complaint Number', 'Title', 'Category', 'Priority', 'Status', 'Equipment', 'Asset Code', 'Building', 'Room', 'Date'];
    const rows = complaints.map(c => [
      c.complaint_number,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      `"${(c.equipment?.equipment_name || c.equipment_name || '').replace(/"/g, '""')}"`,
      c.equipment?.asset_code || c.asset_code || '',
      `"${(c.building_name || '').replace(/"/g, '""')}"`,
      c.room_number || '',
      new Date(c.created_at).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fixit_campus_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = analytics?.metrics || {
    totalComplaints: 0,
    openComplaints: 0,
    pendingAssignments: 0,
    urgentIssues: 0,
    resolvedComplaints: 0,
    avgResolutionTimeHours: 0
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaint_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Campus Maintenance Operations</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            College facility oversight, technician allocations, and performance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Complaints" value={metrics.totalComplaints} icon={BarChart3} />
        <StatCard title="Open Tickets" value={metrics.openComplaints} icon={Clock} />
        <StatCard title="Pending Assign" value={metrics.pendingAssignments} icon={UserCheck} alert={metrics.pendingAssignments > 0} />
        <StatCard title="Urgent Safety" value={metrics.urgentIssues} icon={AlertTriangle} alert={metrics.urgentIssues > 0} />
        <StatCard title="Resolved" value={metrics.resolvedComplaints} icon={CheckCircle2} />
        <StatCard 
          title="Avg Resolution" 
          value={`${metrics.avgResolutionTimeHours}h`} 
          icon={Clock} 
          description="Average ticket turnaround"
        />
      </div>

      {/* Repeat Equipment Failures Panel */}
      {analytics?.repeatFailures && analytics.repeatFailures.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-amber-800" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Repeated Equipment Failures (Preventative Action Required)
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">Over 1 breakdown logged</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {analytics.repeatFailures.map((rf, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">{rf.equipment_name}</p>
                  <p className="font-mono text-[11px] text-stone-500">Asset: {rf.asset_code}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 text-xs">
                  {rf.complaint_count} issues
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complaints Management Queue */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search complaint # or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white text-stone-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Wrench}
              title="No complaints in queue"
              description={search || statusFilter !== 'all' ? "No complaints match your active filter criteria." : "There are currently no active maintenance complaints registered in the system."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Subject & Equipment</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-4 py-3.5 font-mono font-semibold text-stone-900 whitespace-nowrap">
                      {c.complaint_number}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-bold text-stone-900 line-clamp-1">{c.title}</p>
                      <p className="text-[11px] text-stone-500">
                        {c.equipment?.equipment_name || c.equipment_name} ({c.category})
                      </p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap">
                      Room {c.equipment?.rooms?.room_number || c.room_number || 'General'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setAssignModalComplaint(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold transition"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Assign Staff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Technician Assignment Modal */}
      {assignModalComplaint && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Assign Maintenance Technician</h3>
                <p className="text-xs font-mono text-stone-500">{assignModalComplaint.complaint_number}</p>
              </div>
              <button onClick={() => setAssignModalComplaint(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Select Certified Campus Technician
                </label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">-- Choose Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Dispatch Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="e.g. Please bring insulation tape and replacement 16A switch."
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalComplaint(null)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedTechId}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
