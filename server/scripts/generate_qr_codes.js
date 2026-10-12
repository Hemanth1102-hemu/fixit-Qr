import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, '../../client/public/qr-codes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 5 Requested QR Units
const qrList = [
  {
    num: 1,
    name: 'Ceiling Fan Front-Left (High Speed)',
    asset_code: 'SRM-TP-401-FAN-01',
    token: 'qr_tp_401_fan01_9a1b2c',
    building: 'Tech Park (TP)',
    room: 'Room TP-401 (Fl 4)',
    type: 'Electrical',
    fileSlug: 'qr-1-tech-park-fan'
  },
  {
    num: 2,
    name: 'Overhead 4K Projector Rear',
    asset_code: 'SRM-TP-502-PRJ-01',
    token: 'qr_tp_502_prj01_8b3d4f',
    building: 'Tech Park (TP)',
    room: 'Room TP-502 (Fl 5)',
    type: 'Electronics',
    fileSlug: 'qr-2-tech-park-projector'
  },
  {
    num: 3,
    name: 'Split AC 2-Ton Inverter',
    asset_code: 'SRM-UB-201-AC-01',
    token: 'qr_ub_201_ac01_7e2a9b',
    building: 'University Building (UB)',
    room: 'Room UB-201 (Fl 2)',
    type: 'HVAC',
    fileSlug: 'qr-3-university-building-ac'
  },
  {
    num: 4,
    name: 'Digital Interactive Smart Board 75"',
    asset_code: 'SRM-BTB-104-DSP-01',
    token: 'qr_btb_104_dsp01_6f4c8a',
    building: 'Bio Tech Block (BTB)',
    room: 'Room BTB-104 (Fl 1)',
    type: 'Electronics',
    fileSlug: 'qr-4-bio-tech-block-smartboard'
  },
  {
    num: 5,
    name: 'Main 32A Modular Power Switchboard',
    asset_code: 'SRM-TP2-305-SWB-01',
    token: 'qr_tp2_305_swb01_5d1e7c',
    building: 'Tech Park 2 (TP2)',
    room: 'Room TP2-305 (Fl 3)',
    type: 'Electrical',
    fileSlug: 'qr-5-tech-park-2-switchboard'
  }
];

async function generateQRCodes() {
  console.log('Generating 5 QR Code assets for FixIt QR testing...\n');

  for (const item of qrList) {
    const landingUrl = `http://localhost:5173/equipment/${item.token}`;

    // 1. Generate PNG
    const pngPath = path.join(outputDir, `${item.fileSlug}.png`);
    await QRCode.toFile(pngPath, landingUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    // 2. Generate SVG
    const svgPath = path.join(outputDir, `${item.fileSlug}.svg`);
    const svgString = await QRCode.toString(landingUrl, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    fs.writeFileSync(svgPath, svgString);

    console.log(`[QR ${item.num}] ${item.building} - ${item.name}`);
    console.log(`       Asset Code: ${item.asset_code}`);
    console.log(`       Target URL: ${landingUrl}`);
    console.log(`       PNG: ${pngPath}`);
    console.log(`       SVG: ${svgPath}\n`);
  }

  // Also write an HTML test index page so the user can easily view or print all 5 stickers in one sheet!
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FixIt QR — 5 Campus Test QR Codes</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafaf9; margin: 0; padding: 24px; color: #1c1917; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 6px; }
    p.sub { text-align: center; color: #78716c; margin-top: 0; margin-bottom: 24px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
    .card { background: white; border: 2px solid #e7e5e4; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
    .badge { display: inline-block; font-size: 11px; font-weight: bold; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 6px; padding: 3px 8px; margin-bottom: 8px; text-transform: uppercase; }
    .bldg { font-size: 13px; font-weight: 600; color: #44403c; margin-bottom: 4px; }
    .room { font-size: 12px; color: #78716c; margin-bottom: 12px; }
    .qr-img { width: 180px; height: 180px; border: 2px solid #1c1917; border-radius: 12px; padding: 8px; background: white; margin-bottom: 12px; }
    .eq-name { font-size: 15px; font-weight: bold; color: #1c1917; margin-bottom: 4px; }
    .asset { font-family: monospace; font-size: 12px; color: #b45309; font-weight: bold; margin-bottom: 14px; }
    .btn { display: inline-block; padding: 8px 14px; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 8px; background: #d97706; color: white; transition: background 0.2s; }
    .btn:hover { background: #b45309; }
    @media print {
      body { background: white; padding: 0; }
      .grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .btn, p.sub { display: none; }
      .card { border: 2px dashed #78716c; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>FixIt QR — 5 Campus Test QR Codes</h1>
  <p class="sub">Scan any QR with your phone camera or web scanner to trigger instant complaint reporting</p>
  <div style="text-align: center; margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 13px; font-weight: bold; background: #1c1917; color: white; border: none; border-radius: 8px; cursor: pointer;">
      🖨️ Print All Stickers
    </button>
  </div>
  <div class="grid">
    ${qrList.map(item => `
      <div class="card">
        <div>
          <span class="badge">QR ${item.num}: ${item.type}</span>
          <div class="bldg">${item.building}</div>
          <div class="room">${item.room}</div>
          <img class="qr-img" src="./${item.fileSlug}.png" alt="${item.name}" />
          <div class="eq-name">${item.name}</div>
          <div class="asset">${item.asset_code}</div>
        </div>
        <a class="btn" href="http://localhost:5173/equipment/${item.token}" target="_blank">
          Open Test Page ↗
        </a>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), htmlContent);
  console.log(`Printable HTML sheet created at: ${path.join(outputDir, 'index.html')}`);
}

generateQRCodes().catch(err => {
  console.error('Error generating QR codes:', err);
  process.exit(1);
});
