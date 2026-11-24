/* Bereich „E-Mail“: Konto (mail.de, IMAP/SMTP), Posteingang mit Lesebereich, „Ans Büro“ (Eingangskette), Antworten, neue E-Mail.
   Abruf: stündlich durch die Sekretärin (eingang.js) oder per Knopf. Passwörter nur im Hauptprozess (verschlüsselt).
   Läuft nach dem Hauptskript und nutzt dessen Globale. */
(function () {
  const MU = { filter: 'alle', sel: '', konten: null, text: {} };
  const M = () => { if (!Array.isArray(S.mails)) S.mails = []; return S.mails; };
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
    const F = MU.filter, list = M().filter(m => F === 'alle' || m.status === F || (F === 'ungelesen' && !m.gelesen)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const sel = M().find(m => m.id === MU.sel) || null;
    const tab = (v, l) => `<button class="pill ${F === v ? 'on' : ''}" data-act="mFilter" data-id="${v}">${l} <span class="small muted">${v === 'alle' ? M().length : v === 'ungelesen' ? M().filter(m => !m.gelesen).length : M().filter(m => m.status === v).length}</span></button>`;
    return `<div class="head"><div class="grow"><h1>${icon('mail')}E-Mail</h1><p class="sub" style="margin:0">${esc(MU.konten.map(k => k.user).join(' · '))}${MU.konten[0] && MU.konten[0].lastCheck ? ' · zuletzt geprüft ' + datum(MU.konten[0].lastCheck) : ''}</p></div>
      <button class="btn" data-act="mKonten">${icon('einstellungen')}Konten</button><button class="btn" data-act="mAbrufen">${icon('update')}Abrufen</button><button class="btn pri" data-act="mNeu">${icon('plus')}Neue E-Mail</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${tab('alle', 'Alle')}${tab('ungelesen', 'Ungelesen')}${tab('neu', 'Neu')}${tab('buero', 'Im Büro')}${tab('erledigt', 'Erledigt')}${tab('ignoriert', 'Nicht bearbeitet')}</div>
      <div class="mwrap"><div class="card mlist">${list.length ? list.map(m => `<button class="mitem ${m.id === MU.sel ? 'on' : ''} ${m.gelesen ? '' : 'ungel'}" data-act="mOpen" data-id="${m.id}">
          <span class="mtop"><b>${esc(kurz(m.fromName || m.from, 40))}</b><small>${esc(datum(m.date))}</small></span>
          <span class="msub">${esc(kurz(m.subject, 70))}${(m.atts || []).length ? ' <span class="small">📎' + m.atts.length + '</span>' : ''}</span>
          <span class="msnip">${esc(kurz(m.snippet, 110))}</span><span class="mst">${(STATUS[m.status] || STATUS.neu)[0]}</span></button>`).join('') : '<div class="empty">Keine E-Mails.</div>'}</div>
        <div class="card mread">${sel ? leseHTML(sel) : '<div class="empty">E-Mail links auswählen.</div>'}</div></div>`;
  };
  function leseHTML(m) {
    const t = MU.text[m.id];
    return `<div class="mrhead"><h3 style="margin:0">${esc(m.subject)}</h3><div class="small muted">${esc(m.fromName ? m.fromName + ' <' + m.from + '>' : m.from)} · ${esc(new Date(m.date).toLocaleString('de-DE'))}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${m.status === 'neu' || m.status === 'ignoriert' ? `<button class="btn sm pri" data-act="mBuero" data-id="${m.id}">${icon('alle')}Ans Büro (Gemini liest)</button>` : `<span class="badge">${(STATUS[m.status] || STATUS.neu)[0]}</span>`}
      <button class="btn sm" data-act="mAntwort" data-id="${m.id}">${icon('mail')}Antworten</button>${m.status === 'neu' ? `<button class="btn sm" data-act="mIgnor" data-id="${m.id}">Nicht bearbeiten</button>` : ''}</div>
      ${(m.atts || []).length ? `<div class="matts">${m.atts.map(a => `<button class="btn sm" data-act="mAtt" data-id="${m.id}" data-f="${a.fileId}">${icon('dokumente')}${esc(kurz(a.name, 40))}</button>`).join('')}</div>` : ''}</div>
      <div class="mbody">${t == null ? '<span class="muted">Lädt …</span>' : esc(t) || '<span class="muted">(kein Text)</span>'}</div>`;
  }
  AFTER.mail = async () => {
    const m = M().find(x => x.id === MU.sel); if (!m) return;
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
    const extra = [];
    bg.querySelector('#mfFile').addEventListener('click', async () => { const f = await pickFile(''); if (f) { extra.push(f); bg.querySelector('#mfFiles').textContent = extra.map(x => x.name).join(', '); } });
    bg.addEventListener('click', async e => {
      const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'x') return bg.remove();
      b.disabled = true; b.textContent = 'Wird gesendet …';
      const atts = [];
      for (const id of [...bg.querySelector('#mfDocs').selectedOptions].map(o => o.value)) { const d = S.documents.find(x => x.id === id); const f = d && await fileGet(d.fileId); if (f && f.blob) atts.push({ name: f.name || d.fileName || d.title + '.pdf', type: f.type || f.blob.type, data: new Uint8Array(await f.blob.arrayBuffer()) }); }
      for (const f of extra) atts.push({ name: f.name, type: f.type, data: new Uint8Array(await f.arrayBuffer()) });
      const r = await window.officeHome.mailSenden(bg.querySelector('#mfAcc').value, { to: bg.querySelector('#mfTo').value, subject: bg.querySelector('#mfSub').value, text: bg.querySelector('#mfText').value, atts, inReplyTo: vor.inReplyTo || '' });
      if (!r || !r.ok) { b.disabled = false; b.textContent = 'Senden'; return alert('Nicht gesendet: ' + ((r && r.message) || 'Fehler')); }
      bg.remove(); toast('E-Mail gesendet');
      if (typeof ohMelden === 'function') ohMelden({ typ: 'system', title: 'E-Mail gesendet: ' + kurz(bg.querySelector('#mfSub').value, 60), lines: ['An ' + bg.querySelector('#mfTo').value] });
    });
  }

  Object.assign(ACT, {
    mFilter: d => { MU.filter = d.id; render(); },
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
