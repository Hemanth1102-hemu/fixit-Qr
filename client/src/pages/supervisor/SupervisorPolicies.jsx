import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Bell, 
  Save,
  RotateCcw
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { apiRequest } from '../../lib/api';

export function SupervisorPolicies() {
  const [policies, setPolicies] = useState({
    policy_name: 'SRMIST Campus Operations Standard',
    response_target_hours: 4.0,
    resolution_target_hours_low: 72.0,
    resolution_target_hours_medium: 48.0,
    resolution_target_hours_high: 24.0,
    resolution_target_hours_urgent: 6.0,
    escalation_threshold_hours: 12.0,
    require_completion_review: true,
    auto_escalate_overdue: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/policies');
      if (res.data) {
        setPolicies(res.data);
      }
    } catch (err) {
      console.error('[SUPERVISOR_POLICIES_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest('/supervisor/policies', {
        method: 'PUT',
        body: JSON.stringify({
          response_target_hours: Number(policies.response_target_hours),
          resolution_target_hours_low: Number(policies.resolution_target_hours_low),
          resolution_target_hours_medium: Number(policies.resolution_target_hours_medium),
          resolution_target_hours_high: Number(policies.resolution_target_hours_high),
          resolution_target_hours_urgent: Number(policies.resolution_target_hours_urgent),
          escalation_threshold_hours: Number(policies.escalation_threshold_hours),
          require_completion_review: Boolean(policies.require_completion_review),
          auto_escalate_overdue: Boolean(policies.auto_escalate_overdue)
        })
      });

      setToastMessage('Campus maintenance policies successfully saved and logged.');
      setTimeout(() => setToastMessage(''), 4000);
      if (res.data) setPolicies(res.data);
    } catch (err) {
      alert(err.message || 'Failed to update policy settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <SupervisorHeader 
        title="Maintenance Policy & SLA Targets"
        subtitle="Configure campus response targets, resolution SLA windows, and mandatory supervisor completion review rules."
        breadcrumbs={[{ label: 'Policy Settings' }]}
        onRefresh={loadPolicies}
        refreshing={loading}
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {toastMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SLA Resolution Targets */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              SLA Resolution Targets (Hours)
            </h3>
            <span className="text-xs text-stone-400">Resolution deadlines by priority</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-rose-800 mb-1">Urgent Priority Target</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.5"
                  min="1"
                  value={policies.resolution_target_hours_urgent}
                  onChange={(e) => setPolicies({ ...policies, resolution_target_hours_urgent: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">hrs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Classroom exam / power cutoff</p>
            </div>

            <div>
              <label className="block font-semibold text-orange-800 mb-1">High Priority Target</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.5"
                  min="1"
                  value={policies.resolution_target_hours_high}
                  onChange={(e) => setPolicies({ ...policies, resolution_target_hours_high: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">hrs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Lab projector / AC breakdown</p>
            </div>

            <div>
              <label className="block font-semibold text-amber-800 mb-1">Medium Priority Target</label>
              <div className="relative">
                <input 
                  type="number"
                  step="1"
                  min="1"
                  value={policies.resolution_target_hours_medium}
                  onChange={(e) => setPolicies({ ...policies, resolution_target_hours_medium: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">hrs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Single fan / switch replacement</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Low Priority Target</label>
              <div className="relative">
                <input 
                  type="number"
                  step="1"
                  min="1"
                  value={policies.resolution_target_hours_low}
                  onChange={(e) => setPolicies({ ...policies, resolution_target_hours_low: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">hrs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Minor aesthetic maintenance</p>
            </div>
          </div>
        </div>

        {/* Triage & Response Policy */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-700" />
              Response Target & Escalation Rules
            </h3>
            <span className="text-xs text-stone-400">Institutional Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">First Response Target (Unassigned to Technician)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={policies.response_target_hours}
                  onChange={(e) => setPolicies({ ...policies, response_target_hours: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">hrs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Maximum time ticket may stay unassigned</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Auto-Escalation Window</label>
              <div className="relative">
                <input 
                  type="number"
                  step="1"
                  min="1"
                  value={policies.escalation_threshold_hours}
                  onChange={(e) => setPolicies({ ...policies, escalation_threshold_hours: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">hrs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Breach threshold triggering supervisor notification</p>
            </div>
          </div>

          {/* Workflow Toggles */}
          <div className="pt-4 border-t border-stone-100 space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={policies.require_completion_review}
                onChange={(e) => setPolicies({ ...policies, require_completion_review: e.target.checked })}
                className="rounded mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-stone-900 block">Require Mandatory Supervisor Completion Review</span>
                <span className="text-stone-500 text-[11px]">
                  When enabled, technician repairs require supervisor review and approval before complaint is marked resolved.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={policies.auto_escalate_overdue}
                onChange={(e) => setPolicies({ ...policies, auto_escalate_overdue: e.target.checked })}
                className="rounded mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-stone-900 block">Auto-Escalate Overdue Complaints</span>
                <span className="text-stone-500 text-[11px]">
                  Tickets exceeding resolution deadline automatically route to Supervisor Escalations queue.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Apply Operational Policies'}
          </button>
        </div>

      </form>
    </div>
  );
}
