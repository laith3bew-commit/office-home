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
// Sichtbarer Programmname (eigener Name aus dem Assistenten, Standard „Home Office“)
const NAME = () => { const n = String(prefsRead().appName || '').trim(); return n || 'Home Office'; };
function trayMenu() {
  if (!tray) return;
  const a = AR(), n = NAME();
  tray.setToolTip(a ? n + ' – التذكيرات تعمل' : n + ' – Erinnerungen aktiv');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: a ? 'فتح ' + n : n + ' öffnen', click: showWin },
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
ipcMain.handle('oh:setAppName', (e, n) => { n = String(n || '').trim().slice(0, 40); const p = prefsRead(); if ((p.appName || '') !== n) { p.appName = n; prefsWrite(p); trayMenu(); } return true; });
require('./lizenz-main.js')({ ipcMain, prefsRead, prefsWrite });
require('./system-main.js')({ ipcMain });
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
    title: NAME(),
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
      new Notification(AR() ? { title: NAME() + ' يعمل في الخلفية', body: 'التذكيرات ستستمر. الفتح أو الإنهاء من الرمز بجانب الساعة.' }
        : { title: NAME() + ' läuft weiter', body: 'Erinnerungen kommen weiterhin. Öffnen oder beenden über das Symbol neben der Uhr.' }).show();
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

// PDF der aktuellen Druckansicht als Daten (ohne Dialog) – z. B. Brief als E-Mail-Anhang
ipcMain.handle('oh:pdfDaten', async (e) => {
  try { const data = await e.sender.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true }); return { ok: true, data: new Uint8Array(data) }; }
  catch (err) { return { ok: false, message: String(err && err.message || err) }; }
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
// Zwei Arten: Memory-Engine (.memory/.system/bin/mem) oder Obsidian-Vault (Ordner mit .obsidian).
// Obsidian: Arbeitsbereiche = Ordner der obersten Ebene, Suche = eigene Textsuche, Notizen sichtbar unter „Home Office“.
function memInfo(root) {
  if (!root || !path.isAbsolute(root)) throw new Error('Kein Ordner für das Gedächtnis gewählt.');
  const cfgFile = path.join(root, '.memory', 'memory-config.json');
  const istEngine = fs.existsSync(path.join(root, '.memory', '.system', 'bin', 'mem')) && fs.existsSync(cfgFile);
  if (!istEngine && fs.existsSync(path.join(root, '.obsidian'))) {
    let ws = []; try { ws = fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.')).map(d => ({ slug: d.name, path: d.name })); } catch (e) {}
    return { root, art: 'obsidian', workstations: ws };
  }
  if (!istEngine)
    throw new Error('In diesem Ordner wurde weder eine Memory-Engine noch ein Obsidian-Vault gefunden. (Einen neuen Vault zuerst einmal in Obsidian öffnen.)');
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  const ws = (Array.isArray(cfg.workstations) ? cfg.workstations : []).filter(w => w && w.path).map(w => ({ slug: String(w.slug || w.path), path: String(w.path) }));
  return { root, art: 'memory', workstations: ws };
}
// Erlaubt: '' = Hauptordner, ein Arbeitsbereich aus der Konfiguration oder ein vorhandener Unterordner
// im Memory-Ordner (z. B. „Fa. Akili/Maha“ als Ordner einer Person). Nie außerhalb, nie in .memory selbst.
function memWsDir(info, wsPath) {
  if (!wsPath) return info.root;
  const root = path.resolve(info.root);
  const dir = path.resolve(root, String(wsPath));
  if (!dir.startsWith(root + path.sep)) throw new Error('Ordner liegt nicht im Memory-Ordner.');
  const rel = path.relative(root, dir).split(path.sep);
  if (rel.some(s => s === '.memory' || s === '.obsidian' || s === '.git' || s === '..')) throw new Error('Ungültiger Ordner.');
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error('Ordner nicht gefunden: ' + wsPath);
  let real = dir; try { real = fs.realpathSync(dir); } catch (e) {}
  let realRoot = root; try { realRoot = fs.realpathSync(root); } catch (e) {}
  if (real !== realRoot && !real.startsWith(realRoot + path.sep)) throw new Error('Ordner liegt nicht im Memory-Ordner.');
  return dir;
}
const relSlash = (root, abs) => path.relative(path.resolve(root), abs).split(path.sep).join('/');
// Einfache Textsuche in .md/.txt-Dateien eines Personenordners (inkl. festgehaltener Notizen unter .memory/office-home).
function memLocalSearch(root, dir, query, max) {
  const terms = String(query).toLowerCase().split(/\s+/).filter(w => w.length > 1); if (!terms.length) return [];
  const hits = []; let seen = 0;
  const walk = (d, depth, inMem) => {
    if (depth > 6 || seen > 4000) return;
    let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const en of ents) {
      const f = path.join(d, en.name);
      if (en.isSymbolicLink()) continue;
      if (en.isDirectory()) {
        if (en.name === '.memory') { const oh = path.join(f, 'office-home'); if (fs.existsSync(oh)) walk(oh, depth + 1, true); continue; }
        if (en.name.startsWith('.') || en.name === 'node_modules') continue;
        walk(f, depth + 1, inMem); continue;
      }
      if (!/\.(md|txt)$/i.test(en.name)) continue; seen++;
      let txt = ''; try { if (fs.statSync(f).size > 1024 * 1024) continue; txt = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
      const low = txt.toLowerCase(); if (!terms.every(w => low.includes(w))) continue;
      const i = low.indexOf(terms[0]); const snip = txt.slice(Math.max(0, i - 120), i + 280).replace(/\s+/g, ' ').trim();
      const tm = txt.match(/^#\s+(.+)$/m);
      hits.push({ scope: 'ordner', title: tm ? tm[1].trim() : en.name.replace(/\.(md|txt)$/i, ''), path: relSlash(root, f), snippet: snip, mtime: fs.statSync(f).mtimeMs });
    }
  };
  walk(dir, 0, false);
  return hits.sort((a, b) => b.mtime - a.mtime).slice(0, max || 8).map(h => { delete h.mtime; return h; });
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
  const r = dialog.showOpenDialogSync(w, { title: 'Memory-Ordner oder Obsidian-Vault wählen', properties: ['openDirectory'] });
  return r && r[0] ? r[0] : '';
});
ipcMain.handle('oh:memStatus', async (e, root) => {
  try { return Object.assign({ ok: true }, memInfo(root)); } catch (err) { return { ok: false, message: err.message }; }
});
// strict = Ordner einer Person: nur Treffer, deren Datei in diesem Ordner liegt (Engine + eigene Textsuche).
ipcMain.handle('oh:memSearch', async (e, root, wsPath, query, strict) => {
  try {
    const info = memInfo(root); const q = oneLine(query, 300);
    if (!q) return { ok: true, hits: [] };
    const dir = memWsDir(info, wsPath);
    if (info.art === 'obsidian') return { ok: true, hits: memLocalSearch(root, dir, q, strict ? 10 : 8) };
    let hits = [];
    try { hits = parseSearch(await memRun(root, ['search', q, '--cwd', dir, '-n', strict ? '40' : '8'])); } catch (err) { if (!strict) throw err; }
    if (strict && wsPath) {
      const pre = relSlash(root, dir) + '/';
      hits = hits.filter(h => (h.path || '').replace(/\\/g, '/').startsWith(pre));
      const known = new Set(hits.map(h => h.path));
      for (const h of memLocalSearch(root, dir, q, 8)) if (!known.has(h.path)) hits.push(h);
      hits = hits.slice(0, 10);
    }
    return { ok: true, hits };
  } catch (err) { return { ok: false, message: err.message }; }
});
// Kopie einer hochgeladenen Datei in den Ordner der Person im Gedächtnis: <Ordner>/Home Office Eingang/<Datum>-<Name>
ipcMain.handle('oh:memCopyFile', async (e, root, wsPath, name, buf) => {
  try {
    const info = memInfo(root); if (!wsPath) throw new Error('Kein Ordner für diese Person gewählt.');
    const dir = path.join(memWsDir(info, wsPath), 'Home Office Eingang'); fs.mkdirSync(dir, { recursive: true });
    const clean = String(name || 'Dokument').replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/^\.+/, '').trim().slice(0, 120) || 'Dokument';
    const date = new Date().toISOString().slice(0, 10);
    const ext = path.extname(clean), base = clean.slice(0, clean.length - ext.length);
    let file = path.join(dir, `${date}-${base}${ext}`); let k = 2;
    while (fs.existsSync(file)) file = path.join(dir, `${date}-${base}-${k++}${ext}`);
    fs.writeFileSync(file, Buffer.from(buf));
    return { ok: true, file: relSlash(info.root, file) };
  } catch (err) { return { ok: false, message: err.message }; }
});
// Ordner einer Person wählen: nur Unterordner des Memory-Ordners; Rückgabe relativ (z. B. „Fa. Akili/Maha“).
ipcMain.handle('oh:memPickDir', async (e, root, current) => {
  try {
    const info = memInfo(root); const w = BrowserWindow.fromWebContents(e.sender);
    let start = info.root; try { if (current) start = memWsDir(info, current); } catch (err) {}
    const r = dialog.showOpenDialogSync(w, { title: 'Ordner der Person im Gedächtnis wählen', defaultPath: start, properties: ['openDirectory'] });
    if (!r || !r[0]) return { ok: false, cancel: true };
    const dir = path.resolve(r[0]);
    if (dir === path.resolve(info.root)) return { ok: false, message: info.art === 'obsidian' ? 'Bitte nicht den ganzen Vault wählen, sondern den Ordner der Person darin (zuerst in Obsidian anlegen).' : 'Bitte nicht den ganzen Memory-Ordner wählen, sondern den Ordner der Person darin.' };
    const rel = relSlash(info.root, dir);
    memWsDir(info, rel);
    return { ok: true, rel };
  } catch (err) { return { ok: false, message: err.message }; }
});
// Notiz festhalten: <Arbeitsbereich>/.memory/office-home/JJJJ-MM/<datum>-<titel>.md, danach Index aktualisieren.
ipcMain.handle('oh:memNote', async (e, root, wsPath, n) => {
  try {
    const info = memInfo(root); n = n || {};
    const date = isoDay(n.date); const title = oneLine(n.title, 160) || 'Eintrag aus Home Office';
    // Obsidian: sichtbarer Ordner „Home Office/JJJJ-MM“ im Ordner der Person (Obsidian zeigt keine Punkt-Ordner)
    const dir = info.art === 'obsidian' ? path.join(memWsDir(info, wsPath), 'Home Office', date.slice(0, 7))
      : path.join(memWsDir(info, wsPath), '.memory', 'office-home', date.slice(0, 7));
    fs.mkdirSync(dir, { recursive: true });
    let file = path.join(dir, `${date}-${slugify(title)}.md`); let k = 2;
    while (fs.existsSync(file)) file = path.join(dir, `${date}-${slugify(title)}-${k++}.md`);
    const meta = [['Art', n.kind], ['Person', n.person], ['An', n.to], ['Vorgang', n.caseTitle], ['Aktenzeichen', n.ref], ['Erinnerung', n.reminder]]
      .filter(x => oneLine(x[1])).map(x => `- **${x[0]}:** ${oneLine(x[1], 300)}`).join('\n');
    const text = `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\nsource: office-home\nkind: ${JSON.stringify(oneLine(n.kind, 60) || 'Notiz')}\n---\n# ${title}\n\n${meta ? meta + '\n\n' : ''}${String(n.body || '').replace(/\r\n/g, '\n').trim()}\n`;
    writeAtomic(file, text);
    let indexed = true; if (info.art !== 'obsidian') { try { await memRun(root, ['index', '--quick']); } catch (err) { indexed = false; } }
    return { ok: true, file: path.relative(root, file), indexed };
  } catch (err) { return { ok: false, message: err.message }; }
});
// Erinnerung: neue Zeile unter „## Active“ in .memory/context/todos.md (gleiches Format wie das Dashboard).
ipcMain.handle('oh:memTask', async (e, root, t) => {
  try {
    const info = memInfo(root); t = t || {};
    if (info.art === 'obsidian') {
      // Obsidian: Aufgabenliste „Home Office/Erinnerungen.md“ im Format des Tasks-Plugins (📅 Fälligkeit)
      const title = oneLine(t.title, 200); if (!title) throw new Error('Erinnerung ohne Text.');
      const dir = path.join(root, 'Home Office'); fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, 'Erinnerungen.md');
      let src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# Erinnerungen aus Home Office\n\n';
      if (!src.endsWith('\n')) src += '\n';
      const note = oneLine(t.note, 300);
      writeAtomic(file, src + `- [ ] ${title} 📅 ${isoDay(t.due)}${note ? ' – ' + note : ''}\n`);
      return { ok: true, id: 'obsidian' };
    }
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
    minWidth: 640, minHeight: 420, title: 'Büro – ' + NAME(), autoHideMenuBar: true,
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

// ---------- E-Mail: IMAP-Abruf und SMTP-Versand ----------
require('./mail-main.js')({ app, ipcMain, safeStorage });
require('./ordner-main.js')({ app, ipcMain, dialog, shell, getWin: () => win });

app.on('second-instance', () => showWin());
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  app.setAppUserModelId('de.leon.officehome');
  createWindow();
  if (bgPrefs().tray) makeTray();
  applyAutostart();
  // Beim Start still nach Updates suchen; die Oberfläche zeigt dann einen Hinweis.
  // … und danach alle 10 Minuten (die Oberfläche meldet eine neue Version nur einmal je Version)
  if (app.isPackaged) win.webContents.once('did-finish-load', () => { setTimeout(() => getUpdater().checkForUpdates().catch(() => {}), 4000); setInterval(() => getUpdater().checkForUpdates().catch(() => {}), 10 * 60 * 1000); });
});
app.on('window-all-closed', () => { if (quitting || !bgPrefs().tray) app.quit(); });
ipcMain.handle('oh:trayEnsure', () => { if (bgPrefs().tray) makeTray(); else if (tray) { tray.destroy(); tray = null; } return true; });
