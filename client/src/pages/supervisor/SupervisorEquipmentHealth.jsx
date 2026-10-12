import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Wrench, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorEquipmentHealth() {
  const [equipmentHealth, setEquipmentHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/equipment-health');
      setEquipmentHealth(res.data || []);
    } catch (err) {
      console.error('[SUPERVISOR_EQUIPMENT_HEALTH_ERROR]', err);
      setEquipmentHealth([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const filteredList = equipmentHealth.filter(eq => {
    const matchesSearch = eq.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.buildingName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'at_risk') return eq.reliabilityStatus === 'at_risk';
    if (statusFilter === 'maintenance_required') return eq.reliabilityStatus === 'maintenance_required';
    return true;
  });

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Equipment Reliability & Repeat Failures"
        subtitle="Asset lifecycle monitoring. Identify chronic equipment failures, repeat breakdown frequency, and assets requiring major overhaul."
        breadcrumbs={[{ label: 'Equipment Reliability' }]}
        onRefresh={loadHealth}
        refreshing={loading}
      />

      {/* Search and Filters */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search equipment by name, asset code, or building..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-stone-500">Filter Health:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">All Equipment</option>
            <option value="maintenance_required">Active Work Required</option>
            <option value="at_risk">Repeat Breakdown Risk</option>
          </select>
        </div>
      </div>

      {/* Equipment Health Cards/Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-8">
          <EmptyState 
            icon={Activity}
            title="No equipment health records found"
            description="All monitored equipment assets are operating normally without recorded failure clusters."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((eq) => {
            const isAtRisk = eq.reliabilityStatus === 'at_risk';
            const isNeedMaint = eq.reliabilityStatus === 'maintenance_required';

            return (
              <div 
                key={eq.id}
                className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      {eq.assetCode}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 mt-1">{eq.equipmentName}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {eq.buildingName} - Room {eq.roomNumber}
                    </p>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isNeedMaint ? 'bg-rose-50 text-rose-800 border border-rose-200' : isAtRisk ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                    {isNeedMaint ? 'Open Tickets' : isAtRisk ? 'Repeat Breakdown' : 'Healthy'}
                  </span>
                </div>

                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="block text-stone-400 text-[10px] uppercase font-semibold">Total Failures</span>
                    <span className="font-bold text-stone-800 text-sm">{eq.totalComplaints}</span>
                  </div>
                  <div>
                    <span className="block text-stone-400 text-[10px] uppercase font-semibold">60-Day Repeat</span>
                    <span className={`font-bold text-sm ${eq.recentFailures60d > 1 ? 'text-amber-700' : 'text-stone-800'}`}>
                      {eq.recentFailures60d}
                    </span>
                  </div>
                  <div>
                    <span className="block text-stone-400 text-[10px] uppercase font-semibold">Open Jobs</span>
                    <span className={`font-bold text-sm ${eq.openComplaints > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {eq.openComplaints}
                    </span>
                  </div>
                </div>

                {/* Mean Time To Failure (MTTF) / Last Repair */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                  <div className="flex justify-between">
                    <span>Mean Time Between Failures:</span>
                    <span className="font-semibold text-stone-800">
                      {eq.mttfDays !== null ? `${eq.mttfDays} days` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Resolution Date:</span>
                    <span className="font-semibold text-stone-800">
                      {eq.lastRepairDate ? new Date(eq.lastRepairDate).toLocaleDateString() : 'None recorded'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
