import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Wrench, 
  AlertTriangle, 
  Search, 
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SupervisorHeader } from '../../components/supervisor/SupervisorHeader';
import { EmptyState } from '../../components/EmptyState';
import { apiRequest } from '../../lib/api';

export function SupervisorLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBuilding, setExpandedBuilding] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLocations = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/supervisor/locations');
      setLocations(res.data || []);
      if (res.data && res.data.length > 0) {
        setExpandedBuilding(res.data[0].id);
      }
    } catch (err) {
      console.error('[SUPERVISOR_LOCATIONS_ERROR]', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const filteredLocations = locations.filter(b => 
    b.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.buildingCode && b.buildingCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <SupervisorHeader 
        title="Buildings & Classroom Monitoring"
        subtitle="Institutional campus facilities directory. Live inspection of SRMIST classroom blocks, equipment counts, and open maintenance tickets."
        breadcrumbs={[{ label: 'Campus Locations' }]}
        onRefresh={loadLocations}
        refreshing={loading}
      />

      {/* Search Input */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search campus building or code..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-stone-500 font-medium">
          {locations.length} Academic Blocks Registered
        </span>
      </div>

      {/* Buildings List with Classrooms Accordion */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-8">
          <EmptyState 
            icon={Building2}
            title="No buildings registered"
            description="Verified campus facilities will appear here with classroom and laboratory monitoring."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLocations.map((b) => {
            const isExpanded = expandedBuilding === b.id;

            return (
              <div 
                key={b.id}
                className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-2xs transition"
              >
                {/* Building Header / Summary */}
                <div 
                  onClick={() => setExpandedBuilding(isExpanded ? null : b.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        {b.buildingName}
                        {b.buildingCode && (
                          <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-normal">
                            {b.buildingCode}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {b.totalRooms} Rooms / Labs • {b.totalEquipment} Equipment Assets
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="flex items-center gap-3 text-right text-xs">
                      <div>
                        <span className={`font-bold ${b.openComplaints > 0 ? 'text-amber-700' : 'text-stone-800'}`}>
                          {b.openComplaints}
                        </span>
                        <p className="text-[10px] text-stone-400 uppercase">Open</p>
                      </div>
                      <div>
                        <span className={`font-bold ${b.urgentComplaints > 0 ? 'text-rose-700' : 'text-stone-400'}`}>
                          {b.urgentComplaints}
                        </span>
                        <p className="text-[10px] text-stone-400 uppercase">Urgent</p>
                      </div>
                    </div>
                    <button className="p-1.5 text-stone-400 rounded-lg hover:bg-stone-100 transition">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Rooms Grid (Expanded) */}
                {isExpanded && (
                  <div className="p-5 bg-stone-50/50 border-t border-stone-100">
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                      Classrooms, Lecture Halls & Labs
                    </div>

                    {!b.rooms || b.rooms.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-2">No individual rooms mapped in this building.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {b.rooms.map((room) => (
                          <div 
                            key={room.id}
                            className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-2xs space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-900">
                                Room {room.roomNumber}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                Floor {room.floorNumber}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 border-t border-stone-100">
                              <span>{room.equipmentCount} Assets</span>
                              <span className={room.openComplaints > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}>
                                {room.openComplaints > 0 ? `${room.openComplaints} Open Issues` : 'No issues'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
