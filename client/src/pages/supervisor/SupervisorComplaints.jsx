import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench, 
  User, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorComplaints() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters state initialized from URL or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Buildings list for filtering
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    // Load buildings for filter dropdown
    apiRequest('/buildings')
      .then(res => setBuildings(res.data || []))
      .catch(() => setBuildings([]));
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder
      });

      if (buildingFilter !== 'all') {
        query.append('buildingId', buildingFilter);
      }

      const res = await apiRequest(`/supervisor/complaints?${query.toString()}`);
      setComplaints(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[SUPERVISOR_COMPLAINTS_ERROR]', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentPage, statusFilter, priorityFilter, buildingFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadComplaints();
  };

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="All Campus Complaints"
        subtitle="Full operational inspection of maintenance tickets across SRMIST campuses, laboratories, and classrooms."
        breadcrumbs={[{ label: 'Complaints Directory' }]}
        onRefresh={loadComplaints}
        refreshing={loading}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Ticket ID (CMP-...), title, description, or asset code..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition shadow-2xs shrink-0"
          >
            Search Grid
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completion_submitted">Awaiting Supervisor Approval</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Building Dropdown */}
          <select
            value={buildingFilter}
            onChange={(e) => { setBuildingFilter(e.target.value); setCurrentPage(1); }}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All SRMIST Buildings</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.building_name}</option>
            ))}
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-stone-400">Sort:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setCurrentPage(1);
              }}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="priority-desc">Urgency First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              icon={Wrench}
              title="No complaints found matching filters"
              description="Adjust your search keywords or clear status and building filters to inspect other complaints."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setBuildingFilter('all');
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Issue & Description</th>
                  <th className="py-3 px-4">Location & Asset</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {complaints.map((c) => {
                  const currentAssignment = c.complaint_assignments?.find(a => a.is_current);
                  const isOverdue = c.target_completion_at && new Date(c.target_completion_at) < new Date() && !['resolved', 'rejected'].includes(c.status);

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-800 whitespace-nowrap">
                        {c.complaint_number}
                        {isOverdue && (
                          <span className="block text-[10px] text-rose-600 font-sans font-bold">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-stone-900 truncate">{c.title}</p>
                        <p className="text-stone-500 text-[11px] line-clamp-1 mt-0.5">{c.description}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-stone-800">
                          {c.equipment?.rooms?.buildings?.building_name || 'Campus'} - Room {c.equipment?.rooms?.room_number || 'N/A'}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          {c.equipment?.equipment_name || 'Equipment'} ({c.equipment?.asset_code || 'CODE'})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {currentAssignment?.technician ? (
                          <div>
                            <p className="font-semibold text-stone-800">{currentAssignment.technician.full_name || 'Technician'}</p>
                            <p className="text-[10px] text-stone-400 truncate">{currentAssignment.technician.email}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-stone-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 text-[11px]">
                        <div>Submitted: {new Date(c.created_at).toLocaleDateString()}</div>
                        {c.resolved_at && (
                          <div className="text-emerald-700 font-medium">Resolved: {new Date(c.resolved_at).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div>
              Showing page <span className="font-bold text-stone-800">{pagination.page}</span> of <span className="font-bold text-stone-800">{pagination.totalPages}</span> ({pagination.total} total)
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

      {/* Modal / Drawer for Detailed Complaint Inspection */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="font-mono text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {selectedComplaint.complaint_number}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-1">{selectedComplaint.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">Priority & Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <PriorityBadge priority={selectedComplaint.priority} />
                  <StatusBadge status={selectedComplaint.status} />
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">Campus Location</span>
                <p className="font-semibold text-stone-800 mt-1">
                  {selectedComplaint.equipment?.rooms?.buildings?.building_name || 'SRM Campus'}
                </p>
                <p className="text-stone-500">Room {selectedComplaint.equipment?.rooms?.room_number || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-stone-400 font-semibold uppercase text-[10px]">Reported Description</span>
              <p className="p-3 bg-stone-50 rounded-xl text-stone-800 leading-relaxed">
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.photo_url && (
              <div className="space-y-2 text-xs">
                <span className="text-stone-400 font-semibold uppercase text-[10px]">Report Photo Evidence</span>
                <div className="rounded-xl overflow-hidden border border-stone-200">
                  <img 
                    src={selectedComplaint.photo_url} 
                    alt="Report Evidence" 
                    className="w-full h-48 object-cover" 
                  />
                </div>
              </div>
            )}

            {selectedComplaint.completion_photo_url && (
              <div className="space-y-2 text-xs">
                <span className="text-stone-400 font-semibold uppercase text-[10px]">Technician Completion Proof</span>
                <div className="rounded-xl overflow-hidden border border-stone-200">
                  <img 
                    src={selectedComplaint.completion_photo_url} 
                    alt="Completion Evidence" 
                    className="w-full h-48 object-cover" 
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-stone-100 gap-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
              >
                Close
              </button>
              {['completion_submitted'].includes(selectedComplaint.status) && (
                <Link
                  to="/supervisor/completion-review"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition"
                >
                  Review Work Order
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
