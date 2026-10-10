import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  SwitchCamera,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export function CameraScannerModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  
  // Camera state
  const [isScanning, setIsScanning] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'interactive-qr-scanner-region';

  // Stop camera feed and cleanup
  const stopCameraStream = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping camera scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
        setStartingCamera(false);
      }
    }
  };

  // Cleanup whenever modal is closed or unmounted
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCameraError('');
      setScanSuccess('');
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Handle successful QR scan
  const handleQrCodeSuccess = async (decodedText) => {
    setScanSuccess(decodedText);
    await stopCameraStream();

    // Extract qrToken from URL or use raw text
    let token = decodedText.trim();
    const urlMatch = token.match(/\/equipment\/([^/?#]+)/);
    if (urlMatch) {
      token = urlMatch[1];
    }

    setTimeout(() => {
      onClose();
      navigate(`/equipment/${token}`);
    }, 600);
  };

  // Start scanning on user click
  const startCameraScanner = async () => {
    setCameraError('');
    setStartingCamera(true);

    try {
      // Check for HTTPS / secure context requirement in production
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Camera access in production requires HTTPS. Please access via a secure connection.');
      }

      // Query available video devices
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No camera hardware detected on this device.');
      }

      setCameras(devices);

      // Prefer rear/environment camera for mobile equipment stickers
      let chosenCamera = devices[0].id;
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      if (backCamera) {
        chosenCamera = backCamera.id;
      }

      setSelectedCameraId(chosenCamera);

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        chosenCamera,
        config,
        (decodedText) => handleQrCodeSuccess(decodedText),
        () => {
          // Frame parsed without QR; ignore frame noise
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera Scanner start error:', err);
      let errorMsg = err.message || 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || errorMsg.includes('Permission denied')) {
        errorMsg = 'Camera permission was denied. Please click the camera icon in your browser address bar and choose "Allow".';
      } else if (err.name === 'NotFoundError' || errorMsg.includes('No camera')) {
        errorMsg = 'No active camera hardware found. You may manually enter the equipment code below.';
      }
      setCameraError(errorMsg);
      await stopCameraStream();
    } finally {
      setStartingCamera(false);
    }
  };

  // Switch camera when multiple lenses are available
  const handleSwitchCamera = async (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    if (html5QrCodeRef.current && isScanning) {
      await stopCameraStream();
      // Restart with new camera
      setTimeout(() => {
        startCameraScanner();
      }, 200);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (token) {
      onClose();
      const match = token.match(/\/equipment\/([^/?#]+)/);
      const cleanToken = match ? match[1] : token;
      navigate(`/equipment/${cleanToken}`);
    }
  };

  const sampleTokens = [
    { label: 'Ceiling Fan (SEC LH-101)', token: 'qr_sec_lh101_fan01_7f8d2a' },
    { label: '4K Projector (SEC LH-101)', token: 'qr_sec_lh101_prj01_4c9b1e' },
    { label: 'Split AC 2-Ton (RCC LAB-1)', token: 'qr_rcc_lab1_ac01_8e1f5d' },
    { label: 'Power Switchboard (RCC LAB-1)', token: 'qr_rcc_lab1_swb01_3a7b9c' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-stone-200 overflow-hidden animate-in fade-in max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Scan Equipment QR Code</h3>
              <p className="text-[11px] text-stone-500">Live optical scanner & instant asset lookup</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* CAMERA VIEWER REGION */}
          <div className="relative rounded-xl overflow-hidden bg-stone-900 text-white min-h-[240px] flex flex-col items-center justify-center border border-stone-800 shadow-inner">
            
            {/* HTML5 QR Container */}
            <div 
              id={scannerContainerId} 
              className={`w-full ${isScanning ? 'block' : 'hidden'}`}
              style={{ minHeight: '240px' }}
            />

            {/* Success state overlay */}
            {scanSuccess && (
              <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-white">QR Code Verified!</p>
                <p className="text-xs text-emerald-200 font-mono mt-1 break-all line-clamp-1">{scanSuccess}</p>
                <p className="text-[11px] text-stone-400 mt-2">Loading equipment status...</p>
              </div>
            )}

            {/* Idle state before camera permission requested */}
            {!isScanning && !scanSuccess && (
              <div className="p-6 text-center space-y-3">
                {startingCamera ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                    <p className="text-xs text-stone-300">Requesting camera permissions...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mx-auto text-amber-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-200">Point Camera at Equipment Label</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Permission is requested only after you start scanning
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Active Scanning Controls */}
            {isScanning && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="px-2.5 py-1 bg-stone-900/80 hover:bg-stone-900 text-stone-200 rounded text-[11px] font-semibold border border-stone-700 flex items-center gap-1"
                >
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop Camera</span>
                </button>
              </div>
            )}

          </div>

          {/* Camera Selection Switcher (if multiple cameras detected) */}
          {cameras.length > 1 && (
            <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200">
              <span className="flex items-center gap-1 font-medium">
                <SwitchCamera className="w-3.5 h-3.5 text-stone-500" />
                <span>Lens:</span>
              </span>
              <select
                value={selectedCameraId}
                onChange={handleSwitchCamera}
                className="text-[11px] bg-white border border-stone-300 rounded px-2 py-0.5"
              >
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.slice(0, 5)}`}</option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Camera Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">{cameraError}</p>
            </div>
          )}

          {/* FALLBACK 1: MANUAL CODE / URL INPUT */}
          <div className="pt-2 border-t border-stone-100">
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700">
                Or Enter Equipment Code Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="e.g. qr_sec_lh101_fan01_7f8d2a"
                  className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                />
                <button
                  type="submit"
                  disabled={!tokenInput.trim()}
                  className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>

          {/* FALLBACK 2: QUICK TEST CAMPUS ASSETS */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-semibold text-stone-700">Quick Test Registered Equipment</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {sampleTokens.map((sample) => (
                <button
                  key={sample.token}
                  type="button"
                  onClick={async () => {
                    await stopCameraStream();
                    onClose();
                    navigate(`/equipment/${sample.token}`);
                  }}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 hover:border-amber-300 text-xs transition group"
                >
                  <span className="font-medium text-stone-800">{sample.label}</span>
                  <span className="font-mono text-[10px] text-stone-400 group-hover:text-amber-700">Inspect</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
