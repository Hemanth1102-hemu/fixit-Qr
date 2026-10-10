import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  ShieldAlert, 
  Loader2, 
  Clock,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function QrEquipmentLanding() {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Complaint submission form state
  const [category, setCategory] = useState('Electrical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    async function fetchEquipment() {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest(`/equipment/${qrToken}`);
        setEquipment(res.data);
      } catch (err) {
        setError(err.message || 'Unable to retrieve equipment information for this QR code.');
      } finally {
        setLoading(false);
      }
    }
    fetchEquipment();
  }, [qrToken]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiRequest('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: equipment.id,
          category,
          title,
          description,
          priority,
          photo_url: photoUrl
        })
      });
      setSubmittedTicket(res.data);
    } catch (err) {
      setError(err.message || 'Failed to lodge complaint. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-2" />
        <p className="text-xs font-medium text-stone-500">Verifying equipment QR token...</p>
      </div>
    );
  }

  if (error && !equipment) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-stone-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Equipment Not Found or Inactive</h2>
            <p className="text-xs text-stone-500 mt-1">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Campus Home</span>
          </button>
        </div>
      </div>
    );
  }

  const room = equipment?.room || equipment?.rooms;
  const building = room?.building || room?.buildings;

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Campus Maintenance Portal</span>
        </button>

        {/* Equipment Verified Header Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {equipment.equipment_type}
              </span>
              <h1 className="text-xl font-bold text-stone-900 mt-1.5">{equipment.equipment_name}</h1>
              <p className="text-xs font-mono text-stone-500">Asset Code: {equipment.asset_code}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Asset</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{building?.building_name || 'Main Campus'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Floor {room?.floor_number || 1}, Room {room?.room_number || 'General'}</span>
            </div>
          </div>

          {equipment.description && (
            <p className="text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200/60">
              {equipment.description}
            </p>
          )}

          {/* Open complaints notification */}
          {equipment.openComplaintsCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">
                  {equipment.openComplaintsCount} maintenance ticket(s) currently open for this asset
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Our facilities team is already notified. You may still lodge your report below if experiencing a distinct or worsening problem.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Success Confirmation State */}
        {submittedTicket ? (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Maintenance Request Lodged</h2>
              <p className="text-xs text-stone-500 mt-1">Ticket has been registered and dispatched to facilities team</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 inline-block text-left w-full max-w-sm">
              <div className="flex justify-between text-xs py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Ticket Number:</span>
                <span className="font-mono font-bold text-stone-900">{submittedTicket.complaint_number}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Initial Status:</span>
                <span className="font-semibold text-amber-700">Pending Assignment</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-stone-500">Priority:</span>
                <span className="font-semibold capitalize text-stone-800">{submittedTicket.priority}</span>
              </div>
            </div>
            <div>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Track In My Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Complaint Submission Form */
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-stone-900">Report Equipment Problem</h2>
              <p className="text-xs text-stone-500">Describe the breakdown or safety malfunction</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Problem Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    <option value="Electrical">Electrical (Power, Sparking, Switch)</option>
                    <option value="HVAC">HVAC / Cooling / Ventilation</option>
                    <option value="Lighting">Lighting / Bulb / Tube</option>
                    <option value="Electronics">Electronics / AV / Projector</option>
                    <option value="Plumbing">Plumbing / Leakage</option>
                    <option value="Structural">Structural / Door / Furniture</option>
                    <option value="Other">Other Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    <option value="low">Low (Cosmetic / Minor)</option>
                    <option value="medium">Medium (Standard Failure)</option>
                    <option value="high">High (Impeding Class / Lab)</option>
                    <option value="urgent">Urgent (Safety / Electrical Hazard)</option>
                  </select>
                </div>
              </div>

              {priority === 'urgent' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Critical Hazard Safety Warning:</strong> Never touch exposed live wires or burning switches. Report immediately to campus security or the control room.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Issue Summary
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Motor hums loudly but fan blades not rotating"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about symptoms, intermittent behavior, or room context to help technicians bring right spare parts..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supporting Photo Link (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.example.com/damage-photo.jpg"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Lodging Complaint...' : 'Submit Maintenance Complaint'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
