// Home Office – Aktivierungsschlüssel erzeugen (nur für Leon, nie mit ausliefern)
//
//   node werkzeuge\lizenz.js init                         einmalig: Schlüsselpaar anlegen
//   node werkzeuge\lizenz.js neu <Geräte-ID> "<Kunde>"     Schlüssel für ein Gerät erzeugen
//   node werkzeuge\lizenz.js pruefen <Schlüssel>           Schlüssel ansehen und Signatur prüfen
//
// Der private Schlüssel liegt nur hier: %USERPROFILE%\.officehome-lizenz\private.pem
// Wer ihn hat, kann beliebig viele Aktivierungsschlüssel erzeugen → sichern (z. B. USB-Stick), nie weitergeben,
// nie ins Repository. Der öffentliche Schlüssel steht in lizenz-main.js (PUBLIC_KEY).
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = path.join(os.homedir(), '.officehome-lizenz');
const PRIV = path.join(DIR, 'private.pem'), PUB = path.join(DIR, 'public.pem'), LOG = path.join(DIR, 'ausgegeben.csv');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const ID_RX = /^[A-Z2-7]{5}-[A-Z2-7]{5}-[A-Z2-7]{5}-[A-Z2-7]{5}$/;

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'init') {
  if (fs.existsSync(PRIV)) { console.log('Schlüsselpaar gibt es schon: ' + PRIV + '\nNICHT neu anlegen – sonst werden alle ausgegebenen Schlüssel ungültig.'); process.exit(1); }
  fs.mkdirSync(DIR, { recursive: true });
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(PRIV, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(PUB, publicKey.export({ type: 'spki', format: 'pem' }));
  console.log('Angelegt: ' + PRIV + '\nÖffentlicher Schlüssel (in lizenz-main.js als PUBLIC_KEY eintragen):\n' + fs.readFileSync(PUB, 'utf8'));
} else if (cmd === 'neu') {
  const id = String(a || '').trim().toUpperCase();
  if (!ID_RX.test(id)) { console.log('Geräte-ID ungültig. Form: XXXXX-XXXXX-XXXXX-XXXXX (steht im Programm unter Einstellungen → Allgemein → Aktivierung).'); process.exit(1); }
  if (!fs.existsSync(PRIV)) { console.log('Kein privater Schlüssel. Zuerst: node werkzeuge\\lizenz.js init'); process.exit(1); }
  const payload = Buffer.from(JSON.stringify({ v: 1, g: id, k: String(b || '').trim().slice(0, 60), d: new Date().toISOString().slice(0, 10) }), 'utf8');
  const sig = crypto.sign(null, payload, crypto.createPrivateKey(fs.readFileSync(PRIV)));
  const key = 'HO1-' + b64u(payload) + '.' + b64u(sig);
  fs.appendFileSync(LOG, `${new Date().toISOString()};${id};${String(b || '').replace(/;/g, ',')}\n`);
  console.log('\nAktivierungsschlüssel für ' + id + (b ? ' (' + b + ')' : '') + ':\n\n' + key + '\n');
} else if (cmd === 'pruefen') {
  try {
    const m = /^HO1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(a || '').replace(/\s+/g, ''));
    if (!m) throw new Error('Form falsch');
    const p = unb64u(m[1]), ok = crypto.verify(null, p, crypto.createPublicKey(fs.readFileSync(PUB)), unb64u(m[2]));
    console.log(JSON.parse(p.toString('utf8')), ok ? '\nSignatur gültig' : '\nSignatur UNGÜLTIG');
  } catch (e) { console.log('Ungültig: ' + e.message); }
} else {
  console.log('Befehle: init | neu <Geräte-ID> "<Kunde>" | pruefen <Schlüssel>');
}
