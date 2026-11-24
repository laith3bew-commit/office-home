// Brücke für das Büro im eigenen Fenster: Nachrichten vom und zum Office-Home-Hauptfenster (über den Hauptprozess).
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bueroBridge', {
  send: (m) => ipcRenderer.send('oh:bueroVonFenster', m),
  on: (cb) => ipcRenderer.on('oh:bueroMsg', (e, m) => cb(m))
});
