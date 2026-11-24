/* Bereich „E-Mail“: Konto (mail.de, IMAP/SMTP), Posteingang mit Lesebereich, „Ans Büro“ (Eingangskette), Antworten, neue E-Mail.
   Abruf: stündlich durch die Sekretärin (eingang.js) oder per Knopf. Passwörter nur im Hauptprozess (verschlüsselt).
   Läuft nach dem Hauptskript und nutzt dessen Globale. */
(function () {
  const MU = { filter: 'alle', sel: '', konten: null, text: {}, ansicht: 'html', extern: {}, urls: {}, ordner: 'eingang', gesendet: null, gSel: '', gLaedt: false, mem: {}, gLaedtVoll: '' };
  const M = () => { if (!Array.isArray(S.mails)) S.mails = []; return S.mails; };
  // Dateien: gespeicherte (Posteingang) oder nur im Arbeitsspeicher (geöffnete gesendete Mails, „mem-…“)
  const fget = async fid => MU.mem[fid] || fileGet(fid);
  const mailVon = id => M().find(x => x.id === id) || (MU.gesendet && MU.gesendet.list.find(x => x.id === id)) || null;
  const kurz = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const STATUS = { neu: ['Neu', 'gruen'], buero: ['Im Büro', 'lila'], erledigt: ['Erledigt', 'gruen'], ignoriert: ['Nicht bearbeitet', 'grau'] };
  const datum = iso => { const d = new Date(iso); return d.toDateString() === new Date().toDateString() ? d.toTimeString().slice(0, 5) : fmtDate(iso.slice(0, 10)); };

  // Menüpunkt über „Kalender“
  const i = NAV.findIndex(n => n.r === 'calendar');
  NAV.splice(i < 0 ? 2 : i, 0, { r: 'mail', l: 'E-Mail', i: 'mail', cnt: () => M().filter(m => !m.gelesen).length });

  async function konten(neu) { if (!DESKTOP || !window.officeHome.mailKonten) return []; if (!MU.konten || neu) MU.konten = await window.officeHome.mailKonten(); return MU.konten; }

  VIEWS.mail = () => {
    if (!DESKTOP) return `<div class="head"><div class="grow"><h1>${icon('mail')}E-Mail</h1></div></div><div class="card"><div class="empty">E-Mail gibt es nur im installierten Programm.</div></div>`;
    if (!MU.konten) { konten().then(() => { if (parseHash().route === 'mail') render(); }); return `<div class="head"><div class="grow"><h1>${icon('mail')}E-Mail</h1></div></div><div class="card"><div class="empty">Lädt …</div></div>`; }
    if (!MU.konten.length) return `<div class="head"><div class="grow"><h1>${icon('mail')}E-Mail</h1><p class="sub" style="margin:0">Postfach verbinden – danach prüft die Sekretärin es jede Stunde.</p></div></div>${kontoForm()}`;
    const kopf = `<div class="head"><div class="grow"><h1>${icon('mail')}E-Mail</h1><p class="sub" style="margin:0">${esc(MU.konten.map(k => k.user).join(' · '))}${MU.konten[0] && MU.konten[0].lastCheck ? ' · zuletzt geprüft ' + datum(MU.konten[0].lastCheck) : ''}</p></div>
      <button class="btn" data-act="mKonten">${icon('einstellungen')}Konten</button><button class="btn" data-act="${MU.ordner === 'gesendet' ? 'mGesendetLaden' : 'mAbrufen'}">${icon('update')}${MU.ordner === 'gesendet' ? 'Neu laden' : 'Abrufen'}</button><button class="btn pri" data-act="mNeu">${icon('plus')}Neue E-Mail</button></div>
      <div class="themesw" style="margin-bottom:12px"><button class="${MU.ordner === 'eingang' ? 'on' : ''}" data-act="mOrdner" data-id="eingang">${icon('mail')}Posteingang</button><button class="${MU.ordner === 'gesendet' ? 'on' : ''}" data-act="mOrdner" data-id="gesendet">${icon('update')}Gesendet</button></div>`;
    if (MU.ordner === 'gesendet') return kopf + gesendetHTML();
    const F = MU.filter, list = M().filter(m => F === 'alle' || m.status === F || (F === 'ungelesen' && !m.gelesen)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const sel = M().find(m => m.id === MU.sel) || null;
    const tab = (v, l) => `<button class="pill ${F === v ? 'on' : ''}" data-act="mFilter" data-id="${v}">${l} <span class="small muted">${v === 'alle' ? M().length : v === 'ungelesen' ? M().filter(m => !m.gelesen).length : M().filter(m => m.status === v).length}</span></button>`;
    return kopf + `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${tab('alle', 'Alle')}${tab('ungelesen', 'Ungelesen')}${tab('neu', 'Neu')}${tab('buero', 'Im Büro')}${tab('erledigt', 'Erledigt')}${tab('ignoriert', 'Nicht bearbeitet')}</div>
      <div class="mwrap"><div class="card mlist">${list.length ? list.map(m => `<button class="mitem ${m.id === MU.sel ? 'on' : ''} ${m.gelesen ? '' : 'ungel'}" data-act="mOpen" data-id="${m.id}">
          <span class="mtop"><b>${esc(kurz(m.fromName || m.from, 40))}</b><small>${esc(datum(m.date))}</small></span>
          <span class="msub">${esc(kurz(m.subject, 70))}${(m.atts || []).length ? ' <span class="small">📎' + m.atts.length + '</span>' : ''}</span>
          <span class="msnip">${esc(kurz(m.snippet, 110))}</span><span class="mst">${(STATUS[m.status] || STATUS.neu)[0]}</span></button>`).join('') : '<div class="empty">Keine E-Mails.</div>'}</div>
        <div class="card mread">${sel ? leseHTML(sel) : '<div class="empty">E-Mail links auswählen.</div>'}</div></div>`;
  };
  // Gesendet: direkt aus dem Ordner „Gesendet“ des Postfachs (auch Mails vom Handy/Browser)
  async function gesendetLaden() {
    if (MU.gLaedt) return; MU.gLaedt = true; const alle = [], fehler = [];
    for (const k of MU.konten || []) { const r = await window.officeHome.mailGesendet(k.id, 50); if (r && r.ok) r.mails.forEach(m => { const g = Object.assign({ id: k.id + ':' + m.uid, acc: k.id, von: k.user, gesendet: true, voll: false }, m); g.attNamen = m.atts || []; g.atts = []; MU.text[g.id] = m.text || ''; alle.push(g); }); else fehler.push(k.user + ': ' + ((r && r.message) || 'Fehler')); }
    MU.gesendet = { list: alle.sort((a, b) => b.date.localeCompare(a.date)), fehler, am: new Date().toISOString() }; MU.gLaedt = false;
    if (parseHash().route === 'mail') render();
  }
  function gesendetHTML() {
    if (!MU.gesendet) { gesendetLaden(); return '<div class="card"><div class="empty">Gesendete E-Mails werden aus dem Postfach geladen …</div></div>'; }
    const G = MU.gesendet, sel = G.list.find(m => m.id === MU.gSel);
    return `${G.fehler.length ? `<div class="banner amber">${esc(G.fehler.join(' · '))}</div>` : ''}
      <div class="mwrap"><div class="card mlist">${G.list.length ? G.list.map(m => `<button class="mitem ${m.id === MU.gSel ? 'on' : ''}" data-act="mGOpen" data-id="${esc(m.id)}">
          <span class="mtop"><b>An: ${esc(kurz(m.to || '?', 40))}</b><small>${esc(datum(m.date))}</small></span>
          <span class="msub">${esc(kurz(m.subject, 70))}${m.attNamen.length ? ' <span class="small">📎' + m.attNamen.length + '</span>' : ''}</span>
          <span class="msnip">${esc(kurz((m.text || '').replace(/\s+/g, ' '), 110))}</span></button>`).join('') : '<div class="empty">Keine gesendeten E-Mails gefunden.</div>'}</div>
        <div class="card mread">${sel ? leseHTML(sel) : '<div class="empty">Gesendete E-Mail links auswählen.</div>'}</div></div>`;
  }
  // Gesendete Mail beim Öffnen vollständig aus dem Postfach holen (HTML, Bilder, Anhänge) – nur im Arbeitsspeicher
  async function gVoll(g) {
    if (g.voll || g.vollFehler || MU.gLaedtVoll) return; MU.gLaedtVoll = g.id;
    try {
      const r = await window.officeHome.mailEinzeln(g.acc, g.uid, 'gesendet');
      if (!r || !r.ok) g.vollFehler = (r && r.message) || 'Fehler';
      else {
        const put = (blob, name, type) => { const fid = 'mem-' + uid(); MU.mem[fid] = { blob, name, type }; return fid; };
        g.atts = (r.atts || []).map(a => ({ fileId: put(new Blob([a.data], { type: a.type }), a.name, a.type), name: a.name, type: a.type, size: a.size, cid: a.cid || '', inline: !!a.inline }));
        g.htmlFileId = r.html ? put(new Blob([r.html], { type: 'text/html' }), 'mail.html', 'text/html') : '';
        MU.text[g.id] = r.text || g.text || ''; g.voll = true;
      }
    } catch (e) { g.vollFehler = String(e && e.message || e); }
    MU.gLaedtVoll = '';
    if (parseHash().route === 'mail' && MU.ordner === 'gesendet' && MU.gSel === g.id) render();
  }
  const groesse = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const istBild = a => /^image\//.test(a.type || '');
  const endung = a => (String(a.name || '').split('.').pop() || '').slice(0, 5).toUpperCase();
  function leseHTML(m) {
    const t = MU.text[m.id], hatHtml = !!m.htmlFileId, ans = hatHtml ? MU.ansicht : 'text', gs = !!m.gesendet;
    const anh = (m.atts || []).filter(a => !a.inline), imText = (m.atts || []).filter(a => a.inline && istBild(a));
    const wer = gs ? 'An: ' + esc(m.to) + ((MU.konten || []).length > 1 ? ' · von ' + esc(m.von) : '') : esc(m.fromName ? m.fromName + ' <' + m.from + '>' : m.from);
    return `<div class="mrhead"><h3 style="margin:0">${esc(m.subject)}</h3><div class="small muted">${wer} · ${esc(new Date(m.date).toLocaleString('de-DE'))}</div>
      ${gs ? '' : `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${m.status === 'neu' || m.status === 'ignoriert' ? `<button class="btn sm pri" data-act="mBuero" data-id="${m.id}">${icon('alle')}Ans Büro (Gemini liest)</button>` : `<span class="badge">${(STATUS[m.status] || STATUS.neu)[0]}</span>`}
      <button class="btn sm" data-act="mAntwort" data-id="${m.id}">${icon('mail')}Antworten</button>${m.status === 'neu' ? `<button class="btn sm" data-act="mIgnor" data-id="${m.id}">Nicht bearbeiten</button>` : ''}</div>`}
      ${!m.voll ? `<div class="small muted" style="margin-top:8px">${m.vollFehler ? 'Bilder und Anhänge konnten nicht geladen werden: ' + esc(m.vollFehler) : (gs && m.attNamen && m.attNamen.length ? m.attNamen.length + ' Anhang/Anhänge und Bilder' : 'Bilder und Anhänge') + ' werden aus dem Postfach geladen …'}</div>` : ''}
      ${anh.length ? `<div class="mgal">${anh.map(a => `<div class="mtile" data-act="mAttOpen" data-id="${m.id}" data-f="${a.fileId}" title="${esc(a.name)}">${istBild(a) ? `<img data-thumb="${a.fileId}" alt="">` : `<span class="mext">${esc(endung(a) || 'DATEI')}</span>`}
          <span class="mtn">${esc(kurz(a.name, 28))}</span><span class="mts">${groesse(a.size || 0)}</span>
          <span class="mtacts"><button class="btn sm" data-act="mAttSys" data-id="${m.id}" data-f="${a.fileId}" data-stop="1" title="Mit dem Standardprogramm öffnen">${icon('auge')}</button><button class="btn sm" data-act="mAttDoc" data-id="${m.id}" data-f="${a.fileId}" data-stop="1" title="Als Dokument ablegen">${icon('dokumente')}</button></span></div>`).join('')}</div>` : ''}
      ${hatHtml ? `<div class="themesw msw"><button class="${ans === 'html' ? 'on' : ''}" data-act="mAnsicht" data-id="html">Mit Bildern</button><button class="${ans === 'text' ? 'on' : ''}" data-act="mAnsicht" data-id="text">Nur Text</button></div>` : ''}</div>
      ${ans === 'html' ? `<div class="mextbar" id="mExtBar" style="display:none">${icon('info')}<span>Bilder aus dem Internet sind blockiert (Schutz vor Werbe- und Zählpixeln).</span><button class="btn sm" data-act="mExtern" data-id="${m.id}">Bilder laden</button></div>
        <iframe class="mhtml" id="mHtml" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" title="E-Mail"></iframe>`
        : `<div class="mbody">${t == null ? '<span class="muted">Lädt …</span>' : esc(t) || '<span class="muted">(kein Text)</span>'}</div>`}
      ${imText.length && ans === 'text' ? `<div class="small muted" style="margin-top:8px">${imText.length} Bild(er) im Text – in der Ansicht „Mit Bildern“ sichtbar.</div>` : ''}`;
  }
  const url = async fid => { if (MU.urls[fid]) return MU.urls[fid]; const f = await fget(fid); if (!f || !f.blob) return ''; return (MU.urls[fid] = URL.createObjectURL(f.blob)); };
  // HTML sicher anzeigen: keine Skripte (sandbox), Bilder aus der Mail (cid) als data:, externe Bilder nur auf Knopfdruck
  async function htmlZeigen(m) {
    const fr = document.getElementById('mHtml'); if (!fr || !m.htmlFileId) return;
    const f = await fget(m.htmlFileId); let h = f && f.blob ? await f.blob.text() : '';
    for (const a of (m.atts || []).filter(x => x.cid)) {
      const g = await fget(a.fileId); if (!g || !g.blob || g.blob.size > 4 * 1024 * 1024) continue;
      const du = await blobToDataURL(g.blob); const cid = a.cid.replace(/^<|>$/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      h = h.replace(new RegExp('cid:' + cid, 'gi'), du);
    }
    const extern = !!MU.extern[m.id], hatExtern = /<img[^>]+src=["']?https?:/i.test(h) || /url\(["']?https?:/i.test(h);
    const csp = `default-src 'none'; img-src data: ${extern ? 'https: http:' : ''}; style-src 'unsafe-inline' ${extern ? 'https:' : ''}; font-src data: ${extern ? 'https:' : ''}; media-src data:`;
    fr.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank">
      <style>html,body{margin:0;padding:12px;background:#fff;color:#1B2A44;font:14px/1.5 Arial,sans-serif;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${h}</body></html>`;
    const bar = document.getElementById('mExtBar'); if (bar) bar.style.display = hatExtern && !extern ? '' : 'none';
  }
  async function thumbs() { for (const im of document.querySelectorAll('img[data-thumb]')) { const u = await url(im.dataset.thumb); if (u) im.src = u; } }
  // Bildbetrachter mit Vor/Zurück (Pfeiltasten)
  async function bildBetrachter(m, fid) {
    const bilder = (m.atts || []).filter(a => istBild(a) && !a.inline); let i = Math.max(0, bilder.findIndex(a => a.fileId === fid));
    if (typeof closeModal === 'function') closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg mlight'; bg.id = 'modal'; document.body.appendChild(bg);
    const zeig = async () => { const a = bilder[i]; bg.innerHTML = `<div class="mlbox"><div class="mlhead"><b>${esc(a.name)}</b><span class="small muted">${i + 1} / ${bilder.length} · ${groesse(a.size || 0)}</span><span class="grow"></span>
        <button class="btn sm" data-ml="sys">${icon('auge')}Öffnen</button><button class="btn sm" data-ml="doc">${icon('dokumente')}Als Dokument</button><button class="btn sm" data-ml="x">${icon('schliessen')}</button></div>
        <div class="mlimg">${bilder.length > 1 ? '<button class="mlnav" data-ml="prev">‹</button>' : ''}<img src="${await url(a.fileId)}" alt="">${bilder.length > 1 ? '<button class="mlnav r" data-ml="next">›</button>' : ''}</div></div>`; };
    await zeig();
    bg.addEventListener('click', async e => { const b = e.target.closest('[data-ml]'); if (!b) { if (e.target === bg) bg.remove(); return; }
      const k = b.dataset.ml; if (k === 'x') return bg.remove(); if (k === 'prev') { i = (i - 1 + bilder.length) % bilder.length; return zeig(); } if (k === 'next') { i = (i + 1) % bilder.length; return zeig(); }
      if (k === 'sys') return ACT.mAttSys({ id: m.id, f: bilder[i].fileId }); if (k === 'doc') { bg.remove(); return ACT.mAttDoc({ id: m.id, f: bilder[i].fileId }); } });
    const taste = e => { if (!document.body.contains(bg)) return document.removeEventListener('keydown', taste); if (e.key === 'ArrowLeft') bg.querySelector('[data-ml=prev]')?.click(); if (e.key === 'ArrowRight') bg.querySelector('[data-ml=next]')?.click(); };
    document.addEventListener('keydown', taste);
  }
  AFTER.mail = async () => {
    if (MU.ordner === 'gesendet') { const g = MU.gesendet && MU.gesendet.list.find(x => x.id === MU.gSel); if (!g) return;
      if (!g.voll) return gVoll(g); thumbs(); if (g.htmlFileId && MU.ansicht === 'html') htmlZeigen(g); return; }
    const m = M().find(x => x.id === MU.sel); if (!m) return;
    if (!m.voll && !m.vollFehler && window.EG && window.EG.mailVoll && !MU.laedt) { MU.laedt = true; window.EG.mailVoll(m).finally(() => { MU.laedt = false; if (parseHash().route === 'mail' && MU.sel === m.id) render(); }); }
    thumbs(); if (m.htmlFileId && MU.ansicht === 'html') htmlZeigen(m);
    if (MU.text[m.id] == null) { const f = m.textFileId && await fileGet(m.textFileId); MU.text[m.id] = f && f.blob ? await f.blob.text() : ''; if (parseHash().route === 'mail') { const b = document.querySelector('.mbody'); if (b) b.textContent = MU.text[m.id] || '(kein Text)'; } }
  };

  function kontoForm(k) {
    k = k || {};
    return `<div class="card" style="max-width:720px"><h3>${icon('mail')}${k.id ? 'Konto bearbeiten' : 'Postfach verbinden'}</h3>
      <ol class="small" style="padding-left:18px;margin:0 0 12px"><li>In mail.de: Einstellungen → <b>POP3/IMAP</b> einschalten.</li><li>Mit Zwei-Faktor-Anmeldung dort ein <b>App-Passwort</b> erstellen und hier eintragen.</li><li>Das Passwort wird verschlüsselt von Windows gespeichert – niemand (auch Claude nicht) kann es lesen.</li></ol>
      <div class="modal" style="box-shadow:none;width:100%;max-height:none"><form style="padding:0" onsubmit="return false" id="mkForm">
        <div class="fld"><label>E-Mail-Adresse</label><input id="mkUser" value="${esc(k.user || '')}" placeholder="name@mail.de" autocomplete="off"></div>
        <div class="fld"><label>Passwort / App-Passwort</label><input id="mkPass" type="password" placeholder="${k.hatPasswort ? '•••••••• (neu eingeben zum Ändern)' : ''}" autocomplete="new-password"></div>
        <div class="fld"><label>Absendername</label><input id="mkName" value="${esc(k.name || S.settings.me.name || '')}"></div>
        <div class="fld"><label>Gehört zu</label><select id="mkPerson"><option value="">Mir (Leon)</option>${S.persons.map(p => `<option value="${p.id}" ${k.personId === p.id ? 'selected' : ''}>${esc(p.role)}</option>`).join('')}</select></div>
        <div class="fld"><label>IMAP-Server</label><input id="mkHost" value="${esc(k.host || 'imap.mail.de')}"></div><div class="fld"><label>SMTP-Server</label><input id="mkSmtp" value="${esc(k.smtpHost || 'smtp.mail.de')}"></div>
      </form></div>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn pri" data-act="mKontoOk" data-id="${esc(k.id || '')}">${icon('speichern')}Verbinden und testen</button>${k.id ? `<button class="btn dan" data-act="mKontoWeg" data-id="${esc(k.id)}">${icon('loeschen')}Entfernen</button>` : ''}</div>
      <div class="small muted" id="mkMsg" style="margin-top:8px"></div></div>`;
  }

  // Für andere Bereiche (Brief-Editor „Als E-Mail senden“): Fenster „Neue E-Mail“ mit Vorbelegung
  window.ohMailSchreiben = async vor => {
    if (!DESKTOP) return;
    await konten();
    if (!(MU.konten || []).length) { if (confirm('Es ist noch kein E-Mail-Konto verbunden. Jetzt im Bereich „E-Mail“ verbinden?')) location.hash = '#/mail'; return; }
    schreiben(vor || {});
  };

  /* ---------- Neue E-Mail / Antwort ---------- */
  function schreiben(vor) {
    vor = vor || {};
    const docs = byPerson(S.documents).filter(d => d.fileId).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 200);
    if (typeof closeModal === 'function') closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    bg.innerHTML = `<div class="modal"><h3>${icon('mail')}${vor.inReplyTo ? 'Antworten' : 'Neue E-Mail'}</h3><form id="mf" onsubmit="return false" style="grid-template-columns:1fr">
      <div class="fld"><label>Von</label><select id="mfAcc">${MU.konten.map(k => `<option value="${k.id}" ${vor.acc === k.id ? 'selected' : ''}>${esc(k.name ? k.name + ' <' + k.user + '>' : k.user)}</option>`).join('')}</select></div>
      <div class="fld"><label>An (mehrere mit Komma)</label><input id="mfTo" value="${esc(vor.to || '')}" list="mfKont"><datalist id="mfKont">${S.contacts.filter(c => c.email).map(c => `<option value="${esc(c.email)}">${esc(c.name)}</option>`).join('')}</datalist></div>
      <div class="fld"><label>Betreff</label><input id="mfSub" value="${esc(vor.subject || '')}"></div>
      <div class="fld"><label>Text</label><textarea id="mfText" rows="11">${esc(vor.text || '')}</textarea></div>
      <div class="fld"><label>Anhänge aus dem Programm</label><select id="mfDocs" multiple size="5">${docs.map(d => `<option value="${d.id}">${esc(kurz(d.title, 70))}${d.personId && getPerson(d.personId) ? ' · ' + esc(getPerson(d.personId).role) : ''}</option>`).join('')}</select><span class="hint">Strg gedrückt halten für mehrere.</span></div>
      <div class="fld"><button type="button" class="btn sm" id="mfFile">${icon('hochladen')}Datei vom Computer anhängen</button> <span class="small muted" id="mfFiles"></span></div>
    </form><div class="acts"><span class="sp"></span><button class="btn" data-m="x">Abbrechen</button><button class="btn pri" data-m="send">${icon('mail')}Senden</button></div></div>`;
    document.body.appendChild(bg);
    const extra = [...(vor.dateien || [])]; // z. B. Brief als PDF aus dem Brief-Editor
    if (extra.length) bg.querySelector('#mfFiles').textContent = extra.map(x => '📎 ' + x.name).join(', ');
    if (!vor.to) setTimeout(() => { const t = bg.querySelector('#mfTo'); if (t) t.focus(); }, 50);
    bg.querySelector('#mfFile').addEventListener('click', async () => { const f = await pickFile(''); if (f) { extra.push(f); bg.querySelector('#mfFiles').textContent = extra.map(x => x.name).join(', '); } });
    bg.addEventListener('click', async e => {
      const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'x') return bg.remove();
      b.disabled = true; b.textContent = 'Wird gesendet …';
      const atts = [];
      for (const id of [...bg.querySelector('#mfDocs').selectedOptions].map(o => o.value)) { const d = S.documents.find(x => x.id === id); const f = d && await fileGet(d.fileId); if (f && f.blob) atts.push({ name: f.name || d.fileName || d.title + '.pdf', type: f.type || f.blob.type, data: new Uint8Array(await f.blob.arrayBuffer()) }); }
      for (const f of extra) atts.push({ name: f.name, type: f.type, data: new Uint8Array(await f.arrayBuffer()) });
      const r = await window.officeHome.mailSenden(bg.querySelector('#mfAcc').value, { to: bg.querySelector('#mfTo').value, subject: bg.querySelector('#mfSub').value, text: bg.querySelector('#mfText').value, atts, inReplyTo: vor.inReplyTo || '' });
      if (!r || !r.ok) { b.disabled = false; b.textContent = 'Senden'; return alert('Nicht gesendet: ' + ((r && r.message) || 'Fehler')); }
      bg.remove(); toast('E-Mail gesendet'); MU.gesendet = null; if (parseHash().route === 'mail' && MU.ordner === 'gesendet') render();
      if (typeof ohMelden === 'function') ohMelden({ typ: 'system', title: 'E-Mail gesendet: ' + kurz(bg.querySelector('#mfSub').value, 60), lines: ['An ' + bg.querySelector('#mfTo').value] });
    });
  }

  Object.assign(ACT, {
    mFilter: d => { MU.filter = d.id; render(); },
    mOrdner: d => { MU.ordner = d.id; render(); },
    mAnsicht: d => { MU.ansicht = d.id; render(); },
    mExtern: d => { MU.extern[d.id] = true; const m = mailVon(d.id); if (m) htmlZeigen(m); },
    mAttOpen: d => { const m = mailVon(d.id), a = m && (m.atts || []).find(x => x.fileId === d.f); if (!a) return; if (istBild(a)) return bildBetrachter(m, a.fileId); return ACT.mAttSys(d); },
    mAttSys: async d => { const f = await fget(d.f); if (!f) return toast('Anhang nicht gefunden'); const r = await window.officeHome.openFile(f.name, await f.blob.arrayBuffer()); if (!r.ok) toast('Konnte nicht geöffnet werden'); },
    mAttDoc: async d => { const m = mailVon(d.id), f = await fget(d.f); if (!m || !f) return toast('Anhang nicht gefunden');
      editDoc(null, { personId: m.personId || '', sender: m.gesendet ? (S.settings.me.name || '') : (m.fromName || m.from), date: (m.date || '').slice(0, 10), tags: m.gesendet ? 'E-Mail, gesendet' : 'E-Mail' }, new File([f.blob], f.name || 'anhang', { type: f.type || f.blob.type })); },
    mGOpen: d => { MU.gSel = d.id; render(); },
    mGesendetLaden: () => { Object.keys(MU.mem).forEach(fid => { if (MU.urls[fid]) { URL.revokeObjectURL(MU.urls[fid]); delete MU.urls[fid]; } }); MU.mem = {}; MU.gesendet = null; render(); },
    mOpen: d => { MU.sel = d.id; const m = M().find(x => x.id === d.id); if (m && !m.gelesen) { m.gelesen = true; save(); } render(); },
    mAbrufen: async () => { if (!window.EG) return; toast('Postfach wird geprüft …'); const r = await window.EG.mailsAbrufen(false); MU.konten = null; await konten(); toast(r.neu ? r.neu + ' neue E-Mail(s)' : 'Keine neuen E-Mails'); render(); },
    mNeu: () => schreiben({}),
    mAntwort: async d => { const m = M().find(x => x.id === d.id); if (!m) return; const t = MU.text[m.id] || '';
      schreiben({ acc: m.acc, to: m.from, subject: /^(re|aw):/i.test(m.subject) ? m.subject : 'AW: ' + m.subject, inReplyTo: m.msgId, text: '\n\n\n-------- Ursprüngliche Nachricht --------\nVon: ' + (m.fromName || m.from) + '\nDatum: ' + new Date(m.date).toLocaleString('de-DE') + '\n\n' + t.split('\n').map(l => '> ' + l).join('\n').slice(0, 8000) }); },
    mBuero: d => { const m = M().find(x => x.id === d.id); if (!m || !window.EG) return; m.status = 'buero'; save(); window.EG.neu({ typ: 'mail', titel: m.subject || '(ohne Betreff)', von: m.fromName || m.from, mailId: m.id, personId: m.personId || '' }); toast('Im Büro – du bekommst eine Karte zum Bestätigen'); render(); },
    mIgnor: d => { const m = M().find(x => x.id === d.id); if (m) { m.status = 'ignoriert'; save(); render(); } },
    mAtt: async d => { const f = await fileGet(d.f); if (!f) return toast('Anhang nicht gefunden'); const r = await window.officeHome.openFile(f.name, await f.blob.arrayBuffer()); if (!r.ok) toast('Konnte nicht geöffnet werden'); },
    mKonten: async () => { const K = await konten(true);
      if (typeof closeModal === 'function') closeModal();
      const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
      bg.innerHTML = `<div class="modal" style="width:min(760px,96vw)"><h3>${icon('mail')}E-Mail-Konten</h3><div style="padding:14px 22px;overflow:auto">${K.map(k => `<div class="row" style="margin-bottom:8px"><div class="grow"><b>${esc(k.user)}</b><div class="small muted">${esc(k.personId && getPerson(k.personId) ? getPerson(k.personId).role : 'Mir')} · ${esc(k.host)}${k.lastCheck ? ' · geprüft ' + datum(k.lastCheck) : ''}</div></div><button class="btn sm" data-mk2="edit" data-id="${k.id}">${icon('bearbeiten')}Bearbeiten</button></div>`).join('')}
        <div id="mkBox">${kontoForm()}</div></div><div class="acts"><span class="sp"></span><button class="btn" data-mk2="x">Schließen</button></div></div>`;
      document.body.appendChild(bg);
      bg.addEventListener('click', e => { const b = e.target.closest('[data-mk2]'); if (!b) return; if (b.dataset.mk2 === 'x') return bg.remove(); if (b.dataset.mk2 === 'edit') bg.querySelector('#mkBox').innerHTML = kontoForm(K.find(x => x.id === b.dataset.id)); });
    },
    mKontoOk: async d => {
      const v = id => (document.getElementById(id) || {}).value || '', msg = document.getElementById('mkMsg'); if (msg) msg.textContent = 'Verbinde …';
      const r = await window.officeHome.mailKontoSpeichern({ id: d.id || undefined, user: v('mkUser'), name: v('mkName'), personId: v('mkPerson'), host: v('mkHost'), smtpHost: v('mkSmtp') }, v('mkPass'));
      if (!r.ok) { if (msg) { msg.textContent = r.message; msg.style.color = 'var(--danger)'; } return; }
      toast('Postfach verbunden'); MU.konten = null; await konten(); if (typeof closeModal === 'function') closeModal(); render();
      if (window.EG) window.EG.mailsAbrufen(false).then(() => render());
    },
    mKontoWeg: async d => { if (!confirm('Konto entfernen? Die bereits abgerufenen E-Mails bleiben im Programm.')) return; await window.officeHome.mailKontoLoeschen(d.id); MU.konten = null; await konten(); if (typeof closeModal === 'function') closeModal(); render(); }
  });
})();
