// Home Office – Desktop-Programm (Electron-Hauptprozess)
'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeTheme, Tray, nativeImage, safeStorage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Programmsprache fest auf Deutsch: Datums- und Zahlenfelder zeigen sonst je nach Windows-Sprache
// z. B. arabische Ziffern oder ein fremdes Datumsformat.
app.commandLine.appendSwitch('lang', 'de-DE');

// Nur eine Instanz erlauben (sonst greifen zwei Fenster gleichzeitig auf die Datenbank zu).
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
let quitting = false, tray = null;
const startHidden = process.argv.includes('--hidden');

// ---------- Hintergrund: Symbol neben der Uhr, Autostart (für Erinnerungen bei geschlossenem Fenster) ----------
const PREFS = () => path.join(app.getPath('userData'), 'oh-prefs.json');
const prefsRead = () => { try { return JSON.parse(fs.readFileSync(PREFS(), 'utf8')); } catch (e) { return {}; } };
const prefsWrite = p => fs.writeFileSync(PREFS(), JSON.stringify(p), 'utf8');
const bgPrefs = () => Object.assign({ tray: true, autostart: true }, prefsRead());
function showWin() { if (!win || win.isDestroyed()) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function applyAutostart() {
  if (!app.isPackaged) return;
  const p = bgPrefs();
  app.setLoginItemSettings({ openAtLogin: !!(p.tray && p.autostart), args: ['--hidden'] });
}
// Sprache der Oberfläche (de/ar) – für Symbol neben der Uhr und Windows-Meldungen
const AR = () => prefsRead().lang === 'ar';
function trayMenu() {
  if (!tray) return;
  const a = AR();
  tray.setToolTip(a ? 'Home Office – التذكيرات تعمل' : 'Home Office – Erinnerungen aktiv');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: a ? 'فتح Home Office' : 'Home Office öffnen', click: showWin },
    { label: a ? 'التقويم' : 'Kalender', click: () => { showWin(); win.webContents.send('oh:openCal', ''); } },
    { type: 'separator' },
    { label: a ? 'إنهاء (لا مزيد من التذكيرات)' : 'Beenden (keine Erinnerungen mehr)', click: () => { quitting = true; app.quit(); } }
  ]));
}
function makeTray() {
  if (tray) return;
  const img = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  trayMenu();
  tray.on('click', showWin);
}
ipcMain.handle('oh:setLang', (e, l) => { const p = prefsRead(); if (p.lang !== l) { p.lang = l === 'ar' ? 'ar' : 'de'; prefsWrite(p); trayMenu(); } return true; });
ipcMain.handle('oh:bgGet', () => Object.assign(bgPrefs(), { packaged: app.isPackaged }));
ipcMain.handle('oh:bgSet', (e, v) => {
  const p = prefsRead(); if (typeof v.tray === 'boolean') p.tray = v.tray; if (typeof v.autostart === 'boolean') p.autostart = v.autostart;
  prefsWrite(p); applyAutostart(); return Object.assign(bgPrefs(), { packaged: app.isPackaged });
});
app.on('before-quit', () => { quitting = true; });

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    show: !startHidden,
    title: 'Home Office',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0F1726' : '#F4F0E8',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });
  win.webContents.session.setSpellCheckerLanguages(['de-DE']);
  win.loadFile(path.join(__dirname, 'OfficeHome.html'));

  // Schließen = im Hintergrund weiterlaufen (Erinnerungen), solange nicht „Beenden“ gewählt wurde.
  win.on('close', e => {
    if (quitting || !bgPrefs().tray) return;
    e.preventDefault(); win.hide();
    const p = prefsRead();
    if (!p.trayHintShown && Notification.isSupported()) {
      new Notification(AR() ? { title: 'Home Office يعمل في الخلفية', body: 'التذكيرات ستستمر. الفتح أو الإنهاء من الرمز بجانب الساعة.' }
        : { title: 'Home Office läuft weiter', body: 'Erinnerungen kommen weiterhin. Öffnen oder beenden über das Symbol neben der Uhr.' }).show();
      p.trayHintShown = true; prefsWrite(p);
    }
  });

  // Links nach außen (http/https/mailto) im Standardbrowser öffnen, keine neuen Fenster in der App.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto):/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); if (/^(https?|mailto):/i.test(url)) shell.openExternal(url); }
  });

  // Downloads (Sicherung, Kalender-Datei): immer mit „Speichern unter“-Dialog.
  win.webContents.session.on('will-download', (e, item) => {
    const target = dialog.showSaveDialogSync(win, {
      title: 'Speichern unter',
      defaultPath: path.join(app.getPath('documents'), item.getFilename())
    });
    if (target) item.setSavePath(target); else item.cancel();
  });
}

const safeName = s => String(s || 'Dokument').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 120) || 'Dokument';

ipcMain.handle('oh:savePDF', async (e, fileName) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  const target = dialog.showSaveDialogSync(w, {
    title: 'Als PDF speichern',
    defaultPath: path.join(app.getPath('documents'), safeName(fileName) + '.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!target) return { ok: false };
  const data = await e.sender.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
  fs.writeFileSync(target, data);
  shell.openPath(target);
  return { ok: true, path: target };
});

ipcMain.handle('oh:print', (e) => new Promise(res => {
  e.sender.print({ printBackground: true }, (ok, reason) => res({ ok, reason }));
}));

ipcMain.handle('oh:openFile', async (e, name, buffer) => {
  const dir = path.join(os.tmpdir(), 'OfficeHome');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, safeName(name));
  fs.writeFileSync(file, Buffer.from(buffer));
  const err = await shell.openPath(file);
  return { ok: !err, error: err };
});

ipcMain.handle('oh:version', () => app.getVersion());
// Darstellung: Fensterrahmen und Systemdialoge folgen der Wahl in Home Office (hell / dunkel / System)
ipcMain.handle('oh:setTheme', (e, v) => { nativeTheme.themeSource = v === 'dunkel' ? 'dark' : v === 'hell' ? 'light' : 'system'; return true; });

// ---------- Programm-Update über GitHub Releases ----------
// Ablauf: suchen → (Nutzer klickt) herunterladen → installieren und neu starten (still, ohne Installationsassistent).
let updater = null;
function getUpdater() {
  if (updater) return updater;
  updater = require('electron-updater').autoUpdater;
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;
  const send = (type, data) => { if (win && !win.isDestroyed()) win.webContents.send('oh:update', Object.assign({ type }, data || {})); };
  updater.on('update-available', i => send('available', { version: i.version, notes: typeof i.releaseNotes === 'string' ? i.releaseNotes : '' }));
  updater.on('update-not-available', () => send('none', { version: app.getVersion() }));
  updater.on('download-progress', p => send('progress', { percent: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', i => send('downloaded', { version: i.version }));
  updater.on('error', e => send('error', { message: String(e && e.message || e).split('\n')[0] }));
  return updater;
}
ipcMain.handle('oh:updateCheck', async () => {
  if (!app.isPackaged) return { ok: false, message: 'Updates gibt es nur im installierten Programm.' };
  try { const r = await getUpdater().checkForUpdates(); return { ok: true, current: app.getVersion(), latest: r && r.updateInfo ? r.updateInfo.version : app.getVersion() }; }
  catch (e) { return { ok: false, message: String(e && e.message || e).split('\n')[0] }; }
});
ipcMain.handle('oh:updateDownload', async () => {
  try { await getUpdater().downloadUpdate(); return { ok: true }; }
  catch (e) { return { ok: false, message: String(e && e.message || e).split('\n')[0] }; }
});
ipcMain.handle('oh:updateInstall', () => { quitting = true; setImmediate(() => getUpdater().quitAndInstall(true, true)); return { ok: true }; });

// ---------- Gedächtnis (Memory-Engine) ----------
// Lesen über den offiziellen Befehl „mem search“ (die Wände der Engine gelten über --cwd),
// Schreiben nur an zwei Stellen: Notizen unter <Arbeitsbereich>/.memory/office-home/ und
// neue Zeilen in .memory/context/todos.md. Engine-Dateien (.memory/.system) werden nie verändert.
const { execFile } = require('child_process');
let memPython = null;

function memRun(root, args) {
  const mem = path.join(root, '.memory', '.system', 'bin', 'mem');
  const tries = memPython ? [memPython] : [['python', ['-X', 'utf8']], ['py', ['-3', '-X', 'utf8']]];
  return new Promise((resolve, reject) => {
    const attempt = i => {
      if (i >= tries.length) return reject(new Error('Python wurde nicht gefunden.'));
      const [cmd, pre] = tries[i];
      execFile(cmd, [...pre, mem, ...args], { cwd: root, timeout: 120000, windowsHide: true, maxBuffer: 8 * 1024 * 1024,
        env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' }) }, (err, stdout, stderr) => {
        if (err && err.code === 'ENOENT') return attempt(i + 1);
        memPython = tries[i];
        if (err && !stdout) return reject(new Error(String(stderr || err.message).trim().split('\n').pop()));
        resolve(String(stdout));
      });
    };
    attempt(0);
  });
}

// Prüft den Memory-Ordner und liefert die Arbeitsbereiche aus memory-config.json (nur lesen).
function memInfo(root) {
  if (!root || !path.isAbsolute(root)) throw new Error('Kein Memory-Ordner gewählt.');
  const cfgFile = path.join(root, '.memory', 'memory-config.json');
  if (!fs.existsSync(path.join(root, '.memory', '.system', 'bin', 'mem')) || !fs.existsSync(cfgFile))
    throw new Error('In diesem Ordner wurde keine Memory-Engine gefunden.');
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  const ws = (Array.isArray(cfg.workstations) ? cfg.workstations : []).filter(w => w && w.path).map(w => ({ slug: String(w.slug || w.path), path: String(w.path) }));
  return { root, workstations: ws };
}
// Nur Arbeitsbereiche aus der Konfiguration zulassen; '' = Hauptordner.
function memWsDir(info, wsPath) {
  if (!wsPath) return info.root;
  const w = info.workstations.find(x => x.path === wsPath);
  if (!w) throw new Error('Unbekannter Arbeitsbereich: ' + wsPath);
  const dir = path.resolve(info.root, w.path);
  if (!dir.startsWith(path.resolve(info.root) + path.sep)) throw new Error('Ungültiger Arbeitsbereich.');
  return dir;
}
const oneLine = (s, n) => String(s || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, n || 200);
const slugify = s => oneLine(s, 200).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'eintrag';
const isoDay = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) ? String(s) : new Date().toISOString().slice(0, 10);
function writeAtomic(file, text) { const tmp = file + '.oh-tmp'; fs.writeFileSync(tmp, text, 'utf8'); fs.renameSync(tmp, file); }

// Suchergebnisse von „mem search“ (Textausgabe) in Objekte umwandeln.
function parseSearch(out) {
  const hits = []; let cur = null;
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/^\d+\.\s+\[([^\]]*)\]\s+(.*)$/);
    if (m) { cur = { scope: m[1], title: m[2].replace(/\s+·\s+\(intro\)\s*$/, '').trim(), path: '', snippet: '' }; hits.push(cur); continue; }
    if (!cur) continue;
    const p = line.match(/^\s+→\s+(.*)$/);
    if (p) { cur.path = p[1].trim(); continue; }
    if (line.trim()) cur.snippet = (cur.snippet ? cur.snippet + '\n' : '') + line.trim();
  }
  return hits;
}

ipcMain.handle('oh:memPickRoot', async e => {
  const w = BrowserWindow.fromWebContents(e.sender);
  const r = dialog.showOpenDialogSync(w, { title: 'Memory-Ordner wählen', properties: ['openDirectory'] });
  return r && r[0] ? r[0] : '';
});
ipcMain.handle('oh:memStatus', async (e, root) => {
  try { return Object.assign({ ok: true }, memInfo(root)); } catch (err) { return { ok: false, message: err.message }; }
});
ipcMain.handle('oh:memSearch', async (e, root, wsPath, query) => {
  try {
    const info = memInfo(root); const q = oneLine(query, 300);
    if (!q) return { ok: true, hits: [] };
    const out = await memRun(root, ['search', q, '--cwd', memWsDir(info, wsPath), '-n', '8']);
    return { ok: true, hits: parseSearch(out) };
  } catch (err) { return { ok: false, message: err.message }; }
});
// Notiz festhalten: <Arbeitsbereich>/.memory/office-home/JJJJ-MM/<datum>-<titel>.md, danach Index aktualisieren.
ipcMain.handle('oh:memNote', async (e, root, wsPath, n) => {
  try {
    const info = memInfo(root); n = n || {};
    const date = isoDay(n.date); const title = oneLine(n.title, 160) || 'Eintrag aus Home Office';
    const dir = path.join(memWsDir(info, wsPath), '.memory', 'office-home', date.slice(0, 7));
    fs.mkdirSync(dir, { recursive: true });
    let file = path.join(dir, `${date}-${slugify(title)}.md`); let k = 2;
    while (fs.existsSync(file)) file = path.join(dir, `${date}-${slugify(title)}-${k++}.md`);
    const meta = [['Art', n.kind], ['Person', n.person], ['An', n.to], ['Vorgang', n.caseTitle], ['Aktenzeichen', n.ref], ['Erinnerung', n.reminder]]
      .filter(x => oneLine(x[1])).map(x => `- **${x[0]}:** ${oneLine(x[1], 300)}`).join('\n');
    const text = `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\nsource: office-home\nkind: ${JSON.stringify(oneLine(n.kind, 60) || 'Notiz')}\n---\n# ${title}\n\n${meta ? meta + '\n\n' : ''}${String(n.body || '').replace(/\r\n/g, '\n').trim()}\n`;
    writeAtomic(file, text);
    let indexed = true; try { await memRun(root, ['index', '--quick']); } catch (err) { indexed = false; }
    return { ok: true, file: path.relative(root, file), indexed };
  } catch (err) { return { ok: false, message: err.message }; }
});
// Erinnerung: neue Zeile unter „## Active“ in .memory/context/todos.md (gleiches Format wie das Dashboard).
ipcMain.handle('oh:memTask', async (e, root, t) => {
  try {
    memInfo(root); t = t || {};
    const file = path.join(root, '.memory', 'context', 'todos.md');
    if (!fs.existsSync(file)) throw new Error('Aufgabenliste der Memory nicht gefunden.');
    const title = oneLine(t.title, 200).replace(/[{}]/g, ''); if (!title) throw new Error('Erinnerung ohne Text.');
    const created = new Date().toISOString().slice(0, 10); const due = isoDay(t.due);
    let src = fs.readFileSync(file, 'utf8'); const nl = src.includes('\r\n') ? '\r\n' : '\n';
    let id = `t-${created.replace(/-/g, '')}-${slugify(title)}`; let k = 2; const base = id;
    while (src.includes(`{id: ${id};`)) id = `${base}-${k++}`;
    const note = oneLine(t.note, 300).replace(/[{};]/g, ',');
    const line = `- [ ] ${title} {id: ${id}; due: ${due}; source: office-home; created: ${created}${note ? '; note: ' + note : ''}}`;
    const lines = src.split(/\r?\n/); const a = lines.findIndex(l => /^##\s+Active\s*$/i.test(l));
    if (a < 0) throw new Error('Abschnitt „## Active“ fehlt in todos.md.');
    let end = lines.findIndex((l, i) => i > a && /^##\s/.test(l)); if (end < 0) end = lines.length;
    let at = end; while (at > a + 1 && !lines[at - 1].trim()) at--;
    lines.splice(at, 0, line);
    writeAtomic(file, lines.join(nl));
    return { ok: true, id };
  } catch (err) { return { ok: false, message: err.message }; }
});

// ---------- Claude-Anbindung (MCP) ----------
// Lokaler HTTP-Kanal nur auf 127.0.0.1 mit Zufalls-Schlüssel. Die Brücke mcp-bridge.js (von Claude gestartet)
// liest Port und Schlüssel aus userData/mcp.json und schickt Werkzeugaufrufe hierher; ausgeführt werden sie
// in der Oberfläche (dort liegen die Daten). Ist die Verbindung aus, gibt es weder Server noch mcp.json.
const http = require('http');
const crypto = require('crypto');
const MCP_FILE = () => path.join(app.getPath('userData'), 'mcp.json');
let mcpServer = null, mcpToken = '', mcpSeq = 0;
const mcpPending = new Map();

function mcpForward(tool, args) {
  return new Promise(resolve => {
    if (!win || win.isDestroyed()) return resolve({ ok: false, error: 'Home Office-Fenster ist nicht geöffnet.' });
    const id = ++mcpSeq;
    const timer = setTimeout(() => { mcpPending.delete(id); resolve({ ok: false, error: 'Home Office hat nicht rechtzeitig geantwortet.' }); }, 15000);
    mcpPending.set(id, r => { clearTimeout(timer); resolve(r); });
    win.webContents.send('oh:mcpCall', { id, tool, args });
  });
}
ipcMain.on('oh:mcpReply', (e, id, result) => { const f = mcpPending.get(id); if (f) { mcpPending.delete(id); f(result || { ok: false, error: 'Keine Antwort' }); } });

function mcpStop() {
  if (mcpServer) { mcpServer.close(); mcpServer = null; }
  try { fs.unlinkSync(MCP_FILE()); } catch (e) {}
}
function mcpStart() {
  if (mcpServer) return Promise.resolve(true);
  mcpToken = crypto.randomBytes(24).toString('hex');
  const srv = http.createServer((req, res) => {
    const end = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
    if (req.method !== 'POST' || req.url !== '/call') return end(404, { ok: false, error: 'not found' });
    const tok = String(req.headers['x-oh-token'] || '');
    if (tok.length !== mcpToken.length || !crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(mcpToken))) return end(403, { ok: false, error: 'Zugang verweigert' });
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', async () => {
      let m; try { m = JSON.parse(body); } catch (e) { return end(400, { ok: false, error: 'Ungültige Anfrage' }); }
      end(200, await mcpForward(String(m.tool || ''), m.args && typeof m.args === 'object' ? m.args : {}));
    });
  });
  return new Promise(resolve => {
    const listen = port => {
      srv.once('error', err => { if (port) listen(0); else resolve(false); });
      srv.listen(port, '127.0.0.1', () => {
        mcpServer = srv;
        fs.writeFileSync(MCP_FILE(), JSON.stringify({ port: srv.address().port, token: mcpToken, pid: process.pid }), { encoding: 'utf8', mode: 0o600 });
        resolve(true);
      });
    };
    listen(47821);
  });
}
// Eintrag, mit dem Claude die Brücke startet (Office Home.exe als Node-Laufzeit).
function mcpEntry() {
  const bridge = app.isPackaged ? path.join(process.resourcesPath, 'mcp-bridge.js') : path.join(__dirname, 'mcp-bridge.js');
  return { command: process.execPath, args: [bridge], env: { ELECTRON_RUN_AS_NODE: '1', OH_MCP_FILE: MCP_FILE() } };
}
const claudeDesktopConfig = () => path.join(process.env.APPDATA || app.getPath('appData'), 'Claude', 'claude_desktop_config.json');
ipcMain.handle('oh:mcpEnable', async (e, on) => { if (on) return { ok: await mcpStart() }; mcpStop(); return { ok: true }; });
ipcMain.handle('oh:mcpInfo', () => {
  const en = mcpEntry(), file = claudeDesktopConfig();
  let installed = false;
  try { const c = JSON.parse(fs.readFileSync(file, 'utf8')); const x = c.mcpServers && c.mcpServers['office-home']; installed = !!x && x.command === en.command && JSON.stringify(x.args) === JSON.stringify(en.args); } catch (err) {}
  const q = v => '"' + String(v).replace(/"/g, '\\"') + '"';
  return { running: !!mcpServer, desktopConfig: file, desktopFound: fs.existsSync(path.dirname(file)), installed, entry: en,
    claudeCode: `claude mcp add office-home --scope user -e ELECTRON_RUN_AS_NODE=1 -e OH_MCP_FILE=${q(en.env.OH_MCP_FILE)} -- ${q(en.command)} ${en.args.map(q).join(' ')}` };
});
// Trägt Home Office in die Konfiguration von Claude Desktop ein (vorher Sicherungskopie, andere Einträge bleiben erhalten).
ipcMain.handle('oh:mcpInstallDesktop', async () => {
  try {
    const file = claudeDesktopConfig(); fs.mkdirSync(path.dirname(file), { recursive: true });
    let cfg = {};
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      try { cfg = raw.trim() ? JSON.parse(raw) : {}; } catch (err) { return { ok: false, message: 'Die Datei claude_desktop_config.json ist kein gültiges JSON – bitte von Hand prüfen.' }; }
      fs.copyFileSync(file, file + '.office-home-backup');
    }
    cfg.mcpServers = Object.assign({}, cfg.mcpServers, { 'office-home': mcpEntry() });
    writeAtomic(file, JSON.stringify(cfg, null, 2));
    return { ok: true, file };
  } catch (err) { return { ok: false, message: err.message }; }
});
app.on('will-quit', mcpStop);

// ---------- Scanner (Drucker, Handy, Ordner, PDF) ----------
require('./scan-main.js')({ app, ipcMain, dialog, BrowserWindow, getWin: () => win });

// ---------- Büro im eigenen Fenster (z. B. auf dem zweiten Bildschirm) ----------
// Das Hauptfenster bleibt für die Daten zuständig; Nachrichten laufen hier durch. Position und Größe werden gemerkt.
let bueroWin = null;
const bueroUrl = theme => ({ query: { theme: theme || 'system', fenster: '1' } });
ipcMain.handle('oh:bueroFenster', (e, theme) => {
  if (bueroWin && !bueroWin.isDestroyed()) { bueroWin.show(); bueroWin.focus(); return { ok: true }; }
  const { screen } = require('electron');
  const p = prefsRead(), alle = screen.getAllDisplays();
  let b = p.bueroBounds;
  const passt = b && alle.some(d => { const a = d.workArea; return b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y < a.y + a.height - 80 && b.y + b.height > a.y + 40; });
  if (!passt) {   // erstes Mal oder Bildschirm fehlt: auf den anderen Bildschirm, sonst neben das Hauptfenster
    const haupt = win && !win.isDestroyed() ? screen.getDisplayMatching(win.getBounds()) : screen.getPrimaryDisplay();
    const a = (alle.find(d => d.id !== haupt.id) || haupt).workArea;
    b = { x: a.x + 40, y: a.y + 40, width: Math.max(800, Math.min(1600, a.width - 80)), height: Math.max(560, Math.min(1000, a.height - 80)) };
  }
  bueroWin = new BrowserWindow(Object.assign({}, b, {
    minWidth: 640, minHeight: 420, title: 'Büro – Home Office', autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0F1726' : '#F4F0E8',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'buero-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  }));
  if (passt && p.bueroMax) bueroWin.maximize();
  bueroWin.loadFile(path.join(__dirname, 'buero.html'), bueroUrl(theme));
  bueroWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  bueroWin.webContents.on('will-navigate', ev => ev.preventDefault());
  const merken = () => {
    if (!bueroWin || bueroWin.isDestroyed()) return;
    const q = prefsRead(); q.bueroMax = bueroWin.isMaximized();
    if (!bueroWin.isMaximized() && !bueroWin.isFullScreen() && !bueroWin.isMinimized()) q.bueroBounds = bueroWin.getBounds();
    prefsWrite(q);
  };
  ['moved', 'resized', 'maximize', 'unmaximize'].forEach(ev => bueroWin.on(ev, merken));
  bueroWin.on('close', merken);
  bueroWin.on('closed', () => { bueroWin = null; if (win && !win.isDestroyed()) win.webContents.send('oh:bueroZu'); });
  return { ok: true };
});
ipcMain.on('oh:bueroAnFenster', (e, m) => { if (bueroWin && !bueroWin.isDestroyed()) bueroWin.webContents.send('oh:bueroMsg', m); });
ipcMain.on('oh:bueroVonFenster', (e, m) => {
  if (!m) return;
  if (m.typ === 'buero-zurueck') { if (bueroWin && !bueroWin.isDestroyed()) bueroWin.close(); showWin(); return; }
  if (m.typ === 'buero-oeffnen' || m.typ === 'buero-dateien') showWin();
  if (win && !win.isDestroyed()) win.webContents.send('oh:bueroVonFenster', m);
});
ipcMain.handle('oh:bueroZu', () => { if (bueroWin && !bueroWin.isDestroyed()) bueroWin.close(); return true; });
ipcMain.handle('oh:bueroTheme', (e, theme) => { if (bueroWin && !bueroWin.isDestroyed()) bueroWin.loadFile(path.join(__dirname, 'buero.html'), bueroUrl(theme)); return true; });
ipcMain.handle('oh:bueroOffen', () => !!(bueroWin && !bueroWin.isDestroyed()));

// ---------- Kalender: Gemini, Google Kalender, Erinnerungen ----------
require('./kalender-main.js')({ app, ipcMain, shell, safeStorage, Notification, getWin: () => win, showWin });

app.on('second-instance', () => showWin());
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  app.setAppUserModelId('de.leon.officehome');
  createWindow();
  if (bgPrefs().tray) makeTray();
  applyAutostart();
  // Beim Start still nach Updates suchen; die Oberfläche zeigt dann einen Hinweis.
  if (app.isPackaged) win.webContents.once('did-finish-load', () => setTimeout(() => getUpdater().checkForUpdates().catch(() => {}), 4000));
});
app.on('window-all-closed', () => { if (quitting || !bgPrefs().tray) app.quit(); });
ipcMain.handle('oh:trayEnsure', () => { if (bgPrefs().tray) makeTray(); else if (tray) { tray.destroy(); tray = null; } return true; });
