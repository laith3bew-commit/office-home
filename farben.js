/* Home Office – eigene Farben und eigener Programmname (Version 2.17)
   Der Nutzer wählt im Assistenten (oder unter Einstellungen → Allgemein) vier Lieblingsfarben und einen Namen.
   Aufbau, Icons, Layout und Funktionen bleiben unverändert – geändert werden nur die Farbvariablen und der sichtbare Name.
   Wird früh im <head> geladen, damit beim Start nichts in den Standardfarben aufblitzt.
   Speicher: localStorage 'oh-eigen' = {name, farben:[4 × '#rrggbb']} (zusätzlich S.settings.eigen für die Sicherung). */
(function () {
  const KEY = 'oh-eigen';
  const STANDARD = { name: 'Home Office', farben: ['#1B2A44', '#4F6785', '#A9B8CA', '#F4F0E8'] };
  const PALETTEN = [
    { n: 'Navy & Papier', ar: 'كحلي وورقي', f: ['#1B2A44', '#4F6785', '#A9B8CA', '#F4F0E8'] },
    { n: 'Wald', ar: 'غابة', f: ['#1F3B2D', '#4E7A5E', '#A8C3AE', '#F2F1EA'] },
    { n: 'Weinrot', ar: 'نبيذي', f: ['#4A1F2B', '#8C3B4E', '#D4A5AE', '#F7F0EE'] },
    { n: 'Petrol', ar: 'بترولي', f: ['#123A44', '#2F7480', '#9CC8CE', '#EEF5F5'] },
    { n: 'Erde', ar: 'ترابي', f: ['#3B2A1E', '#8A6141', '#D2B48C', '#F6F0E6'] },
    { n: 'Lavendel', ar: 'لافندر', f: ['#2E2647', '#6A5A9C', '#BDB2DE', '#F4F2F9'] },
    { n: 'Graphit', ar: 'غرافيت', f: ['#222428', '#5A606B', '#B5BAC2', '#F3F3F2'] },
    { n: 'Sonne', ar: 'شمس', f: ['#3A2E12', '#B07A1E', '#E8C877', '#FBF6EA'] }
  ];

  /* ---------- Farbrechnung ---------- */
  const hex = h => { h = String(h || '').trim().replace(/^#/, ''); if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(c => c + c).join(''); return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toUpperCase() : null; };
  const rgb = h => { h = hex(h).slice(1); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const rgba = (h, al) => { const c = rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${al})`; };
  const lum = h => { const c = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  // so lange mit Schwarz/Weiß mischen, bis der Kontrast zu „gegen“ reicht
  const dunkler = (f, gegen, min) => { let c = f; for (let i = 0; i < 40 && kontrast(c, gegen) < min; i++) c = mix(c, '#000000', .06); return c; };
  const heller = (f, gegen, min) => { let c = f; for (let i = 0; i < 40 && kontrast(c, gegen) < min; i++) c = mix(c, '#FFFFFF', .06); return c; };
  const textAuf = bg => kontrast(bg, '#FFFFFF') >= kontrast(bg, '#111111') ? '#F7F5F0' : '#141A24';

  // Vier Farben nach Helligkeit ordnen: dunkel (Hauptfarbe) → Akzent → zweiter Akzent → hell (Hintergrund)
  function rollen(farben) {
    const f = farben.map(hex).filter(Boolean); while (f.length < 4) f.push(STANDARD.farben[f.length]);
    const s = f.slice(0, 4).sort((a, b) => lum(a) - lum(b));
    let hell = s[3]; for (let i = 0; i < 30 && lum(hell) < .82; i++) hell = mix(hell, '#FFFFFF', .12);
    const d = dunkler(s[0], hell, 9), a1 = dunkler(s[1], hell, 4.5), a2 = s[2];
    return { d, a1, a2, hell };
  }

  function cssFuer(farben) {
    const { d, a1, a2, hell } = rollen(farben);
    const W = '#FFFFFF';
    const t = (k, c) => `--t${k}:${c};--t${k}f:${textAuf(c)};`;
    const hellV = {
      '--bg': hell, '--panel': W, '--panel2': mix(hell, W, .5), '--hover': mix(hell, d, .05), '--ink': d, '--muted': a1, '--line': mix(hell, d, .1), '--line2': mix(hell, d, .06),
      '--brand': d, '--brand-ink': hell, '--brand-muted': heller(a2, d, 4.5), '--brand-hover': rgba(a2, .12), '--brand-on': rgba(a2, .22),
      '--accent': d, '--on-accent': hell, '--accent2': a1, '--accent-soft': mix(W, a1, .12), '--focus': a2, '--dotgrid': rgba(a2, .42),
      '--c-1': d, '--c-in': a1, '--c-out': d, '--c-3': mix(a1, a2, .5), '--c-warn': a2, '--c-ok': a1, '--c-text': a1, '--c-grid': mix(hell, d, .1), '--c-ink': d,
      '--c-4': a2, '--c-5': mix(d, a1, .4), '--c-6': mix(a2, W, .4), '--c-7': mix(a1, a2, .25), '--c-dot': W
    };
    const hellT = t(1, d) + t(2, a1) + t(3, a2) + t(4, mix(d, a1, .4)) + t(5, mix(a1, a2, .5)) + t(6, mix(a2, W, .4)) + t(7, mix(d, a1, .6)) + t(8, mix(hell, d, .12)) + t(9, mix(a1, a2, .25));
    const bgD = mix(d, '#000000', .45), panD = kontrast(d, '#000000') > 2.2 ? mix(d, '#000000', .2) : d;
    const inkD = heller(hell, panD, 10), a2D = heller(a2, panD, 4.5);
    const dunkelV = {
      '--bg': bgD, '--panel': panD, '--panel2': mix(panD, W, .05), '--hover': mix(panD, W, .09), '--ink': inkD, '--muted': a2D, '--line': rgba(a2, .18), '--line2': rgba(a2, .10),
      '--brand': mix(d, '#000000', .6), '--brand-ink': inkD, '--brand-muted': mix(a1, a2, .5), '--brand-hover': rgba(a2, .08), '--brand-on': rgba(a2, .16),
      '--accent': a2D, '--on-accent': textAuf(a2D), '--accent2': a2D, '--accent-soft': rgba(a2, .14), '--focus': a1, '--dotgrid': rgba(a2, .09),
      '--c-1': inkD, '--c-in': a2D, '--c-out': inkD, '--c-3': mix(a1, a2, .5), '--c-warn': a1, '--c-ok': a2D, '--c-text': a2D, '--c-grid': rgba(a2, .2), '--c-ink': inkD,
      '--c-4': a1, '--c-5': mix(a2, W, .4), '--c-6': mix(d, a1, .6), '--c-7': mix(a1, a2, .7), '--c-dot': panD
    };
    const dunkelT = t(1, inkD) + t(2, a2D) + t(3, a1) + t(4, mix(a2, W, .4)) + t(5, mix(a1, a2, .5)) + t(6, mix(d, a1, .5)) + t(7, mix(a1, a2, .7)) + t(8, mix(d, a1, .6)) + t(9, mix(hell, d, .1));
    const block = o => Object.entries(o).map(([k, v]) => k + ':' + v).join(';') + ';';
    // Spezifität: hell 0,2,0 (schlägt :root), dunkel 0,3,0 (schlägt :root[data-theme=dunkel])
    return `:root[data-eigen]{${block(hellV)}${hellT}}
:root[data-eigen][data-theme=dunkel]{color-scheme:dark;${block(dunkelV)}${dunkelT}}
@media (prefers-color-scheme:dark){:root[data-eigen][data-theme=system]{color-scheme:dark;${block(dunkelV)}${dunkelT}}}
:root[data-eigen] .logo svg rect{fill:var(--brand-ink)} :root[data-eigen] .logo svg path{stroke:var(--brand)} :root[data-eigen] .logo svg circle{fill:var(--accent2)}`;
  }

  /* ---------- Lesen / Anwenden ---------- */
  function lesen() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && Array.isArray(v.farben)) return v; } catch (e) {} return null; }
  const istStandard = c => !c || ((c.name || STANDARD.name) === STANDARD.name && c.farben.map(hex).join() === STANDARD.farben.join());
  const name = () => { const c = lesen(); return (c && String(c.name || '').trim()) || STANDARD.name; };

  function anwenden(c) {
    const root = document.documentElement;
    let st = document.getElementById('ohEigenCss');
    const eigen = c && !(c.farben.map(hex).join() === STANDARD.farben.join());
    if (eigen) {
      if (!st) { st = document.createElement('style'); st.id = 'ohEigenCss'; (document.head || root).appendChild(st); }
      st.textContent = cssFuer(c.farben); root.setAttribute('data-eigen', '');
    } else { if (st) st.remove(); root.removeAttribute('data-eigen'); }
    nameSetzen((c && String(c.name || '').trim()) || STANDARD.name);
  }
  function nameSetzen(n) {
    document.title = n;
    document.querySelectorAll('.logo .lbl, .ohskopf b').forEach(x => { x.textContent = n; x.classList.add('no-i18n'); });
    try { if (window.officeHome && window.officeHome.setAppName) window.officeHome.setAppName(n); } catch (e) {}
  }
  // speichern: localStorage (früh beim Start) + S.settings.eigen (kommt mit in die Sicherung)
  function speichern(c) {
    const v = { name: String(c.name || '').trim().slice(0, 40) || STANDARD.name, farben: c.farben.map(hex).map((x, i) => x || STANDARD.farben[i]).slice(0, 4) };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    try { if (typeof S !== 'undefined' && S.settings && (typeof MODE === 'undefined' || MODE !== 'demo')) { S.settings.eigen = v; if (typeof save === 'function') save(); } } catch (e) {}
    anwenden(v); return v;
  }

  /* ---------- Auswahl-Baustein (Assistent + Einstellungen) ---------- */
  const AR = () => (window.OH_LANG || (function () { try { return localStorage.getItem('oh-lang'); } catch (e) { return 'de'; } })()) === 'ar';
  const T = (de, ar) => AR() ? (ar || de) : de;
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ROLLEN_TXT = () => [T('Hauptfarbe', 'اللون الأساسي'), T('Akzent', 'لون مميز'), T('Zweiter Akzent', 'لون مميز تاني'), T('Hintergrund', 'الخلفية')];

  function auswahlHTML(c) {
    c = c || lesen() || STANDARD;
    const f = c.farben.map((x, i) => hex(x) || STANDARD.farben[i]);
    return `<div class="ohfwahl no-i18n" data-ohf>
      <div class="fld"><label>${T('Name des Programms', 'اسم البرنامج')}</label><input data-ohf-name maxlength="40" value="${e(c.name || STANDARD.name)}" placeholder="Home Office" autocomplete="off"></div>
      <div class="small muted" style="margin:10px 0 6px">${T('Fertige Farbwelten – oder unten eigene Farben wählen bzw. Farbcodes eintippen (z. B. #1B2A44):', 'ألوان جاهزة – أو اختار ألوانك تحت أو اكتب كود اللون (مثلاً ‎#1B2A44):')}</div>
      <div class="ohfpal">${PALETTEN.map((p, i) => `<button type="button" class="ohfp" data-ohf-pal="${i}" title="${e(AR() ? p.ar : p.n)}">${p.f.map(x => `<i style="background:${x}"></i>`).join('')}<span>${e(AR() ? p.ar : p.n)}</span></button>`).join('')}</div>
      <div class="ohffarben">${f.map((x, i) => `<div class="ohff"><label>${i + 1}. ${ROLLEN_TXT()[i]}</label><div class="ohffz"><input type="color" data-ohf-c="${i}" value="${x.toLowerCase()}"><input data-ohf-h="${i}" value="${x}" maxlength="7" spellcheck="false" class="mono"></div></div>`).join('')}</div>
      <div class="small muted" style="margin-top:6px">${T('Die Reihenfolge ist egal: Das Programm nimmt automatisch die dunkelste Farbe für Seitenleiste und Schrift und die hellste für den Hintergrund – und passt sie an, damit alles gut lesbar bleibt. Briefe bleiben immer auf weißem Papier.', 'الترتيب مش مهم: البرنامج لحالو بياخد اللون الأغمق للشريط الجانبي والكتابة والأفتح للخلفية – وبيعدّلهن شوي مشان كل شي ينقرا منيح. الرسائل بتضل دايماً على ورق أبيض.')}</div>
      <div class="ohfvor" data-ohf-vor></div>
      <div style="margin-top:8px"><button type="button" class="btn sm ghost" data-ohf-std>${T('Standard wiederherstellen', 'رجّع الافتراضي')}</button></div>
    </div>`;
  }
  function vorschauHTML(c) {
    const { d, a1, a2, hell } = rollen(c.farben);
    return `<div class="ohfmini" style="background:${hell}"><div class="ohfmside" style="background:${d};color:${hell}"><b>${e(c.name || STANDARD.name)}</b><i style="background:${a2}"></i><i style="background:${rgba(a2, .35)}"></i><i style="background:${rgba(a2, .35)}"></i></div>
      <div class="ohfmmain"><div class="ohfmcard"><span style="background:${d}"></span><span style="background:${a1};width:60%"></span><span style="background:${a2};width:40%"></span></div><button style="background:${d};color:${hell}">${T('Knopf', 'زر')}</button></div></div>`;
  }
  function lesenAus(box) {
    const farben = [0, 1, 2, 3].map(i => hex(box.querySelector(`[data-ohf-h="${i}"]`).value) || hex(box.querySelector(`[data-ohf-c="${i}"]`).value));
    return { name: (box.querySelector('[data-ohf-name]').value || '').trim() || STANDARD.name, farben };
  }
  // bindet Ereignisse; jede Änderung wird sofort live angezeigt (live = gleich speichern)
  function binden(box, live) {
    if (!box || box.dataset.ohfGebunden) return; box.dataset.ohfGebunden = '1';
    const neu = () => { const c = lesenAus(box); const v = box.querySelector('[data-ohf-vor]'); if (v) v.innerHTML = vorschauHTML(c); if (live) speichern(c); else anwenden(c); };
    const setzen = f => { f.forEach((x, i) => { box.querySelector(`[data-ohf-c="${i}"]`).value = x.toLowerCase(); const h = box.querySelector(`[data-ohf-h="${i}"]`); h.value = x; h.classList.remove('bad'); }); neu(); };
    box.addEventListener('input', ev => {
      const t = ev.target;
      if (t.dataset.ohfC != null) { box.querySelector(`[data-ohf-h="${t.dataset.ohfC}"]`).value = t.value.toUpperCase(); neu(); }
      else if (t.dataset.ohfH != null) { const h = hex(t.value); t.classList.toggle('bad', !h); if (h) { box.querySelector(`[data-ohf-c="${t.dataset.ohfH}"]`).value = h.toLowerCase(); neu(); } }
      else if (t.hasAttribute('data-ohf-name')) neu();
    });
    box.addEventListener('click', ev => {
      const p = ev.target.closest('[data-ohf-pal]'); if (p) { setzen(PALETTEN[+p.dataset.ohfPal].f); return; }
      if (ev.target.closest('[data-ohf-std]')) { box.querySelector('[data-ohf-name]').value = STANDARD.name; setzen(STANDARD.farben); }
    });
    neu();
  }

  /* ---------- Stil für den Baustein ---------- */
  const css = `.ohfpal{display:flex;flex-wrap:wrap;gap:8px}
.ohfp{display:flex;align-items:center;gap:2px;padding:6px 10px 6px 6px;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);cursor:pointer;font-size:12px}
.ohfp:hover{background:var(--hover)} .ohfp i{width:16px;height:16px;border-radius:50%;display:inline-block;box-shadow:0 0 0 1px rgba(0,0,0,.08)} .ohfp span{margin-inline-start:6px}
.ohffarben{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px} @media (max-width:700px){.ohffarben{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ohff label{display:block;font-size:12px;color:var(--muted);margin-bottom:4px} .ohffz{display:flex;gap:6px;align-items:center}
.ohffz input[type=color]{width:38px;height:34px;padding:0;border:1px solid var(--line);border-radius:10px;background:none;cursor:pointer;flex:none}
.ohffz input.mono{width:100%;min-width:0;height:34px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--ink);font-family:Consolas,monospace;font-size:13px;text-transform:uppercase;direction:ltr}
.ohffz input.mono:focus{outline:2px solid var(--focus);outline-offset:0} .ohffz input.bad{border-color:var(--danger);background:var(--danger-soft)}
.ohfvor{margin-top:12px} .ohfmini{display:flex;height:120px;border-radius:14px;overflow:hidden;border:1px solid var(--line)}
.ohfmside{width:30%;padding:10px;display:flex;flex-direction:column;gap:7px;font-size:12px} .ohfmside b{font-family:var(--hand);font-weight:400;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .ohfmside i{height:7px;border-radius:4px;display:block}
.ohfmmain{flex:1;padding:12px;display:flex;flex-direction:column;gap:10px;align-items:flex-start} .ohfmcard{background:#fff;border-radius:10px;padding:10px;width:100%;display:flex;flex-direction:column;gap:6px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ohfmcard span{height:7px;border-radius:4px;display:block;width:80%} .ohfmmain button{border:0;border-radius:999px;padding:5px 14px;font-size:12px}`;

  /* ---------- Start ---------- */
  anwenden(lesen());
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    nameSetzen(name());
  });
  // Nach dem Laden der Daten: Sicherung enthält eigene Farben, localStorage nicht (z. B. neuer PC) → übernehmen
  (function warte() {
    if (!window.OH_READY) return setTimeout(warte, 300);
    try { const g = typeof S !== 'undefined' && S.settings && S.settings.eigen; const l = lesen();
      if (g && Array.isArray(g.farben) && (!l || JSON.stringify(l) !== JSON.stringify(g)) && (typeof MODE === 'undefined' || MODE !== 'demo')) { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch (e) {} anwenden(g); }
      else nameSetzen(name());
    } catch (e) {}
  })();

  window.ohFarben = { lesen, speichern, anwenden, name, auswahlHTML, binden, rollen, kontrast, STANDARD, PALETTEN, istStandard };
})();
