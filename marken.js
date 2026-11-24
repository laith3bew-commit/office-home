/* Internetmarken-Vorrat.
   Ein Marken-PDF (Mehrfachdruck oder Scan eines Bogens) bzw. ein Bild wird einmal geladen, die einzelnen Marken werden
   automatisch erkannt und ausgeschnitten und liegen dann als Vorrat bereit. Ein Brief nimmt sich die nächste freie Marke
   (reserviert); beim Drucken bzw. „Als PDF speichern“ wird sie als „benutzt“ markiert und nie wieder angeboten.
   Daten: S.marken = [{id, fileId, nr, bogen, wert, added, reserved:letterId, used:{at, letterId, subject}}]; Bilder im Datei-Speicher.
   PDF-Darstellung mit pdf.js 3.11.174 (lib/pdfjs, Apache-2.0), wird erst bei Bedarf geladen. */
(function () {
  const marken = () => { if (!Array.isArray(S.marken)) S.marken = []; return S.marken; };
  const lebendeBriefe = () => new Set([...S.letters.map(l => l.id), ...(typeof LD !== 'undefined' && LD ? [LD.id] : [])]);
  const frei = m => !m.used && (!m.reserved || !lebendeBriefe().has(m.reserved));
  const freie = () => marken().filter(frei).sort((a, b) => (a.added || '').localeCompare(b.added || '') || a.nr - b.nr);
  window.MK_freie = freie;

  /* ---------- pdf.js bei Bedarf laden (ohne Worker-Thread: pdf.worker läuft im Fenster) ---------- */
  let pdfjsP = null;
  const ladeSkript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Konnte ' + src + ' nicht laden')); document.head.appendChild(s); });
  function pdfjs() {
    if (!pdfjsP) pdfjsP = (async () => { await ladeSkript('lib/pdfjs/pdf.worker.min.js'); await ladeSkript('lib/pdfjs/pdf.min.js'); const L = window.pdfjsLib; L.GlobalWorkerOptions.workerSrc = 'lib/pdfjs/pdf.worker.min.js'; return L; })();
    return pdfjsP;
  }
  // Seiten als Canvas (ca. 300 dpi) + Breite in mm
  async function seiten(file) {
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
      const L = await pdfjs(); const doc = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise; const out = [];
      for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
        const pg = await doc.getPage(i), vp1 = pg.getViewport({ scale: 1 }), scale = 300 / 72, vp = pg.getViewport({ scale });
        const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: ctx, viewport: vp }).promise;
        out.push({ c, mmW: vp1.width / 72 * 25.4 });
      }
      return out;
    }
    const img = await new Promise((res, rej) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild konnte nicht gelesen werden')); i.src = u; });
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0);
    return [{ c, mmW: c.width > c.height ? 297 : 210 }];
  }
  /* ---------- Marken finden: dunkle Pixel → 1-mm-Raster → verbinden → Kästen in Markengröße ---------- */
  function finden(c, mmW) {
    const W = c.width, H = c.height, ppm = W / mmW, gw = Math.ceil(W / ppm), gh = Math.ceil(H / ppm);
    const data = c.getContext('2d').getImageData(0, 0, W, H).data;
    const cnt = new Float32Array(gw * gh), tot = new Float32Array(gw * gh);
    const step = Math.max(1, Math.floor(ppm / 4)); // jede ~4. Zeile/Spalte genügt
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
      const i = (y * W + x) * 4, lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2], g = Math.floor(y / ppm) * gw + Math.floor(x / ppm);
      tot[g]++; if (lum < 110) cnt[g]++;
    }
    const ink = new Uint8Array(gw * gh); for (let g = 0; g < ink.length; g++) ink[g] = tot[g] && cnt[g] / tot[g] > 0.02 ? 1 : 0;
    // Verbinden: Lücken bis 3 mm schließen (innerhalb einer Marke), Abstände zwischen Marken sind größer
    const R = 3, dil = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (ink[y * gw + x])
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < gh && xx >= 0 && xx < gw) dil[yy * gw + xx] = 1; }
    const seen = new Uint8Array(gw * gh), boxes = [];
    for (let s = 0; s < dil.length; s++) {
      if (!dil[s] || seen[s]) continue;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; const st = [s]; seen[s] = 1;
      while (st.length) { const g = st.pop(), x = g % gw, y = (g / gw) | 0; if (ink[g]) { n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; const k = yy * gw + xx; if (dil[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
      if (x1 < 0) continue;
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (finden.debug) finden.debug.push({ x0, y0, bw, bh, n });
      if (bw >= 22 && bw <= 90 && bh >= 12 && bh <= 55 && n > 40) boxes.push({ x0, y0, x1, y1 });
    }
    // Reihenfolge: Zeilen von oben, darin von links
    boxes.sort((a, b) => Math.abs(a.y0 - b.y0) > 8 ? a.y0 - b.y0 : a.x0 - b.x0);
    return boxes.map(b => { const m = 1, x = Math.max(0, (b.x0 - m) * ppm), y = Math.max(0, (b.y0 - m) * ppm), w = Math.min(W - x, (b.x1 - b.x0 + 1 + 2 * m) * ppm), h = Math.min(H - y, (b.y1 - b.y0 + 1 + 2 * m) * ppm);
      const o = document.createElement('canvas'); o.width = Math.round(w); o.height = Math.round(h); const ctx = o.getContext('2d'); ctx.drawImage(c, x, y, w, h, 0, 0, o.width, o.height);
      o.mmW = Math.round(w / ppm * 10) / 10; o.mmH = Math.round(h / ppm * 10) / 10; return o; }); // echte Größe → Druck in Originalgröße
  }
  const toBlob = c => new Promise(r => c.toBlob(r, 'image/png'));
  const blobURL = new Map();
  async function bildURL(m) { if (blobURL.has(m.fileId)) return blobURL.get(m.fileId); const f = await fileGet(m.fileId); if (!f) return ''; const u = URL.createObjectURL(f.blob); blobURL.set(m.fileId, u); return u; }
  async function dataURL(m) { const f = await fileGet(m.fileId); return f ? await blobToDataURL(f.blob) : ''; }

  /* ---------- Import ---------- */
  async function importieren() {
    const f = await pickFile('application/pdf,image/*'); if (!f) return;
    toast('Marken werden erkannt …');
    let gef = [];
    try { for (const s of await seiten(f)) gef.push(...finden(s.c, s.mmW)); }
    catch (e) { return alert('Datei konnte nicht gelesen werden: ' + (e.message || e)); }
    if (!gef.length) return alert('In der Datei wurden keine Marken erkannt. Bitte ein Marken-PDF der Deutschen Post oder einen gut lesbaren Scan des Bogens wählen.');
    dialog(`<h3>${icon('hochladen')}${gef.length} Marken erkannt</h3>
      <p class="small muted" style="margin-top:0">Aus „${esc(f.name)}“. Bereits benutzte oder falsch erkannte Marken anklicken, um sie abzuwählen.</p>
      <div class="fld" style="max-width:220px"><label>Porto je Marke (€)</label><input id="mkWert" value="0,95"></div>
      <div class="mkgrid" id="mkNeu">${gef.map((c, i) => `<button class="mkt on" data-i="${i}"><img src="${c.toDataURL('image/png')}"><span>Nr. ${i + 1}</span></button>`).join('')}</div>
      <div class="acts"><span class="sp"></span><button class="btn" data-mk="zu">Abbrechen</button><button class="btn pri" data-mk="ok">${icon('plus')}Ausgewählte übernehmen</button></div>`, async (a, bg) => {
      if (a !== 'ok') return true;
      const wahl = [...bg.querySelectorAll('#mkNeu .mkt.on')].map(b => Number(b.dataset.i)); if (!wahl.length) return true;
      const wert = (bg.querySelector('#mkWert').value || '').trim(), added = new Date().toISOString(), start = marken().reduce((m, x) => Math.max(m, x.nr || 0), 0);
      let k = 0;
      for (const i of wahl) { const id = uid(), fileId = uid(); await filePut(fileId, { blob: await toBlob(gef[i]), name: 'internetmarke-' + (start + k + 1) + '.png', type: 'image/png' });
        marken().push({ id, fileId, nr: start + ++k, bogen: f.name, wert, added, mmW: gef[i].mmW, mmH: gef[i].mmH }); }
      save(); toast(wahl.length + ' Marken im Vorrat'); if (typeof ohMelden === 'function') ohMelden({ typ: 'system', title: wahl.length + ' Internetmarken in den Vorrat übernommen', lines: [f.name], link: '' });
      render(); setTimeout(verwalten, 50); return true;
    }, bg => bg.querySelector('#mkNeu').addEventListener('click', e => { const b = e.target.closest('.mkt'); if (b) b.classList.toggle('on'); }));
  }

  /* ---------- Vorrat verwalten ---------- */
  async function verwalten() {
    const L = [...marken()].sort((a, b) => (frei(b) - frei(a)) || (a.nr - b.nr));
    const nFrei = L.filter(frei).length;
    dialog(`<h3>${icon('stempel')}Internetmarken – Vorrat</h3>
      <p class="small muted" style="margin-top:0"><b>${nFrei}</b> frei · ${L.filter(m => m.used).length} benutzt · ${L.length} insgesamt. Benutzte Marken werden nie wieder angeboten.</p>
      ${L.length ? `<div class="mkgrid" id="mkAlle">${L.map(m => { const lt = m.used ? S.letters.find(l => l.id === m.used.letterId) : null;
        return `<div class="mkt ${m.used ? 'used' : frei(m) ? '' : 'res'}" data-id="${m.id}"><img data-f="${m.fileId}" alt=""><span>Nr. ${m.nr}${m.wert ? ' · ' + esc(m.wert) + ' €' : ''}</span>
        ${m.used ? `<em class="mkstamp">benutzt</em><small>${fmtDate(m.used.at.slice(0, 10))}${m.used.subject ? ' · ' + esc(m.used.subject.slice(0, 40)) : ''}</small>` : !frei(m) ? '<small>für einen Brief reserviert</small>' : ''}
        <div class="mkacts">${m.used ? `<button class="btn sm" data-mk="frei" data-id="${m.id}" title="Doch nicht benutzt">Wieder frei</button>${lt ? `<a class="btn sm" href="#/brief/${lt.id}" data-mk="zu">Brief</a>` : ''}` : `<button class="btn sm" data-mk="benutzt" data-id="${m.id}">Als benutzt markieren</button>`}<button class="btn sm dan" data-mk="weg" data-id="${m.id}" title="Löschen">${icon('loeschen')}</button></div></div>`; }).join('')}</div>`
        : '<div class="empty">Noch keine Marken im Vorrat.</div>'}
      <div class="acts">${L.some(m => m.used) ? '<button class="btn" data-mk="leeren">Benutzte entfernen</button>' : ''}<span class="sp"></span><button class="btn" data-mk="zu">Schließen</button><button class="btn pri" data-mk="import">${icon('hochladen')}Marken-PDF laden</button></div>`, async (a, bg, b) => {
      const m = b && b.dataset.id && marken().find(x => x.id === b.dataset.id);
      if (a === 'import') { setTimeout(importieren, 30); return true; }
      if (a === 'benutzt' && m) { m.used = { at: new Date().toISOString(), letterId: '', subject: 'von Hand markiert' }; m.reserved = ''; save(); setTimeout(verwalten, 10); return true; }
      if (a === 'frei' && m) { if (!confirm('Marke Nr. ' + m.nr + ' wieder als frei markieren? Nur wenn sie wirklich nicht auf einem Brief klebt bzw. gedruckt wurde.')) return false; m.used = null; m.reserved = ''; save(); setTimeout(verwalten, 10); return true; }
      if (a === 'weg' && m) { if (!confirm('Marke Nr. ' + m.nr + ' löschen?')) return false; await fileDel(m.fileId); S.marken = marken().filter(x => x.id !== m.id); save(); setTimeout(verwalten, 10); return true; }
      if (a === 'leeren') { const u = marken().filter(x => x.used); if (!confirm(u.length + ' benutzte Marken endgültig entfernen?')) return false; for (const x of u) await fileDel(x.fileId); S.marken = marken().filter(x => !x.used); save(); setTimeout(verwalten, 10); return true; }
      return true;
    }, async bg => { for (const im of bg.querySelectorAll('img[data-f]')) { const m = marken().find(x => x.fileId === im.dataset.f); if (m) im.src = await bildURL(m); } });
  }

  /* ---------- Brief: nächste freie Marke nehmen / wählen / benutzt markieren ---------- */
  async function setzen(L, m) {
    if (L.markeId && L.markeId !== (m && m.id)) { const alt = marken().find(x => x.id === L.markeId); if (alt && !alt.used && alt.reserved === L.id) alt.reserved = ''; }
    if (!m) { L.markeId = ''; L.markeImg = ''; L.markeMM = null; save(); return; }
    m.reserved = L.id; L.markeId = m.id; L.markeImg = await dataURL(m); L.markeMM = m.mmW ? { w: m.mmW, h: m.mmH } : null; L.useMarke = true; save();
  }
  async function naechste(L) { const m = freie()[0]; if (!m) { if (confirm('Kein freier Vorrat mehr. Jetzt ein Marken-PDF laden?')) importieren(); return false; } await setzen(L, m); return true; }
  async function waehlen(L) {
    const F = freie(); if (!F.length) return naechste(L);
    dialog(`<h3>${icon('stempel')}Marke wählen</h3><p class="small muted" style="margin-top:0">${F.length} freie Marken.</p>
      <div class="mkgrid" id="mkWahl">${F.map(m => `<button class="mkt" data-id="${m.id}"><img data-f="${m.fileId}"><span>Nr. ${m.nr}${m.wert ? ' · ' + esc(m.wert) + ' €' : ''}</span></button>`).join('')}</div>
      <div class="acts"><span class="sp"></span><button class="btn" data-mk="zu">Abbrechen</button></div>`, async () => true,
      async bg => { for (const im of bg.querySelectorAll('img[data-f]')) { const m = marken().find(x => x.fileId === im.dataset.f); if (m) im.src = await bildURL(m); }
        bg.querySelector('#mkWahl').addEventListener('click', async e => { const b = e.target.closest('.mkt'); if (!b) return; const m = marken().find(x => x.id === b.dataset.id); bg.remove(); await setzen(L, m); render(); toast('Marke Nr. ' + m.nr + ' gewählt'); }); });
  }
  // Nach Drucken / PDF: Marke endgültig als benutzt markieren
  function benutzt(L) {
    if (!L || !L.useMarke || !L.markeId) return;
    const m = marken().find(x => x.id === L.markeId); if (!m || m.used) return;
    m.used = { at: new Date().toISOString(), letterId: L.id, subject: typeof letterSubject === 'function' ? letterSubject(L) : '' }; m.reserved = ''; save();
    toast('Internetmarke Nr. ' + m.nr + ' als benutzt markiert · ' + freie().length + ' frei');
    if (freie().length <= 3 && typeof ohMelden === 'function') ohMelden({ typ: 'system', key: 'marken-knapp:' + freie().length, title: 'Nur noch ' + freie().length + ' Internetmarken im Vorrat', lines: ['Neue Marken kaufen und das PDF unter Brief → Internetmarke laden.'] });
  }
  function infoHTML(L) {
    const m = L.markeId && marken().find(x => x.id === L.markeId), n = freie().length;
    return `<div class="mkinfo">${m ? `<span class="badge ${m.used ? 'amber' : 'green'}">Nr. ${m.nr}${m.used ? ' · benutzt am ' + fmtDate(m.used.at.slice(0, 10)) : ' · reserviert'}</span>` : L.markeImg ? '<span class="badge">eigenes Bild</span>' : '<span class="badge amber">keine Marke</span>'}
      <span class="small muted">Vorrat: <b>${n}</b> frei</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${!m || m.used ? `<button class="btn sm pri" data-act="mkNaechste">${icon('plus')}Nächste freie Marke</button>` : ''}<button class="btn sm" data-act="mkWaehlen">Marke wählen</button><button class="btn sm" data-act="mkVorrat">${icon('stempel')}Vorrat (${n})</button><button class="btn sm" data-act="mkImport">${icon('hochladen')}Marken-PDF laden</button>${L.markeImg ? '<button class="btn sm dan" data-act="markeDel">' + icon('loeschen') + 'entfernen</button>' : ''}</div>`;
  }

  /* ---------- kleines Dialog-Gerüst ---------- */
  function dialog(html, onAct, after) {
    if (typeof closeModal === 'function') closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    bg.innerHTML = `<div class="modal mkwin">${html}</div>`; document.body.appendChild(bg);
    bg.addEventListener('click', async e => { if (e.target === bg) return bg.remove(); const b = e.target.closest('[data-mk]'); if (!b) return; if (b.dataset.mk === 'zu') return bg.remove(); if (await onAct(b.dataset.mk, bg, b)) bg.remove(); });
    if (after) after(bg);
  }

  window.MK = { importieren, verwalten, naechste, waehlen, benutzt, infoHTML, setzen, freie, _seiten: seiten, _finden: finden };
})();
