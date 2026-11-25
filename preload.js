// Brücke zwischen Oberfläche (OfficeHome.html) und Desktop-Funktionen.
// Die Oberfläche läuft weiterhin auch im Browser; dort fehlt window.officeHome einfach.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('officeHome', {
  desktop: true,
  // Speichert den aktuellen Inhalt von #print-root als PDF (Speichern-Dialog).
  savePDF: (fileName) => ipcRenderer.invoke('oh:savePDF', fileName),
  pdfDaten: () => ipcRenderer.invoke('oh:pdfDaten'),
  ordnerWaehlen: (titel) => ipcRenderer.invoke('oh:ordnerWaehlen', titel),
  ordnerAnlegen: (name) => ipcRenderer.invoke('oh:ordnerAnlegen', name),
  ordnerListe: (dir, max) => ipcRenderer.invoke('oh:ordnerListe', dir, max),
  ordnerLesen: (dir, rel) => ipcRenderer.invoke('oh:ordnerLesen', dir, rel),
  ordnerSchreiben: (dir, name, data) => ipcRenderer.invoke('oh:ordnerSchreiben', dir, name, data),
  ordnerSuche: (dir, q) => ipcRenderer.invoke('oh:ordnerSuche', dir, q),
  ordnerOeffnen: (dir, rel) => ipcRenderer.invoke('oh:ordnerOeffnen', dir, rel),
  // Öffnet den Druckdialog von Windows für den Inhalt von #print-root.
  print: () => ipcRenderer.invoke('oh:print'),
  // Öffnet ein gespeichertes Dokument mit dem Standardprogramm von Windows.
  openFile: (name, buffer) => ipcRenderer.invoke('oh:openFile', name, buffer),
  version: () => ipcRenderer.invoke('oh:version'),
  setTheme: (v) => ipcRenderer.invoke('oh:setTheme', v),
  // Programm-Update (GitHub Releases)
  updateCheck: () => ipcRenderer.invoke('oh:updateCheck'),
  updateDownload: () => ipcRenderer.invoke('oh:updateDownload'),
  updateInstall: () => ipcRenderer.invoke('oh:updateInstall'),
  onUpdate: (cb) => ipcRenderer.on('oh:update', (e, data) => cb(data)),
  // Gedächtnis (Memory-Engine)
  memPickRoot: () => ipcRenderer.invoke('oh:memPickRoot'),
  memStatus: (root) => ipcRenderer.invoke('oh:memStatus', root),
  memSearch: (root, ws, query, strict) => ipcRenderer.invoke('oh:memSearch', root, ws, query, !!strict),
  memPickDir: (root, current) => ipcRenderer.invoke('oh:memPickDir', root, current),
  memCopyFile: (root, ws, name, buf) => ipcRenderer.invoke('oh:memCopyFile', root, ws, name, buf),
  onReminder: (cb) => ipcRenderer.on('oh:reminder', (e, r) => cb(r)),
  // E-Mail
  mailKonten: () => ipcRenderer.invoke('oh:mailKonten'),
  mailKontoSpeichern: (konto, pass) => ipcRenderer.invoke('oh:mailKontoSpeichern', konto, pass),
  mailKontoLoeschen: (id) => ipcRenderer.invoke('oh:mailKontoLoeschen', id),
  mailAbrufen: (id, opts) => ipcRenderer.invoke('oh:mailAbrufen', id, opts),
  mailSenden: (id, m) => ipcRenderer.invoke('oh:mailSenden', id, m),
  mailGesendet: (id, n) => ipcRenderer.invoke('oh:mailGesendet', id, n),
  mailEinzeln: (id, uid, ordner) => ipcRenderer.invoke('oh:mailEinzeln', id, uid, ordner),
  memNote: (root, ws, note) => ipcRenderer.invoke('oh:memNote', root, ws, note),
  memTask: (root, task) => ipcRenderer.invoke('oh:memTask', root, task),
  // Claude-Anbindung (MCP): Server an/aus, Einrichtung, Werkzeugaufrufe aus Claude beantworten
  mcpEnable: (on) => ipcRenderer.invoke('oh:mcpEnable', !!on),
  mcpInfo: () => ipcRenderer.invoke('oh:mcpInfo'),
  mcpInstallDesktop: () => ipcRenderer.invoke('oh:mcpInstallDesktop'),
  // Scanner
  makePdf: (parts, title) => ipcRenderer.invoke('oh:makePdf', parts, title),
  scanWia: () => ipcRenderer.invoke('oh:scanWia'),
  phoneStart: () => ipcRenderer.invoke('oh:phoneStart'),
  phoneStop: () => ipcRenderer.invoke('oh:phoneStop'),
  watchPick: () => ipcRenderer.invoke('oh:watchPick'),
  watchSet: (dir) => ipcRenderer.invoke('oh:watchSet', dir),
  onScanIncoming: (cb) => ipcRenderer.on('oh:scanIncoming', (e, d) => cb(d)),
  onPhoneDone: (cb) => ipcRenderer.on('oh:phoneDone', (e, d) => cb(d)),
  onPhoneState: (cb) => ipcRenderer.on('oh:phoneState', (e, d) => cb(d)),
  // Kalender: KI (Gemini), Google Kalender, Erinnerungen, Hintergrund
  kiStatus: () => ipcRenderer.invoke('oh:kiStatus'),
  kiSetKey: (key, model) => ipcRenderer.invoke('oh:kiSetKey', key, model),
  kiAnalyze: (doc) => ipcRenderer.invoke('oh:kiAnalyze', doc),
  kiSchreiben: (doc) => ipcRenderer.invoke('oh:kiSchreiben', doc),
  gStatus: () => ipcRenderer.invoke('oh:gStatus'),
  gSetClient: (id, secret) => ipcRenderer.invoke('oh:gSetClient', id, secret),
  gConnect: () => ipcRenderer.invoke('oh:gConnect'),
  gDisconnect: () => ipcRenderer.invoke('oh:gDisconnect'),
  // Vollmacht als Google-Drive-Freigabelink
  gDriveShare: (name, type, buf, fileId) => ipcRenderer.invoke('oh:gDriveShare', name, type, buf, fileId),
  gDriveUnshare: (fileId) => ipcRenderer.invoke('oh:gDriveUnshare', fileId),
  gList: (from, to) => ipcRenderer.invoke('oh:gList', from, to),
  gUpsert: (ev, id) => ipcRenderer.invoke('oh:gUpsert', ev, id),
  gDelete: (id) => ipcRenderer.invoke('oh:gDelete', id),
  gKalender: () => ipcRenderer.invoke('oh:gKalender'),
  gKalenderSetzen: (id, name) => ipcRenderer.invoke('oh:gKalenderSetzen', id, name),
  gMove: (id, von, nach) => ipcRenderer.invoke('oh:gMove', id, von, nach),
  remindSet: (list) => ipcRenderer.invoke('oh:remindSet', list),
  bgGet: () => ipcRenderer.invoke('oh:bgGet'),
  bgSet: (v) => ipcRenderer.invoke('oh:bgSet', v),
  trayEnsure: () => ipcRenderer.invoke('oh:trayEnsure'),
  setLang: (l) => ipcRenderer.invoke('oh:setLang', l),
  setAppName: (n) => ipcRenderer.invoke('oh:setAppName', n),
  // Aktivierung (ein Schlüssel je Gerät)
  lizenzStatus: () => ipcRenderer.invoke('oh:lizenzStatus'),
  lizenzSetzen: (k) => ipcRenderer.invoke('oh:lizenzSetzen', k),
  lizenzEntfernen: () => ipcRenderer.invoke('oh:lizenzEntfernen'),
  systemPruefen: () => ipcRenderer.invoke('oh:systemPruefen'),
  // Büro im eigenen Fenster
  bueroFenster: (theme) => ipcRenderer.invoke('oh:bueroFenster', theme),
  bueroAnFenster: (m) => ipcRenderer.send('oh:bueroAnFenster', m),
  bueroZu: () => ipcRenderer.invoke('oh:bueroZu'),
  bueroTheme: (theme) => ipcRenderer.invoke('oh:bueroTheme', theme),
  bueroOffen: () => ipcRenderer.invoke('oh:bueroOffen'),
  onBueroVonFenster: (cb) => ipcRenderer.on('oh:bueroVonFenster', (e, m) => cb(m)),
  onBueroZu: (cb) => ipcRenderer.on('oh:bueroZu', () => cb()),
  onOpenCal: (cb) => ipcRenderer.on('oh:openCal', (e, ref) => cb(ref)),
  onMcpCall: (cb) => ipcRenderer.on('oh:mcpCall', async (e, m) => {
    let r; try { r = await cb(m.tool, m.args); } catch (err) { r = { ok: false, error: String(err && err.message || err) }; }
    ipcRenderer.send('oh:mcpReply', m.id, r);
  })
});
