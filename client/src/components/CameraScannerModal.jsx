import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, X, ArrowRight, Sparkles } from 'lucide-react';

export function CameraScannerModal({ isOpen, onClose }) {
  const [tokenInput, setTokenInput] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (token) {
      onClose();
      // If full URL was pasted, extract token
      const match = token.match(/\/equipment\/([^/?#]+)/);
      const cleanToken = match ? match[1] : token;
      navigate(`/equipment/${cleanToken}`);
    }
  };

  const sampleTokens = [
    { label: 'Ceiling Fan (LH-101)', token: 'qr_sec_lh101_fan01_7f8d2a' },
    { label: '4K Projector (LH-101)', token: 'qr_sec_lh101_prj01_4c9b1e' },
    { label: 'Split AC 2-Ton (LAB-1)', token: 'qr_rcc_lab1_ac01_8e1f5d' },
    { label: 'Power Switchboard (LAB-1)', token: 'qr_rcc_lab1_swb01_3a7b9c' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Scan Equipment QR Code</h3>
              <p className="text-[11px] text-stone-500">Camera scanner or quick asset code input</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleScanSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Enter QR Token or Equipment URL
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. qr_sec_lh101_fan01_7f8d2a"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!tokenInput.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              <span>Inspect Equipment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Scan shortcuts */}
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-semibold text-stone-700">Quick Test Registered Equipment</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {sampleTokens.map((sample) => (
                <button
                  key={sample.token}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/equipment/${sample.token}`);
                  }}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 hover:border-amber-300 text-xs transition group"
                >
                  <span className="font-medium text-stone-800">{sample.label}</span>
                  <span className="font-mono text-[10px] text-stone-400 group-hover:text-amber-700">Scan</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
