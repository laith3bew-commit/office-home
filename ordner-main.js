// Home Office – Ordner je Person (ohne Gedächtnis-Engine): wählen/anlegen, Dateien auflisten, lesen, ablegen, durchsuchen.
// Zugriff nur innerhalb des übergebenen Ordners (kein „..“, keine Pfade außerhalb). Gelöscht oder verschoben wird nie etwas.
'use strict';
const path = require('path');
const fs = require('fs');

module.exports = function ({ app, ipcMain, dialog, shell, getWin }) {
  const ENDUNGEN = /\.(pdf|jpe?g|png|webp|heic|heif|docx?|txt|md|odt|rtf|xlsx?|eml)$/i;
  const LESBAR = /\.(txt|md|eml)$/i;
  const sicher = s => String(s || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Datei';
  const istOrdner = d => { try { return !!d && path.isAbsolute(d) && fs.statSync(d).isDirectory(); } catch (e) { return false; } };
  // relativer Pfad → absoluter Pfad, nur wenn er wirklich im Ordner liegt
  const innen = (dir, rel) => { const abs = path.resolve(dir, String(rel || '')); const r = path.relative(dir, abs); if (!r || r.startsWith('..') || path.isAbsolute(r)) return null; return abs; };
  function liste(dir, max) {
    const out = [];
    const geh = (d, tiefe) => {
      if (out.length >= max || tiefe > 4) return;
      let eintr = []; try { eintr = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
      for (const e of eintr) {
        if (out.length >= max) return;
        if (e.name.startsWith('.') || e.name.startsWith('~$')) continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) { geh(p, tiefe + 1); continue; }
        if (!ENDUNGEN.test(e.name)) continue;
        try { const st = fs.statSync(p); out.push({ rel: path.relative(dir, p), name: e.name, size: st.size, mtime: st.mtime.toISOString() }); } catch (err) {}
      }
    };
    geh(dir, 0);
    return out.sort((a, b) => b.mtime.localeCompare(a.mtime));
  }

  ipcMain.handle('oh:ordnerWaehlen', async (e, titel) => {
    const r = await dialog.showOpenDialog(getWin(), { title: titel || 'Ordner wählen', properties: ['openDirectory', 'createDirectory'], defaultPath: app.getPath('documents') });
    return r.canceled || !r.filePaths[0] ? '' : r.filePaths[0];
  });
  // Neuer Ordner unter „Dokumente\Home Office\<Name>“ (z. B. „Vater“)
  ipcMain.handle('oh:ordnerAnlegen', (e, name) => {
    try { const d = path.join(app.getPath('documents'), 'Home Office', sicher(name)); fs.mkdirSync(d, { recursive: true }); return { ok: true, pfad: d }; }
    catch (err) { return { ok: false, message: String(err.message || err) }; }
  });
  ipcMain.handle('oh:ordnerListe', (e, dir, max) => {
    if (!istOrdner(dir)) return { ok: false, message: 'Ordner nicht gefunden.' };
    return { ok: true, dateien: liste(dir, Math.min(2000, Number(max) || 1000)) };
  });
  ipcMain.handle('oh:ordnerLesen', (e, dir, rel) => {
    if (!istOrdner(dir)) return { ok: false, message: 'Ordner nicht gefunden.' };
    const abs = innen(dir, rel); if (!abs) return { ok: false, message: 'Ungültiger Pfad.' };
    try { const st = fs.statSync(abs); if (st.size > 40 * 1024 * 1024) return { ok: false, message: 'Datei ist zu groß (über 40 MB).' }; return { ok: true, name: path.basename(abs), data: new Uint8Array(fs.readFileSync(abs)) }; }
    catch (err) { return { ok: false, message: String(err.message || err) }; }
  });
  // Neues Dokument als Kopie in „<Ordner>\Home Office\“ ablegen (vorhandene Dateien werden nie überschrieben)
  ipcMain.handle('oh:ordnerSchreiben', (e, dir, name, data) => {
    if (!istOrdner(dir)) return { ok: false, message: 'Ordner nicht gefunden.' };
    try {
      const ziel = path.join(dir, 'Home Office'); fs.mkdirSync(ziel, { recursive: true });
      const n = sicher(name), ext = path.extname(n), stamm = n.slice(0, n.length - ext.length);
      let p = path.join(ziel, n), i = 2; while (fs.existsSync(p)) p = path.join(ziel, stamm + ' (' + (i++) + ')' + ext);
      fs.writeFileSync(p, Buffer.from(data));
      return { ok: true, rel: path.relative(dir, p) };
    } catch (err) { return { ok: false, message: String(err.message || err) }; }
  });
  // Suche: Dateinamen + Inhalt von Textdateien (für die Frage-Leiste)
  ipcMain.handle('oh:ordnerSuche', (e, dir, q) => {
    if (!istOrdner(dir)) return { ok: false, message: 'Ordner nicht gefunden.' };
    const woerter = String(q || '').toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 8); if (!woerter.length) return { ok: true, hits: [] };
    const hits = [];
    for (const f of liste(dir, 2000)) {
      const nm = f.rel.toLowerCase(); let punkte = woerter.filter(w => nm.includes(w)).length, snippet = '';
      if (LESBAR.test(f.name) && f.size < 1024 * 1024) {
        try { const t = fs.readFileSync(path.join(dir, f.rel), 'utf8'), tl = t.toLowerCase();
          for (const w of woerter) { const i = tl.indexOf(w); if (i >= 0) { punkte++; if (!snippet) snippet = t.slice(Math.max(0, i - 80), i + 160).replace(/\s+/g, ' '); } } } catch (err) {}
      }
      if (punkte) hits.push({ rel: f.rel, title: f.name, snippet, punkte });
    }
    return { ok: true, hits: hits.sort((a, b) => b.punkte - a.punkte).slice(0, 20) };
  });
  ipcMain.handle('oh:ordnerOeffnen', async (e, dir, rel) => {
    if (!istOrdner(dir)) return { ok: false };
    const abs = rel ? innen(dir, rel) : dir; if (!abs) return { ok: false };
    const err = await shell.openPath(abs); return { ok: !err };
  });
};
