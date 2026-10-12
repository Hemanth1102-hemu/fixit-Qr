import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileCheck2, 
  RotateCcw, 
  Search,
  Building2,
  MapPin,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { EmptyState } from '../components/EmptyState';
import { apiRequest } from '../lib/api';

export function SupervisorDashboard() {
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [opsRes, revRes] = await Promise.all([
        apiRequest('/supervisor/operations'),
        apiRequest('/supervisor/reviews')
      ]);
      setData(opsRes.data);
      setReviews(revRes.data || []);
    } catch {
      setData({
        metrics: {
          activeComplaints: 0,
          completionReviewsPending: 0,
          urgentEscalations: 0,
          overdueTickets: 0,
          reopenedTickets: 0,
          avgResolutionHours: 0
        },
        urgentEscalations: []
      });
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewDecision = async (decision) => {
    if (!selectedReview) return;
    setActionLoading(true);
    try {
      await apiRequest(`/complaints/${selectedReview.id}/supervisor-review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          decision_notes: decisionNotes || (decision === 'approve' ? 'Work verified and approved by supervisor.' : 'Requires rework.')
        })
      });
      setNotice(decision === 'approve' ? 'Complaint approved and closed as Resolved.' : 'Returned to technician for rework.');
      setTimeout(() => setNotice(''), 3000);
      setSelectedReview(null);
      setDecisionNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Review failed');
    } finally {
      setActionLoading(false);
    }
  };

  const metrics = data?.metrics || {
    activeComplaints: 0,
    completionReviewsPending: 0,
    urgentEscalations: 0,
    overdueTickets: 0,
    reopenedTickets: 0,
    avgResolutionHours: 0
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Executive Operations
        </span>
        <h1 className="text-xl font-bold tracking-tight text-stone-900 mt-1">Supervisor Control Center</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Campus-wide maintenance oversight, repair completion quality audits, and operational SLA tracking
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Active Tickets" value={metrics.activeComplaints} icon={TrendingUp} />
        <StatCard title="Completion Reviews" value={metrics.completionReviewsPending} icon={FileCheck2} alert={metrics.completionReviewsPending > 0} />
        <StatCard title="Urgent Escalations" value={metrics.urgentEscalations} icon={AlertTriangle} alert={metrics.urgentEscalations > 0} />
        <StatCard title="Reopened Issues" value={metrics.reopenedTickets} icon={RotateCcw} alert={metrics.reopenedTickets > 0} />
        <StatCard title="Overdue Work" value={metrics.overdueTickets} icon={Clock} />
        <StatCard title="Avg Turnaround" value={`${metrics.avgResolutionHours}h`} icon={Clock} />
      </div>

      {/* Pending Completion Reviews Section */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Repair Completion Review Queue
            </h3>
            <p className="text-[11px] text-stone-500">
              Audit technician work evidence before final resolution sign-off
            </p>
          </div>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-xs">
            {reviews.length} awaiting review
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={CheckCircle2}
              title="Review queue is clear"
              description="No completed repair tickets currently awaiting supervisor inspection or sign-off."
            />
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {reviews.map((r) => (
              <div key={r.id} className="p-5 hover:bg-stone-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                      {r.complaint_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      Completion Submitted
                    </span>
                    <span className="text-xs font-medium text-stone-600">
                      Asset: {r.equipment?.equipment_name} ({r.equipment?.asset_code})
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900">{r.title}</h4>

                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/80 text-xs text-stone-700">
                    <span className="font-semibold block text-stone-900 mb-0.5">Technician Repair Notes:</span>
                    <span>{r.completion_notes}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(r)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Audit & Review Work</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Urgent Escalations Panel */}
      {data?.urgentEscalations && data.urgentEscalations.length > 0 && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Urgent Safety Escalations Requiring Immediate Action
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {data.urgentEscalations.map((esc) => (
              <div key={esc.id} className="bg-white p-4 rounded-xl border border-rose-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-rose-800">{esc.complaint_number}</span>
                  <PriorityBadge priority="urgent" />
                </div>
                <h4 className="font-bold text-stone-900">{esc.title}</h4>
                <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                  <span>{esc.building}</span>
                  <span>Room {esc.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supervisor Audit Decision Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Quality Audit & Sign-off</h3>
                <p className="text-xs font-mono text-stone-500">{selectedReview.complaint_number}</p>
              </div>
              <button onClick={() => setSelectedReview(null)} className="text-stone-400">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-stone-700">Problem Subject:</span>
                <p className="text-stone-900 font-medium mt-0.5">{selectedReview.title}</p>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/80">
                <span className="font-semibold text-stone-800 block mb-1">Technician Repair Notes:</span>
                <p className="text-stone-700">{selectedReview.completion_notes}</p>
              </div>

              {selectedReview.completion_evidence_url && (
                <div>
                  <span className="font-semibold text-stone-700 block mb-1">Photo Evidence Link:</span>
                  <a 
                    href={selectedReview.completion_evidence_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-amber-700 underline break-all"
                  >
                    {selectedReview.completion_evidence_url}
                  </a>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Supervisor Audit Decision Notes
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter audit confirmation or reason for rework..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewDecision('return_for_rework')}
                  className="px-4 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  Return for Rework
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewDecision('approve')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                >
                  Approve Completion (Resolve)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
