import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, Send, AlertTriangle, ShieldAlert, Camera } from 'lucide-react';
import { apiRequest } from '../lib/api';

export function ReportProblem() {
  const navigate = useNavigate();
  const [equipmentId, setEquipmentId] = useState('90000001-0000-4000-8000-000000000001');
  const [category, setCategory] = useState('Electrical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const sampleEquipments = [
    { id: '90000001-0000-4000-8000-000000000001', name: 'Ceiling Fan Front-Left (SEC LH-101)' },
    { id: '90000002-0000-4000-8000-000000000002', name: 'Overhead 4K Projector (SEC LH-101)' },
    { id: '90000003-0000-4000-8000-000000000003', name: 'Air Conditioner Split 2-Ton (RCC LAB-1)' },
    { id: '90000004-0000-4000-8000-000000000004', name: 'Main Power Switchboard 16A (RCC LAB-1)' },
    { id: '90000005-0000-4000-8000-000000000005', name: 'LED Panel Light Center (CUL READING-2A)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: equipmentId,
          category,
          title,
          description,
          priority,
          photo_url: photoUrl
        })
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Manual Equipment Ticket
          </span>
          <h1 className="text-xl font-bold text-stone-900 mt-2">Lodge Campus Maintenance Complaint</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Report broken infrastructure, safety hazards, or equipment malfunctions
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Select Campus Equipment
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
            >
              {sampleEquipments.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              Tip: You can also scan the QR code sticker directly on the machine with your phone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
              >
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC / Air Conditioning</option>
                <option value="Lighting">Lighting</option>
                <option value="Electronics">Electronics / AV</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Priority / Urgency</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
              >
                <option value="low">Low (Minor / Cosmetic)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Hindering Lecture/Lab)</option>
                <option value="urgent">Urgent (Safety / Live Voltage)</option>
              </select>
            </div>
          </div>

          {priority === 'urgent' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                <strong>Urgent Hazard:</strong> If this problem involves sparking, burning, or structural collapse, alert lab assistants or security immediately.
              </p>
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Issue Subject</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Switch sparking when toggled"
              className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Detailed Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of what occurred..."
              className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Photo Reference URL (Optional)</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/damage.jpg"
              className="w-full p-2.5 border border-stone-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Maintenance Complaint'}</span>
          </button>
        </form>
      </div>

    </div>
  );
}
