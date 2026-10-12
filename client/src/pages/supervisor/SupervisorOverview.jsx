import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  UserCheck,
  AlertOctagon,
  Calendar,
  Filter,
  BarChart3,
  Layers,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import { EmptyState } from '../../components/EmptyState';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { apiRequest } from '../../lib/api';

export function SupervisorOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('30d');

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest('/supervisor/overview');
      setData(res.data);
    } catch (err) {
      console.error('[SUPERVISOR_OVERVIEW_ERROR]', err);
      setData({
        metrics: {
          totalComplaints: 0,
          newComplaints: 0,
          unassignedComplaints: 0,
          assignedComplaints: 0,
          inProgressComplaints: 0,
          completionPending: 0,
          resolvedComplaints: 0,
          reopenedComplaints: 0,
          urgentComplaints: 0,
          overdueComplaints: 0,
          avgResolutionHours: 0,
          resolutionRate: 0,
          reopenedRate: 0
        },
        priorityDistribution: {},
        statusDistribution: {},
        monthlyTrends: [],
        recentCriticalIncidents: [],
        recentSupervisorActions: [],
        technicianWorkloadSummary: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = data?.metrics || {
    totalComplaints: 0,
    newComplaints: 0,
    unassignedComplaints: 0,
    assignedComplaints: 0,
    inProgressComplaints: 0,
    completionPending: 0,
    resolvedComplaints: 0,
    reopenedComplaints: 0,
    urgentComplaints: 0,
    overdueComplaints: 0,
    avgResolutionHours: 0,
    resolutionRate: 0,
    reopenedRate: 0
  };

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Campus Maintenance Operations"
        subtitle="Real-time institutional oversight of SRMIST physical infrastructure, repair workflows, SLA adherence, and staff workloads."
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last Quarter</option>
              <option value="all">All Academic Year</option>
            </select>
            <Link
              to="/supervisor/analytics"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition shadow-2xs"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Reports
            </Link>
          </div>
        }
      />

      {/* Primary KPI Grid — All Cards Navigate to Filtered Views on Click */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div 
          onClick={() => navigate('/supervisor/complaints')}
          className="cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <StatCard 
            title="Total Reported"
            value={metrics.totalComplaints}
            icon={Layers}
            description="All campus tickets"
          />
        </div>

        <div 
          onClick={() => navigate('/supervisor/complaints?status=pending')}
          className="cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <StatCard 
            title="Unassigned / New"
            value={metrics.newComplaints}
            icon={Clock}
            description="Awaiting staff dispatch"
            alert={metrics.newComplaints > 5}
          />
        </div>

        <div 
          onClick={() => navigate('/supervisor/escalations')}
          className="cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <StatCard 
            title="Urgent Escalations"
            value={metrics.urgentComplaints}
            icon={AlertOctagon}
            description="High-priority SLA risks"
            alert={metrics.urgentComplaints > 0}
          />
        </div>

        <div 
          onClick={() => navigate('/supervisor/completion-review')}
          className="cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <StatCard 
            title="Awaiting Review"
            value={metrics.completionPending}
            icon={FileCheck2}
            description="Technician sign-offs"
            alert={metrics.completionPending > 0}
          />
        </div>

        <div 
          onClick={() => navigate('/supervisor/complaints?status=resolved')}
          className="cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <StatCard 
            title="Resolved Tickets"
            value={metrics.resolvedComplaints}
            icon={CheckCircle2}
            trend={`${metrics.resolutionRate}% rate`}
            description="Verified maintenance"
          />
        </div>

        <div 
          onClick={() => navigate('/supervisor/complaints?status=reopened')}
          className="cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <StatCard 
            title="Reopened Cases"
            value={metrics.reopenedComplaints}
            icon={RotateCcw}
            description="Repeat breakdown flag"
            alert={metrics.reopenedComplaints > 0}
          />
        </div>
      </div>

      {/* Secondary Operational Indicators Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Avg Resolution Time</p>
            <p className="text-xl font-bold text-stone-900 mt-1">
              {metrics.avgResolutionHours > 0 ? `${metrics.avgResolutionHours} hrs` : 'N/A'}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">From submission to supervisor verification</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-semibold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Overdue Complaints</p>
            <p className="text-xl font-bold text-stone-900 mt-1">
              {metrics.overdueComplaints}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Exceeded target completion deadline</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${metrics.overdueComplaints > 0 ? 'bg-rose-50 text-rose-700' : 'bg-stone-50 text-stone-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Active In-Progress</p>
            <p className="text-xl font-bold text-stone-900 mt-1">
              {metrics.inProgressComplaints}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Under active technician repair</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center font-semibold">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Split: Critical Incidents Queue & Technician Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Critical Incidents Requiring Supervision */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Critical Incidents & Escalation Queue
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Urgent priority tickets, overdue jobs, and complaints requiring supervisor intervention.
              </p>
            </div>
            <Link 
              to="/supervisor/escalations"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition"
            >
              View Escalations ({metrics.urgentComplaints})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.recentCriticalIncidents || data.recentCriticalIncidents.length === 0 ? (
            <EmptyState 
              icon={CheckCircle2}
              title="No critical incidents"
              description="All reported campus equipment issues are progressing within standard operational targets."
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {data.recentCriticalIncidents.map((c) => (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 rounded-xl px-2.5 transition">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                        {c.complaint_number}
                      </span>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm font-semibold text-stone-900 truncate">
                      {c.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {c.equipment?.rooms?.buildings?.building_name || 'SRM Campus'} - Room {c.equipment?.rooms?.room_number || 'General'}
                      </span>
                      <span>•</span>
                      <span>{c.equipment?.equipment_name || 'Asset'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      to={`/supervisor/complaints?search=${encodeURIComponent(c.complaint_number)}`}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                    >
                      Inspect
                    </Link>
                    <Link
                      to="/supervisor/escalations"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition shadow-2xs"
                    >
                      Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Technician Workload & Distribution */}
        <div className="space-y-6">
          
          {/* Workload Card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-stone-700" />
                Staff Workload Summary
              </h2>
              <Link 
                to="/supervisor/team-performance"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition"
              >
                Team View
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !data?.technicianWorkloadSummary || data.technicianWorkloadSummary.length === 0 ? (
              <EmptyState 
                icon={UserCheck}
                title="No active staff assignments"
                description="Staff assignments will appear as technicians are dispatched to campus work orders."
              />
            ) : (
              <div className="space-y-3">
                {data.technicianWorkloadSummary.slice(0, 5).map((tech) => (
                  <div key={tech.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{tech.name}</p>
                      <p className="text-[11px] text-stone-500 truncate max-w-[150px]">{tech.email}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-xs font-bold text-amber-700">{tech.activeJobs}</span>
                        <p className="text-[10px] text-stone-400 uppercase">Active</p>
                      </div>
                      <div className="border-l border-stone-200 pl-3">
                        <span className="text-xs font-bold text-emerald-700">{tech.completedJobs}</span>
                        <p className="text-[10px] text-stone-400 uppercase">Resolved</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              SRMIST Supervisor Quick Actions
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Maintain institutional compliance, verify completed electrical/HVAC work, and adjust response thresholds.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <Link 
                to="/supervisor/completion-review"
                className="p-2.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-center font-medium transition"
              >
                Review Work Orders
              </Link>
              <Link 
                to="/supervisor/policies"
                className="p-2.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-center font-medium transition"
              >
                Configure SLAs
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
