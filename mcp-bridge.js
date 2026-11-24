// Home Office – MCP-Brücke (stdio) für Claude Desktop / Claude Code.
// Läuft als eigener Node-Prozess (Home Office.exe mit ELECTRON_RUN_AS_NODE=1) und leitet jeden
// Werkzeugaufruf an das laufende Home Office weiter (nur 127.0.0.1, mit Zugangsschlüssel aus mcp.json).
// Keine Abhängigkeiten, keine Daten auf der Festplatte außer dem Lesen von mcp.json.
'use strict';
const http = require('http');
const fs = require('fs');

const CFG = process.env.OH_MCP_FILE || '';
const P = (desc, props = {}, req = []) => ({ type: 'object', properties: props, required: req, additionalProperties: false, description: desc });
const s = d => ({ type: 'string', description: d }), n = d => ({ type: 'number', description: d });
const person = s('Person: Rolle (z. B. „Vater“, „Mutter“), Name oder ID. Leer = alle.');

const TOOLS = [
  ['uebersicht', 'Gesamtüberblick: überfällige und anstehende Fristen, offene Vorgänge, Geldfluss des Monats, Kontostand.', P('', { person })],
  ['fristen', 'Offene Fristen und Aufgaben (auch überfällige) der nächsten Tage, inklusive Kündigungsfristen von Verträgen.', P('', { tage: n('Zeitraum in Tagen, Standard 30'), person })],
  ['vorgaenge', 'Vorgänge (Akten) auflisten, z. B. Anträge, Widersprüche.', P('', { status: s('offen | in Bearbeitung | wartet auf Antwort | erledigt | alle (Standard: alle außer erledigt)'), person })],
  ['vorgang', 'Einen Vorgang vollständig lesen: Schritte, Verlauf, Fristen, Dokumente, Briefe.', P('', { id: s('ID des Vorgangs'), suche: s('oder Teil des Titels') })],
  ['suchen', 'Volltextsuche über Vorgänge, Aufgaben, Dokumente, Briefe, Kontakte, Notizen und Verträge.', P('', { text: s('Suchbegriff') }, ['text'])],
  ['finanzen', 'Einnahmen und Ausgaben eines Monats nach Kategorie und Person, Kontostand und Prognose.', P('', { monat: s('JJJJ-MM, Standard: aktueller Monat'), person })],
  ['buchungen', 'Einzelne Buchungen (Einnahmen/Ausgaben, auch automatische Vertragszahlungen) auflisten.', P('', { von: s('JJJJ-MM-TT'), bis: s('JJJJ-MM-TT'), kategorie: s('z. B. Lebensmittel'), art: s('ein | aus'), person })],
  ['vertraege', 'Laufende Verträge mit Betrag, Intervall, Laufzeit und Kündigungsfrist.', P('', { person })],
  ['kontakte', 'Adressbuch durchsuchen (Behörden, Firmen, Privatpersonen) mit Anschrift, Telefon, E-Mail.', P('', { suche: s('Name, Ort …') })],
  ['personen', 'Die vertretenen Personen mit Stammdaten und Vollmacht.', P('')],
  ['aufgabe_anlegen', 'Neue Aufgabe / Frist anlegen (nur wenn Schreiben erlaubt ist).', P('', { titel: s('Was ist zu tun'), faellig: s('JJJJ-MM-TT'), person, vorgang_id: s('optional'), prioritaet: s('normal | hoch | niedrig'), notiz: s('optional') }, ['titel'])],
  ['aufgabe_erledigen', 'Eine Aufgabe als erledigt markieren (nur wenn Schreiben erlaubt ist).', P('', { id: s('ID der Aufgabe') }, ['id'])],
  ['notiz_anlegen', 'Notiz speichern (nur wenn Schreiben erlaubt ist).', P('', { titel: s('Titel'), inhalt: s('Text'), person }, ['titel', 'inhalt'])],
  ['verlauf_eintragen', 'Eintrag in den Verlauf eines Vorgangs schreiben (nur wenn Schreiben erlaubt ist).', P('', { vorgang_id: s('ID des Vorgangs'), text: s('Eintrag'), datum: s('JJJJ-MM-TT, Standard heute') }, ['vorgang_id', 'text'])],
  ['brief_entwurf', 'Briefentwurf (DIN 5008) speichern; er erscheint unter „Brief schreiben“ zum Prüfen und Drucken (nur wenn Schreiben erlaubt ist).', P('', { betreff: s('Betreff'), text: s('Brieftext ohne Anrede und Gruß'), person, kontakt_id: s('Empfänger aus dem Adressbuch'), empfaenger: s('oder Anschrift als Text, Zeilen mit \\n'), vorgang_id: s('optional'), anrede: s('Standard: Sehr geehrte Damen und Herren,') }, ['betreff', 'text'])],
  ['buchung_anlegen', 'Einnahme oder Ausgabe erfassen (nur wenn Schreiben erlaubt ist).', P('', { datum: s('JJJJ-MM-TT'), art: s('ein | aus'), betrag: n('Betrag in Euro, positiv'), kategorie: s('z. B. Lebensmittel, Rente'), person, beschreibung: s('optional'), empfaenger: s('optional') }, ['art', 'betrag'])]
].map(([name, description, inputSchema]) => ({ name, description, inputSchema }));

function callApp(tool, args) {
  return new Promise(resolve => {
    let cfg;
    try { cfg = JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch (e) { return resolve({ ok: false, error: 'Home Office ist nicht geöffnet oder die Claude-Verbindung ist in den Einstellungen ausgeschaltet.' }); }
    const body = JSON.stringify({ tool, args: args || {} });
    const req = http.request({ host: '127.0.0.1', port: cfg.port, path: '/call', method: 'POST', timeout: 20000,
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'x-oh-token': cfg.token } }, res => {
      let d = ''; res.setEncoding('utf8'); res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ ok: false, error: 'Ungültige Antwort von Home Office.' }); } });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => resolve({ ok: false, error: 'Home Office ist nicht geöffnet. Bitte das Programm starten und erneut versuchen.' }));
    req.end(body);
  });
}

const send = msg => process.stdout.write(JSON.stringify(msg) + '\n');
async function handle(m) {
  if (m.id === undefined) return; // Benachrichtigungen (z. B. notifications/initialized)
  const ok = result => send({ jsonrpc: '2.0', id: m.id, result });
  switch (m.method) {
    case 'initialize':
      return ok({ protocolVersion: (m.params && m.params.protocolVersion) || '2025-06-18', capabilities: { tools: {} },
        serverInfo: { name: 'office-home', version: '1.0.0' },
        instructions: 'Home Office ist das Familienbüro des Nutzers (Fristen, Vorgänge, Briefe, Finanzen seiner Eltern). Antworte auf Deutsch, außer der Nutzer schreibt in einer anderen Sprache. Schreibende Werkzeuge nur nach ausdrücklichem Wunsch des Nutzers verwenden.' });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS });
    case 'tools/call': {
      const name = m.params && m.params.name;
      if (!TOOLS.some(t => t.name === name)) return send({ jsonrpc: '2.0', id: m.id, error: { code: -32602, message: 'Unbekanntes Werkzeug: ' + name } });
      const r = await callApp(name, m.params.arguments);
      return ok({ content: [{ type: 'text', text: r.ok ? String(r.text || '') : String(r.error || 'Fehler') }], isError: !r.ok });
    }
    default: return send({ jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Methode nicht unterstützt: ' + m.method } });
  }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk; let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let m; try { m = JSON.parse(line); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
    handle(m).catch(e => m.id !== undefined && send({ jsonrpc: '2.0', id: m.id, error: { code: -32603, message: String(e && e.message || e) } }));
  }
});
process.stdin.on('end', () => process.exit(0));
