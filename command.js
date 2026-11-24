/* Home Office Command – schwebender Knopf mit Frage-/Befehlsfenster (Strg+K).
   Idee nach „Swipii Command“ (Leon), neu gebaut für Home Office: ohne KI, nur Suche.
   Quellen: Gedächtnis (nur Ordner der erkannten Person) und die von Gemini gelesenen Dokumente (Zusammenfassung, Absender, Nummern).
   Der Tresor wird nie gelesen. Sensible Nummern erscheinen verdeckt (Klick = zeigen, Knopf = kopieren).
   Läuft nach dem Hauptskript; nutzt dessen globale Funktionen (S, $, esc, icon, getPerson, memOn, …). */
(function () {
  const CMD = { open: false, run: null, busy: false, mode: '' };
  const POS_KEY = 'oh-cmd-pos';
  const ICO = n => (typeof icon === 'function' ? icon(n) : '');

  /* ---------- Wörter: Stoppwörter, Synonyme (Deutsch + Arabisch → deutsche Suchbegriffe) ---------- */
  const STOP = new Set(('was wie wo wer wann welche welcher welches ist sind hat haben die der das den dem des ein eine einen von vom zu zum zur für mit und oder bitte mir mich ich du sie er es '
    + 'nummer nr zeig zeige sag sage gib finde suche such meine meiner mein unsere unser '
    + 'شو ايش إيش شنو وين مين كم قديش هو هي تبع تبعت تبعو تبعها تبعه رقم ال لـ ل من على عن في بدي عطيني اعطيني جيبلي جبلي قلي خبرني فرجيني').split(/\s+/));
  // Begriff → deutsche Suchwörter; „typ“ steuert die Erkennung eines Werts im Text
  const SYN = [
    { k: /versicher(ten|ungs)?nummer|kv-?n(r|ummer)|krankenkasse|krankenversicher|تأمين|تامين|الصحي|كرانكن/i, w: ['Versichertennummer', 'Krankenkasse', 'Versicherungsnummer'], typ: 'kv', l: 'Versichertennummer' },
    { k: /iban|konto|bank|حساب|ايبان|آيبان|بنك/i, w: ['IBAN', 'Konto', 'Bank'], typ: 'iban', l: 'IBAN' },
    { k: /steuer-?id|steuerid|identifikationsnummer|steuernummer|ضريب/i, w: ['Steuer-ID', 'Steueridentifikationsnummer', 'Steuernummer'], typ: 'steuer', l: 'Steuer-ID' },
    { k: /renten(versicherungs)?nummer|rv-?nummer|rente|تقاعد|رنت|رينت/i, w: ['Rentenversicherungsnummer', 'Rente', 'Versicherungsnummer'], typ: 'rv', l: 'Rentenversicherungsnummer' },
    { k: /aktenzeichen|az\b|geschäftszeichen|bg-?n(r|ummer)|ملف|اكتن/i, w: ['Aktenzeichen', 'Geschäftszeichen', 'BG-Nummer'], typ: 'az', l: 'Aktenzeichen' },
    { k: /kunden-?n(r|ummer)|vertragsn(r|ummer)|vertrag|عقد|زبون/i, w: ['Kundennummer', 'Vertragsnummer', 'Vertrag'], typ: 'kd', l: 'Kunden-/Vertragsnummer' },
    { k: /pflegegrad|pflege|رعاية|درجة/i, w: ['Pflegegrad', 'Pflegekasse'], typ: 'pg', l: 'Pflegegrad' },
    { k: /miete|wohnung|vermieter|ايجار|إيجار|بيت|شقة/i, w: ['Miete', 'Wohnung', 'Vermieter'] },
    { k: /jobcenter|bürgergeld|جوب/i, w: ['Jobcenter', 'Bürgergeld'] },
    { k: /arzt|ärztin|praxis|دكتور|طبيب/i, w: ['Arzt', 'Praxis'] },
    { k: /telefon|handy|تلفون|هاتف|موبايل/i, w: ['Telefon'], typ: 'tel', l: 'Telefon' },
    { k: /geburt|مواليد|ميلاد|عمر/i, w: ['Geburtsdatum', 'geboren'], typ: 'geb', l: 'Geburtsdatum' }
  ];
  // Werte im Text erkennen
  const RX = {
    kv: /\b[A-Z]\d{9}\b/,
    iban: /\b[A-Z]{2}\d{2}(?:[ ]?[0-9A-Z]{4}){3,7}(?:[ ]?[0-9A-Z]{1,3})?\b/,
    steuer: /\b\d{2}[ ]?\d{3}[ ]?\d{3}[ ]?\d{3}\b/,
    rv: /\b\d{2}[ ]?\d{6}[ ]?[A-Z][ ]?\d{3}\b/,
    az: /(?:Aktenzeichen|Az\.?|Geschäftszeichen|BG-?N(?:r|ummer)\.?|Zeichen)\s*[:.]?\s*([A-Z0-9][A-Z0-9\/\-.]{2,30}(?: [A-Z0-9\/\-.]{1,12}){0,2})/i,
    kd: /(?:Kunden-?|Vertrags-?|Mitglieds-?|Versicherungsschein-?)(?:n(?:r|ummer)\.?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\/\-.]{3,30})/i,
    pg: /Pflegegrad\s*([1-5])/i,
    tel: /(?:\+49|0)[1-9][0-9 \/-]{6,16}\d/,
    geb: /\b\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}\b/
  };
  // Verdecken: alles, was wie IBAN, Versichertennummer, Steuer-ID, RV-Nummer oder lange Ziffernfolge aussieht
  const SENS = /\b[A-Z]{2}\d{2}(?:[ ]?[0-9A-Z]{4}){3,7}(?:[ ]?[0-9A-Z]{1,3})?\b|\b[A-Z]\d{9}\b|\b\d{2}[ ]?\d{6}[ ]?[A-Z][ ]?\d{3}\b|\b\d{2}[ ]?\d{3}[ ]?\d{3}[ ]?\d{3}\b|\b\d{8,}\b/g;
  const maskVal = v => { const s = String(v); const c = s.replace(/\s/g, ''); return c.length <= 4 ? '••••' : c.slice(0, 3) + '•'.repeat(Math.max(3, c.length - 5)) + c.slice(-2); };
  const sensSpan = (v, alwaysMask) => `<span class="cmdsens" data-v="${esc(v)}" title="Klicken zum Anzeigen">${esc(maskVal(v))}</span><button class="cmdcopy" data-v="${esc(v)}" title="Kopieren">${ICO('kopieren')}</button>`;
  const maskHTML = s => { let out = '', last = 0; String(s).replace(SENS, (m, i) => { out += esc(String(s).slice(last, i)) + sensSpan(m); last = i + m.length; return m; }); return out + esc(String(s).slice(last)); };

  /* ---------- Person aus der Frage erkennen ---------- */
  const AR_ROLE = { 'Vater': ['بابا', 'ابي', 'أبي', 'الوالد', 'والدي', 'papa'], 'Mutter': ['ماما', 'امي', 'أمي', 'الوالدة', 'والدتي', 'mama'] };
  function personAus(text) {
    const t = ' ' + String(text).toLowerCase() + ' ';
    for (const p of S.persons) {
      const names = [p.role, p.firstName, p.lastName, personName(p), ...(AR_ROLE[p.role] || []), ...String(p.alias || '').split(/[,،;]/).map(x => x.trim()), ...((p.role || '').toLowerCase() === 'vater' ? ['papa'] : (p.role || '').toLowerCase() === 'mutter' ? ['mama'] : [])]
        .filter(x => x && String(x).trim().length > 1).map(x => String(x).toLowerCase());
      if (names.some(n => t.includes(n))) return p;
    }
    // Arabische Schreibweise des Vornamens (z. B. مها → Maha) über den Gedächtnis-Ordner
    const m = (typeof memCfg === 'function' && memCfg().map) || {};
    for (const p of S.persons) { const dir = (m[p.id] || '').split('/').pop().toLowerCase(); if (dir && t.includes(dir)) return p; }
    return UI.person && UI.person !== 'all' ? getPerson(UI.person) : null;
  }
  function begriffe(text, p) {
    const raw = String(text).toLowerCase().replace(/[?!.,;:()„“"']/g, ' ').split(/\s+/).filter(Boolean);
    const pn = p ? [p.role, p.firstName, p.lastName, ...(AR_ROLE[p.role] || []), ...String(p.alias || '').split(/[,،;]/).map(x => x.trim())].filter(Boolean).map(x => String(x).toLowerCase()) : [];
    const typ = SYN.find(s => s.k.test(text));
    const words = new Set();
    for (const s of SYN) if (s.k.test(text)) s.w.forEach(w => words.add(w));
    for (const w of raw) if (!STOP.has(w) && !pn.includes(w) && w.length > 2 && !/[؀-ۿ]/.test(w)) words.add(w);
    return { typ, words: [...words] };
  }

  /* ---------- Suche ---------- */
  function docTreffer(p, words, typ) {
    const ws = words.map(w => w.toLowerCase());
    const out = [];
    for (const d of S.documents) {
      if (p && d.personId && d.personId !== p.id) continue;
      if (p && !d.personId) continue;
      const nums = (d.kiNummern || []).map(n => n.art + ': ' + n.wert).join(' · ');
      const hay = [d.title, d.sender, d.category, d.tags, d.notes, nums].join(' ').toLowerCase();
      const score = ws.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
      if (!score) continue;
      let wert = null;
      if (typ && typ.typ) for (const n of d.kiNummern || []) { if (typ.k.test(n.art) || (RX[typ.typ] && RX[typ.typ].test(n.wert))) { wert = n.wert; break; } }
      out.push({ quelle: 'dok', d, score: score + (wert ? 3 : 0), wert, text: [d.notes, nums].filter(Boolean).join('\n') });
    }
    return out.sort((a, b) => b.score - a.score || (b.d.date || '').localeCompare(a.d.date || '')).slice(0, 6);
  }
  function wertAus(text, typ) {
    if (!typ || !typ.typ || !RX[typ.typ]) return null;
    const m = String(text).match(RX[typ.typ]); return m ? (m[1] || m[0]).trim() : null;
  }

  /* ---------- Befehle (mit Bestätigung) ---------- */
  const OPEN = [[/vertr[aä]g|عقود|عقد/i, 'contracts', 'Verträge'], [/dokument|مستند|اوراق|أوراق/i, 'documents', 'Dokumente'], [/kalender|termin|تقويم|موعد|مواعيد/i, 'calendar', 'Kalender'],
    [/frist|aufgabe|مهل|مهام/i, 'tasks', 'Fristen & Aufgaben'], [/finanz|ausgab|einnahm|مصاريف|مالية/i, 'finance', 'Finanzen'], [/person|vollmacht|وكالة|اشخاص|أشخاص/i, 'persons', 'Personen & Vollmachten'],
    [/adress|kontakt|دفتر|جهات/i, 'contacts', 'Adressbuch'], [/brief|رسائل|رسالة/i, 'letters', 'Briefe'], [/büro|buero|مكتب/i, 'office', 'Büro'], [/konto|vermögen|حسابات|أملاك/i, 'assets', 'Konten & Vermögen'], [/notiz|ملاحظ/i, 'notes', 'Notizen']];
  function datumAus(t) {
    const T = today(); const s = String(t).toLowerCase();
    if (/übermorgen|بعد بكرة|بعد بكره/.test(s)) return dshift(T, 2);
    if (/morgen|بكرة|بكره|غدا|غداً/.test(s)) return dshift(T, 1);
    if (/heute|اليوم/.test(s)) return T;
    let m = s.match(/in (\d+) tag/) || s.match(/بعد (\d+) (?:يوم|ايام|أيام)/); if (m) return dshift(T, Number(m[1]));
    if (/nächste woche|الأسبوع الجاي|الاسبوع الجاي|الجمعة الجاية/.test(s)) return dshift(T, 7);
    m = s.match(/(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?/); if (m) { const y = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : T.slice(0, 4); return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
    return '';
  }
  function befehl(text, p) {
    const s = String(text);
    if (/^(neue |eine )?(frist|aufgabe|erinner)|^(ذكرني|ذكّرني|مهلة|سجل مهلة|حط مهلة|اعمل مهلة)/i.test(s.trim())) {
      const due = datumAus(s) || dshift(today(), 7);
      const title = s.replace(/^(neue |eine )?(frist|aufgabe|erinnerung|erinnere mich)\s*:?\s*|^(ذكرني|ذكّرني|مهلة|سجل مهلة|حط مهلة|اعمل مهلة)\s*/i, '').replace(/\b(heute|morgen|übermorgen|in \d+ tagen?|nächste woche)\b|بكرة|بكره|اليوم|بعد بكرة/gi, '').trim() || 'Neue Frist';
      return { art: 'frist', title, due, p };
    }
    if (/^(schreib|brief|kündig|widerspruch)|^(اكتب|رسالة|الغي|ألغي|الغاء|إلغاء|اعتراض)/i.test(s.trim())) {
      const q = s.replace(/^(schreibe?( einen)?( brief)?|brief|اكتب( رسالة)?|رسالة)\s*/i, '');
      const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const kw = /kündig|الغ|إلغ/i.test(s) ? 'kündig' : /widerspruch|اعتراض/i.test(s) ? 'widerspruch' : '';
      const tpls = allTemplates().map(t => ({ t, sc: (kw && t.name.toLowerCase().includes(kw) ? 2 : 0) + words.reduce((a, w) => a + (t.name.toLowerCase().includes(w) ? 1 : 0), 0) })).sort((a, b) => b.sc - a.sc);
      const c = S.contacts.find(c => c.name && s.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]));
      const tpl = tpls[0] && tpls[0].sc ? tpls[0].t : null;
      return { art: 'brief', tpl, c, p };
    }
    if (/^(öffne|zeig(e)?|geh zu)|^(افتح|وريني|فرجيني|روح ع|خدني ع)/i.test(s.trim())) {
      const o = OPEN.find(([rx]) => rx.test(s)); if (o) return { art: 'oeffnen', route: o[1], l: o[2], p };
    }
    return null;
  }

  /* ---------- Ablauf einer Anfrage (Schritte + Weg-Anzeige) ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function ausfuehren(text, opt = {}) {
    text = String(text || '').trim(); if (!text || CMD.busy) return;
    CMD.busy = true;
    const p = opt.p !== undefined ? opt.p : personAus(text);
    const run = CMD.run = { text: opt.label || text, steps: [], hop: 0, ziel: p ? p.role : 'Alle', antwort: null, status: 'running' };
    const step = l => { run.steps.push(l); draw(); };
    draw(); await wait(180); run.hop = 1; step(p ? 'Person erkannt: ' + p.role + (personName(p) !== p.role ? ' (' + personName(p) + ')' : '') : 'Keine Person erkannt – suche allgemein');
    try {
      if (opt.quick) await opt.quick(run, step, p);
      else {
        const b = befehl(text, p);
        if (b) { run.hop = 2; step('Befehl erkannt'); await wait(150); run.antwort = befehlAntwort(b); }
        else await frage(run, step, text, p);
      }
    } catch (e) { run.antwort = { text: 'Fehler: ' + (e && e.message || e), html: '' }; }
    run.hop = 3; draw(); await wait(260); run.hop = 4; run.status = 'done'; CMD.busy = false; draw();
  }
  async function frage(run, step, text, p) {
    const { typ, words } = begriffe(text, p);
    run.hop = 2; step('Suchbegriffe: ' + (words.slice(0, 5).join(', ') || '–')); draw();
    // 1) Von Gemini gelesene Dokumente
    const docs = docTreffer(p, words.length ? words : [text], typ);
    step('Dokumente durchsucht: ' + docs.length + ' Treffer');
    // 2) Gedächtnis – nur der Ordner der Person
    let mem = [], memNote = '';
    if (typeof memOn === 'function' && memOn()) {
      const dir = p ? memWsFor(p.id) : (memCfg().defaultWs || '');
      if (p && !dir) memNote = 'Für ' + p.role + ' ist kein Ordner im Gedächtnis gewählt (Einstellungen → Claude & Gedächtnis).';
      else {
        run.ziel = p ? memDirLabel(dir) : 'Gedächtnis'; draw();
        const r = await window.officeHome.memSearch(memCfg().root, dir, (words.join(' ') || text), !!p);
        if (r && r.ok) mem = r.hits || []; else memNote = 'Gedächtnis: ' + ((r && r.message) || 'nicht erreichbar');
      }
      step('Gedächtnis durchsucht: ' + mem.length + ' Treffer');
    } else memNote = DESKTOP ? 'Gedächtnis ist nicht verbunden (Einstellungen → Claude & Gedächtnis).' : 'Das Gedächtnis gibt es nur im installierten Programm.';
    // 3) Wert herausziehen
    let wert = null, quelle = null;
    for (const d of docs) if (d.wert) { wert = d.wert; quelle = 'Dokument „' + d.d.title + '“'; break; }
    if (!wert) for (const h of mem) { const v = wertAus(h.snippet + ' ' + h.title, typ); if (v) { wert = v; quelle = 'Gedächtnis: ' + h.path; break; } }
    if (!wert) for (const d of docs) { const v = wertAus(d.text, typ); if (v) { wert = v; quelle = 'Dokument „' + d.d.title + '“'; break; } }
    const wer = p ? ' von ' + esc(p.role) : '';
    let html = '';
    if (wert) html = `<div class="cmdval"><span class="small muted">${esc(typ.l)}${wer}</span><div>${typ.typ === 'pg' || typ.typ === 'geb' ? '<b>' + esc(wert) + '</b>' : sensSpan(wert)}</div><div class="small muted">Quelle: ${esc(quelle)}</div></div>`;
    const list = [...docs.slice(0, 3).map(d => `<div class="cmdhit"><b>${ICO('dokumente')}${esc(d.d.title)}</b><div class="small muted">${esc([d.d.sender, fmtDate(d.d.date)].filter(Boolean).join(' · '))}</div>${d.text ? `<div class="small">${maskHTML(d.text.slice(0, 260))}</div>` : ''}<button class="btn sm" data-cmd="doc" data-id="${esc(d.d.id)}">${ICO('auge')}Öffnen</button></div>`),
      ...mem.slice(0, 4).map(h => `<div class="cmdhit"><b>${ICO('gedaechtnis')}${esc(h.title)}</b><div class="small muted trunc">${esc(h.path)}</div>${h.snippet ? `<div class="small">${maskHTML(h.snippet.slice(0, 280))}</div>` : ''}</div>`)];
    const head = wert ? `${esc(typ.l)}${wer} gefunden.` : list.length ? `${list.length} passende Stelle${list.length > 1 ? 'n' : ''} gefunden${p ? ' für ' + esc(p.role) : ''}.` : `Nichts gefunden${p ? ' für ' + esc(p.role) : ''}. Andere Begriffe versuchen – z. B. Behörde, Art der Nummer oder Stichwort aus dem Brief.`;
    run.antwort = { text: head, html: html + (list.length ? `<div class="cmdhits">${list.join('')}</div>` : '') + (memNote ? `<div class="small muted">${esc(memNote)}</div>` : '') };
  }
  function befehlAntwort(b) {
    const wer = b.p ? b.p.role : 'Allgemein';
    if (b.art === 'frist') return { text: 'Neue Frist anlegen?', html: `<div class="cmdval"><b>${esc(b.title)}</b><div class="small muted">fällig am ${fmtDate(b.due)} · ${esc(wer)}</div></div>`,
      acts: [['Anlegen', 'plus', () => { S.tasks.push({ id: uid(), title: b.title, due: b.due, personId: b.p ? b.p.id : '', caseId: '', priority: 'normal', notes: 'Angelegt über Command', done: false, created: today() }); save(); render(); fertig('Frist angelegt: ' + b.title + ' am ' + fmtDate(b.due)); }], ['Abbrechen', 'schliessen', () => fertig('Abgebrochen.')]] };
    if (b.art === 'brief') return { text: b.tpl ? 'Brief mit Vorlage öffnen?' : 'Neuen Brief öffnen?', html: `<div class="cmdval"><b>${esc(b.tpl ? b.tpl.name : 'Freies Schreiben')}</b><div class="small muted">${b.c ? 'an ' + esc(b.c.name) + ' · ' : ''}${esc(wer)}</div></div>`,
      acts: [['Brief öffnen', 'brief', () => { const q = new URLSearchParams(); if (b.tpl) q.set('tpl', b.tpl.id); if (b.c) q.set('contact', b.c.id); if (b.p) q.set('person', b.p.id); location.hash = '#/brief/new?' + q; schliessen(); }], ['Andere Vorlage', 'vorlage', () => { schliessen(); tplPickOpen('', '', ''); }]] };
    if (b.art === 'oeffnen') return { text: b.l + (b.p ? ' für ' + b.p.role : '') + ' öffnen?', html: '',
      acts: [['Öffnen', 'auge', () => { if (b.p) UI.person = b.p.id; location.hash = '#/' + b.route; render(); schliessen(); }]] };
    return null;
  }
  function fertig(t) { if (CMD.run) { CMD.run.antwort = { text: esc(t), html: '' }; draw(); } }

  /* ---------- Schnellknöpfe ---------- */
  const QUICK = [
    { id: 'aktualisieren', l: 'Aktualisieren', i: 'update' },
    { id: 'upload', l: 'Datei hochladen', i: 'hochladen' },
    { id: 'fragen', l: 'Offene Rückfragen', i: 'info' },
    { id: 'fristen', l: 'Fristen heute & diese Woche', i: 'fristen' },
    { id: 'dok', l: 'Dokumente durchsuchen', i: 'suche' }
  ];
  function quick(id) {
    if (id === 'aktualisieren') { if (window.EG) window.EG.aktualisieren(); return; }
    if (id === 'probe') { schliessen(); if (window.EG) window.EG.demoStart(); return; }
    if (id === 'upload') return hochladen();
    if (id === 'dok') { CMD.mode = 'dok'; draw(); const i = $('#cmdIn'); if (i) { i.placeholder = 'Dokumente durchsuchen … (Titel, Absender, Inhalt)'; i.focus(); } return; }
    if (id === 'fragen') return ausfuehren('Offene Rückfragen', { label: 'Offene Rückfragen zeigen', quick: async (run, step) => {
      run.hop = 2; step('Büro gefragt'); await wait(200);
      const n = BU.fragen || 0, ohneP = S.documents.filter(d => !d.personId).length, kiF = S.documents.filter(d => d.ki && !d.ki.ok).length;
      run.ziel = 'Büro';
      run.antwort = { text: n ? `Es gibt ${n} offene Rückfrage${n > 1 ? 'n' : ''} im Büro.` : 'Es gibt keine offenen Rückfragen.', html: (ohneP || kiF) ? `<div class="small muted">${ohneP ? ohneP + ' Dokument(e) ohne Person' : ''}${ohneP && kiF ? ' · ' : ''}${kiF ? kiF + ' Dokument(e) konnte die KI nicht lesen' : ''}</div>` : '',
        acts: [['Im Büro zeigen', 'alle', () => { location.hash = '#/office'; schliessen(); }]] };
    } });
    if (id === 'fristen') return ausfuehren('Fristen', { label: 'Fristen heute & diese Woche', p: personAus(''), quick: async (run, step, p) => {
      run.hop = 2; step('Fristen und Termine gesammelt'); await wait(150);
      const T = today(), bis = dshift(T, 7);
      const ok = x => !p || x.personId === p.id;
      const f = S.tasks.filter(t => !t.done && t.due && t.due <= bis && ok(t)).map(t => ({ d: t.due, t: t.title, k: 'Frist', pid: t.personId }));
      const e = (S.events || []).filter(x => !x.done && x.date >= T && x.date <= bis && ok(x)).map(x => ({ d: x.date, t: (x.time ? x.time + ' ' : '') + x.title, k: x.kind === 'frist' ? 'Frist' : 'Termin', pid: x.personId }));
      const all = [...f, ...e].sort((a, b) => a.d.localeCompare(b.d));
      run.ziel = 'Kalender';
      run.antwort = { text: all.length ? `${all.length} Einträge bis ${fmtDate(bis)}${p ? ' für ' + esc(p.role) : ''}.` : 'Diese Woche ist nichts fällig.',
        html: all.length ? `<div class="cmdhits">${all.slice(0, 10).map(x => `<div class="cmdrow ${x.d < T ? 'over' : ''}"><span class="small">${x.d < T ? 'überfällig · ' : ''}${fmtDate(x.d)}</span><b>${esc(x.t)}</b><span class="small muted">${x.k}${x.pid && getPerson(x.pid) ? ' · ' + esc(getPerson(x.pid).role) : ''}</span></div>`).join('')}</div>` : '',
        acts: [['Im Kalender ansehen', 'kalender', () => { location.hash = '#/calendar'; schliessen(); }]] };
    } });
  }
  function dokSuche(q) {
    return ausfuehren(q, { label: 'Dokumente: ' + q, quick: async (run, step, p) => {
      run.hop = 2; const w = q.toLowerCase().split(/\s+/).filter(Boolean);
      const L = S.documents.filter(d => !p || d.personId === p.id).filter(d => { const h = [d.title, d.sender, d.category, d.tags, d.notes, (d.kiNummern || []).map(n => n.art + ' ' + n.wert).join(' ')].join(' ').toLowerCase(); return w.every(x => h.includes(x)); })
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      step('Dokumente durchsucht: ' + L.length + ' Treffer'); run.ziel = 'Dokumente';
      run.antwort = { text: L.length ? `${L.length} Dokument${L.length > 1 ? 'e' : ''} gefunden.` : 'Kein Dokument gefunden.',
        html: L.length ? `<div class="cmdhits">${L.slice(0, 8).map(d => `<div class="cmdhit"><b>${ICO('dokumente')}${esc(d.title)}</b><div class="small muted">${esc([d.sender, fmtDate(d.date), d.personId && getPerson(d.personId) ? getPerson(d.personId).role : ''].filter(Boolean).join(' · '))}</div><button class="btn sm" data-cmd="doc" data-id="${esc(d.id)}">${ICO('auge')}Öffnen</button></div>`).join('')}</div>` : '' };
    } });
  }
  async function hochladen() {
    const f = await pickFile('application/pdf,image/*,.doc,.docx,.txt'); if (!f) return;
    const txt = ($('#cmdIn') && $('#cmdIn').value) || '';
    const p = personAus(txt);
    const weiter = person => {
      schliessen();
      editDoc(null, { personId: person ? person.id : '' }, f, async o => {
        const pp = getPerson(o.personId);
        if (pp && DESKTOP && typeof memOn === 'function' && memOn() && memWsFor(pp.id) && window.officeHome.memCopyFile) {
          const r = await window.officeHome.memCopyFile(memCfg().root, memWsFor(pp.id), f.name, await f.arrayBuffer());
          toast(r && r.ok ? 'Auch im Gedächtnis abgelegt: ' + memDirLabel(memWsFor(pp.id)) : 'Gedächtnis: ' + ((r && r.message) || 'nicht gespeichert'));
        }
      });
    };
    if (p || S.persons.length < 2) return weiter(p || S.persons[0]);
    CMD.run = { text: 'Datei: ' + f.name, steps: ['Datei gewählt'], hop: 4, ziel: '?', status: 'done',
      antwort: { text: 'Für wen ist die Datei?', html: '', acts: [...S.persons.map(x => [x.role, 'personen', () => weiter(x)]), ['Allgemein', 'alle', () => weiter(null)]] } };
    draw();
  }

  /* ---------- Oberfläche ---------- */
  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  let orb, panel;
  function aufbauen() {
    orb = el(`<button id="cmdOrb" aria-label="Command öffnen (Strg+K)" title="Frage stellen (Strg+K)"><span class="core">${ICO('ki')}</span></button>`);
    panel = el(`<div id="cmdPanel" role="dialog" aria-label="Home Office Command" aria-hidden="true"></div>`);
    document.body.append(orb, panel);
    let pos = null; try { pos = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch (e) {}
    setzen(pos);
    // Ziehen; ein Klick ohne Bewegung öffnet
    let start = null, moved = false;
    orb.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY, r: orb.getBoundingClientRect() }; moved = false; orb.setPointerCapture(e.pointerId); });
    orb.addEventListener('pointermove', e => { if (!start) return; const dx = e.clientX - start.x, dy = e.clientY - start.y; if (!moved && Math.hypot(dx, dy) < 5) return; moved = true;
      setzen({ x: start.r.left + dx, y: start.r.top + dy }, true); if (CMD.open) lage(); });
    orb.addEventListener('pointerup', () => { if (!start) return; start = null; if (moved) { const r = orb.getBoundingClientRect(); try { localStorage.setItem(POS_KEY, JSON.stringify({ x: r.left, y: r.top })); } catch (e) {} } else umschalten(); });
    window.addEventListener('resize', () => { setzen(orbPos()); if (CMD.open) lage(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); umschalten(); }
      else if (e.key === 'Escape' && CMD.open && !document.getElementById('modal')) schliessen();
    });
    panel.addEventListener('click', klick);
    panel.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cmdIn') { e.preventDefault(); senden(); } });
  }
  const orbPos = () => { const r = orb.getBoundingClientRect(); return { x: r.left, y: r.top }; };
  function setzen(pos, live) {
    const W = window.innerWidth, H = window.innerHeight, s = 56;
    const p = pos && isFinite(pos.x) ? pos : { x: W - s - 28, y: Math.round(H * 0.62) }; // Standard: rechts, über den Hinweiskarten
    orb.style.left = Math.min(W - s - 6, Math.max(6, p.x)) + 'px'; orb.style.top = Math.min(H - s - 6, Math.max(6, p.y)) + 'px';
  }
  function lage() {
    const r = orb.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, pw = Math.min(390, W - 24), ph = Math.min(560, H - 24);
    let x = r.left + r.width / 2 > W / 2 ? r.left - pw - 12 : r.right + 12; x = Math.min(W - pw - 12, Math.max(12, x));
    let y = r.top + r.height / 2 - ph / 2; y = Math.min(H - ph - 12, Math.max(12, y));
    panel.style.left = x + 'px'; panel.style.top = y + 'px'; panel.style.width = pw + 'px'; panel.style.maxHeight = ph + 'px';
    panel.style.transformOrigin = (r.left + r.width / 2 - x) + 'px ' + (r.top + r.height / 2 - y) + 'px';
  }
  function umschalten() { CMD.open ? schliessen() : oeffnen(); }
  function oeffnen() { CMD.open = true; lage(); draw(); panel.classList.add('on'); orb.classList.add('on'); panel.setAttribute('aria-hidden', 'false'); setTimeout(() => { const i = $('#cmdIn'); if (i) i.focus(); }, 180); }
  function schliessen() { CMD.open = false; CMD.mode = ''; panel.classList.remove('on'); orb.classList.remove('on'); panel.setAttribute('aria-hidden', 'true'); }
  function senden() { const i = $('#cmdIn'); if (!i || !i.value.trim() || CMD.busy) return; const q = normDigits(i.value.trim()); i.value = ''; if (CMD.mode === 'dok') { CMD.mode = ''; dokSuche(q); } else ausfuehren(q); }
  function klick(e) {
    const t = e.target;
    const sv = t.closest('.cmdsens'); if (sv) { const show = !sv.classList.contains('shown'); sv.classList.toggle('shown', show); sv.textContent = show ? sv.dataset.v : maskVal(sv.dataset.v); return; }
    const cp = t.closest('.cmdcopy'); if (cp) { navigator.clipboard.writeText(cp.dataset.v).then(() => toast('Kopiert'), () => prompt('Kopieren:', cp.dataset.v)); return; }
    const b = t.closest('[data-cmd]'); if (!b) return;
    const a = b.dataset.cmd;
    if (a === 'close') return schliessen();
    if (a === 'egkarte') { CMD.karte = b.dataset.id; return draw(); }
    if (a === 'egzurueck') { CMD.karte = null; return draw(); }
    if (a === 'eg' && window.EG) { b.disabled = true; window.EG.aktion(b.dataset.id, b.dataset.ea, panel).then(r => { b.disabled = false; if (r === 'zu') CMD.karte = null; if (r !== 'bleib') draw(); }); return; }
    if (a === 'send') return senden();
    if (a === 'neu') { CMD.run = null; CMD.mode = ''; draw(); const i = $('#cmdIn'); if (i) i.focus(); return; }
    if (a === 'quick') return quick(b.dataset.id);
    if (a === 'steps') { CMD.run.showSteps = !CMD.run.showSteps; return draw(); }
    if (a === 'act') { const f = CMD.run && CMD.run.antwort && CMD.run.antwort.acts && CMD.run.antwort.acts[Number(b.dataset.i)]; if (f) f[2](); return; }
    if (a === 'doc') { const d = S.documents.find(x => x.id === b.dataset.id); if (d) openDoc(d); return; }
  }
  function route(run) {
    const ph = run.hop, N = [['Du', 'personen'], ['Command', 'ki'], ['Gedächtnis', 'gedaechtnis'], [run.ziel || 'Ziel', run.ziel === 'Kalender' ? 'kalender' : run.ziel === 'Büro' ? 'alle' : run.ziel === 'Dokumente' ? 'dokumente' : 'vollmacht']];
    const seg = j => ph >= 3 ? (ph === 3 ? 'back' : 'ok') : ph === j ? 'active' : ph > j ? 'done' : 'idle';
    return `<div class="cmdroute">${N.map(([l, ic], i) => `<div class="node ${ph >= 3 || ph >= i ? 'on' : ''} ${ph === i || (ph === 2 && i === 3) ? 'cur' : ''} ${ph === 4 ? 'ok' : ''}"><span>${ICO(ic)}</span><em>${esc(l)}</em></div>${i < 3 ? `<i class="seg ${seg(i)}"></i>` : ''}`).join('')}</div>`;
  }
  function draw() {
    if (!panel || !CMD.open) return;
    // Karte aus dem Eingang (Vorschlag mit Häkchen)
    if (CMD.karte && window.EG) {
      panel.innerHTML = `<div class="cmdhead"><button class="cmdx" data-cmd="egzurueck" aria-label="Zurück">‹</button><div class="grow"><b>Eingang</b><div class="small muted">Erst nach deiner Bestätigung wird etwas eingetragen</div></div><button class="cmdx" data-cmd="close" aria-label="Schließen">${ICO('schliessen')}</button></div>
        <div class="cmdbody">${window.EG.karteHTML(CMD.karte)}</div>`;
      return;
    }
    const r = CMD.run, running = r && r.status === 'running';
    const inp = $('#cmdIn'); const val = inp ? inp.value : '';
    panel.innerHTML = `<div class="cmdhead"><span class="cmdlogo">${ICO('ki')}</span><div class="grow"><b>Home Office Command</b><div class="small muted">Fragen ans Gedächtnis und an deine Dokumente</div></div><kbd>Strg K</kbd><button class="cmdx" data-cmd="close" aria-label="Schließen">${ICO('schliessen')}</button></div>
      <div class="cmdfield"><input id="cmdIn" autocomplete="off" placeholder="${CMD.mode === 'dok' ? 'Dokumente durchsuchen … (Titel, Absender, Inhalt)' : 'Frage oder Befehl … z. B. „Versichertennummer Mutter“'}" ${running ? 'disabled' : ''}><button data-cmd="send" aria-label="Senden" ${running ? 'disabled' : ''}>${ICO('suche')}</button></div>
      ${r ? `<div class="cmdbody"><div class="cmdq">${esc(r.text)}</div>${route(r)}
        ${r.status === 'done' && !r.showSteps ? `<button class="cmdsteps" data-cmd="steps">${ICO('erledigt')}${r.steps.length} Schritte abgeschlossen ▾</button>`
          : `<div class="cmdsteplist">${r.steps.map((s, i) => `<div class="${running && i === r.steps.length - 1 ? 'cur' : ''}">${running && i === r.steps.length - 1 ? '<span class="spin"></span>' : ICO('erledigt')}${esc(s)}</div>`).join('')}${running && !r.steps.length ? '<div class="cur"><span class="spin"></span>Wird gesendet …</div>' : ''}</div>`}
        ${r.antwort ? `<div class="cmdans"><div class="lbl"><i></i>Antwort</div><div class="txt">${r.antwort.text}</div>${r.antwort.html || ''}${(r.antwort.acts || []).length ? `<div class="acts">${r.antwort.acts.map((a, i) => `<button class="btn sm ${i === 0 ? 'pri' : ''}" data-cmd="act" data-i="${i}">${ICO(a[1])}${esc(a[0])}</button>`).join('')}</div>` : ''}</div>` : ''}</div>
        <div class="cmdfoot">${r.status === 'done' ? `<button class="cmdtile sm" data-cmd="neu">${ICO('update')}Neue Anfrage</button>` : ''}<span class="grow"></span>${QUICK.map(q => `<button class="cmdico" data-cmd="quick" data-id="${q.id}" title="${esc(q.l)}" ${running ? 'disabled' : ''}>${ICO(q.i)}</button>`).join('')}</div>`
      : `${window.EG ? window.EG.listeHTML() : ''}<div><div class="cmdlbl">Schnellaktionen</div><div class="cmdgrid">${(MODE === 'demo' ? [{ id: 'probe', l: 'Aufgabe probieren', i: 'alle' }, ...QUICK] : QUICK).map(q => `<button class="cmdtile" data-cmd="quick" data-id="${q.id}">${ICO(q.i)}${esc(q.l)}</button>`).join('')}</div>
        <div class="cmdtip small muted">Beispiele: „Versichertennummer Mutter“, „شو رقم تأمين ماما“, „IBAN Vater“, „Frist morgen AOK anrufen“, „Kündigung Vodafone“, „öffne Verträge Vater“.</div></div>`}`;
    const i2 = $('#cmdIn'); if (i2 && val && !running) i2.value = val;
    if (i2 && !running && document.activeElement === document.body) i2.focus();
    const b = panel.querySelector('.cmdbody'); if (b) b.scrollTop = b.scrollHeight;
    if (typeof window.ohTranslate === 'function') window.ohTranslate(panel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aufbauen); else aufbauen();
  window.ohCommand = { oeffnen, schliessen, frage: q => { oeffnen(); ausfuehren(q); },
    karte: id => { CMD.karte = id; CMD.run = null; if (!CMD.open) oeffnen(); else draw(); },
    neuZeichnen: () => { if (CMD.open && !CMD.busy && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#cmdPanel input:not([type=checkbox]), #cmdPanel select'))) draw(); } };
})();
