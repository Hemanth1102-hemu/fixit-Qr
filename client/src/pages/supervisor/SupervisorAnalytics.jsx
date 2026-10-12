import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Layers, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/analytics');
      setData(res.data);
    } catch (err) {
      console.error('[SUPERVISOR_ANALYTICS_ERROR]', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch full complaints dataset for export
      const res = await apiRequest('/supervisor/complaints?limit=100');
      const items = res.data || [];

      if (items.length === 0) {
        alert('No complaint records available to export.');
        return;
      }

      // Generate CSV Content
      const headers = ['Complaint Number', 'Title', 'Category', 'Priority', 'Status', 'Building', 'Room', 'Created Date', 'Resolved Date'];
      const rows = items.map(c => [
        `"${c.complaint_number || ''}"`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.category || ''}"`,
        `"${c.priority || ''}"`,
        `"${c.status || ''}"`,
        `"${c.equipment?.rooms?.buildings?.building_name || ''}"`,
        `"${c.equipment?.rooms?.room_number || ''}"`,
        `"${c.created_at ? new Date(c.created_at).toISOString() : ''}"`,
        `"${c.resolved_at ? new Date(c.resolved_at).toISOString() : ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `fixit_qr_maintenance_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to generate CSV export');
    } finally {
      setExporting(false);
    }
  };

  const kpis = data?.kpiSummary || {
    totalComplaints: 0,
    resolutionRate: 0,
    avgRepairHours: 0,
    overdueRate: 0,
    reopenedRate: 0
  };

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Maintenance Analytics & Reports"
        subtitle="Institutional operations intelligence. Breakdown of campus equipment reliability, category distributions, and SLA resolution velocity."
        breadcrumbs={[{ label: 'Analytics & Reports' }]}
        onRefresh={loadAnalytics}
        refreshing={loading}
        actions={
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export CSV Report'}
          </button>
        }
      />

      {/* KPI Headline Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Volume</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{kpis.totalComplaints}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Complaints logged</p>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Resolution Rate</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{kpis.resolutionRate}%</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Verified completions</p>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Avg Resolution</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{kpis.avgRepairHours}h</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Mean time to repair</p>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Overdue Rate</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{kpis.overdueRate}%</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Exceeded target SLA</p>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Repeat Failures</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{kpis.reopenedRate}%</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Reopened rate</p>
        </div>
      </div>

      {/* Main Aggregations: Categories & Buildings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown Table */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              Complaints by Maintenance Category
            </h3>
            <span className="text-xs text-stone-400">SRMIST Distribution</span>
          </div>

          {!data?.categoryBreakdown || data.categoryBreakdown.length === 0 ? (
            <EmptyState 
              icon={Layers}
              title="No category metrics recorded"
              description="Category distributions will populate as campus tickets are submitted."
            />
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-stone-700">
                    <span className="capitalize">{item.category}</span>
                    <span>{item.count} tickets ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Building Breakdown Table */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stone-700" />
              Building Workload & Resolution Health
            </h3>
            <span className="text-xs text-stone-400">Campus Facilities</span>
          </div>

          {!data?.buildingBreakdown || data.buildingBreakdown.length === 0 ? (
            <EmptyState 
              icon={Building2}
              title="No building data recorded"
              description="Campus locations with active work tickets will appear in this breakdown."
            />
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {data.buildingBreakdown.map((b, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-800">{b.building}</p>
                    <p className="text-[11px] text-stone-400">{b.total} Total Complaints</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-bold text-amber-700">{b.open}</span>
                      <p className="text-[10px] text-stone-400 uppercase">Open</p>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">{b.resolved}</span>
                      <p className="text-[10px] text-stone-400 uppercase">Resolved</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
