/* Eingang – feste Ablaufkette im Hintergrund.
   Neu (E-Mail, Upload, Scan, Handy, Ordner) → Warteschlange → Sekretärin holt es (Briefkasten leuchtet) → Gemini liest
   → Vorschlagskarte mit Häkchen (im Command, Glocke, Büro) → erst nach deiner Bestätigung: Kalender, Fristen, Finanzen,
   Adressbuch, Notiz, Gedächtnis, Ablage im Ordner der Person, Mitteilungen. Immer nur ein Eingang gleichzeitig, der Reihe nach.
   Farbpunkte (Statussprache aus Heikes Swipii-Büro): rot = wichtig / Antwort nötig, orange = Termin oder einfache Ergänzung,
   grün = Bestätigung / Bericht. Neue Einträge tragen e.neu = {farbe, eg, at}; der Punkt verschwindet beim Öffnen.
   Läuft nach dem Hauptskript und nutzt dessen Globale. */
(function () {
  const FARBE = { rot: '#FF5D5D', orange: '#F2B544', gruen: '#3DDC97', lila: '#A487D6', grau: '#6E6680' };
  const RANG = { rot: 3, orange: 2, gruen: 1 };
  const L = () => { if (!Array.isArray(S.eingang)) S.eingang = []; return S.eingang; };
  const M = () => { if (!Array.isArray(S.mails)) S.mails = []; return S.mails; };
  const bereit = () => window.OH_READY && DESKTOP && MODE !== 'demo';
  const offen = () => L().filter(x => x.status === 'vorschlag' || x.status === 'fehler');
  const OFFEN_ST = ['warte', 'liest', 'frage', 'vorschlag', 'fehler'];
  const melde = m => { if (typeof ohMelden === 'function') ohMelden(m); };
  const buero = a => { try { if (typeof buPost === 'function') buPost({ typ: 'buero-ereignis', aufgabe: Object.assign({ dauer: 8 }, a) }); } catch (e) {} };
  const kurz = (s, n) => { s = String(s || ''); return s.length > (n || 60) ? s.slice(0, (n || 60) - 1) + '…' : s; };
  const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const personVon = (role, fallback) => (S.persons.find(p => p.role === role) || {}).id || fallback || '';

  /* ---------- Warteschlange ---------- */
  function neu(e) {
    if (!window.OH_READY) return;
    const it = Object.assign({ id: uid(), created: new Date().toISOString(), status: 'warte', docIds: [], schritte: [] }, e);
    if (it.docIds.length && L().some(x => x.status !== 'ignoriert' && x.docIds.some(d => it.docIds.includes(d)))) return null; // schon in der Kette
    if (it.mailId) { // dieselbe E-Mail nur einmal in der Kette – ein gescheiterter Eintrag wird stattdessen neu versucht
      const da = L().find(x => x.mailId === it.mailId && OFFEN_ST.includes(x.status));
      if (da) { if (da.status === 'fehler') { da.status = 'warte'; da.fehler = ''; save(); punkt(); if (bereit()) setTimeout(tick, 300); } return da; }
    }
    L().push(it); save(); punkt();
    if (!bereit()) { if (MODE === 'demo') toast('Im Demo-Modus liest die KI nichts.'); return it; }
    setTimeout(tick, 300);
    return it;
  }
  let laeuft = false;
  async function tick() {
    if (!bereit() || laeuft) return;
    const it = L().find(x => x.status === 'warte'); if (!it) return;
    if (typeof kiReady === 'function' && !kiReady()) { it.status = 'fehler'; it.fehler = 'Kein Gemini-Schlüssel (Einstellungen → Kalender, Google & KI).'; save(); punkt(); return; }
    laeuft = true; it.status = 'liest'; save(); punkt();
    buero({ an: 'sekretariat', post: true, text: 'nimmt „' + kurz(it.titel, 40) + '“ an', dauer: 12 });
    try { await lesen(it); }
    catch (e) { it.status = 'fehler'; it.fehler = String(e && e.message || e); melde({ typ: 'ki', title: 'Konnte „' + kurz(it.titel) + '“ nicht lesen', lines: [it.fehler], link: 'cmd:' + it.id }); }
    laeuft = false; save(); punkt(); if (typeof render === 'function' && /^(mail|documents)$/.test(parseHash().route)) render();
    setTimeout(tick, 800);
  }
  async function teileVon(it) {
    const parts = []; let summe = 0;
    const ids = [...it.docIds.map(id => (S.documents.find(d => d.id === id) || {}).fileId), ...((it.mailId && (M().find(m => m.id === it.mailId) || {}).atts) || []).filter(a => !a.inline).map(a => a.fileId)].filter(Boolean);
    for (const fid of ids) {
      const f = await fileGet(fid); if (!f || !f.blob) continue;
      const mime = f.type || f.blob.type || ''; if (!/^(application\/pdf|image\/(jpeg|png|webp|heic|heif))$/.test(mime)) continue;
      if (summe + f.blob.size > 17 * 1024 * 1024) break;
      parts.push({ mime, data: new Uint8Array(await f.blob.arrayBuffer()) }); summe += f.blob.size;
    }
    return parts;
  }
  async function mailText(m) { if (!m || !m.textFileId) return ''; const f = await fileGet(m.textFileId); return f && f.blob ? await f.blob.text() : ''; }
  async function lesen(it) {
    const m = it.mailId ? M().find(x => x.id === it.mailId) : null;
    const parts = await teileVon(it), text = m ? await mailText(m) : '';
    if (!parts.length && !text) throw new Error('Keine lesbare Datei (nur PDF und Bilder) und kein Text.');
    const r = await window.officeHome.kiAnalyze({ parts, text, von: m ? (m.fromName ? m.fromName + ' <' + m.from + '>' : m.from) : '', betreff: m ? m.subject : '',
      ctx: { today: today(), lang: window.OH_LANG || 'de', persons: S.persons.map(p => ({ label: p.role, name: personName(p) })) } });
    if (!r || !r.ok) throw new Error((r && r.message) || 'Gemini hat nicht geantwortet.');
    const res = r.result || {};
    it.ki = res; it.personId = personVon(res.person, it.personId); if (res.titel) it.titel = String(res.titel).slice(0, 140); if (res.absender && !it.von) it.von = String(res.absender);
    it.schritte = vorschlaege(it, res); it.prio = it.schritte.reduce((p, s) => RANG[s.farbe] > RANG[p] ? s.farbe : p, res.wichtigkeit === 'hoch' ? 'rot' : 'gruen');
    if (res.wichtigkeit === 'hoch') it.prio = 'rot';
    it.status = 'vorschlag'; it.gelesenAm = new Date().toISOString();
    // Sekretärin verteilt: Rückfrage im Büro, Glocke, Command-Punkt
    melde({ typ: 'ki', title: 'Bitte bestätigen: ' + kurz(it.titel, 70), lines: [it.ki.anliegen || it.ki.zusammenfassung || '', it.schritte.length + ' Schritte vorgeschlagen'].filter(Boolean), link: 'cmd:' + it.id, key: 'eg:' + it.id });
    try { if (typeof buPost === 'function') buPost({ typ: 'buero-frage', frage: { id: 'eingang:' + it.id, text: '„' + kurz(it.titel, 50) + '“ ist gelesen – ' + it.schritte.length + ' Schritte warten auf deine Bestätigung.', optionen: ['Jetzt ansehen', 'Später'] } }); } catch (e) {}
  }

  /* ---------- Vorschläge aus dem Gemini-Ergebnis ---------- */
  function vorschlaege(it, res) {
    const P = getPerson(it.personId), wer = P ? P.role : 'Allgemein', hoch = res.wichtigkeit === 'hoch', S_ = [];
    const add = (art, text, sub, farbe, d) => S_.push({ id: uid(), art, text, sub: sub || '', farbe, an: true, d: d || {} });
    const m = it.mailId ? M().find(x => x.id === it.mailId) : null;
    const nAtt = m ? (m.atts || []).length : 0;
    add('ablage', it.docIds.length ? 'Dokument ablegen bei ' + wer : nAtt ? nAtt + ' Anhang/Anhänge als Dokument bei ' + wer + ' speichern' : 'E-Mail bei ' + wer + ' ablegen',
      [res.absender, res.art, res.zusammenfassung && kurz(res.zusammenfassung, 120)].filter(Boolean).join(' · '), 'gruen', {});
    for (const t of Array.isArray(res.termine) ? res.termine : []) {
      if (!isDate(t.datum)) continue; const fr = t.art === 'frist';
      // Leons Regel: wichtiger Termin = rot, Frist/Anforderung mit Abgabedatum = orange, Bestätigung/Antwort = grün
      add(fr ? 'frist' : 'termin', (fr ? 'Frist' : 'Termin') + ' am ' + fmtDate(t.datum) + (t.uhrzeit ? ' um ' + t.uhrzeit : '') + ': ' + (t.titel || ''), [t.was_tun, t.ort].filter(Boolean).join(' · '),
        fr ? 'orange' : hoch ? 'rot' : 'orange', t);
    }
    for (const z of Array.isArray(res.zahlungen) ? res.zahlungen : []) {
      const betrag = String(z.betrag || '').trim(); if (!betrag) continue;
      add('zahlung', 'Zahlung ' + betrag + ' € an ' + (z.empfaenger || res.absender || '?') + (isDate(z.faellig) ? ' bis ' + fmtDate(z.faellig) : ''),
        'Frist + geplante Ausgabe in Finanzen + Termin' + (z.iban ? ' · IBAN ' + z.iban : ''), hoch ? 'rot' : 'orange', z);
    }
    const unt = (Array.isArray(res.unterlagen) ? res.unterlagen : []).filter(Boolean);
    if (unt.length) { const fr = (res.termine || []).find(t => isDate(t.datum)); add('unterlagen', 'Unterlagen einreichen' + (fr ? ' bis ' + fmtDate(fr.datum) : ''), unt.slice(0, 6).join(', '), 'orange', { liste: unt, due: fr ? fr.datum : dshift(today(), 14) }); }
    for (const g of Array.isArray(res.gueltigkeit) ? res.gueltigkeit : []) { if (isDate(g.gueltig_bis)) add('erneuern', 'Erinnerung: ' + (g.was || 'Bescheid') + ' läuft am ' + fmtDate(g.gueltig_bis) + ' ab', g.erneuern || '', 'orange', g); }
    for (const k of Array.isArray(res.kontakte) ? res.kontakte : []) {
      const org = String(k.organisation || '').trim(), nm = String(k.name || '').trim(); if (!org && !nm) continue;
      const da = S.contacts.find(c => (org && normTxt(c.name) === normTxt(org)) || (k.email && c.email && c.email.toLowerCase() === String(k.email).toLowerCase()));
      add('kontakt', da ? 'Adressbuch ergänzen: ' + da.name : 'Neu ins Adressbuch: ' + (org || nm) + (org && nm ? ' (' + nm + ')' : ''), [k.abteilung, [k.strasse, k.plz, k.ort].filter(Boolean).join(' '), k.telefon, k.email].filter(Boolean).join(' · '), 'orange', k);
    }
    add('notiz', 'Notiz mit Zusammenfassung', kurz(res.zusammenfassung || res.anliegen || '', 140), 'gruen', {});
    if (typeof memOn === 'function' && memOn() && P && memWsFor(P.id)) add('gedaechtnis', 'Im Gedächtnis festhalten + Datei ablegen', memDirLabel(memWsFor(P.id)), 'gruen', {});
    else if (it.typ === 'demo') add('gedaechtnis', 'Im Gedächtnis festhalten + Datei ablegen', 'Demo-Gedächtnis (nur Probe – dein echtes Gedächtnis bleibt unberührt)', 'gruen', {});
    // Bestätigungen/Antworten ohne Aufgabe: grün; reine Werbung: Häkchen aus
    if (res.art === 'Werbung') S_.forEach(s => { s.an = s.art === 'ablage' ? false : false; });
    if (/^(Bestätigung|Antwort|Information)$/.test(res.art || '') && !hoch) S_.forEach(s => { if (s.art === 'termin' || s.art === 'frist') s.farbe = 'gruen'; });
    return S_;
  }

  /* ---------- Übernehmen (nur nach Bestätigung) ---------- */
  const markiere = (o, farbe, it) => { o.neu = { farbe, eg: it.id, at: new Date().toISOString() }; return o; };
  async function anwenden(it, ids, personId) {
    if (it.status !== 'vorschlag') return;
    const res = it.ki || {}, P = getPerson(personId !== undefined ? personId : it.personId), pid = P ? P.id : '', wer = P ? P.role : 'Allgemein';
    const m = it.mailId ? M().find(x => x.id === it.mailId) : null;
    const nimm = new Set(ids), out = [], docs = [];
    const kat = { Rechnung: 'Sonstiges', Mahnung: 'Sonstiges', Bescheid: 'Behörde', Anforderung: 'Behörde', Vertrag: 'Vertrag' }[res.art] || 'Behörde';
    for (const s of it.schritte.filter(x => nimm.has(x.id))) {
      try {
        if (s.art === 'ablage') {
          for (const id of it.docIds) { const d = S.documents.find(x => x.id === id); if (!d) continue;
            if (!d.personId) d.personId = pid; if (res.absender && !d.sender) d.sender = String(res.absender); if (res.zusammenfassung && !d.notes) d.notes = String(res.zusammenfassung);
            if (res.titel && /^(scan|dokument|img|image|\d)/i.test(d.title)) d.title = String(res.titel).slice(0, 140);
            d.kiNummern = (res.nummern || []).filter(n => n && n.art && n.wert).slice(0, 30); d.ki = { at: new Date().toISOString(), ok: true }; markiere(d, s.farbe, it); docs.push(d); }
          if (m) for (const a of (m.atts || []).filter(x => !x.inline)) { const d = markiere({ id: uid(), added: today(), title: (res.titel ? String(res.titel).slice(0, 100) + ' – ' : '') + a.name.replace(/\.[^.]+$/, ''), personId: pid, category: kat, sender: res.absender || m.fromName || m.from, date: (m.date || '').slice(0, 10) || today(),
            caseId: '', deadline: '', tags: 'E-Mail', notes: res.zusammenfassung || '', fileId: a.fileId, fileName: a.name, fileType: a.type, fileSize: a.size, kiNummern: (res.nummern || []).slice(0, 30), ki: { at: new Date().toISOString(), ok: true }, mailId: m.id }, s.farbe, it);
            S.documents.push(d); it.docIds.push(d.id); docs.push(d); }
          out.push(s.text);
        }
        else if (s.art === 'termin' || s.art === 'frist') { const t = s.d, time = /^\d{1,2}:\d{2}$/.test(t.uhrzeit || '') ? String(t.uhrzeit).padStart(5, '0') : '';
          S.events = S.events || []; S.events.push(markiere({ id: uid(), source: 'ki', kind: s.art, title: String(t.titel || it.titel), date: t.datum, time, duration: 60, personId: pid, note: [t.was_tun, it.ki.anliegen].filter(Boolean).join('\n'), place: String(t.ort || ''),
            docId: it.docIds[0] || '', caseId: '', remind: time ? [10080, 1440, 60] : [10080, 1440], created: today(), gDirty: true }, s.farbe, it));
          const unt = it.schritte.find(x => x.art === 'unterlagen' && nimm.has(x.id) && x.d.due === t.datum); // sonst doppelte Aufgabe
          if (s.art === 'frist' && !unt) S.tasks.push(markiere({ id: uid(), title: String(t.titel || it.titel), due: t.datum, personId: pid, caseId: '', docId: it.docIds[0] || '', priority: s.farbe === 'rot' ? 'hoch' : 'normal', notes: t.was_tun || '', done: false, created: today() }, s.farbe, it));
          buero({ an: s.art === 'frist' ? 'fristen' : 'termine', text: (s.art === 'frist' ? 'trägt die Frist ein' : 'trägt den Termin ein') + ': ' + kurz(t.titel, 30) });
          out.push(s.text); }
        else if (s.art === 'zahlung') { const z = s.d, due = isDate(z.faellig) ? z.faellig : dshift(today(), 14), amt = Number(String(z.betrag).replace(/\./g, '').replace(',', '.')) || 0, an = z.empfaenger || res.absender || '';
          S.tasks.push(markiere({ id: uid(), title: 'Zahlen: ' + z.betrag + ' € an ' + an, due, personId: pid, caseId: '', docId: it.docIds[0] || '', priority: s.farbe === 'rot' ? 'hoch' : 'normal', notes: [z.verwendungszweck && 'Verwendungszweck: ' + z.verwendungszweck, z.iban && 'IBAN: ' + z.iban].filter(Boolean).join('\n'), done: false, created: today() }, s.farbe, it));
          if (amt) S.bookings.push(markiere({ id: uid(), date: due, type: 'aus', amount: amt, category: typeof autoCategory === 'function' ? autoCategory(an, z.verwendungszweck || '', 'aus') : 'Sonstiges', personId: pid, accountId: '', counterparty: an, text: (z.verwendungszweck || it.titel) + ' (geplant)', source: 'eingang', planned: true, contractId: '' }, s.farbe, it));
          S.events = S.events || []; S.events.push(markiere({ id: uid(), source: 'ki', kind: 'frist', title: 'Zahlung ' + z.betrag + ' € an ' + an, date: due, time: '', duration: 60, personId: pid, note: z.verwendungszweck || '', place: '', docId: it.docIds[0] || '', caseId: '', remind: [10080, 1440], created: today(), gDirty: true }, s.farbe, it));
          buero({ an: 'finanzen', text: 'plant die Zahlung: ' + z.betrag + ' €' });
          out.push(s.text); }
        else if (s.art === 'unterlagen') { S.tasks.push(markiere({ id: uid(), title: 'Unterlagen einreichen' + (res.absender ? ' (' + res.absender + ')' : ''), due: s.d.due, personId: pid, caseId: '', docId: it.docIds[0] || '', priority: 'hoch', notes: s.d.liste.map(x => '– ' + x).join('\n'), done: false, created: today() }, s.farbe, it));
          buero({ an: 'fristen', text: 'notiert die angeforderten Unterlagen' }); out.push(s.text); }
        else if (s.art === 'erneuern') { const g = s.d; let at = addMonths(g.gueltig_bis, -1); if (at <= today()) at = g.gueltig_bis <= today() ? today() : dshift(today(), 1);
          S.events = S.events || []; S.events.push(markiere({ id: uid(), source: 'ki', kind: 'frist', title: 'Erneuern: ' + (g.was || 'Bescheid'), date: at, time: '', duration: 60, personId: pid, note: (g.erneuern || '') + '\nGültig bis ' + fmtDate(g.gueltig_bis) + '.', docId: it.docIds[0] || '', caseId: '', remind: [10080, 1440], created: today(), gDirty: true }, s.farbe, it));
          out.push(s.text); }
        else if (s.art === 'kontakt') { const vor = new Set(S.contacts.map(c => c.id)), diffs = []; const line = kiContact(s.d, diffs);
          const c = S.contacts.find(x => !vor.has(x.id)) || S.contacts.find(x => normTxt(x.name) === normTxt(s.d.organisation || s.d.name || ''));
          if (c) markiere(c, s.farbe, it); if (line) out.push(line); if (diffs.length) setTimeout(() => kiDiffDialog(diffs), 400);
          buero({ an: 'sekretariat', text: 'pflegt das Adressbuch' }); }
        else if (s.art === 'notiz') { S.notes.push(markiere({ id: uid(), title: kurz(it.titel, 90), content: [res.anliegen, res.zusammenfassung, (res.unterlagen || []).length ? 'Unterlagen:\n' + res.unterlagen.map(x => '– ' + x).join('\n') : '', m ? 'E-Mail von ' + (m.fromName || m.from) + ' am ' + fmtDate((m.date || '').slice(0, 10)) : ''].filter(Boolean).join('\n\n'),
            personId: pid, pinned: false, updated: today() }, s.farbe, it)); buero({ an: 'schreiben', text: 'schreibt die Notiz' }); out.push(s.text); }
        else if (s.art === 'gedaechtnis' && it.typ === 'demo') {
          demoMerken(it, 'Festgehalten: „' + it.titel + '“ für ' + wer + ' – ' + (res.anliegen || '') + ' Übernommen: ' + out.join('; '));
          buero({ an: 'archiv', text: 'legt die Akte im Ordner ab (Probe)' });
          melde({ typ: 'system', title: '„' + kurz(it.titel, 50) + '“ abgelegt (Probe)', lines: ['Im Demo-Gedächtnis bei ' + wer + ' – das echte Gedächtnis bleibt unberührt.'] });
          out.push('Im Demo-Gedächtnis festgehalten'); }
        else if (s.art === 'gedaechtnis' && P && typeof memOn === 'function' && memOn()) {
          const dir = memWsFor(P.id);
          const r = await window.officeHome.memNote(memCfg().root, dir, { title: it.titel, date: today(), kind: m ? 'E-Mail' : 'Notiz', to: res.absender || '', person: personName(P),
            body: ['Was: ' + (res.anliegen || ''), res.zusammenfassung || '', 'Übernommen: ' + out.join('; ')].filter(Boolean).join('\n\n') });
          for (const d of docs.length ? docs : it.docIds.map(id => S.documents.find(x => x.id === id)).filter(Boolean)) {
            const f = await fileGet(d.fileId); if (!f || !f.blob) continue;
            const c = await window.officeHome.memCopyFile(memCfg().root, dir, f.name || d.fileName || (d.title + '.pdf'), await f.blob.arrayBuffer());
            if (c && c.ok) melde({ typ: 'system', title: '„' + kurz(d.title, 50) + '“ abgelegt', lines: ['Im Ordner ' + memDirLabel(dir) + ' (Home Office Eingang)'], key: 'abl:' + d.id });
          }
          buero({ an: 'archiv', text: 'legt die Akte im Ordner ab' });
          out.push(r && r.ok ? 'Im Gedächtnis festgehalten (' + memDirLabel(dir) + ')' : 'Gedächtnis: ' + ((r && r.message) || 'nicht gespeichert')); }
      } catch (e) { out.push('Fehler bei „' + s.text + '“: ' + (e.message || e)); }
    }
    it.status = 'erledigt'; it.erledigtAm = new Date().toISOString(); it.ergebnis = out; it.personId = pid;
    if (m) m.status = 'erledigt';
    if (it.typ === 'demo') setTimeout(() => demoEnde(it), 14000);
    save(); if (typeof calAfterChange === 'function') calAfterChange(); render(); punkt();
    melde({ typ: 'system', title: 'Erledigt: ' + kurz(it.titel, 70), lines: out.slice(0, 6), link: '' });
  }
  function ignorieren(it) { it.status = 'ignoriert'; const m = it.mailId && M().find(x => x.id === it.mailId); if (m) m.status = 'ignoriert'; save(); punkt(); }

  /* ---------- Karte (im Command-Fenster) ---------- */
  const dot = (f, puls) => `<i class="egdot ${puls ? 'puls' : ''}" style="--c:${FARBE[f] || FARBE.grau}"></i>`;
  function listeHTML() {
    const O = offen(), W = L().filter(x => x.status === 'warte' || x.status === 'liest' || x.status === 'frage');
    if (!O.length && !W.length) return '';
    return `<div class="cmdlbl">Wartet auf dich (${O.length})${W.length ? ` · ${W.length} in Bearbeitung` : ''}</div><div class="eglist">${[...O.sort((a, b) => (RANG[b.prio] || 0) - (RANG[a.prio] || 0)), ...W].map(x => `<button class="egitem" data-cmd="egkarte" data-id="${x.id}">${x.status === 'liest' ? '<i class="egdot bau"></i>' : x.status === 'warte' ? dot('grau') : x.status === 'fehler' ? dot('rot') : dot(x.prio, x.prio !== 'gruen')}<span><b>${esc(kurz(x.titel, 60))}</b><small>${esc([x.von, x.status === 'liest' ? 'Gemini liest …' : x.status === 'frage' ? 'Rückfrage im Büro' : x.status === 'warte' ? 'in der Warteschlange' : x.status === 'fehler' ? 'Fehler' : x.schritte.length + ' Schritte'].filter(Boolean).join(' · '))}</small></span></button>`).join('')}</div>`;
  }
  function karteHTML(id) {
    const it = L().find(x => x.id === id); if (!it) return '<div class="small muted">Nicht mehr vorhanden.</div>';
    if (it.typ === 'mailwahl') return mailwahlHTML(it);
    const k = it.ki || {}, P = getPerson(it.personId);
    if (it.status === 'fehler') return `<div class="egkarte"><div class="eghead">${dot('rot')}<b>${esc(it.titel)}</b></div><div class="small" style="color:var(--danger)">${esc(it.fehler || 'Fehler')}</div>
      <div class="acts"><button class="btn sm pri" data-cmd="eg" data-ea="nochmal" data-id="${it.id}">Noch einmal lesen</button><button class="btn sm" data-cmd="eg" data-ea="ignorieren" data-id="${it.id}">Verwerfen</button></div></div>`;
    const neuStart = it.typ === 'demo' ? `<button class="btn sm" data-cmd="eg" data-ea="neustart" data-id="${it.id}">${icon('update')}Aufgabe neu starten</button>` : '';
    const demoMem = it.typ === 'demo' && (S.demoGedaechtnis || []).some(x => x.eg === it.id) ? `<div class="cmdlbl" style="margin:6px 0 4px">Demo-Gedächtnis (nur Probe)</div><ul class="egerg">${S.demoGedaechtnis.filter(x => x.eg === it.id).map(x => `<li><span class="small muted">${new Date(x.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> ${esc(x.text)}</li>`).join('')}</ul>` : '';
    if (it.status === 'erledigt') return `<div class="egkarte"><div class="eghead">${dot('gruen')}<b>${esc(it.titel)}</b></div><ul class="egerg">${(it.ergebnis || []).map(l => `<li>${esc(l)}</li>`).join('')}</ul>${demoMem}${neuStart ? `<div class="acts">${neuStart}</div>` : ''}</div>`;
    if (it.status !== 'vorschlag') return `<div class="egkarte"><div class="eghead"><i class="egdot bau"></i><b>${esc(it.titel)}</b></div><div class="small muted">${it.status === 'liest' ? 'Gemini liest gerade …' + (it.typ === 'demo' ? ' Schau ins Büro: Sekretärin und Archiv sind dran.' : '') : it.status === 'frage' ? 'Die Sekretärin hat dir im Büro eine Frage gestellt – bitte dort antworten.' : 'Wartet in der Reihe.'}</div>${demoMem}${neuStart ? `<div class="acts">${neuStart}</div>` : ''}</div>`;
    return `<div class="egkarte" data-eg="${it.id}"><div class="eghead">${dot(it.prio, true)}<b>${esc(it.titel)}</b></div>
      <div class="egmeta small">${esc([it.von || k.absender, k.art, k.wichtigkeit && 'Wichtigkeit: ' + k.wichtigkeit].filter(Boolean).join(' · '))}</div>
      ${k.anliegen ? `<div class="eganl">${esc(k.anliegen)}</div>` : ''}
      <label class="small egper">Gehört zu <select data-egp="1">${['', ...S.persons.map(p => p.id)].map(v => `<option value="${v}" ${v === (it.personId || '') ? 'selected' : ''}>${v ? esc(getPerson(v).role) : 'Allgemein'}</option>`).join('')}</select></label>
      <div class="egsteps">${it.schritte.map(s => `<label class="egstep"><input type="checkbox" data-egs="${s.id}" ${s.an ? 'checked' : ''}><span><b>${esc(s.text)}</b>${s.sub ? `<small>${esc(s.sub)}</small>` : ''}</span>${dot(s.farbe)}</label>`).join('')}</div>
      <div class="acts"><button class="btn sm pri" data-cmd="eg" data-ea="ok" data-id="${it.id}">${icon('erledigt')}Bestätigen</button><button class="btn sm" data-cmd="eg" data-ea="spaeter" data-id="${it.id}">Später</button><button class="btn sm dan" data-cmd="eg" data-ea="ignorieren" data-id="${it.id}">Verwerfen</button>${it.docIds[0] ? `<button class="btn sm" data-cmd="eg" data-ea="doc" data-id="${it.id}">${icon('auge')}Datei</button>` : ''}</div>
      <div class="small muted">Nichts wird eingetragen, bevor du bestätigst.${it.typ === 'demo' ? ' (Probe – nur Demo-Daten)' : ''}</div>${demoMem}</div>`;
  }
  // „Nicht mehr fragen“: Mail bleibt im Posteingang (nichts wird gelöscht), wird aber nicht bearbeitet und in keiner Auswahl mehr angeboten
  function mailsNichtFragen(ids) {
    let n = 0; M().forEach(m => { if (ids.includes(m.id) && m.status !== 'erledigt' && m.status !== 'buero') { m.status = 'ignoriert'; n++; } });
    L().forEach(it => { if (it.typ === 'mailwahl' && it.status === 'vorschlag') { it.schritte = it.schritte.filter(s => !ids.includes(s.d.mailId)); if (!it.schritte.length) { it.status = 'erledigt'; it.ergebnis = ['Keine E-Mail mehr offen']; } } });
    save(); punkt(); return n;
  }
  function mailwahlHTML(it) {
    it.schritte = it.schritte.filter(s => M().some(m => m.id === s.d.mailId)); // inzwischen gelöschte Mails weglassen
    const n = it.schritte.length;
    if (!n) return `<div class="egkarte"><div class="eghead">${dot('gruen')}<b>Keine E-Mails mehr in dieser Auswahl</b></div></div>`;
    return `<div class="egkarte" data-eg="${it.id}"><div class="eghead">${dot('gruen', true)}<b>${esc(it.titel)}</b></div>
      <div class="small muted">Markieren, dann ans Büro geben oder „Nicht mehr fragen“. Gelöscht wird nichts – alle E-Mails bleiben im Posteingang.</div>
      <label class="egstep egalle"><input type="checkbox" data-egalle="1"><span><b>Alle auswählen</b><small>${n} E-Mail${n > 1 ? 's' : ''}</small></span></label>
      <div class="egsteps">${it.schritte.map(s => { const m = M().find(x => x.id === s.d.mailId) || {};
        return `<label class="egstep"><input type="checkbox" data-egs="${s.id}" ${s.an ? 'checked' : ''}><span><b>${esc(m.fromName || m.from || '?')}</b><small>${esc(kurz(m.subject, 80))}${(m.atts || []).length ? ' · 📎 ' + m.atts.length : ''}</small></span></label>`; }).join('')}</div>
      <div class="acts"><button class="btn sm pri" data-cmd="eg" data-ea="ok" data-id="${it.id}">${icon('alle')}Ans Büro</button><button class="btn sm" data-cmd="eg" data-ea="nichtfragen" data-id="${it.id}" title="Bleibt im Posteingang, wird nicht bearbeitet und nicht mehr angeboten">${icon('schliessen')}Nicht mehr fragen</button><button class="btn sm" data-cmd="eg" data-ea="spaeter" data-id="${it.id}">Später</button></div></div>`;
  }
  // „Alle auswählen“ in Auswahlkarten
  document.addEventListener('change', e => { const a = e.target.closest('[data-egalle]'); if (!a) return; const box = a.closest('[data-eg]'); if (box) box.querySelectorAll('[data-egs]').forEach(x => { x.checked = a.checked; }); });
  async function aktion(id, a, panel) {
    const it = L().find(x => x.id === id); if (!it) return;
    const box = panel && panel.querySelector(`[data-eg="${id}"]`);
    const ids = box ? [...box.querySelectorAll('[data-egs]')].filter(x => x.checked).map(x => x.dataset.egs) : it.schritte.filter(s => s.an).map(s => s.id);
    if (a === 'nichtfragen' && it.typ === 'mailwahl') {
      if (!ids.length) { toast('Bitte zuerst E-Mails markieren.'); return 'bleib'; }
      const mids = it.schritte.filter(s => ids.includes(s.id)).map(s => s.d.mailId);
      const n = mailsNichtFragen(mids);
      if (it.status === 'vorschlag') it.titel = it.schritte.length + ' neue E-Mail' + (it.schritte.length > 1 ? 's' : '') + ': ' + [...new Set(it.schritte.map(s => { const m = M().find(x => x.id === s.d.mailId) || {}; return m.fromName || m.from; }))].slice(0, 4).join(', ');
      save(); toast(n + ' E-Mail(s) werden nicht mehr angeboten – sie bleiben im Posteingang'); if (parseHash().route === 'mail') render(); return;
    }
    if (a === 'ok' && it.typ === 'mailwahl') {
      if (!ids.length) { toast('Bitte zuerst E-Mails markieren.'); return 'bleib'; }
      const nimm = new Set(ids);
      for (const s of it.schritte) { const m = M().find(x => x.id === s.d.mailId); if (!m) continue;
        if (nimm.has(s.id)) { m.status = 'buero'; neu({ typ: 'mail', titel: m.subject || '(ohne Betreff)', von: m.fromName || m.from, mailId: m.id, personId: m.personId || '' }); }
        else if (m.status === 'neu') m.status = 'ignoriert'; }
      it.status = 'erledigt'; it.ergebnis = [nimm.size + ' E-Mail(s) ans Büro gegeben']; save(); punkt(); toast(nimm.size ? nimm.size + ' E-Mail(s) im Büro' : 'Keine E-Mail übernommen'); return;
    }
    if (a === 'ok') { const sel = box && box.querySelector('[data-egp]'); await anwenden(it, ids, sel ? sel.value : undefined); return; }
    if (a === 'neustart') { await demoNeustart(); return 'zu'; }
    if (a === 'spaeter') return 'zu';
    if (a === 'ignorieren') { ignorieren(it); return; }
    if (a === 'nochmal') { it.status = 'warte'; it.fehler = ''; save(); setTimeout(tick, 100); return; }
    if (a === 'doc') { const d = S.documents.find(x => x.id === it.docIds[0]); if (d) openDoc(d); return 'bleib'; }
  }

  /* ---------- Punkt am Command-Knopf ---------- */
  function punkt() {
    const O = offen(), f = O.length ? O.reduce((p, x) => (RANG[x.status === 'fehler' ? 'rot' : x.prio] || 0) > (RANG[p] || 0) ? (x.status === 'fehler' ? 'rot' : x.prio) : p, 'gruen') : '';
    const orb = document.getElementById('cmdOrb'); if (!orb) return;
    let d = orb.querySelector('.egorb'); if (!d) { d = document.createElement('i'); d.className = 'egorb'; orb.appendChild(d); }
    d.style.display = f ? '' : 'none'; d.style.setProperty('--c', FARBE[f] || FARBE.grau); d.textContent = O.length > 1 ? O.length : '';
    d.classList.toggle('puls', f === 'rot' || f === 'orange');
    const busy = L().some(x => x.status === 'liest'); orb.classList.toggle('egbusy', busy);
    if (window.ohCommand && window.ohCommand.neuZeichnen) window.ohCommand.neuZeichnen();
  }

  /* ---------- Punkte an neuen Einträgen (bis zum Öffnen) ---------- */
  const QUELLEN = () => [S.events || [], S.tasks, S.contacts, S.notes, S.documents, S.bookings || []];
  // Kalender-Einträge haben Kennungen wie „e:<id>“ (Termin) oder „t:<id>“ (Aufgabe)
  const finde = id => { id = String(id || '').replace(/^[etc]:/, ''); for (const A of QUELLEN()) { const o = A.find(x => x.id === id); if (o) return o; } return null; };
  const ZEILE = 'tr, .row, .note, .kcard, .kev, li, .card';
  // Punkt immer an derselben Stelle: am Anfang der Zeile/Karte, senkrecht mittig (CSS .eghost > .egnew)
  function punkteSetzen() {
    const main = document.getElementById('main'); if (!main) return;
    main.querySelectorAll('[data-id]').forEach(el => {
      const o = finde(el.dataset.id); if (!o || !o.neu || o.neu.gesehen) return;
      const zeile = el.closest(ZEILE);
      if (!zeile) return;                                                            // lose Knöpfe/Links ohne eigene Zeile: kein Punkt
      if (zeile !== el && zeile.hasAttribute('data-id') && zeile.dataset.id !== el.dataset.id) return; // Link in einer fremden Zeile (z. B. Dokument im Termin)
      const host = zeile.tagName === 'TR' ? zeile.firstElementChild : zeile; if (!host) return;
      if (host.querySelector(':scope > .egnew')) return;
      const i = document.createElement('i'); i.className = 'egdot egnew ' + (o.neu.farbe !== 'gruen' ? 'puls' : ''); i.style.setProperty('--c', FARBE[o.neu.farbe] || FARBE.gruen); i.title = 'Neu aus dem Eingang';
      host.classList.add('eghost'); host.appendChild(i);
    });
    main.querySelectorAll('.eghost').forEach(h => { if (!h.querySelector(':scope > .egnew')) h.classList.remove('eghost'); });
  }
  document.addEventListener('click', e => { const el = e.target.closest('#main [data-id]'); if (!el) return; const o = finde(el.dataset.id); if (o && o.neu && !o.neu.gesehen) { o.neu.gesehen = true; save(); } }, true);

  /* ---------- E-Mail-Inhalt speichern: Text, HTML (Ansicht mit Bildern), alle Anhänge (inline = Bild im Text) ---------- */
  async function mailInhalt(m, x) {
    // alte Dateien weg – außer sie gehören inzwischen zu einem abgelegten Dokument (gleiche Datei)
    const benutzt = f => S.documents.some(d => d.fileId === f);
    for (const f of [m.textFileId, m.htmlFileId, ...(m.atts || []).map(a => a.fileId)]) if (f && !benutzt(f)) await fileDel(f).catch(() => {});
    m.textFileId = uid(); await filePut(m.textFileId, { blob: new Blob([x.text || ''], { type: 'text/plain' }), name: 'mail.txt', type: 'text/plain' });
    m.htmlFileId = ''; if (x.html) { m.htmlFileId = uid(); await filePut(m.htmlFileId, { blob: new Blob([x.html], { type: 'text/html' }), name: 'mail.html', type: 'text/html' }); }
    m.atts = [];
    for (const a of x.atts || []) { const fid = uid(); await filePut(fid, { blob: new Blob([a.data], { type: a.type }), name: a.name, type: a.type }); m.atts.push({ fileId: fid, name: a.name, type: a.type, size: a.size, cid: a.cid || '', inline: !!a.inline }); }
    m.voll = true;
  }
  // Ältere Mail (vor dieser Version nur Text + PDF) beim Öffnen vollständig nachladen
  async function mailVoll(m) {
    if (!m || m.voll || !DESKTOP || !window.officeHome.mailEinzeln || MODE === 'demo') return false;
    const r = await window.officeHome.mailEinzeln(m.acc, m.uid); if (!r || !r.ok) { m.vollFehler = (r && r.message) || 'Fehler'; return false; }
    await mailInhalt(m, r); save(); return true;
  }

  /* ---------- E-Mail abrufen (Sekretärin, stündlich) ---------- */
  async function mailsAbrufen(still) {
    if (!bereit() || !window.officeHome.mailKonten) return { neu: 0 };
    const konten = await window.officeHome.mailKonten(); if (!konten.length) return { neu: 0, keinKonto: true };
    buero({ an: 'sekretariat', text: 'prüft das Postfach', dauer: 6 });
    const neue = [];
    for (const k of konten) {
      const r = await window.officeHome.mailAbrufen(k.id);
      if (!r || !r.ok) { if (!still) toast('E-Mail ' + k.user + ': ' + ((r && r.message) || 'Fehler')); melde({ typ: 'system', title: 'E-Mail-Abruf fehlgeschlagen (' + k.user + ')', lines: [(r && r.message) || ''], key: 'mailerr:' + k.id + ':' + today() }); continue; }
      for (const x of r.mails || []) {
        if (x.zuGross || M().some(m => m.acc === k.id && m.uid === x.uid)) continue;
        const m = { id: uid(), acc: k.id, uid: x.uid, msgId: x.msgId, from: x.from, fromName: x.fromName, to: x.to, subject: x.subject, date: x.date, snippet: String(x.text || '').replace(/\s+/g, ' ').slice(0, 220), atts: [], status: 'neu', gelesen: false, personId: k.personId || '' };
        await mailInhalt(m, x);
        M().unshift(m); neue.push(m);
      }
    }
    if (M().length > 1500) S.mails = M().slice(0, 1500);
    if (neue.length) {
      const it = { id: uid(), typ: 'mailwahl', created: new Date().toISOString(), status: 'vorschlag', prio: 'gruen', docIds: [], titel: neue.length + ' neue E-Mail' + (neue.length > 1 ? 's' : '') + ': ' + [...new Set(neue.map(m => m.fromName || m.from))].slice(0, 4).join(', '),
        schritte: neue.map(m => ({ id: uid(), art: 'mail', an: false, farbe: 'gruen', d: { mailId: m.id } })) };
      L().push(it); save(); punkt();
      melde({ typ: 'buero', title: it.titel, lines: ['Bitte auswählen, was das Büro bearbeiten soll.'], link: 'cmd:' + it.id, key: 'mw:' + it.id });
      try { buPost({ typ: 'buero-frage', frage: { id: 'eingang:' + it.id, text: 'Im Postfach: ' + it.titel + '. Welche soll ich bearbeiten?', optionen: ['Jetzt ansehen', 'Später'] } }); } catch (e) {}
      if (parseHash().route === 'mail') render();
    }
    return { neu: neue.length };
  }

  /* ---------- Aktualisieren: Postfach, Scanner, Handy, Ordner, ungelesene Dokumente ---------- */
  async function aktualisieren() {
    if (!window.OH_READY) return;
    if (MODE === 'demo') return toast('Im Demo-Modus wird nichts abgerufen.');
    toast('Suche nach Neuem …');
    const mail = await mailsAbrufen(true);
    const seit = S.eingangStand || '';
    const scans = (S.scans || []).filter(b => !b.imBuero && b.pages && b.pages.length && (b.created || '') > seit);
    const docs = S.documents.filter(d => d.fileId && !d.ki && !L().some(x => x.docIds.includes(d.id)));
    const n = (mail.neu || 0) + scans.length + docs.length;
    S.eingangStand = new Date().toISOString(); save();
    if (!scans.length && !docs.length) { melde({ typ: 'system', title: n ? n + ' Neues gefunden' : 'Nichts Neues', lines: mail.keinKonto ? ['Kein E-Mail-Konto eingerichtet (Einstellungen → E-Mail).'] : [] }); toast(n ? n + ' Neues gefunden' : 'Nichts Neues gefunden'); return n; }
    const quelle = b => b.source === 'handy' ? 'vom Handy' : b.source === 'drucker' ? 'vom Drucker' : 'aus dem Ordner';
    const it = { id: uid(), typ: 'sammel', created: new Date().toISOString(), status: 'vorschlag', prio: 'gruen', docIds: [],
      titel: 'Gefunden: ' + [mail.neu ? mail.neu + ' E-Mail(s)' : '', scans.length ? scans.length + ' Scan(s)' : '', docs.length ? docs.length + ' ungelesene Datei(en)' : ''].filter(Boolean).join(', '),
      schritte: [...scans.map(b => ({ id: uid(), art: 'scan', an: true, farbe: 'gruen', text: b.title, sub: b.pages.length + ' Seite(n) ' + quelle(b), d: { scanId: b.id } })),
        ...docs.map(d => ({ id: uid(), art: 'doc', an: true, farbe: 'gruen', text: d.title, sub: 'Dokument ohne KI', d: { docId: d.id } }))] };
    L().push(it); save(); punkt();
    melde({ typ: 'system', title: it.titel, lines: ['Auswählen, was das Büro lesen soll.'], link: 'cmd:' + it.id, key: 'sm:' + it.id });
    if (window.ohCommand) window.ohCommand.karte(it.id);
    return n;
  }
  async function sammelOk(it, ids) {
    const nimm = new Set(ids);
    for (const s of it.schritte.filter(x => nimm.has(x.id))) {
      if (s.art === 'doc') { const d = S.documents.find(x => x.id === s.d.docId); if (d) neu({ typ: 'datei', titel: d.title, docIds: [d.id], personId: d.personId || '' }); }
      if (s.art === 'scan') { const b = (S.scans || []).find(x => x.id === s.d.scanId); if (!b) continue;
        try { const blob = await scanPdf(b), fid = uid(); await filePut(fid, { blob, name: b.title + '.pdf', type: 'application/pdf' });
          const d = { id: uid(), added: today(), title: b.title, personId: '', category: 'Sonstiges', sender: '', date: today(), caseId: '', deadline: '', tags: 'Scan', notes: '', fileId: fid, fileName: b.title + '.pdf', fileType: 'application/pdf', fileSize: blob.size };
          S.documents.push(d); b.imBuero = true; neu({ typ: b.source === 'handy' ? 'handy' : 'scan', titel: b.title, docIds: [d.id] });
        } catch (e) { toast('Scan „' + b.title + '“: ' + (e.message || e)); } }
    }
    it.status = 'erledigt'; it.ergebnis = [nimm.size + ' ans Büro gegeben']; save(); punkt();
  }

  /* ---------- Probe im Demo-Modus: „Aufgabe probieren“ ----------
     Ein Testbrief läuft sichtbar durch Briefkasten → Sekretärin → Archiv (Gemini, nachgestellt) → Rückfragen im Büro →
     Karte im Command → Verteilung an die Mitarbeiter → Demo-Gedächtnis. Nur im Demo-Modus; echtes Gedächtnis/KI bleiben unberührt. */
  const DEMO = { timer: [] };
  const spaeter = (f, ms) => DEMO.timer.push(setTimeout(f, ms));
  function demoMerken(it, text) { (S.demoGedaechtnis = S.demoGedaechtnis || []).push({ at: new Date().toISOString(), eg: it.id, text }); save(); }
  function briefBild() {
    const c = document.createElement('canvas'); c.width = 1240; c.height = 1754; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#1B2A44';
    g.font = 'bold 34px Arial'; g.fillText('Landratsamt Dachau · Ausländerbehörde', 120, 140);
    g.font = '24px Arial'; g.fillText('Weiherweg 16 · 85221 Dachau · Tel. 08131 74-0', 120, 182);
    g.font = '26px Arial'; ['Frau', 'Ingrid Becker', 'Birkenallee 22', '10405 Berlin'].forEach((l, i) => g.fillText(l, 120, 330 + i * 36));
    g.fillText('Aktenzeichen: AZ-2026-123 · ' + new Date().toLocaleDateString('de-DE'), 700, 330);
    g.font = 'bold 28px Arial'; g.fillText('Anforderung von Unterlagen', 120, 560);
    g.font = '26px Arial'; ['Sehr geehrte Frau Becker,', '', 'für die Verlängerung Ihres Aufenthaltstitels benötigen wir bis zum 05.01.2027:', '  – gültigen Reisepass (Kopie)', '  – aktuelle Meldebescheinigung',
      '', 'Für die Bearbeitung fällt eine Gebühr von 45,00 € an. Bitte überweisen Sie den', 'Betrag bis 15.12.2026 auf DE12 7005 0000 0000 1234 56 (Verwendungszweck: AZ-2026-123).', '', 'Ihre Ansprechpartnerin: Frau Anna Weber, Sachbearbeitung.', '', 'Mit freundlichen Grüßen', 'Landratsamt Dachau']
      .forEach((l, i) => g.fillText(l, 120, 640 + i * 40));
    g.fillStyle = '#A33A3A'; g.font = 'bold 40px Arial'; g.save(); g.translate(820, 1500); g.rotate(-0.2); g.fillText('PROBE', 0, 0); g.restore();
    return new Promise(r => c.toBlob(r, 'image/png'));
  }
  const DEMO_KI = () => ({ zusammenfassung: 'Die Ausländerbehörde fordert für die Verlängerung des Aufenthaltstitels Reisepass und Meldebescheinigung bis 05.01.2027 an und verlangt 45 € Gebühr bis 15.12.2026.',
    person: '', absender: 'Landratsamt Dachau – Ausländerbehörde', titel: 'Anforderung von Unterlagen – Ausländerbehörde (Probe)', art: 'Anforderung', wichtigkeit: 'hoch',
    anliegen: 'Reisepass-Kopie und Meldebescheinigung bis 05.01.2027 einreichen, 45 € Gebühr bis 15.12.2026 zahlen.',
    termine: [{ titel: 'Unterlagen bei der Ausländerbehörde einreichen', datum: '2027-01-05', uhrzeit: '', art: 'frist', ort: 'Landratsamt Dachau', was_tun: 'Reisepass-Kopie, Meldebescheinigung' }],
    unterlagen: ['Reisepass (Kopie)', 'Meldebescheinigung'], zahlungen: [{ betrag: '45,00', empfaenger: 'Landratsamt Dachau', iban: 'DE12 7005 0000 0000 1234 56', verwendungszweck: 'AZ-2026-123', faellig: '2026-12-15' }],
    kontakte: [{ organisation: 'Landratsamt Dachau – Ausländerbehörde', name: 'Frau Anna Weber', funktion: 'Sachbearbeitung', strasse: 'Weiherweg 16', plz: '85221', ort: 'Dachau', telefon: '08131 74-0', email: '' }],
    nummern: [{ art: 'Aktenzeichen', wert: 'AZ-2026-123' }, { art: 'IBAN', wert: 'DE12 7005 0000 0000 1234 56' }], gueltigkeit: [] });
  async function demoStart() {
    if (MODE !== 'demo') return toast('„Aufgabe probieren“ gibt es nur im Demo-Modus.');
    const laufend = L().find(x => x.typ === 'demo' && !['erledigt', 'ignoriert'].includes(x.status));
    if (laufend) { if (!confirm('Eine Probe läuft schon. Neu starten?')) { if (window.ohCommand) window.ohCommand.karte(laufend.id); return; } return demoNeustart(); }
    const blob = await briefBild(), fileId = uid(); await filePut(fileId, { blob, name: 'Auslaenderbehoerde-Probe.png', type: 'image/png' });
    const it = { id: uid(), typ: 'demo', titel: 'Brief der Ausländerbehörde (Probe)', von: 'Ausländerbehörde Dachau', status: 'liest', docIds: [], schritte: [], created: new Date().toISOString() };
    const d = { id: uid(), added: today(), title: 'Schreiben der Ausländerbehörde (Probe)', personId: '', category: 'Behörde', sender: 'Ausländerbehörde Dachau', date: today(), caseId: '', deadline: '', tags: 'Probe', notes: '', fileId, fileName: 'Auslaenderbehoerde-Probe.png', fileType: 'image/png', fileSize: blob.size, demoRun: it.id };
    S.documents.push(d); it.docIds.push(d.id); L().push(it); save(); punkt();
    location.hash = '#/office';
    melde({ typ: 'neu', title: 'Probe gestartet: Brief der Ausländerbehörde', lines: ['Schau ins Büro: Briefkasten → Sekretärin → Archiv → Rückfragen an dich.'] });
    spaeter(() => buero({ an: 'sekretariat', post: true, text: 'öffnet den Brief der Ausländerbehörde', dauer: 7, fertig: 'Brief geöffnet – geht zum Scannen ins Archiv',
      weiter: [{ an: 'archiv', traegt: true, text: 'scannt den Brief, Gemini liest mit', dauer: 9, fertig: 'Gemini hat den Brief gelesen' }] }), 2500);
    spaeter(() => demoGelesen(it), 30000);
  }
  function demoGelesen(it) {
    if (it.status !== 'liest') return;
    it.ki = DEMO_KI(); it.titel = it.ki.titel; it.status = 'frage'; save(); punkt();
    demoMerken(it, 'Eingang: Brief der Ausländerbehörde (AZ-2026-123) – Unterlagen bis 05.01.2027, Gebühr 45 € bis 15.12.2026.');
    const frage = { id: 'demo:person:' + it.id, text: 'Gemini hat den Brief gelesen: Die Ausländerbehörde will Unterlagen bis 05.01.2027. Für wen ist der Brief?', optionen: S.persons.map(p => p.role) };
    try { buPost({ typ: 'buero-frage', frage }); } catch (e) {}
    melde({ typ: 'buero', title: 'Rückfrage im Büro (Probe)', lines: [frage.text], link: '#/office' });
  }
  function demoAntwort(art, egId, antwort) {
    const it = L().find(x => x.id === egId); if (!it || it.typ !== 'demo') return;
    if (art === 'person') {
      const p = S.persons.find(x => x.role === antwort); it.personId = p ? p.id : ''; it.ki.person = antwort; save();
      demoMerken(it, 'Antwort von dir: Der Brief gehört zu ' + antwort + '.');
      buero({ an: 'leitung', text: 'prüft den Vorgang für ' + antwort, dauer: 6, fertig: 'Vorgang geprüft' });
      spaeter(() => { try { buPost({ typ: 'buero-frage', frage: { id: 'demo:gebuehr:' + it.id, text: 'Die Behörde verlangt 45 € Gebühr bis 15.12.2026. Soll ich die Zahlung einplanen?', optionen: ['Ja, einplanen', 'Nein'] } }); } catch (e) {} }, 7000);
    }
    if (art === 'gebuehr') {
      demoMerken(it, 'Antwort von dir: Gebühr ' + (antwort === 'Nein' ? 'nicht einplanen.' : 'einplanen.'));
      it.schritte = vorschlaege(it, it.ki); if (antwort === 'Nein') it.schritte.forEach(s => { if (s.art === 'zahlung') s.an = false; });
      it.prio = 'rot'; it.status = 'vorschlag'; save(); punkt();
      melde({ typ: 'ki', title: 'Bitte bestätigen (Probe): ' + kurz(it.titel, 60), lines: [it.ki.anliegen, it.schritte.length + ' Schritte vorgeschlagen'], link: 'cmd:' + it.id, key: 'eg:' + it.id });
      spaeter(() => { if (window.ohCommand) window.ohCommand.karte(it.id); }, 1500);
    }
  }
  function demoEnde(it) {
    demoMerken(it, 'Erledigt: alle Schritte verteilt – Termine, Fristen, Finanzen, Adressbuch, Notiz und Ablage.');
    melde({ typ: 'neu', title: 'Probe fertig', lines: ['Alle Mitarbeiter haben ihren Teil erledigt.', 'Im Command kannst du die Aufgabe neu starten.'], link: 'cmd:' + it.id });
  }
  async function demoNeustart() {
    DEMO.timer.forEach(clearTimeout); DEMO.timer = [];
    const ids = new Set(L().filter(x => x.typ === 'demo').map(x => x.id));
    const weg = o => !(o.neu && ids.has(o.neu.eg)) && !ids.has(o.demoRun);
    for (const d of S.documents.filter(x => !weg(x))) if (d.fileId && d.demoRun) await fileDel(d.fileId);
    S.documents = S.documents.filter(weg); S.tasks = S.tasks.filter(weg); S.contacts = S.contacts.filter(weg); S.notes = S.notes.filter(weg);
    S.events = (S.events || []).filter(weg); S.bookings = (S.bookings || []).filter(weg);
    S.demoGedaechtnis = (S.demoGedaechtnis || []).filter(x => !ids.has(x.eg));
    S.mitteilungen = (S.mitteilungen || []).filter(m => !/\(Probe\)|^Probe /.test(m.title) && !(m.link && ids.has(m.link.slice(4))));
    S.eingang = L().filter(x => !ids.has(x.id)); save(); punkt();
    if (window.ohCommand) window.ohCommand.schliessen();
    return demoStart();
  }

  /* ---------- Büro-Antworten abfangen ---------- */
  const origEmpf = window.buEmpfang;
  if (typeof origEmpf === 'function') window.buEmpfang = function (d) {
    if (d && d.typ === 'buero-antwort' && String(d.id || '').startsWith('demo:')) { const [, art, id] = String(d.id).split(':'); demoAntwort(art, id, d.antwort); return; }
    if (d && d.typ === 'buero-antwort' && String(d.id || '').startsWith('eingang:')) { if (d.antwort === 'Jetzt ansehen' && window.ohCommand) window.ohCommand.karte(String(d.id).slice(8)); return; }
    return origEmpf.apply(this, arguments);
  };
  // Neue Dateien (Upload) gehen in die Kette statt direkt an die KI
  window.kiAutoDoc = function (d) { if (d && d.fileId && calCfg().ki !== false) neu({ typ: 'datei', titel: d.title, docIds: [d.id], personId: d.personId || '' }); };
  window.kiDoc = async function (d, manual) {
    if (!d) return; if (!DESKTOP) return manual && alert('Die KI gibt es nur im installierten Programm.');
    if (MODE === 'demo') return manual && alert('Im Demo-Modus wird nichts an die KI geschickt.');
    const alt = L().find(x => x.docIds.includes(d.id) && x.status !== 'erledigt' && x.status !== 'ignoriert'); if (alt) { if (window.ohCommand) window.ohCommand.karte(alt.id); return; }
    const it = neu({ typ: 'datei', titel: d.title, docIds: [d.id], personId: d.personId || '' }); if (it && manual) toast('„' + d.title + '“ ist in der Reihe – du bekommst eine Karte zum Bestätigen.');
  };
  // Nach jedem Neuzeichnen des Hauptbereichs (auch bei Seitenwechsel): Punkte an neuen Einträgen
  let pzT = null;
  const beobachte = () => { const main = document.getElementById('main'); if (!main) return setTimeout(beobachte, 300);
    new MutationObserver(() => { clearTimeout(pzT); pzT = setTimeout(() => { try { punkteSetzen(); } catch (e) {} }, 60); }).observe(main, { childList: true }); };
  beobachte();

  function start() {
    const go = () => { if (!window.OH_READY) return setTimeout(go, 500);
      L().forEach(x => { if (x.status === 'liest') x.status = 'warte'; }); // nach Neustart wieder einreihen
      // Einträge, die nur am abgeschalteten Gemini-Modell gescheitert sind, automatisch noch einmal lesen
      L().forEach(x => { if (x.status === 'fehler' && /no longer available|not found|is not supported|deprecated/i.test(x.fehler || '')) { x.status = 'warte'; x.fehler = ''; } });
      // Doppelte Einträge derselben E-Mail (mehrfach „Ans Büro“ gedrückt) entfernen – der weiteste bleibt
      const RF = { vorschlag: 5, frage: 4, liest: 3, warte: 2, fehler: 1 }, best = {};
      L().forEach(x => { if (x.mailId && OFFEN_ST.includes(x.status)) { const b = best[x.mailId]; if (!b || (RF[x.status] || 0) > (RF[b.status] || 0)) best[x.mailId] = x; } });
      S.eingang = L().filter(x => !(x.mailId && OFFEN_ST.includes(x.status) && best[x.mailId] !== x));
      save();
      punkt(); punkteSetzen(); setInterval(tick, 4000); setTimeout(tick, 2500);
      setTimeout(() => mailsAbrufen(true), 20000); setInterval(() => mailsAbrufen(true), 60 * 60 * 1000); // stündlich: Sekretärin prüft das Postfach
    };
    go();
  }
  ACT.demoAufgabe = () => demoStart();
  window.EG = { neu, offen, listeHTML, karteHTML, aktion: async (id, a, panel) => { const it = L().find(x => x.id === id); if (it && it.typ === 'sammel' && a === 'ok') { const box = panel && panel.querySelector(`[data-eg="${id}"]`); await sammelOk(it, box ? [...box.querySelectorAll('[data-egs]')].filter(x => x.checked).map(x => x.dataset.egs) : []); return; } return aktion(id, a, panel); },
    aktualisieren, mailsAbrufen, mailsNichtFragen, mailVoll, punkt, FARBE, demoStart, demoNeustart };
  // Sammelkarte nutzt dieselbe Darstellung wie Mailwahl/Vorschlag
  const kh = karteHTML; window.EG.karteHTML = id => { const it = L().find(x => x.id === id); if (it && it.typ === 'sammel' && it.status === 'vorschlag') return `<div class="egkarte" data-eg="${it.id}"><div class="eghead">${dot('gruen', true)}<b>${esc(it.titel)}</b></div><div class="egsteps">${it.schritte.map(s => `<label class="egstep"><input type="checkbox" data-egs="${s.id}" ${s.an ? 'checked' : ''}><span><b>${esc(s.text)}</b><small>${esc(s.sub)}</small></span></label>`).join('')}</div><div class="acts"><button class="btn sm pri" data-cmd="eg" data-ea="ok" data-id="${it.id}">Ausgewählte ans Büro</button><button class="btn sm" data-cmd="eg" data-ea="ignorieren" data-id="${it.id}">Keine</button></div></div>`; return kh(id); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
