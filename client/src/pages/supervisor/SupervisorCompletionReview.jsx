import React, { useEffect, useState } from 'react';
import { 
  FileCheck2, 
  CheckCircle2, 
  RotateCcw, 
  MapPin, 
  Clock, 
  User, 
  Wrench, 
  AlertCircle, 
  Image as ImageIcon,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorCompletionReview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/completion-reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('[SUPERVISOR_REVIEWS_ERROR]', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openDecisionModal = (review, type) => {
    setSelectedReview(review);
    setDecisionType(type);
    setReviewNotes('');
    setReworkReason('');
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReview) return;

    if (decisionType === 'return_for_rework' && !reworkReason.trim()) {
      alert('A documented reason is mandatory when returning a repair for rework.');
      return;
    }

    setActionSubmitting(true);
    try {
      const body = {
        decision: decisionType,
        notes: reviewNotes.trim(),
        reason: reworkReason.trim()
      };

      const res = await apiRequest(`/supervisor/completion-reviews/${selectedReview.id}/decision`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setToastMessage(res.message || 'Decision recorded successfully');
      setTimeout(() => setToastMessage(''), 4000);
      setDecisionModalOpen(false);
      loadReviews();
    } catch (err) {
      alert(err.message || 'Decision submission failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Completion Reviews & Approvals"
        subtitle="Mandatory supervisor verification queue. Inspect technician repair work, photo evidence, and parts logs before formal ticket resolution."
        breadcrumbs={[{ label: 'Completion Review Queue' }]}
        onRefresh={loadReviews}
        refreshing={loading}
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-8">
          <EmptyState 
            icon={FileCheck2}
            title="No completion reviews awaiting approval"
            description="When technicians submit completed physical repairs with photo evidence, tickets appear here for supervisor sign-off."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((rev) => {
            const activeAssign = rev.complaint_assignments?.find(a => a.is_current);
            const repairLog = rev.repair_records?.[0];

            return (
              <div 
                key={rev.id}
                className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs hover:border-amber-400 transition space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded">
                      {rev.complaint_number}
                    </span>
                    <PriorityBadge priority={rev.priority} />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Awaiting Supervisor Sign-Off
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-medium">
                    Submitted: {new Date(rev.updated_at).toLocaleString()}
                  </div>
                </div>

                {/* Main Content Split: Complaint Issue vs Technician Repair Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left: Original Reported Problem */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      1. Original Reported Problem
                    </span>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                      <h4 className="text-sm font-bold text-stone-900">{rev.title}</h4>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.description}</p>
                      
                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-500">
                        <span>Reporter: {rev.reporter?.full_name || 'Campus User'}</span>
                        <span className="font-mono">{rev.equipment?.equipment_name}</span>
                      </div>
                    </div>

                    {rev.photo_url && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase">Initial Issue Photo</span>
                        <div className="rounded-xl overflow-hidden border border-stone-200 max-h-48">
                          <img src={rev.photo_url} alt="Initial problem" className="w-full h-44 object-cover" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Technician Work Submission */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      2. Technician Repair Submission
                    </span>
                    <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900">
                          {activeAssign?.technician?.full_name || 'Staff Technician'}
                        </span>
                        <span className="text-stone-500 font-mono text-[11px]">
                          {activeAssign?.technician?.email}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-stone-500 uppercase block">Work Notes</span>
                        <p className="text-xs text-stone-800 leading-relaxed mt-0.5 font-medium">
                          {rev.completion_notes || repairLog?.repair_summary || 'Work completed per standard protocol.'}
                        </p>
                      </div>

                      {repairLog && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/50 text-[11px]">
                          <div>
                            <span className="text-stone-400">Parts Used:</span>
                            <p className="font-semibold text-stone-800">{repairLog.parts_replaced || 'None recorded'}</p>
                          </div>
                          <div>
                            <span className="text-stone-400">Labor Hours:</span>
                            <p className="font-semibold text-stone-800">{repairLog.labor_hours || '0.0'} hrs</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {(rev.completion_photo_url || rev.completion_evidence_url || repairLog?.repair_photo_url) && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-amber-700 uppercase">
                          Completion Photo Proof
                        </span>
                        <div className="rounded-xl overflow-hidden border border-amber-200 max-h-48">
                          <img 
                            src={rev.completion_photo_url || rev.completion_evidence_url || repairLog?.repair_photo_url} 
                            alt="Repair Proof" 
                            className="w-full h-44 object-cover" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Supervisor Review Decision Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      {rev.equipment?.rooms?.buildings?.building_name || 'SRM Campus'} — Room {rev.equipment?.rooms?.room_number || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openDecisionModal(rev, 'return_for_rework')}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Return for Rework
                    </button>
                    <button
                      onClick={() => openDecisionModal(rev, 'approve')}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-2xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve & Resolve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Dialog Modal */}
      {decisionModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${decisionType === 'approve' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                  {decisionType === 'approve' ? 'Verify & Approve Completion' : 'Return Work for Rework'}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  Ticket #{selectedReview.complaint_number}
                </h3>
              </div>
              <button 
                onClick={() => setDecisionModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              {decisionType === 'return_for_rework' ? (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Mandatory Rework Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                    placeholder="Specify exactly why the repair is rejected (e.g. Loose wiring exposed, projector color uncalibrated, missing completion photo)..."
                    rows={3}
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder-stone-400"
                  />
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-emerald-900 leading-relaxed">
                  Approving this work order will transition complaint <span className="font-mono font-bold">#{selectedReview.complaint_number}</span> to <span className="font-bold">Resolved</span>, verify the physical repair record in the database, and notify the reporting campus user.
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Supervisor Audit Comment (Optional)
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Additional supervisor note for audit trail..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`px-5 py-2 font-semibold text-white rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center gap-1.5 ${decisionType === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'}`}
                >
                  {actionSubmitting ? 'Recording...' : decisionType === 'approve' ? 'Confirm Approval' : 'Send Back for Rework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
