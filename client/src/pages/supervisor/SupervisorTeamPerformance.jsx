import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Filter, 
  Search, 
  TrendingUp, 
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorTeamPerformance() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/team-performance');
      setTeam(res.data || []);
    } catch (err) {
      console.error('[SUPERVISOR_TEAM_ERROR]', err);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const filteredTeam = team.filter(tech => {
    const matchesSearch = tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tech.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalActiveJobs = team.reduce((acc, t) => acc + t.activeJobs, 0);
  const totalCompleted = team.reduce((acc, t) => acc + t.completedJobs, 0);
  const totalOverdue = team.reduce((acc, t) => acc + t.overdueJobs, 0);

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Technician Workload & Performance"
        subtitle="Operational metrics for campus maintenance technicians, active workloads, resolution times, and fair allocation."
        breadcrumbs={[{ label: 'Team Performance' }]}
        onRefresh={loadTeam}
        refreshing={loading}
      />

      {/* Aggregate Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Field Technicians</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{team.length}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Assigned to SRMIST maintenance</p>
        </div>
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Active Repairs</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{totalActiveJobs}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Assigned & in-progress tickets</p>
        </div>
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Verified Completions</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{totalCompleted}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Resolved campus jobs</p>
        </div>
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Overdue Tasks</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{totalOverdue}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Exceeding SLA completion window</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter technicians by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="text-xs text-stone-500 font-medium">
          Showing {filteredTeam.length} technician records
        </div>
      </div>

      {/* Team Roster Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-8">
          <EmptyState 
            icon={Users}
            title="No technician records found"
            description="Technicians with authorized campus maintenance accounts will appear here with live workload tracking."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeam.map((tech) => (
            <div 
              key={tech.id} 
              className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{tech.fullName}</h3>
                  <p className="text-xs text-stone-500 truncate max-w-[200px]">{tech.email}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tech.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                  {tech.isActive ? 'Active Duty' : 'Inactive'}
                </span>
              </div>

              {/* Workload Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-stone-600 mb-1">
                  <span>Current Workload</span>
                  <span>{tech.activeJobs} Active Jobs</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${tech.activeJobs > 5 ? 'bg-rose-500' : tech.activeJobs > 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (tech.activeJobs / 8) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl text-center text-xs">
                <div>
                  <span className="block text-stone-400 text-[10px] uppercase font-semibold">In Progress</span>
                  <span className="font-bold text-stone-800 text-sm">{tech.inProgressJobs}</span>
                </div>
                <div>
                  <span className="block text-stone-400 text-[10px] uppercase font-semibold">Resolved</span>
                  <span className="font-bold text-emerald-700 text-sm">{tech.completedJobs}</span>
                </div>
                <div>
                  <span className="block text-stone-400 text-[10px] uppercase font-semibold">Overdue</span>
                  <span className="font-bold text-rose-700 text-sm">{tech.overdueJobs}</span>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  Avg Resolution:
                </span>
                <span className="font-semibold text-stone-800">
                  {tech.avgResolutionHours > 0 ? `${tech.avgResolutionHours} hrs` : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
