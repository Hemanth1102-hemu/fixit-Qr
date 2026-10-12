import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertOctagon, 
  Clock, 
  MapPin, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Edit3, 
  UserCheck, 
  FileText,
  X
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorEscalations() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('add_note');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadEscalations = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/escalations');
      setEscalations(res.data || []);
    } catch (err) {
      console.error('[SUPERVISOR_ESCALATIONS_ERROR]', err);
      setEscalations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  const openActionModal = (ticket, type = 'add_note') => {
    setSelectedTicket(ticket);
    setActionType(type);
    setNotes('');
    setReason('');
    setNewDeadline(ticket.target_completion_at ? new Date(ticket.target_completion_at).toISOString().slice(0, 16) : '');
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('A documented reason is mandatory for supervisor escalation actions.');
      return;
    }

    setActionSubmitting(true);
    try {
      const body = {
        actionType,
        reason: reason.trim(),
        notes: notes.trim()
      };
      if (actionType === 'adjust_deadline' && newDeadline) {
        body.newDeadline = new Date(newDeadline).toISOString();
      }

      await apiRequest(`/supervisor/escalations/${selectedTicket.id}/action`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setToastMessage(`Supervisor action '${actionType}' recorded with audit log.`);
      setTimeout(() => setToastMessage(''), 4000);
      setActionModalOpen(false);
      loadEscalations();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Urgent & Escalated Maintenance"
        subtitle="Active oversight of high-severity incidents, breached SLA response targets, and overdue repair jobs across SRMIST."
        breadcrumbs={[{ label: 'Escalations Queue' }]}
        onRefresh={loadEscalations}
        refreshing={loading}
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMessage}
        </div>
      )}

      {/* Escalation Queue Table / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : escalations.length === 0 ? (
          <div className="bg-white border border-stone-200/80 rounded-2xl p-8">
            <EmptyState 
              icon={CheckCircle2}
              title="No pending escalations"
              description="No complaints currently exceed institutional SLA targets or require emergency supervisor dispatch."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {escalations.map((ticket) => {
              const activeAssign = ticket.complaint_assignments?.find(a => a.is_current);
              const isOverdue = ticket.target_completion_at && new Date(ticket.target_completion_at) < new Date();
              const hoursElapsed = Math.round((new Date() - new Date(ticket.created_at)) / (1000 * 60 * 60));

              return (
                <div 
                  key={ticket.id}
                  className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-amber-400 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded">
                        {ticket.complaint_number}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                      {ticket.status === 'reopened' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                          Repeat Issue
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{hoursElapsed} hours elapsed since report</span>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <h3 className="text-base font-bold text-stone-900">{ticket.title}</h3>
                      <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                        {ticket.description}
                      </p>
                      {ticket.escalation_notes && (
                        <div className="text-[11px] font-mono bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg text-amber-900 whitespace-pre-wrap">
                          {ticket.escalation_notes}
                        </div>
                      )}
                    </div>

                    {/* Meta and Assignments */}
                    <div className="p-3.5 bg-stone-50 rounded-xl space-y-2.5 text-xs">
                      <div>
                        <span className="text-stone-400 font-semibold uppercase text-[10px] block">Location & Asset</span>
                        <p className="font-semibold text-stone-800 mt-0.5">
                          {ticket.equipment?.rooms?.buildings?.building_name || 'SRMIST'} — Room {ticket.equipment?.rooms?.room_number || 'General'}
                        </p>
                        <p className="text-stone-500 text-[11px] font-mono">
                          {ticket.equipment?.equipment_name} ({ticket.equipment?.asset_code})
                        </p>
                      </div>

                      <div className="border-t border-stone-200/60 pt-2">
                        <span className="text-stone-400 font-semibold uppercase text-[10px] block">Assigned Technician</span>
                        {activeAssign?.technician ? (
                          <div className="mt-0.5">
                            <p className="font-semibold text-stone-800">{activeAssign.technician.full_name}</p>
                            <p className="text-[11px] text-stone-500 truncate">{activeAssign.technician.email}</p>
                          </div>
                        ) : (
                          <p className="text-rose-700 font-semibold text-[11px] mt-0.5">Not assigned yet</p>
                        )}
                      </div>

                      {ticket.target_completion_at && (
                        <div className="border-t border-stone-200/60 pt-2">
                          <span className="text-stone-400 font-semibold uppercase text-[10px] block">Target Completion Deadline</span>
                          <p className="font-semibold text-stone-800 mt-0.5">
                            {new Date(ticket.target_completion_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supervisor Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    <span className="text-[11px] text-stone-400 font-medium">
                      All actions are immutably recorded in the institutional audit log
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openActionModal(ticket, 'add_note')}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Add Note
                      </button>
                      <button
                        onClick={() => openActionModal(ticket, 'adjust_deadline')}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Adjust Deadline
                      </button>
                      <button
                        onClick={() => openActionModal(ticket, 'request_reassignment')}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Reassignment Request
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Dialog Modal */}
      {actionModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Supervisor Decision Form
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  Ticket #{selectedTicket.complaint_number}
                </h3>
              </div>
              <button 
                onClick={() => setActionModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="add_note">Add Supervisor Escalation Note</option>
                  <option value="adjust_deadline">Adjust Target Completion Deadline</option>
                  <option value="request_reassignment">Request Dispatch Reassignment</option>
                  <option value="request_admin_action">Request Urgent Maintenance Admin Action</option>
                </select>
              </div>

              {actionType === 'adjust_deadline' && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">New Target Completion Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Documented Operational Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mandatory reason for supervisor action (e.g. Parts arrived from central store, specialized contractor required)..."
                  rows={3}
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Additional Staff Instructions (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions for technician or estate admin..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionSubmitting ? 'Recording...' : 'Record Decision & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
