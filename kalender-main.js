// Home Office – Kalender (Hauptprozess): Gemini (Dokumente lesen), Google Kalender (zweiseitig) und Erinnerungen.
// Geheimnisse (Gemini-Schlüssel, Google-Client, Google-Anmeldung) liegen nur lokal, verschlüsselt mit safeStorage.
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');

module.exports = function setupKalender({ app, ipcMain, shell, safeStorage, Notification, getWin, showWin }) {
  const file = n => path.join(app.getPath('userData'), n);
  const readJson = (n, d) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch (e) { return d; } };
  const writeJson = (n, v) => { const f = file(n), t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(v), { encoding: 'utf8', mode: 0o600 }); fs.renameSync(t, f); };

  // ---------- Geheimnisse ----------
  function secrets() {
    const raw = readJson('oh-secrets.json', {});
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      try { out[k] = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(v, 'base64')) : ''; } catch (e) { out[k] = ''; }
    }
    return out;
  }
  function setSecret(k, v) {
    const raw = readJson('oh-secrets.json', {});
    if (!v) delete raw[k];
    else {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows-Verschlüsselung ist nicht verfügbar.');
      raw[k] = safeStorage.encryptString(String(v)).toString('base64');
    }
    writeJson('oh-secrets.json', raw);
  }
  const errText = e => String(e && e.message || e).split('\n')[0];

  // ---------- Gemini: Dokument lesen ----------
  const PROMPT = (ctx) => `Du liest einen Brief oder ein Dokument (deutsch, meist von einer Behörde, Kasse, Ärztin oder Firma) für einen Bevollmächtigten, der die Angelegenheiten seiner Eltern erledigt.
Heute ist ${ctx.today}. Personen, für die er handelt (genau so zurückgeben): ${ctx.persons.map(p => `"${p.label}" (${p.name})`).join(', ') || 'keine'}.
Antworte NUR mit JSON nach diesem Schema, ohne Erklärungen:
{
 "zusammenfassung": "${ctx.lang === 'ar' ? '2–3 Sätze auf einfachem Hocharabisch (Ziffern 0–9, Datum wie 24.11.2026); deutsche Amtsbegriffe in Klammern dahinter, z. B. اعتراض (Widerspruch): worum geht es, was wird verlangt, bis wann' : '2–3 Sätze auf Deutsch: worum geht es, was wird verlangt, bis wann'}",
 "person": "Bezeichnung der betroffenen Person aus der Liste oder leer",
 "absender": "Name der Behörde / Firma / Praxis",
 "kontakte": [ { "organisation": "Behörde/Firma", "abteilung": "Abteilung, Fachbereich oder Team", "name": "Vor- und Nachname der zuständigen Person mit Anrede (z. B. Frau Anna Weber) oder leer",
   "funktion": "Zuständigkeit / Funktion der Person", "strasse": "", "plz": "", "ort": "", "telefon": "", "fax": "", "email": "" } ],
 "termine": [ { "titel": "kurzer Titel", "datum": "JJJJ-MM-TT", "uhrzeit": "HH:MM oder leer", "art": "termin (Termin mit Uhrzeit/Anwesenheit) oder frist (Abgabe, Rückmeldung, Widerspruch)",
   "ort": "Ort/Raum oder leer", "was_tun": "konkret: was mitbringen, einreichen oder erledigen" } ],
 "gueltigkeit": [ { "was": "z. B. Bewilligung Bürgergeld", "gueltig_bis": "JJJJ-MM-TT", "erneuern": "was rechtzeitig zu beantragen oder einzureichen ist" } ],
 "nummern": [ { "art": "z. B. Versichertennummer, Krankenkasse, Aktenzeichen, Kundennummer, Vertragsnummer, BG-Nummer, Steuer-ID, Steuernummer, Rentenversicherungsnummer, IBAN, Betrag, Pflegegrad", "wert": "genau wie im Dokument" } ],
 "titel": "kurzer deutscher Titel des Schreibens, z. B. Anforderung von Unterlagen – Ausländerbehörde",
 "art": "eins von: Bescheid, Rechnung, Mahnung, Anforderung, Termin, Bestätigung, Antwort, Vertrag, Information, Werbung",
 "wichtigkeit": "hoch (Frist/Geld/Rechtsfolge, schnell handeln) | mittel (etwas zu tun, Zeit vorhanden) | niedrig (nur zur Kenntnis / Bestätigung)",
 "anliegen": "1 Satz auf Deutsch: was der Absender konkret verlangt oder mitteilt",
 "unterlagen": [ "angeforderte Unterlage 1", "…" ],
 "zahlungen": [ { "betrag": "123,45", "empfaenger": "", "iban": "", "verwendungszweck": "", "faellig": "JJJJ-MM-TT oder leer" } ]
}
Regeln: Nur Daten, die im Dokument stehen. Kontakte nur mit mindestens Organisation oder Name. Keine Kontakte für den Empfänger selbst oder die betroffene Person.
Fristen aus Formulierungen wie „innerhalb von 2 Wochen nach Erhalt“ ausrechnen (Briefdatum + Frist, Zugang 3 Tage nach Briefdatum). Bei befristeten Bewilligungen oder Bescheiden das Ende in "gueltigkeit" eintragen.`;

  // Modell: gespeichertes oder leer (= automatisch das neueste „flash“-Modell aus Googles Liste).
  // Meldet Google, dass ein Modell nicht mehr verfügbar ist, wird automatisch gewechselt und gespeichert.
  const ALT_MODELL = 'gemini-2.5-flash';
  const modellGespeichert = () => readJson('oh-prefs.json', {}).kiModel || '';
  const speichereModell = m => { const p = readJson('oh-prefs.json', {}); p.kiModel = m; writeJson('oh-prefs.json', p); };
  const veraltet = msg => /no longer available|not found|is not supported|deprecated|404/i.test(String(msg || ''));
  // Kandidaten in sinnvoller Reihenfolge, ohne die Modelle in `ohne` (die gerade gescheitert sind).
  // Wichtig: Google listet ein abgeschaltetes Modell (z. B. gemini-2.5-flash „nicht mehr für neue Nutzer“) teils weiter –
  // deshalb nie dasselbe Modell noch einmal vorschlagen.
  async function modellKandidaten(key, hinweis, ohne) {
    const raus = new Set(ohne || []);
    // Googles Meldung nennt zuerst das alte Modell, dann den Vorschlag („… please use models/gemini-3.8-flash“) → ersten Treffer nehmen, der nicht gescheitert ist
    const vorschlag = [...String(hinweis || '').matchAll(/models\/(gemini-[a-z0-9.\-]*[a-z0-9])/gi)].map(x => x[1]).find(n => !raus.has(n));
    let alle = [];
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
      const j = await r.json().catch(() => ({}));
      alle = (j.models || []).filter(x => (x.supportedGenerationMethods || []).includes('generateContent')).map(x => String(x.name || '').replace(/^models\//, ''));
    } catch (e) {}
    const ver = n => { const v = n.match(/^gemini-(\d+(?:\.\d+)?)/); return v ? parseFloat(v[1]) : 0; };
    const nachVersion = l => l.sort((a, b) => ver(b) - ver(a));
    const stabil = nachVersion(alle.filter(n => /^gemini-\d+(\.\d+)?-flash$/.test(n)));                 // gemini-3-flash, gemini-2.5-flash …
    const latest = alle.filter(n => /^gemini-flash-latest$/.test(n));                                    // Alias auf das aktuelle Flash
    const vorab = nachVersion(alle.filter(n => /^gemini-\d+(\.\d+)?-flash-preview(-[\w-]+)?$/.test(n)));  // gemini-3-flash-preview …
    const out = [];
    for (const n of [vorschlag && alle.includes(vorschlag) ? vorschlag : '', ...stabil, ...latest, ...vorab, vorschlag || '', 'gemini-flash-latest'])
      if (n && !raus.has(n) && !out.includes(n)) out.push(n);
    return out;
  }
  async function neuestesModell(key, hinweis, ohne) { return (await modellKandidaten(key, hinweis, ohne))[0] || ''; }
  ipcMain.handle('oh:kiStatus', () => { const s = secrets(); return { hasKey: !!s.gemini, model: modellGespeichert() || 'automatisch' }; });
  ipcMain.handle('oh:kiSetKey', (e, key, model) => {
    try {
      if (key !== undefined && key !== null) setSecret('gemini', String(key).trim());
      if (model !== undefined && model !== null) { const v = String(model).trim(); speichereModell(/^(automatisch|auto)?$/i.test(v) ? '' : v); }
      return { ok: true };
    } catch (err) { return { ok: false, message: errText(err) }; }
  });
  // Gemeinsame Gemini-Abfrage (Dateien + Text → JSON) mit automatischem Modellwechsel
  async function geminiJSON(teile, prompt, temperature) {
      const key = secrets().gemini; if (!key) return { ok: false, message: 'Kein Gemini-Schlüssel eingetragen (Einstellungen → Kalender & KI).' };
      let model = modellGespeichert();
      if (!model) { model = await neuestesModell(key) || ALT_MODELL; speichereModell(model); }
      const summe = teile.reduce((s, p) => s + p.data.length, 0);
      if (summe > 18 * 1024 * 1024) return { ok: false, message: 'Dateien sind zu groß für die KI (zusammen über 18 MB).' };
      const body = { contents: [{ parts: [...teile.map(p => ({ inline_data: { mime_type: p.mime, data: p.data.toString('base64') } })), { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: temperature == null ? 0.1 : temperature } };
      const frage = mdl => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mdl)}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
      let r = await frage(model), j = await r.json().catch(() => ({}));
      if (!r.ok && veraltet((j.error && j.error.message) || r.status)) {
        // Modell abgeschaltet → nacheinander die passenden neueren Modelle probieren (nie das gescheiterte), das erste funktionierende merken
        const versucht = [model];
        const kandidaten = await modellKandidaten(key, j.error && j.error.message, versucht);
        for (const neu of kandidaten.slice(0, 4)) {
          versucht.push(neu); r = await frage(neu); j = await r.json().catch(() => ({}));
          if (r.ok) { model = neu; speichereModell(neu); break; }
          if (!veraltet((j.error && j.error.message) || r.status)) { model = neu; speichereModell(neu); break; } // anderer Fehler (z. B. Kontingent) – Modell gibt es aber
        }
      }
      if (!r.ok) return { ok: false, message: (j.error && j.error.message) || ('Gemini-Fehler ' + r.status) };
      const text = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
      let out; try { out = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch (err) { return { ok: false, message: 'Antwort der KI war kein gültiges JSON.' }; }
      return { ok: true, result: out, model };
  }
  const teileAus = doc => (Array.isArray(doc.parts) ? doc.parts : doc.data ? [{ mime: doc.mime, data: doc.data }] : []).map(p => ({ mime: p.mime, data: Buffer.from(p.data) }));
  const mailKontext = doc => doc.text ? `\n\nE-Mail (Absender: ${String(doc.von || '').slice(0, 200)}, Betreff: ${String(doc.betreff || '').slice(0, 300)}):\n${String(doc.text).slice(0, 20000)}\n\nBerücksichtige E-Mail-Text und alle Anhänge zusammen.` : '';
  ipcMain.handle('oh:kiAnalyze', async (e, doc) => {
    try {
      // Eine Datei (mime/data) oder mehrere (parts) und/oder ein E-Mail-Text (text)
      const teile = teileAus(doc);
      if (!teile.length && !doc.text) return { ok: false, message: 'Nichts zum Lesen.' };
      return await geminiJSON(teile, PROMPT(doc.ctx || { persons: [], today: '' }) + mailKontext(doc));
    } catch (err) { return { ok: false, message: errText(err) }; }
  });
  // Auftrag zu einem Eingang (z. B. „Antwort schreiben“) → Briefentwurf. Nur Entwurf – Leon prüft, ändert und verschickt selbst.
  const PROMPT_BRIEF = c => `Du bist die Schreibkraft im Familienbüro „Home Office“. Heute ist ${c.today}.
Absender ist ${c.absender || 'der Bevollmächtigte'}${c.person ? ', der im Namen und in Vollmacht von ' + c.person + ' handelt' : ''}.
Vorliegend: das Schreiben bzw. die E-Mail (Dateien/Text oben) und die bisherige Auswertung:
${JSON.stringify(c.analyse || {}).slice(0, 6000)}

AUFTRAG VON LEON: ${String(c.auftrag || '').slice(0, 2000)}

Schreibe dazu einen Brief auf Deutsch (sachlich, höflich, klar, wie ein deutscher Geschäftsbrief nach DIN 5008).
Regeln:
- Nur den Brieftext: keine Absender- oder Empfängeranschrift, kein Datum, keine Unterschrift, keine Grußformel im Feld "text".
- Aktenzeichen, Kundennummern, Beträge und Daten nur verwenden, wenn sie in den Unterlagen stehen. Was fehlt oder Leon entscheiden muss, in eckige Klammern setzen, z. B. [Datum einsetzen].
${c.person ? '- Im ersten Satz einmal erwähnen, dass du in Vollmacht für ' + c.person + ' schreibst – nicht öfter.\n' : ''}- Bezug nehmen auf das Schreiben (Datum/Betreff, wenn bekannt).
- Den Auftrag genau umsetzen; nichts zusagen oder bestätigen, was Leon nicht verlangt hat.
Antworte NUR mit JSON:
{"betreff": "kurzer Betreff (mit Aktenzeichen, falls vorhanden)", "anrede": "z. B. Sehr geehrte Frau X, / Sehr geehrte Damen und Herren,", "text": "Brieftext mit Absätzen (\\n\\n)", "gruss": "Mit freundlichen Grüßen",
 "empfaenger": "Name der Stelle/Person, an die der Brief geht", "empfaenger_anschrift": "Anschrift mehrzeilig (\\n), falls bekannt, sonst leer", "email": "E-Mail-Adresse des Empfängers, falls im Schreiben genannt, sonst leer",
 "hinweis": "kurzer Hinweis an Leon auf Deutsch, was er prüfen oder ergänzen muss (leer, wenn nichts)"}`;
  ipcMain.handle('oh:kiSchreiben', async (e, doc) => {
    try {
      if (!String(doc.auftrag || '').trim()) return { ok: false, message: 'Bitte einen Auftrag eingeben.' };
      return await geminiJSON(teileAus(doc), PROMPT_BRIEF(doc.ctx || {}) + mailKontext(doc) + '\n\nAUFTRAG (noch einmal): ' + String(doc.auftrag).slice(0, 2000), 0.4);
    } catch (err) { return { ok: false, message: errText(err) }; }
  });

  // ---------- Google Kalender (OAuth für Desktop-Apps, Loopback + PKCE) ----------
  // drive.file: nur Dateien, die Home Office selbst anlegt (Vollmacht-Freigabe)
  // calendarlist.readonly: nur die Liste der Kalender lesen, damit der Kalender „Home Office“ gewählt werden kann
  const SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/drive.file';
  let gToken = null; // {access, exp}
  const gClient = () => { const s = secrets(); return { id: s.gClientId || '', secret: s.gClientSecret || '', refresh: s.gRefresh || '' }; };
  // Zielkalender: gewählt (prefs.gCalId) oder der Hauptkalender des Kontos
  const calId = () => readJson('oh-prefs.json', {}).gCalId || 'primary';
  const evPfad = (id, cal) => '/calendars/' + encodeURIComponent(cal || calId()) + '/events' + (id ? '/' + encodeURIComponent(id) : '');

  ipcMain.handle('oh:gStatus', () => { const c = gClient(); const p = readJson('oh-prefs.json', {});
    return { hasClient: !!(c.id && c.secret), connected: !!c.refresh, email: p.gEmail || '', drive: !!c.refresh && /drive\.file/.test(p.gScope || ''),
      liste: !!c.refresh && /calendarlist/.test(p.gScope || ''), calId: p.gCalId || 'primary', calName: p.gCalName || '' }; });
  // Alle Kalender, in die geschrieben werden darf (Besitzer/Bearbeiter)
  ipcMain.handle('oh:gKalender', async () => {
    try { const j = await gApi('GET', '/users/me/calendarList', null, { minAccessRole: 'writer', maxResults: '250' });
      return { ok: true, items: (j.items || []).map(k => ({ id: k.id, name: k.summaryOverride || k.summary || k.id, primary: !!k.primary, farbe: k.backgroundColor || '' })) }; }
    catch (err) { return { ok: false, message: /insufficient|scope/i.test(errText(err)) ? 'Für die Kalender-Auswahl bitte Google einmal trennen und neu verbinden.' : errText(err) }; }
  });
  ipcMain.handle('oh:gKalenderSetzen', (e, id, name) => { const p = readJson('oh-prefs.json', {}); if (!id || id === 'primary') { delete p.gCalId; delete p.gCalName; } else { p.gCalId = String(id); p.gCalName = String(name || ''); } writeJson('oh-prefs.json', p); return { ok: true }; });
  // Termin von einem Kalender in einen anderen verschieben (gleiche Termin-ID bleibt erhalten)
  ipcMain.handle('oh:gMove', async (e, googleId, von, nach) => {
    try { const j = await gApi('POST', evPfad(googleId, von) + '/move', null, { destination: nach }); return { ok: true, id: j.id, updated: j.updated }; }
    catch (err) { return { ok: false, message: errText(err) }; }
  });
  ipcMain.handle('oh:gSetClient', (e, id, secret) => {
    try { setSecret('gClientId', String(id || '').trim()); setSecret('gClientSecret', String(secret || '').trim()); return { ok: true }; }
    catch (err) { return { ok: false, message: errText(err) }; }
  });
  ipcMain.handle('oh:gDisconnect', async () => {
    const c = gClient();
    if (c.refresh) { try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(c.refresh), { method: 'POST' }); } catch (e) {} }
    setSecret('gRefresh', ''); gToken = null; const p = readJson('oh-prefs.json', {}); delete p.gEmail; delete p.gScope; writeJson('oh-prefs.json', p);
    return { ok: true };
  });
  ipcMain.handle('oh:gConnect', async () => {
    const c = gClient(); if (!c.id || !c.secret) return { ok: false, message: 'Bitte zuerst Client-ID und Client-Schlüssel eintragen.' };
    const verifier = crypto.randomBytes(48).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');
    return new Promise(resolve => {
      let done = false;
      const srv = http.createServer(async (req, res) => {
        const u = new URL(req.url, 'http://127.0.0.1');
        if (u.pathname !== '/') { res.writeHead(404); return res.end(); }
        const page = msg => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(`<!doctype html><meta charset="utf-8"><body style="font-family:Segoe UI,sans-serif;background:#F4F0E8;color:#1B2A44;display:grid;place-items:center;height:100vh"><div><h2>Home Office</h2><p>${msg}</p><p>Du kannst dieses Fenster schließen.</p></div>`); };
        if (u.searchParams.get('state') !== state) { page('Ungültige Anfrage.'); return; }
        const code = u.searchParams.get('code');
        if (!code) { page('Anmeldung abgebrochen.'); finish({ ok: false, message: 'Anmeldung abgebrochen.' }); return; }
        try {
          const redirect = `http://127.0.0.1:${srv.address().port}`;
          const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, client_id: c.id, client_secret: c.secret, redirect_uri: redirect, grant_type: 'authorization_code', code_verifier: verifier }) });
          const j = await r.json();
          if (!r.ok || !j.refresh_token) throw new Error(j.error_description || j.error || 'Keine Anmeldung erhalten.');
          setSecret('gRefresh', j.refresh_token); gToken = { access: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
          let email = '';
          try { const ci = await gApi('GET', '/calendars/primary'); email = ci.id || ''; } catch (err) {}
          const p = readJson('oh-prefs.json', {}); p.gEmail = email; p.gScope = j.scope || ''; writeJson('oh-prefs.json', p);
          page('Google Kalender ist jetzt mit Home Office verbunden.'); finish({ ok: true, email });
        } catch (err) { page('Fehler: ' + errText(err)); finish({ ok: false, message: errText(err) }); }
      });
      const finish = r => { if (done) return; done = true; setTimeout(() => srv.close(), 500); showWin(); resolve(r); };
      srv.listen(0, '127.0.0.1', () => {
        const redirect = `http://127.0.0.1:${srv.address().port}`;
        const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: c.id, redirect_uri: redirect, response_type: 'code', scope: SCOPE,
          access_type: 'offline', prompt: 'consent', state, code_challenge: challenge, code_challenge_method: 'S256' });
        shell.openExternal(url);
      });
      setTimeout(() => finish({ ok: false, message: 'Zeit abgelaufen – bitte erneut verbinden.' }), 5 * 60 * 1000);
    });
  });

  async function gAccess() {
    if (gToken && gToken.exp > Date.now()) return gToken.access;
    const c = gClient(); if (!c.refresh) throw new Error('Google ist nicht verbunden (Einstellungen → Kalender, Google & KI).');
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: c.id, client_secret: c.secret, refresh_token: c.refresh, grant_type: 'refresh_token' }) });
    const j = await r.json();
    if (!r.ok) { if (j.error === 'invalid_grant') setSecret('gRefresh', ''); throw new Error(j.error_description || j.error || 'Google-Anmeldung abgelaufen.'); }
    gToken = { access: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
    return gToken.access;
  }
  async function gApi(method, p, body, query) {
    const url = 'https://www.googleapis.com/calendar/v3' + p + (query ? '?' + new URLSearchParams(query) : '');
    const r = await fetch(url, { method, headers: Object.assign({ authorization: 'Bearer ' + await gAccess() }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined });
    if (r.status === 204 || r.status === 410) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ('Google-Fehler ' + r.status));
    return j;
  }
  ipcMain.handle('oh:gList', async (e, timeMin, timeMax) => {
    try {
      const items = []; let pageToken = '';
      for (let i = 0; i < 20; i++) {
        const q = { timeMin, timeMax, singleEvents: 'true', showDeleted: 'false', maxResults: '250', orderBy: 'startTime' }; if (pageToken) q.pageToken = pageToken;
        const j = await gApi('GET', evPfad(), null, q);
        items.push(...(j.items || [])); pageToken = j.nextPageToken || ''; if (!pageToken) break;
      }
      return { ok: true, items };
    } catch (err) { return { ok: false, message: errText(err) }; }
  });
  ipcMain.handle('oh:gUpsert', async (e, ev, googleId) => {
    try { const j = googleId ? await gApi('PATCH', evPfad(googleId), ev) : await gApi('POST', evPfad(), ev); return { ok: true, id: j.id, updated: j.updated }; }
    catch (err) { return { ok: false, message: errText(err) }; }
  });
  ipcMain.handle('oh:gDelete', async (e, googleId) => {
    try { await gApi('DELETE', evPfad(googleId)); return { ok: true }; }
    catch (err) { return { ok: false, message: errText(err) }; }
  });

  // ---------- Google Drive: Vollmacht als Freigabelink ----------
  // Lädt die Datei in den Ordner „Home Office – Vollmachten“ (wird bei Bedarf angelegt) und gibt sie
  // für „jeder mit dem Link“ zum Ansehen frei. Bei vorhandener fileId wird nur der Inhalt ersetzt (Link bleibt gleich).
  async function driveFetch(url, opt = {}) {
    const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ authorization: 'Bearer ' + await gAccess() }, opt.headers || {}) }));
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
      if (r.status === 403 && /insufficient/i.test(reason || (j.error && j.error.message) || '')) throw new Error('Google Drive ist noch nicht freigegeben – bitte unter Einstellungen → Google einmal „Trennen“ und neu verbinden.');
      if (r.status === 403 && /accessNotConfigured|SERVICE_DISABLED/i.test(JSON.stringify(j))) throw new Error('Bitte in der Google Cloud Console die „Google Drive API“ aktivieren.');
      throw new Error((j.error && j.error.message) || ('Google-Drive-Fehler ' + r.status));
    }
    return j;
  }
  async function driveFolder() {
    const p = readJson('oh-prefs.json', {});
    if (p.gDriveFolder) { try { const f = await driveFetch('https://www.googleapis.com/drive/v3/files/' + p.gDriveFolder + '?fields=id,trashed'); if (f.id && !f.trashed) return f.id; } catch (e) {} }
    const f = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Home Office – Vollmachten', mimeType: 'application/vnd.google-apps.folder' }) });
    const q = readJson('oh-prefs.json', {}); q.gDriveFolder = f.id; writeJson('oh-prefs.json', q);
    return f.id;
  }
  ipcMain.handle('oh:gDriveShare', async (e, name, type, buf, fileId) => {
    try {
      const data = Buffer.from(buf); const mime = type || 'application/pdf';
      let f = null;
      if (fileId) {
        try { f = await driveFetch('https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(fileId) + '?uploadType=media&fields=id,webViewLink,trashed', { method: 'PATCH', headers: { 'content-type': mime }, body: data }); }
        catch (err) { f = null; }
        if (f && f.trashed) f = null;
      }
      if (!f) {
        const folder = await driveFolder(); const b = 'oh' + crypto.randomBytes(12).toString('hex');
        const meta = JSON.stringify({ name, parents: [folder] });
        const body = Buffer.concat([Buffer.from(`--${b}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\ncontent-type: ${mime}\r\n\r\n`), data, Buffer.from(`\r\n--${b}--`)]);
        f = await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', { method: 'POST', headers: { 'content-type': 'multipart/related; boundary=' + b }, body });
      }
      await driveFetch('https://www.googleapis.com/drive/v3/files/' + f.id + '/permissions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }) });
      return { ok: true, id: f.id, link: f.webViewLink || ('https://drive.google.com/file/d/' + f.id + '/view') };
    } catch (err) { return { ok: false, message: errText(err) }; }
  });
  ipcMain.handle('oh:gDriveUnshare', async (e, fileId) => {
    try { await driveFetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId), { method: 'DELETE' }); return { ok: true }; }
    catch (err) { if (/not found|404/i.test(errText(err))) return { ok: true }; return { ok: false, message: errText(err) }; }
  });

  // ---------- Erinnerungen (Windows-Benachrichtigungen) ----------
  // Die Oberfläche schickt die Liste der nächsten Erinnerungen; hier wird jede Minute geprüft.
  let reminders = readJson('oh-reminders.json', { list: [], fired: {} });
  const saveRem = () => { try { writeJson('oh-reminders.json', reminders); } catch (e) {} };
  ipcMain.handle('oh:remindSet', (e, list) => {
    reminders.list = (Array.isArray(list) ? list : []).filter(r => r && r.id && r.at).slice(0, 500);
    const keep = {}; for (const r of reminders.list) if (reminders.fired[r.id]) keep[r.id] = 1; reminders.fired = keep; saveRem(); tick();
    return { ok: true };
  });
  function tick() {
    const now = Date.now(); let changed = false;
    for (const r of reminders.list) {
      if (reminders.fired[r.id] || r.at > now || r.at < now - 12 * 3600 * 1000) continue;
      reminders.fired[r.id] = 1; changed = true;
      if (Notification.isSupported()) {
        const n = new Notification({ title: r.title, body: r.body || '', silent: false });
        n.on('click', () => { showWin(); const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send('oh:openCal', r.ref || ''); });
        n.show();
      }
      // auch in die Mitteilungszentrale (Glocke) der Oberfläche
      try { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send('oh:reminder', { id: r.id, title: r.title, body: r.body || '' }); } catch (e) {}
    }
    if (changed) saveRem();
  }
  setInterval(tick, 60 * 1000);
};
