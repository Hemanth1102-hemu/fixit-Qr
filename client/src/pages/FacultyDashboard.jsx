import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Search, 
  Building2, 
  MapPin, 
  Calendar,
  BookOpen,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function FacultyDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [classroomAllocation, setClassroomAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [compRes, classRes] = await Promise.all([
          apiRequest('/complaints/mine').catch(() => ({ data: [] })),
          apiRequest('/classroom/my-allocation').catch(() => ({ data: null }))
        ]);
        setComplaints(compRes.data || []);
        if (classRes?.data) {
          setClassroomAllocation(classRes.data);
        }
      } catch {
        // Fallback for preview
        setComplaints([
          {
            id: 'cmp-fac-1',
            complaint_number: 'CMP-202610-5011',
            title: 'Digital Podium Touchscreen Unresponsive in Lecture Hall',
            status: 'in_progress',
            priority: 'high',
            category: 'Electronics',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            equipment: {
              equipment_name: 'Overhead 4K Projector & Smart Screen',
              asset_code: 'UB-201-AV-01',
              rooms: {
                room_number: 'UB-201',
                buildings: { building_name: 'University Building (UB)' }
              }
            }
          }
        ]);
        setClassroomAllocation({
          has_active_allocation: true,
          institutional_record: {
            department: 'Electronics & Communication',
            reg_or_emp_no: 'EMP-SRM-4491',
            section: 'Associate Professor / PG Lab'
          },
          current_room: {
            building_name: 'University Building (UB)',
            building_code: 'UB',
            floor_number: 2,
            room_number: 'UB-201',
            session_type: 'Laboratory Session'
          }
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const total = complaints.length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const pending = complaints.filter(c => ['pending', 'submitted', 'under_review'].includes(c.status)).length;

  const filtered = complaints.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaint_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            SRMIST Faculty Portal
          </span>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 mt-1">Faculty Maintenance Workspace</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Priority infrastructure reporting for lecture theaters, seminar rooms, and research laboratories
          </p>
        </div>
        <Link
          to="/student/report"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Laboratory or Classroom Issue</span>
        </Link>
      </div>

      {/* Classroom Allocation */}
      {classroomAllocation?.has_active_allocation && (
        <div className="bg-gradient-to-r from-amber-50/70 via-stone-50 to-white border border-amber-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Assigned Teaching Room / Research Lab
              </h3>
            </div>
            <span className="text-[11px] text-amber-800 font-medium bg-amber-100/60 px-2 py-0.5 rounded">
              {classroomAllocation.institutional_record?.department}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>{classroomAllocation.current_room?.building_name}</span>
                <span className="text-stone-400">•</span>
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Room {classroomAllocation.current_room?.room_number}</span>
              </div>
              <p className="text-xs text-stone-500">
                Session: <strong className="text-stone-700">{classroomAllocation.current_room?.session_type}</strong> (Emp ID: {classroomAllocation.institutional_record?.reg_or_emp_no})
              </p>
            </div>

            <Link
              to="/student/report"
              state={{ prefillRoom: classroomAllocation.current_room }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue in {classroomAllocation.current_room?.room_number}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reported" value={total} icon={ClipboardList} />
        <StatCard title="Under Review" value={pending} icon={Clock} />
        <StatCard title="In Progress" value={inProgress} icon={AlertCircle} />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle2} />
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 bg-white text-stone-800"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="divide-y divide-stone-100">
          {filtered.map((c) => (
            <div key={c.id} className="p-5 hover:bg-stone-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                    {c.complaint_number}
                  </span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <h3 className="text-sm font-bold text-stone-900">{c.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span>Room {c.equipment?.rooms?.room_number || 'General'}</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
