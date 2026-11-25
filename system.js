/* Home Office – Systemprüfung (Oberfläche, Version 2.17)
   Beim Start (und unter Einstellungen → Allgemein → Systemprüfung) wird geprüft, ob alle Zusatzprogramme da sind.
   Fehlt etwas Wichtiges, erscheint ein Fenster: was fehlt, wofür es gebraucht wird, und zwei Wege:
   „Selbst installieren“ (offizieller Download) oder „Claude installiert es“ (fertiger Auftrag für Claude in der Zwischenablage).
   Das Programm selbst installiert nichts. */
(function () {
  const AR = (window.OH_LANG || 'de') === 'ar';
  const T = (de, ar) => AR ? (ar || de) : de;
  const OH = window.officeHome || {};
  const KEY = 'oh-sys-ignoriert';
  const progName = () => (window.ohFarben ? window.ohFarben.name() : 'Home Office');
  const STUFE = { pflicht: [T('nötig', 'ضروري'), 'red'], empfohlen: [T('empfohlen', 'مُستحسن'), 'amber'], optional: [T('optional', 'اختياري'), 'blue'] };
  let letzte = null;

  async function pruefen() { if (!OH.systemPruefen) return null; try { letzte = await OH.systemPruefen(); } catch (e) { letzte = null; } return letzte; }
  const fehlend = r => (r ? r.liste.filter(x => !x.ok) : []);

  function auftrag(liste) {
    const mitWinget = liste.filter(x => x.winget), ohne = liste.filter(x => !x.winget);
    if (AR) return `ثبّتلي لو سمحت هالبرامج الناقصة لبرنامج «${progName()}» على ويندوز – بس من المصادر الرسمية، وقلّي قبل كل خطوة شو رح تعمل:\n`
      + mitWinget.map(x => `- ${x.nameAr || x.name}: winget install --id ${x.winget} -e --source winget`).join('\n')
      + (ohne.length ? '\nوهدول اشرحلي كيف جهّزهن:\n' + ohne.map(x => `- ${x.nameAr || x.name}${x.link ? ' (' + x.link + ')' : ''}`).join('\n') : '')
      + `\nممنوع تغيّر أي شي ببرنامج «${progName()}» نفسو.`;
    return `Bitte installiere mir diese fehlenden Programme für „${progName()}“ unter Windows – nur aus offiziellen Quellen, und sag mir vor jedem Schritt, was du tust:\n`
      + mitWinget.map(x => `- ${x.name}: winget install --id ${x.winget} -e --source winget`).join('\n')
      + (ohne.length ? '\nUnd erkläre mir, wie ich diese einrichte:\n' + ohne.map(x => `- ${x.name}${x.link ? ' (' + x.link + ')' : ''}`).join('\n') : '')
      + `\nAm Programm „${progName()}“ selbst darfst du nichts ändern.`;
  }

  function zeile(x) {
    const s = STUFE[x.stufe] || STUFE.empfohlen;
    return `<div class="row" style="align-items:flex-start;gap:10px"><span class="badge ${x.ok ? 'green' : s[1]}" style="flex:none;min-width:84px;text-align:center">${x.ok ? T('vorhanden', 'موجود') : s[0]}</span>
      <div class="grow"><b>${esc(AR ? (x.nameAr || x.name) : x.name)}</b>${x.info && x.ok ? ` <span class="small muted no-i18n">${esc(x.info)}</span>` : ''}<div class="small muted">${esc(AR ? (x.wofuerAr || x.wofuer) : x.wofuer)}</div></div>
      ${!x.ok && x.link ? `<button class="btn sm" data-sy="link:${esc(x.id)}">${icon('hochladen')}${T('Selbst installieren', 'ثبّتو بنفسك')}</button>` : ''}</div>`;
  }

  async function zeigen(erzwingen) {
    const r = letzte && !erzwingen ? letzte : await pruefen();
    if (!r) { if (erzwingen) toast(T('Die Systemprüfung gibt es nur im Desktop-Programm.', 'فحص النظام موجود بس ببرنامج سطح المكتب.')); return; }
    const f = fehlend(r), wichtig = f.filter(x => x.stufe !== 'optional');
    closeModal(); const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    const sortiert = r.liste.slice().sort((a, b) => (a.ok - b.ok) || (['pflicht', 'empfohlen', 'optional'].indexOf(a.stufe) - ['pflicht', 'empfohlen', 'optional'].indexOf(b.stufe)));
    bg.innerHTML = `<div class="modal no-i18n" style="width:min(720px,96vw)"><h3>${icon('einstellungen')} ${T('Systemprüfung', 'فحص النظام')}</h3>
      <div style="padding:0 18px">
        <p style="margin-top:0">${f.length ? (wichtig.length
          ? T(`Damit „${esc(progName())}“ einwandfrei läuft, fehlt auf diesem Computer noch etwas. Du kannst es selbst installieren oder Claude damit beauftragen.`, `مشان «${esc(progName())}» يشتغل بشكل ممتاز، في شي ناقص على هالكمبيوتر. فيك تثبّتو بنفسك أو تخلي Claude يثبّتلك ياه.`)
          : T('Alles Nötige ist da. Ein paar optionale Programme fehlen noch – sie machen die Arbeit bequemer.', 'كل الضروري موجود. في كم برنامج اختياري ناقص – بيسهّلو الشغل.'))
          : T('Alles ist da – das Programm kann voll arbeiten.', 'كل شي موجود – البرنامج جاهز يشتغل بكل طاقتو.')}</p>
        <div class="list">${sortiert.map(zeile).join('')}</div>
        ${f.length ? `<div class="banner blue" style="margin-top:12px">${icon('info')}<div>${T('<b>Claude installiert es:</b> Der Auftrag wird in die Zwischenablage kopiert. Öffne Claude (Claude Desktop oder claude.ai), füge ihn mit Strg+V ein und schick ihn ab. Claude sagt dir vor jedem Schritt, was es tut.', '<b>Claude بيثبّتو:</b> الطلب بينسخ عالحافظة. افتح Claude (Claude Desktop أو claude.ai)، الصقو بـ Ctrl+V وابعتو. Claude بيقلك قبل كل خطوة شو عم يعمل.')}</div></div>` : ''}
      </div>
      <div class="acts">${f.length && wichtig.length && !erzwingen ? `<button class="btn ghost" data-sy="spaeter">${T('Nicht mehr fragen', 'لا تسألني مرة تانية')}</button>` : ''}<span class="sp"></span>
        <button class="btn" data-sy="neu">${icon('update')}${T('Erneut prüfen', 'افحص من جديد')}</button>
        ${f.length ? `<button class="btn" data-sy="claude">${icon('kopieren')}${T('Claude installiert es', 'Claude بيثبّتو')}</button>` : ''}
        <button class="btn pri" data-sy="zu">${T('Schließen', 'سكّر')}</button></div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', async e => {
      const b = e.target.closest('[data-sy]'); if (!b) { if (e.target === bg) closeModal(); return; }
      const a = b.dataset.sy;
      if (a === 'zu') return closeModal();
      if (a === 'spaeter') { try { localStorage.setItem(KEY, f.map(x => x.id).sort().join(',')); } catch (er) {} return closeModal(); }
      if (a === 'neu') { letzte = null; return zeigen(true); }
      if (a === 'claude') { const txt = auftrag(f); try { await navigator.clipboard.writeText(txt); toast(T('Auftrag für Claude kopiert – jetzt bei Claude einfügen (Strg+V)', 'الطلب انسخ – الصقو هلأ عند Claude (Ctrl+V)')); } catch (er) { prompt(T('Diesen Text bei Claude einfügen:', 'الصق هالنص عند Claude:'), txt); } return; }
      if (a.startsWith('link:')) { const x = r.liste.find(y => y.id === a.slice(5)); if (x && x.link) window.open(x.link, '_blank'); }
    });
  }

  // Start: einmal prüfen; Fenster nur, wenn Nötiges/Empfohlenes fehlt und diese Auswahl nicht schon abgelehnt wurde
  (function warte() {
    if (!window.OH_READY) return setTimeout(warte, 400);
    setTimeout(async () => {
      const r = await pruefen(); const w = fehlend(r).filter(x => x.stufe !== 'optional'); if (!w.length) return;
      let ign = ''; try { ign = localStorage.getItem(KEY) || ''; } catch (e) {}
      if (ign === w.map(x => x.id).sort().join(',')) return;
      if (document.getElementById('modal')) return; // kein Fenster über einem anderen
      zeigen(false);
    }, 2500);
  })();

  window.ohSystem = { zeigen, pruefen, auftrag };
})();
