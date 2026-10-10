import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  Camera, 
  Send,
  Calendar,
  Check
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { apiRequest } from '../lib/api';

export function MaintenanceDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Resolution form state
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchAssignedTasks = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/complaints/mine'); // Or technician assignments
      setTasks(res.data || []);
    } catch {
      // Mock demonstration tasks
      setTasks([
        {
          id: 'task-1',
          complaint_number: 'CMP-202610-1049',
          title: 'AC unit blowing ambient air without cooling',
          description: 'Compressor not engaging. Filter was checked and is clean.',
          category: 'HVAC',
          priority: 'urgent',
          status: 'in_progress',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          equipment: {
            equipment_name: 'Air Conditioner Split 2-Ton',
            asset_code: 'RCC-LAB1-AC-01',
            rooms: {
              room_number: 'LAB-1',
              buildings: { building_name: 'Ramanujan Computing Center' }
            }
          }
        },
        {
          id: 'task-2',
          complaint_number: 'CMP-202610-1052',
          title: 'Main Power Switchboard 16A socket burnt',
          description: 'Heavy scorch mark near plug socket 3. Smell of melted plastic.',
          category: 'Electrical',
          priority: 'urgent',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          equipment: {
            equipment_name: 'Main Power Switchboard 16A',
            asset_code: 'RCC-LAB1-SWB-01',
            rooms: {
              room_number: 'LAB-1',
              buildings: { building_name: 'Ramanujan Computing Center' }
            }
          }
        },
        {
          id: 'task-3',
          complaint_number: 'CMP-202610-0988',
          title: 'LED Panel Light Center flickering',
          description: 'Driver unit buzzing and light strobe effect.',
          category: 'Lighting',
          priority: 'low',
          status: 'resolved',
          created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
          resolved_at: new Date(Date.now() - 3600000 * 10).toISOString(),
          resolution_notes: 'Replaced faulty constant current LED driver with genuine Philips 36W ballast.',
          equipment: {
            equipment_name: 'LED Panel Light Center',
            asset_code: 'CUL-RD2A-LGT-01',
            rooms: {
              room_number: 'READING-2A',
              buildings: { building_name: 'Central University Library' }
            }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, []);

  const totalAssigned = tasks.length;
  const pendingWork = tasks.filter(t => t.status === 'pending').length;
  const inProgressWork = tasks.filter(t => t.status === 'in_progress').length;
  const urgentWork = tasks.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await apiRequest(`/complaints/${selectedTask.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || (newStatus === 'in_progress' ? 'Technician started maintenance' : 'Repair work completed'),
          resolution_notes: newStatus === 'resolved' ? resolutionNotes : undefined,
          completion_photo_url: completionPhotoUrl || undefined
        })
      });
      setSuccessMessage(`Work order updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedTask(null);
      setResolutionNotes('');
      setStatusNote('');
      setCompletionPhotoUrl('');
      fetchAssignedTasks();
    } catch (err) {
      alert(err.message || 'Failed to update work order');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">Maintenance Work Orders</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Campus maintenance tasks assigned to your technician team
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Jobs" value={totalAssigned} icon={Wrench} />
        <StatCard title="Urgent Safety Issues" value={urgentWork} icon={AlertTriangle} alert={urgentWork > 0} />
        <StatCard title="In Progress" value={inProgressWork} icon={Clock} />
        <StatCard title="Pending Pickup" value={pendingWork} icon={CheckCircle2} />
      </div>

      {/* Work Orders List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-900">Active Work Order Queue</span>
          <span className="text-[11px] text-stone-500">{tasks.length} total tasks</span>
        </div>

        <div className="divide-y divide-stone-100">
          {tasks.map((task) => {
            const eq = task.equipment;
            const rm = eq?.rooms || eq?.room;
            const bg = rm?.buildings || rm?.building;

            return (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-5 hover:bg-stone-50/80 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                      {task.complaint_number}
                    </span>
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>

                  <h3 className="text-sm font-bold text-stone-900">{task.title}</h3>
                  <p className="text-xs text-stone-600 line-clamp-1">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                    <span className="font-semibold text-stone-800">{eq?.equipment_name}</span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>{bg?.building_name}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>Room {rm?.room_number}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
                  >
                    Manage Work
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technician Work Order Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <span className="text-[10px] font-mono text-stone-500">{selectedTask.complaint_number}</span>
                <h3 className="text-sm font-bold text-stone-900">{selectedTask.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-semibold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTask.status} />
                <PriorityBadge priority={selectedTask.priority} />
                <span className="text-stone-500">Asset: {selectedTask.equipment?.asset_code}</span>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/60 space-y-1">
                <p className="font-semibold text-stone-800">Reported Problem Description</p>
                <p className="text-stone-600">{selectedTask.description}</p>
              </div>

              {/* State Transitions */}
              {selectedTask.status === 'pending' && (
                <div className="pt-2 space-y-2">
                  <p className="font-semibold text-stone-800">Action: Accept & Begin Repair</p>
                  <p className="text-stone-500 text-[11px]">
                    Confirm that you are moving to the site to inspect this equipment.
                  </p>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-sm transition"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>{actionLoading ? 'Updating...' : 'Start Job (In Progress)'}</span>
                  </button>
                </div>
              )}

              {selectedTask.status === 'in_progress' && (
                <div className="pt-2 space-y-3">
                  <p className="font-semibold text-stone-900">Record Job Completion & Repair Details</p>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Repair Notes / Parts Replaced
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="e.g. Replaced 2.5uF capacitor, cleaned copper terminals, tested on full speed."
                      className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Completion Photo Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={completionPhotoUrl}
                      onChange={(e) => setCompletionPhotoUrl(e.target.value)}
                      placeholder="https://images.example.com/repair-verified.jpg"
                      className="w-full p-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading || !resolutionNotes.trim()}
                    onClick={() => handleUpdateStatus('resolved')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionLoading ? 'Saving...' : 'Mark Complaint Resolved'}</span>
                  </button>
                </div>
              )}

              {selectedTask.status === 'resolved' && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Repair Completed</span>
                  </p>
                  <p className="text-[11px]">{selectedTask.resolution_notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
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
