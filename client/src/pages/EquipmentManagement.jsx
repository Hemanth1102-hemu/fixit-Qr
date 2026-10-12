import React, { useEffect, useState } from 'react';
import { 
  QrCode, 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Printer, 
  CheckCircle2, 
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { QrModal } from '../components/QrModal';
import { EmptyState } from '../components/EmptyState';
import { apiRequest } from '../lib/api';

export function EquipmentManagement() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Registration form state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [equipmentType, setEquipmentType] = useState('Electrical');
  const [description, setDescription] = useState('');
  const [registering, setRegistering] = useState(false);
  
  // QR preview modal
  const [activeQrItem, setActiveQrItem] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [equipRes, bldgRes] = await Promise.all([
        apiRequest('/equipment').catch(() => ({ data: [] })),
        apiRequest('/buildings').catch(() => ({ data: [] }))
      ]);
      setEquipmentList(equipRes.data || []);
      setBuildings(bldgRes.data || []);
    } catch {
      setEquipmentList([]);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterEquipment = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await apiRequest('/equipment', {
        method: 'POST',
        body: JSON.stringify({
          room_id: selectedRoomId,
          equipment_name: equipmentName,
          asset_code: assetCode,
          equipment_type: equipmentType,
          description
        })
      });
      setSuccessMsg('New equipment registered & QR token generated!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setShowRegisterModal(false);
      setEquipmentName('');
      setAssetCode('');
      setDescription('');
      loadData();
      if (res.data) {
        setActiveQrItem(res.data);
      }
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const filtered = equipmentList.filter(eq =>
    eq.equipment_name.toLowerCase().includes(search.toLowerCase()) ||
    eq.asset_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Equipment Inventory & QR Labels</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Register campus electricals, AV gear, and HVAC units with unique unguessable QR tokens
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Equipment</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search asset code or equipment name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <span className="text-xs text-stone-500">{filtered.length} equipment assets</span>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={QrCode}
              title="No campus equipment found"
              description={search ? "No assets match your search filter." : "No equipment records have been registered yet. Add equipment to generate print-ready QR code labels."}
              actionLabel="Register Equipment"
              onAction={() => setShowRegisterModal(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Asset Code</th>
                  <th className="px-4 py-3">Equipment Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">QR Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => {
                  const rm = item.rooms || item.room;
                  const bg = rm?.buildings || rm?.building;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-800 whitespace-nowrap">
                        {item.asset_code}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-stone-900">{item.equipment_name}</p>
                        {item.description && <p className="text-[11px] text-stone-500 line-clamp-1">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                          {item.equipment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-stone-600 whitespace-nowrap">
                        {bg?.building_name || 'Campus'} - Room {rm?.room_number || '101'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${item.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                          {item.is_active ? 'Active' : 'Decommissioned'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveQrItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-700" />
                          <span>View / Print QR</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Preview & Print Modal */}
      {activeQrItem && (
        <QrModal equipment={activeQrItem} onClose={() => setActiveQrItem(null)} />
      )}

      {/* Register Equipment Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">Register New Campus Equipment</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form onSubmit={handleRegisterEquipment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Building & Room</label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">-- Choose Classroom / Lab --</option>
                  <option value="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa">SEC - LH-101 (Lecture Hall)</option>
                  <option value="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb">SEC - PHYS-204 (Physics Lab)</option>
                  <option value="cccccccc-cccc-4ccc-8ccc-cccccccccccc">RCC - LAB-1 (Computer Lab)</option>
                  <option value="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee">CUL - READING-2A (Library)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder="e.g. Overhead 4K Projector Rear"
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Asset Code</label>
                  <input
                    type="text"
                    required
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    placeholder="SEC-LH101-PRJ-02"
                    className="w-full p-2 border border-stone-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Electronics">Electronics</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Plumbing">Plumbing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description / Spec</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brand, model, or mounting location..."
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50"
                >
                  {registering ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
