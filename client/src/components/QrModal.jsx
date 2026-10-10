import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X, Building2, MapPin } from 'lucide-react';

export function QrModal({ equipment, onClose }) {
  const qrRef = useRef(null);
  if (!equipment) return null;

  const qrUrl = `${window.location.origin}/equipment/${equipment.qr_token}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 80;
      canvas.height = img.height + 160;
      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw QR in center
      ctx.drawImage(img, 40, 40);
      // Draw text label
      ctx.fillStyle = '#1C1917';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(equipment.equipment_name, canvas.width / 2, img.height + 70);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#78716C';
      ctx.fillText(`Asset: ${equipment.asset_code}`, canvas.width / 2, img.height + 95);
      ctx.fillText('FixIt QR Campus Maintenance', canvas.width / 2, img.height + 120);

      const a = document.createElement('a');
      a.download = `QR-${equipment.asset_code}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">Equipment QR Label</h3>
            <p className="text-xs text-stone-500">Scan to lodge instant maintenance ticket</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div id="printable-qr-zone" className="p-6 text-center space-y-4">
          <div 
            ref={qrRef}
            className="inline-block p-4 bg-white rounded-xl border-2 border-stone-900 shadow-sm"
          >
            <QRCodeSVG 
              value={qrUrl} 
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-lg leading-tight">{equipment.equipment_name}</h4>
            <p className="text-xs font-mono font-medium text-amber-800 bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200">
              {equipment.asset_code}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-stone-600 bg-stone-50 py-2.5 px-4 rounded-lg border border-stone-200/60">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <span>{equipment.rooms?.buildings?.building_name || equipment.room?.building?.building_name || 'Main Campus'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>Room {equipment.rooms?.room_number || equipment.room?.room_number || 'General'}</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-400">
            Scan URL: <span className="font-mono text-[10px] break-all">{qrUrl}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-stone-50 border-t border-stone-100">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Sticker
          </button>
        </div>

      </div>
    </div>
  );
}
