import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Search, 
  Star, 
  RotateCcw, 
  ArrowRight,
  MapPin,
  Building2,
  Calendar
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Selected complaint detail & feedback modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [reopenNote, setReopenNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // SRMIST Classroom Integration state
  const [classroomAllocation, setClassroomAllocation] = useState(null);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const [res, classRes] = await Promise.all([
        apiRequest('/complaints/mine'),
        apiRequest('/classroom/my-allocation').catch(() => ({ data: null }))
      ]);
      setComplaints(res.data || []);
      if (classRes && classRes.data) {
        setClassroomAllocation(classRes.data);
      }
    } catch {
      setComplaints([]);
      setClassroomAllocation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'pending').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.equipment?.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setFeedbackSubmitting(true);
    try {
      await apiRequest(`/complaints/${selectedTicket.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating: feedbackRating, comments: feedbackComments })
      });
      setActionSuccess('Feedback submitted successfully!');
      setTimeout(() => setActionSuccess(''), 3000);
      setSelectedTicket(null);
      fetchMyComplaints();
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket || !reopenNote.trim()) return;
    try {
      await apiRequest(`/complaints/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'reopened',
          note: reopenNote
        })
      });
      setActionSuccess('Ticket reopened for review by facility team.');
      setTimeout(() => setActionSuccess(''), 3000);
      setSelectedTicket(null);
      setReopenNote('');
      fetchMyComplaints();
    } catch (err) {
      alert(err.message || 'Failed to reopen complaint');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              SRMIST Campus Portal
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Reporter Dashboard</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Lodge and track equipment maintenance tickets for SRMIST classrooms, labs, and amenities
          </p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SRMIST CLASSROOM TIMETABLE ALLOCATION WIDGET */}
      {classroomAllocation && classroomAllocation.has_active_allocation && (
        <div className="bg-gradient-to-r from-amber-50/70 via-stone-50 to-white border border-amber-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Current Scheduled Classroom (SRMIST Timetable Sync)
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-medium bg-amber-100/60 px-2 py-0.5 rounded">
              {classroomAllocation.institutional_record?.department} • {classroomAllocation.institutional_record?.section}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>{classroomAllocation.current_room?.building_name}</span>
                <span className="text-stone-400">•</span>
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Room {classroomAllocation.current_room?.room_number}</span>
              </div>
              <p className="text-xs text-stone-500">
                Active Session: <strong className="text-stone-700">{classroomAllocation.current_room?.session_type}</strong> (Reg/Emp: {classroomAllocation.institutional_record?.reg_or_emp_no})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/report"
                state={{ prefillRoom: classroomAllocation.current_room }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Fault in This Classroom</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Submitted Tickets" value={total} icon={ClipboardList} />
        <StatCard title="Pending Review" value={pending} icon={Clock} />
        <StatCard title="Under Repair" value={inProgress} icon={AlertCircle} />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle2} />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets, assets, or room numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-stone-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>
        </div>
      </div>

      {/* Complaints List Table / Cards */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ClipboardList className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-semibold text-stone-800">No maintenance tickets found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Scan a QR code on any fan, light, switch, or projector to report issues directly.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredComplaints.map((c) => {
              const eq = c.equipment;
              const rm = eq?.rooms || eq?.room;
              const bg = rm?.buildings || rm?.building;

              return (
                <div 
                  key={c.id}
                  onClick={() => setSelectedTicket(c)}
                  className="p-4 sm:p-5 hover:bg-stone-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                        {c.complaint_number}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>

                    <h3 className="text-sm font-bold text-stone-900">{c.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="font-medium text-stone-700">{eq?.equipment_name || 'Equipment'}</span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>{bg?.building_name || 'Campus'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>Room {rm?.room_number || '101'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      <span>View Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Details & Feedback Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div>
                <span className="text-[10px] font-mono text-stone-400">{selectedTicket.complaint_number}</span>
                <h3 className="text-sm font-bold text-stone-900">{selectedTicket.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="text-stone-500 font-medium">Category: {selectedTicket.category}</span>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/60 space-y-1">
                <p className="font-semibold text-stone-800">Problem Description</p>
                <p className="text-stone-600">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolution_notes && (
                <div className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-200 space-y-1">
                  <p className="font-semibold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Technician Repair Report</span>
                  </p>
                  <p className="text-emerald-800">{selectedTicket.resolution_notes}</p>
                </div>
              )}

              {/* Feedback Section for Resolved Tickets */}
              {selectedTicket.status === 'resolved' && (
                <div className="pt-3 border-t border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-900">Submit Resolution Feedback</h4>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Service Rating (1 to 5 Stars)
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`p-1 rounded ${star <= feedbackRating ? 'text-amber-500' : 'text-stone-300'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Comments on Work Quality
                      </label>
                      <textarea
                        rows={2}
                        value={feedbackComments}
                        onChange={(e) => setFeedbackComments(e.target.value)}
                        placeholder="Was the equipment fixed properly and clean?"
                        className="w-full p-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={feedbackSubmitting}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      {feedbackSubmitting ? 'Submitting...' : 'Save Rating & Feedback'}
                    </button>
                  </form>

                  {/* Reopen Action */}
                  <div className="pt-3 border-t border-stone-100">
                    <p className="text-[11px] font-semibold text-stone-700 mb-1">Is the problem still persisting?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Reason why issue is not resolved..."
                        value={reopenNote}
                        onChange={(e) => setReopenNote(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleReopenTicket}
                        disabled={!reopenNote.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold shrink-0 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen Ticket</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 text-xs font-semibold text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
