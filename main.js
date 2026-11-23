// Office Home – Desktop-Programm (Electron-Hauptprozess)
'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Nur eine Instanz erlauben (sonst greifen zwei Fenster gleichzeitig auf die Datenbank zu).
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    title: 'Office Home',
    backgroundColor: '#f3f5f9',
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
ipcMain.handle('oh:updateInstall', () => { setImmediate(() => getUpdater().quitAndInstall(true, true)); return { ok: true }; });

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
    const date = isoDay(n.date); const title = oneLine(n.title, 160) || 'Eintrag aus Office Home';
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

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  // Beim Start still nach Updates suchen; die Oberfläche zeigt dann einen Hinweis.
  if (app.isPackaged) win.webContents.once('did-finish-load', () => setTimeout(() => getUpdater().checkForUpdates().catch(() => {}), 4000));
});
app.on('window-all-closed', () => app.quit());
