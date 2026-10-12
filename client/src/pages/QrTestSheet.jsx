import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  MapPin, 
  Printer, 
  ExternalLink, 
  QrCode, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

const TEST_QR_ITEMS = [
  {
    num: 1,
    building: 'Tech Park (TP)',
    room: 'Room TP-401 (4th Floor)',
    department: 'Software Engineering Laboratory',
    name: 'Ceiling Fan Front-Left (High Speed)',
    assetCode: 'SRM-TP-401-FAN-01',
    type: 'Electrical',
    token: 'qr_tp_401_fan01_9a1b2c',
    description: 'Crompton 1200mm high speed ceiling fan in Software Lab'
  },
  {
    num: 2,
    building: 'Tech Park (TP)',
    room: 'Room TP-502 (5th Floor)',
    department: 'Advanced AI Seminar Hall',
    name: 'Overhead 4K Projector Rear',
    assetCode: 'SRM-TP-502-PRJ-01',
    type: 'Electronics',
    token: 'qr_tp_502_prj01_8b3d4f',
    description: 'Epson 4K ceiling mounted digital projector in AI Seminar Hall'
  },
  {
    num: 3,
    building: 'University Building (UB)',
    room: 'Room UB-201 (2nd Floor)',
    department: 'Main Academic Lecture Theatre',
    name: 'Split AC 2-Ton Inverter',
    assetCode: 'SRM-UB-201-AC-01',
    type: 'HVAC',
    token: 'qr_ub_201_ac01_7e2a9b',
    description: 'Daikin 2-Ton inverter split AC in Main Lecture Theatre'
  },
  {
    num: 4,
    building: 'Bio Tech Block (BTB)',
    room: 'Room BTB-104 (1st Floor)',
    department: 'Biochemistry & Molecular Genetics Lab',
    name: 'Digital Interactive Smart Board 75"',
    assetCode: 'SRM-BTB-104-DSP-01',
    type: 'Electronics',
    token: 'qr_btb_104_dsp01_6f4c8a',
    description: 'Samsung 75-inch touch interactive screen in Molecular Lab'
  },
  {
    num: 5,
    building: 'Tech Park 2 (TP2)',
    room: 'Room TP2-305 (3rd Floor)',
    department: 'Cloud Computing & Server Infrastructure',
    name: 'Main 32A Modular Power Switchboard',
    assetCode: 'SRM-TP2-305-SWB-01',
    type: 'Electrical',
    token: 'qr_tp2_305_swb01_5d1e7c',
    description: 'Legrand 32A heavy-duty modular power panel in Cloud Computing Center'
  }
];

export function QrTestSheet() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-stone-800 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Testing QR Matrix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            5 Campus Equipment QR Codes for Testing
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
            Scan any of these 5 codes using your mobile camera or the web camera scanner to test instant equipment identification, status verification, and ticket logging.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print All 5 Stickers</span>
          </button>
        </div>
      </div>

      {/* 5 QR Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEST_QR_ITEMS.map((item) => {
          const scanUrl = `${window.location.origin}/equipment/${item.token}`;

          return (
            <div
              key={item.num}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-amber-400/60 transition group"
            >
              {/* Card Top / Header */}
              <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded border border-amber-200">
                    QR #{item.num} • {item.type}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready to Scan</span>
                </span>
              </div>

              {/* QR Center */}
              <div className="p-6 text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-2xl border-2 border-stone-900 shadow-md group-hover:scale-105 transition transform duration-200">
                  <QRCodeSVG
                    value={scanUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-stone-900 text-base leading-snug">
                    {item.name}
                  </h3>
                  <p className="font-mono text-xs text-amber-800 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200">
                    {item.assetCode}
                  </p>
                </div>

                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 text-xs text-stone-600 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                    <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{item.building}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{item.room}</span>
                  </div>
                  <div className="text-[11px] text-stone-400 pt-0.5">
                    {item.department}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                <a
                  href={`/qr-codes/${item.building.toLowerCase().includes('tech park 2') ? 'qr-5-tech-park-2-switchboard' : item.building.toLowerCase().includes('bio') ? 'qr-4-bio-tech-block-smartboard' : item.building.toLowerCase().includes('university') ? 'qr-3-university-building-ac' : item.num === 1 ? 'qr-1-tech-park-fan' : 'qr-2-tech-park-projector'}.png`}
                  download
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 transition"
                >
                  Download PNG
                </a>

                <Link
                  to={`/equipment/${item.token}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <span>Test Scan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
