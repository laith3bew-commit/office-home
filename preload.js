// Brücke zwischen Oberfläche (OfficeHome.html) und Desktop-Funktionen.
// Die Oberfläche läuft weiterhin auch im Browser; dort fehlt window.officeHome einfach.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('officeHome', {
  desktop: true,
  // Speichert den aktuellen Inhalt von #print-root als PDF (Speichern-Dialog).
  savePDF: (fileName) => ipcRenderer.invoke('oh:savePDF', fileName),
  // Öffnet den Druckdialog von Windows für den Inhalt von #print-root.
  print: () => ipcRenderer.invoke('oh:print'),
  // Öffnet ein gespeichertes Dokument mit dem Standardprogramm von Windows.
  openFile: (name, buffer) => ipcRenderer.invoke('oh:openFile', name, buffer),
  version: () => ipcRenderer.invoke('oh:version'),
  // Programm-Update (GitHub Releases)
  updateCheck: () => ipcRenderer.invoke('oh:updateCheck'),
  updateDownload: () => ipcRenderer.invoke('oh:updateDownload'),
  updateInstall: () => ipcRenderer.invoke('oh:updateInstall'),
  onUpdate: (cb) => ipcRenderer.on('oh:update', (e, data) => cb(data)),
  // Gedächtnis (Memory-Engine)
  memPickRoot: () => ipcRenderer.invoke('oh:memPickRoot'),
  memStatus: (root) => ipcRenderer.invoke('oh:memStatus', root),
  memSearch: (root, ws, query) => ipcRenderer.invoke('oh:memSearch', root, ws, query),
  memNote: (root, ws, note) => ipcRenderer.invoke('oh:memNote', root, ws, note),
  memTask: (root, task) => ipcRenderer.invoke('oh:memTask', root, task)
});
