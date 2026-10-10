import React, { useEffect, useState } from 'react';
import { Building2, Plus, MapPin, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api';

export function BuildingsManagement() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddBldg, setShowAddBldg] = useState(false);
  const [bldgName, setBldgName] = useState('');
  const [bldgCode, setBldgCode] = useState('');
  const [bldgDesc, setBldgDesc] = useState('');

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [targetBldgId, setTargetBldgId] = useState('');
  const [floorNum, setFloorNum] = useState(1);
  const [roomNum, setRoomNum] = useState('');

  const [msg, setMsg] = useState('');

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/buildings');
      setBuildings(res.data || []);
    } catch {
      // Mock fallback
      setBuildings([
        {
          id: 'b-1',
          building_name: 'Science & Engineering Complex',
          building_code: 'SEC',
          rooms: [
            { id: 'r-1', floor_number: 1, room_number: 'LH-101' },
            { id: 'r-2', floor_number: 2, room_number: 'PHYS-204' }
          ]
        },
        {
          id: 'b-2',
          building_name: 'Ramanujan Computing Center',
          building_code: 'RCC',
          rooms: [
            { id: 'r-3', floor_number: 1, room_number: 'LAB-1' },
            { id: 'r-4', floor_number: 3, room_number: 'SERVER-301' }
          ]
        },
        {
          id: 'b-3',
          building_name: 'Central University Library',
          building_code: 'CUL',
          rooms: [
            { id: 'r-5', floor_number: 2, room_number: 'READING-2A' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const handleAddBuilding = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/buildings', {
        method: 'POST',
        body: JSON.stringify({
          building_name: bldgName,
          building_code: bldgCode.toUpperCase(),
          description: bldgDesc
        })
      });
      setMsg('Building registered successfully');
      setTimeout(() => setMsg(''), 3000);
      setShowAddBldg(false);
      setBldgName('');
      setBldgCode('');
      setBldgDesc('');
      fetchBuildings();
    } catch (err) {
      alert(err.message || 'Failed to add building');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/buildings/rooms', {
        method: 'POST',
        body: JSON.stringify({
          building_id: targetBldgId,
          floor_number: Number(floorNum),
          room_number: roomNum
        })
      });
      setMsg('Room added successfully');
      setTimeout(() => setMsg(''), 3000);
      setShowAddRoom(false);
      setRoomNum('');
      fetchBuildings();
    } catch (err) {
      alert(err.message || 'Failed to add room');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Campus Buildings & Rooms</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure campus physical structure, departments, and numbered rooms for equipment placement
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddBldg(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Building</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (buildings.length > 0) setTargetBldgId(buildings[0].id);
              setShowAddRoom(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-stone-500" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Buildings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {b.building_code}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-2">{b.building_name}</h3>
              </div>
              <div className="p-2 rounded-lg bg-stone-100 text-stone-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                Registered Rooms ({(b.rooms || []).length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(b.rooms || []).map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-50 border border-stone-200/80 text-xs font-medium text-stone-700"
                  >
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{r.room_number} (Fl {r.floor_number})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Building Modal */}
      {showAddBldg && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">Add Campus Building</h3>
              <button onClick={() => setShowAddBldg(false)} className="text-stone-400">✕</button>
            </div>
            <form onSubmit={handleAddBuilding} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Building Name</label>
                <input
                  type="text"
                  required
                  value={bldgName}
                  onChange={(e) => setBldgName(e.target.value)}
                  placeholder="e.g. Mechanical Engineering Workshop"
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Building Code</label>
                <input
                  type="text"
                  required
                  value={bldgCode}
                  onChange={(e) => setBldgCode(e.target.value)}
                  placeholder="MEW"
                  className="w-full p-2 border border-stone-300 rounded-lg font-mono uppercase"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddBldg(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-semibold">Save Building</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">Add Room to Building</h3>
              <button onClick={() => setShowAddRoom(false)} className="text-stone-400">✕</button>
            </div>
            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Building</label>
                <select
                  value={targetBldgId}
                  onChange={(e) => setTargetBldgId(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.building_name} ({b.building_code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Floor Number</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={floorNum}
                    onChange={(e) => setFloorNum(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={roomNum}
                    onChange={(e) => setRoomNum(e.target.value)}
                    placeholder="LH-201"
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddRoom(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-semibold">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
