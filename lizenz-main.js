// Home Office – Aktivierung (Hauptprozess)
// Ohne gültigen Aktivierungsschlüssel läuft nur der Demo-Modus. Ein Schlüssel gilt für genau ein Gerät:
// Er enthält die Geräte-ID (aus der Windows-MachineGuid abgeleitet) und ist mit Leons privatem Ed25519-Schlüssel
// signiert (werkzeuge/lizenz.js). Hier steht nur der öffentliche Schlüssel – damit lässt sich nur prüfen, nicht erzeugen.
// Gespeichert wird der Schlüssel in oh-prefs.json („lizenz“).
'use strict';
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAwRF6jpiWDILNuYIq+WU4GVW1tcU2/F6KKq5txZ07eHA=
-----END PUBLIC KEY-----`;

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buf, n) { let bits = '', out = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; out.length < n; i += 5) out += B32[parseInt(bits.substr(i, 5), 2)]; return out; }
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

let geraetCache = null;
function maschinenKennung() {
  try {
    const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid', '/reg:64'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
    const m = /MachineGuid\s+REG_SZ\s+([0-9a-f-]+)/i.exec(out); if (m) return m[1].toLowerCase();
  } catch (e) {}
  return null;
}
// Geräte-ID: XXXXX-XXXXX-XXXXX-XXXXX (100 Bit aus SHA-256 der MachineGuid)
function geraeteId() {
  if (geraetCache) return geraetCache;
  const g = maschinenKennung(); if (!g) return null;
  const s = base32(crypto.createHash('sha256').update('home-office|' + g).digest(), 20);
  return (geraetCache = s.match(/.{5}/g).join('-'));
}

function pruefe(key) {
  const id = geraeteId();
  if (!id) return { aktiv: false, geraet: null, fehler: 'Die Geräte-ID konnte nicht gelesen werden.' };
  if (!key) return { aktiv: false, geraet: id };
  const m = /^HO1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(key).replace(/\s+/g, ''));
  if (!m) return { aktiv: false, geraet: id, fehler: 'Das ist kein gültiger Aktivierungsschlüssel (er beginnt mit „HO1-“).' };
  let p; try {
    const payload = unb64u(m[1]);
    if (!crypto.verify(null, payload, crypto.createPublicKey(PUBLIC_KEY), unb64u(m[2]))) return { aktiv: false, geraet: id, fehler: 'Der Aktivierungsschlüssel ist ungültig.' };
    p = JSON.parse(payload.toString('utf8'));
  } catch (e) { return { aktiv: false, geraet: id, fehler: 'Der Aktivierungsschlüssel ist ungültig.' }; }
  if (p.g !== id) return { aktiv: false, geraet: id, fehler: 'Dieser Schlüssel gehört zu einem anderen Gerät. Ein Schlüssel gilt nur für ein Gerät.' };
  return { aktiv: true, geraet: id, kunde: p.k || '', datum: p.d || '' };
}

module.exports = ({ ipcMain, prefsRead, prefsWrite }) => {
  ipcMain.handle('oh:lizenzStatus', () => pruefe(prefsRead().lizenz));
  ipcMain.handle('oh:lizenzSetzen', (e, key) => {
    const r = pruefe(String(key || '').trim());
    if (r.aktiv) { const p = prefsRead(); p.lizenz = String(key).replace(/\s+/g, ''); prefsWrite(p); }
    return r;
  });
  ipcMain.handle('oh:lizenzEntfernen', () => { const p = prefsRead(); delete p.lizenz; prefsWrite(p); return pruefe(null); });
};
module.exports.pruefe = pruefe;
module.exports.geraeteId = geraeteId;
