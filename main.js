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

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  // Beim Start still nach Updates suchen; die Oberfläche zeigt dann einen Hinweis.
  if (app.isPackaged) win.webContents.once('did-finish-load', () => setTimeout(() => getUpdater().checkForUpdates().catch(() => {}), 4000));
});
app.on('window-all-closed', () => app.quit());
