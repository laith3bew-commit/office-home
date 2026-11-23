// Office Home – Scanner (Hauptprozess): Drucker-Scan über WIA, Handy-Upload im Heimnetz (QR-Code),
// überwachter Ordner und PDF-Erstellung. Alle Seiten gehen per IPC 'oh:scanIncoming' an die Oberfläche.
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');

const MIME = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

module.exports = function setupScan({ app, ipcMain, dialog, BrowserWindow, getWin }) {
  const send = (ch, data) => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send(ch, data); };

  // ---------- PDF aus Bildern und PDFs bauen (pdf-lib) ----------
  ipcMain.handle('oh:makePdf', async (e, parts, title) => {
    try {
      const { PDFDocument } = require('pdf-lib');
      const doc = await PDFDocument.create();
      doc.setTitle(String(title || 'Scan')); doc.setProducer('Office Home'); doc.setCreator('Office Home Scanner');
      const A4 = [595.28, 841.89];
      for (const p of parts || []) {
        const bytes = new Uint8Array(p.data);
        if (p.mime === 'application/pdf') {
          const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          (await doc.copyPages(src, src.getPageIndices())).forEach(pg => doc.addPage(pg));
          continue;
        }
        const img = p.mime === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const land = img.width > img.height, [W, H] = land ? [A4[1], A4[0]] : A4;
        const s = Math.min(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
        doc.addPage([W, H]).drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
      }
      return { ok: true, data: await doc.save() };
    } catch (err) { return { ok: false, message: err.message }; }
  });

  // ---------- Drucker / Scanner über Windows-WIA ----------
  ipcMain.handle('oh:scanWia', async () => {
    const out = path.join(os.tmpdir(), 'OfficeHome', 'scan-' + Date.now() + '.jpg');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const ps = [
      '$ErrorActionPreference = "Stop"',
      'try {',
      '  $dlg = New-Object -ComObject WIA.CommonDialog',
      // DeviceType 1 = Scanner, Intent 1 = Farbe, Bias 131072 = Qualität, JPEG-Format, Gerät nur bei mehreren wählen, Windows-Scan-Dialog zeigen
      '  $img = $dlg.ShowAcquireImage(1, 1, 131072, "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}", $false, $true, $false)',
      '  if ($img -eq $null) { Write-Output "CANCEL"; exit 0 }',
      `  $img.SaveFile("${out.replace(/"/g, '')}")`,
      '  Write-Output "OK"',
      '} catch { Write-Output ("ERR " + $_.Exception.Message) }'
    ].join('\n');
    return new Promise(resolve => {
      execFile('powershell.exe', ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', ps], { windowsHide: false, timeout: 10 * 60000 }, (err, stdout) => {
        const o = String(stdout || '').trim();
        if (o.startsWith('OK') && fs.existsSync(out)) { const data = fs.readFileSync(out); fs.unlink(out, () => {}); return resolve({ ok: true, data, mime: 'image/jpeg', name: 'Scan.jpg' }); }
        if (o.startsWith('CANCEL')) return resolve({ ok: false, cancelled: true });
        let msg = o.replace(/^ERR\s*/, '') || (err && err.message) || 'Unbekannter Fehler';
        if (/0x80210015|kein.*gerät|no device|WIA_ERROR_OFFLINE|0x80210005/i.test(msg)) msg = 'Kein Scanner gefunden oder ausgeschaltet. Bitte Drucker/Scanner einschalten und per USB oder WLAN mit Windows verbinden.';
        resolve({ ok: false, message: msg });
      });
    });
  });

  // ---------- Handy-Upload im Heimnetz ----------
  let phone = null; // {srv, token, port, idle}
  function lanIps() {
    const all = [];
    for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) all.push(a.address);
    const rank = ip => /^192\.168\./.test(ip) ? 0 : /^10\./.test(ip) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
    return all.sort((a, b) => rank(a) - rank(b));
  }
  function phoneStop() { if (phone) { clearTimeout(phone.idle); phone.srv.close(); phone = null; send('oh:phoneState', { running: false }); } }
  function bumpIdle() { if (!phone) return; clearTimeout(phone.idle); phone.idle = setTimeout(phoneStop, 30 * 60000); }
  ipcMain.handle('oh:phoneStart', async () => {
    if (!phone) {
      const token = crypto.randomBytes(16).toString('hex');
      const page = fs.readFileSync(path.join(__dirname, 'phone.html'), 'utf8');
      const srv = http.createServer((req, res) => {
        const u = new URL(req.url, 'http://x'); const ok = u.searchParams.get('t') === token;
        const json = (code, o) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)); };
        if (!ok) { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Zugang abgelaufen. Bitte den QR-Code in Office Home neu scannen.'); }
        bumpIdle();
        if (req.method === 'GET' && u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(page); }
        if (req.method === 'POST' && u.pathname === '/upload') {
          const chunks = []; let size = 0;
          req.on('data', c => { size += c.length; if (size > 40 * 1024 * 1024) { req.destroy(); } else chunks.push(c); });
          req.on('end', () => {
            const mime = String(req.headers['content-type'] || '').split(';')[0];
            if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(mime)) return json(415, { ok: false, error: 'Nur Fotos (JPG/PNG) oder PDF.' });
            const name = decodeURIComponent(String(req.headers['x-name'] || 'Handy-Foto'));
            send('oh:scanIncoming', { source: 'handy', name, mime, data: Buffer.concat(chunks), batch: u.searchParams.get('b') || '' });
            json(200, { ok: true });
          });
          return;
        }
        if (req.method === 'POST' && u.pathname === '/done') { send('oh:phoneDone', { batch: u.searchParams.get('b') || '' }); return json(200, { ok: true }); }
        json(404, { ok: false });
      });
      await new Promise((resolve, reject) => { srv.once('error', reject); srv.listen(0, '0.0.0.0', resolve); });
      phone = { srv, token, port: srv.address().port, idle: null }; bumpIdle();
    }
    const ips = lanIps(); if (!ips.length) { phoneStop(); return { ok: false, message: 'Kein Heimnetz (WLAN/LAN) gefunden.' }; }
    const url = `http://${ips[0]}:${phone.port}/?t=${phone.token}`;
    const qr = await require('qrcode').toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: 'M' });
    send('oh:phoneState', { running: true });
    return { ok: true, url, qr, ips, port: phone.port };
  });
  ipcMain.handle('oh:phoneStop', () => { phoneStop(); return { ok: true }; });

  // ---------- Überwachter Ordner ----------
  let watcher = null, watchDir = '';
  const pending = new Map();
  function importFile(file) {
    const ext = path.extname(file).toLowerCase(); if (!MIME[ext]) return;
    if (pending.has(file)) return; pending.set(file, 0);
    let last = -1, same = 0;
    const tick = () => {
      let st; try { st = fs.statSync(file); } catch (e) { pending.delete(file); return; }
      if (st.size === last && st.size > 0) same++; else same = 0; last = st.size;
      if (same < 2) return setTimeout(tick, 700);
      try {
        const data = fs.readFileSync(file);
        send('oh:scanIncoming', { source: 'ordner', name: path.basename(file), mime: MIME[ext], data });
        const doneDir = path.join(watchDir, 'importiert'); fs.mkdirSync(doneDir, { recursive: true });
        let target = path.join(doneDir, path.basename(file)), k = 2;
        while (fs.existsSync(target)) target = path.join(doneDir, path.basename(file, ext) + '-' + k++ + ext);
        fs.renameSync(file, target);
      } catch (e) {}
      pending.delete(file);
    };
    setTimeout(tick, 500);
  }
  function watchStart(dir) {
    if (watcher) { watcher.close(); watcher = null; } watchDir = '';
    if (!dir) return { ok: true };
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return { ok: false, message: 'Ordner nicht gefunden.' };
    watchDir = dir;
    for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isFile()) importFile(p); }
    watcher = fs.watch(dir, (ev, f) => { if (f) { const p = path.join(dir, f); if (fs.existsSync(p) && fs.statSync(p).isFile()) importFile(p); } });
    return { ok: true };
  }
  ipcMain.handle('oh:watchPick', e => { const r = dialog.showOpenDialogSync(BrowserWindow.fromWebContents(e.sender), { title: 'Ordner für eingehende Scans wählen', properties: ['openDirectory', 'createDirectory'] }); return r && r[0] ? r[0] : ''; });
  ipcMain.handle('oh:watchSet', (e, dir) => { try { return watchStart(dir); } catch (err) { return { ok: false, message: err.message }; } });

  app.on('will-quit', () => { phoneStop(); if (watcher) watcher.close(); });
};
