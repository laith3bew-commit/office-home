/* Home Office – Ersteinrichtung, Personen-Ordner, Hilfe je Seite und Rundgang (ab Version 2.17).
   - Assistent beim ersten Start im Live-Modus (leere Daten): Sprache → Willkommen → eigene Daten → Personen → je Person Daten + Ordner
     → vorhandene Dateien übernehmen → Verbindungen (Gemini, Google) → E-Mail (Zeitraum, einzeln durchgehen) → Fertig/Rundgang.
   - Demo-Modus bleibt unverändert (Assistent und Hilfe nur im Live-Modus).
   - Bestehende Installationen (schon Daten vorhanden) sehen den Assistenten nicht (migrate setzt setup.fertig).
   Läuft nach dem Hauptskript und nutzt dessen Globale (S, save, render, ACT, VIEWS, DESKTOP, MODE …). */
(function () {
  'use strict';
  const AR = (window.OH_LANG || 'de') === 'ar';
  const T = (de, ar) => AR ? (ar || de) : de;
  const OH = window.officeHome || {};
  const setup = () => { S.settings.setup = S.settings.setup || { fertig: false }; return S.settings.setup; };
  const offen = () => MODE === 'live' && !(S.settings.setup && S.settings.setup.fertig);
  const sichern = async () => { try { if (typeof flushSave === 'function') await flushSave(); else save(); } catch (e) { save(); } };
  const kurz = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const FARBEN = ['#4F6785', '#A9B8CA', '#7C8FA6', '#5E7A6A', '#9A7B5B', '#7A6A92', '#B07A7A', '#6C8CA0', '#8A9A5B', '#A08870'];
  const ROLLEN = [['Vater', 'الأب', 'Herr'], ['Mutter', 'الأم', 'Frau'], ['Ehefrau', 'الزوجة', 'Frau'], ['Ehemann', 'الزوج', 'Herr'], ['Schwester', 'الأخت', 'Frau'], ['Bruder', 'الأخ', 'Herr'],
    ['Tochter', 'البنت', 'Frau'], ['Sohn', 'الابن', 'Herr'], ['Oma', 'الجدة', 'Frau'], ['Opa', 'الجد', 'Herr'], ['Tante', 'العمة / الخالة', 'Frau'], ['Onkel', 'العم / الخال', 'Herr']];
  const rolleAr = r => (ROLLEN.find(x => x[0] === r) || [])[1] || r;

  /* =====================================================================================
     Teil 1: Personen-Ordner (ohne Gedächtnis-Engine): wählen/anlegen, Dateien übernehmen, Kopien ablegen, suchen
     ===================================================================================== */
  async function ordnerWaehlen(p) {
    if (!OH.ordnerWaehlen) return false;
    const d = await OH.ordnerWaehlen(T('Ordner für ' + p.role + ' wählen', 'اختر مجلد ' + rolleAr(p.role)));
    if (!d) return false; p.ordner = d; p.ordnerSeit = p.ordnerSeit || new Date().toISOString(); save(); return true;
  }
  async function ordnerAnlegen(p) {
    if (!OH.ordnerAnlegen) return false;
    const r = await OH.ordnerAnlegen(p.role + (personName(p) && personName(p) !== p.role ? ' – ' + personName(p) : ''));
    if (!r || !r.ok) { alert(T('Ordner konnte nicht angelegt werden: ', 'ما قدرت أعمل المجلد: ') + ((r && r.message) || '')); return false; }
    p.ordner = r.pfad; p.ordnerSeit = p.ordnerSeit || new Date().toISOString(); save(); return true;
  }
  const TYP = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', txt: 'text/plain', md: 'text/markdown',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', odt: 'application/vnd.oasis.opendocument.text', rtf: 'application/rtf',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', eml: 'message/rfc822' };
  const typVon = n => TYP[(String(n).split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
  const groesse = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  // Vorhandene Dateien im Ordner einer Person: auswählen und als Dokumente übernehmen (optional von Gemini lesen lassen)
  async function ordnerImport(p, fertig) {
    if (!p.ordner || !OH.ordnerListe) return;
    const r = await OH.ordnerListe(p.ordner, 2000);
    if (!r || !r.ok) { alert(T('Ordner nicht gefunden: ', 'المجلد مش موجود: ') + p.ordner); return; }
    const schon = new Set(S.documents.filter(d => d.personId === p.id && d.ordnerRel).map(d => d.ordnerRel));
    const liste = r.dateien.filter(f => !schon.has(f.rel) && !/^Home Office[\\/]/i.test(f.rel));
    if (typeof closeModal === 'function') closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg no-i18n'; bg.id = 'modal'; document.body.appendChild(bg);
    const ki = typeof kiReady === 'function' && kiReady();
    bg.innerHTML = `<div class="modal" style="width:min(820px,96vw)"><h3>${icon('dokumente')}${T('Dateien im Ordner von ', 'ملفات مجلد ')}${esc(AR ? rolleAr(p.role) : p.role)}</h3>
      <div style="padding:12px 22px;overflow:auto;max-height:64vh"><div class="small muted" style="margin-bottom:8px">${esc(p.ordner)}</div>
      ${liste.length ? `<p class="small" style="margin:0 0 8px">${T('Wähle aus, was Home Office als Dokument übernehmen soll. Die Dateien bleiben, wo sie sind – nichts wird verschoben oder gelöscht.', 'اختار شو بدك البرنامج ياخد كمستند. الملفات بتضل مكانها – ما في شي بينتقل أو بينمسح.')}</p>
        <label class="egstep egalle"><input type="checkbox" id="oiAlle"><span><b>${T('Alle auswählen', 'اختيار الكل')}</b><small>${liste.length} ${T('Dateien', 'ملف')}</small></span></label>
        <div class="egsteps" style="margin-top:6px">${liste.slice(0, 500).map((f, i) => `<label class="egstep"><input type="checkbox" data-oi="${i}"><span><b>${esc(f.name)}</b><small>${esc(f.rel)} · ${groesse(f.size)} · ${esc(new Date(f.mtime).toLocaleDateString('de-DE'))}</small></span></label>`).join('')}</div>
        ${liste.length > 500 ? `<p class="small muted">${T('Es werden die neuesten 500 angezeigt.', 'معروض أحدث 500 ملف.')}</p>` : ''}`
      : `<div class="empty">${T('Keine neuen Dateien in diesem Ordner.', 'ما في ملفات جديدة بهالمجلد.')}</div>`}</div>
      <div class="acts">${liste.length && ki ? `<label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="oiKi" checked>${T('von Gemini lesen lassen (Termine, Fristen, Kontakte vorschlagen)', 'خلي Gemini يقراهن (يقترح مواعيد ومهل وجهات اتصال)')}</label>` : ''}
        <span class="sp"></span><button class="btn" data-oi="x">${T('Schließen', 'إغلاق')}</button>${liste.length ? `<button class="btn pri" data-oi="ok">${icon('plus')}${T('Übernehmen', 'استيراد')}</button>` : ''}</div></div>`;
    bg.querySelector('#oiAlle')?.addEventListener('change', e => bg.querySelectorAll('[data-oi]').forEach(x => { if (x.type === 'checkbox') x.checked = e.target.checked; }));
    bg.addEventListener('click', async e => {
      const b = e.target.closest('button[data-oi]'); if (!b) return;
      if (b.dataset.oi === 'x') { bg.remove(); if (fertig) fertig(0); return; }
      const wahl = [...bg.querySelectorAll('input[data-oi]')].filter(x => x.checked).map(x => liste[Number(x.dataset.oi)]);
      if (!wahl.length) return alert(T('Bitte zuerst Dateien auswählen.', 'اختار ملفات أول.'));
      const mitKi = !!(bg.querySelector('#oiKi') && bg.querySelector('#oiKi').checked);
      b.disabled = true; let n = 0;
      for (const f of wahl) {
        b.textContent = T('Übernehme ', 'عم استورد ') + (n + 1) + ' / ' + wahl.length + ' …';
        const x = await OH.ordnerLesen(p.ordner, f.rel); if (!x || !x.ok) continue;
        const type = typVon(f.name), fileId = uid();
        await filePut(fileId, { blob: new Blob([x.data], { type }), name: f.name, type });
        const d = { id: uid(), added: today(), title: f.name.replace(/\.[^.]+$/, ''), date: f.mtime.slice(0, 10), category: 'Sonstiges', personId: p.id, sender: '', caseId: '', notes: '',
          tags: T('Ordner', 'Ordner'), fileId, fileName: f.name, fileType: type, fileSize: f.size, ordnerRel: f.rel };
        S.documents.push(d); n++;
        if (mitKi && /^(application\/pdf|image\/)/.test(type) && typeof kiAutoDoc === 'function') { try { kiAutoDoc(d); } catch (err) {} }
      }
      save(); bg.remove(); toast(n + T(' Dokument(e) übernommen', ' مستند انضاف')); if (typeof render === 'function') render(); if (fertig) fertig(n);
    });
  }
  // Neue Dokumente einer Person als Kopie in „<Ordner>\Home Office\“ ablegen (erst ab dem Zeitpunkt, an dem der Ordner gewählt wurde)
  let kopieLaeuft = false, kopieTimer = null;
  async function ordnerKopien() {
    if (kopieLaeuft || MODE !== 'live' || !OH.ordnerSchreiben) return; kopieLaeuft = true;
    try {
      for (const d of S.documents) {
        if (!d.fileId || d.ordnerRel || d.ordnerKopie) continue;
        const p = getPerson(d.personId); if (!p || !p.ordner || !p.ordnerSeit) continue;
        if ((d.added || '') < p.ordnerSeit.slice(0, 10)) continue;
        const f = await fileGet(d.fileId); if (!f || !f.blob) continue;
        const ext = (String(f.name || d.fileName || '').match(/\.[a-z0-9]{2,5}$/i) || [''])[0] || (/pdf/.test(f.type || '') ? '.pdf' : '');
        const name = ((d.date || today()) + ' ' + (d.title || 'Dokument')).replace(/[\\/:*?"<>|]+/g, '-').slice(0, 100) + ext;
        const r = await OH.ordnerSchreiben(p.ordner, name, new Uint8Array(await f.blob.arrayBuffer()));
        d.ordnerKopie = r && r.ok ? r.rel : 'fehler';
      }
    } catch (e) {}
    kopieLaeuft = false; origSave();
  }
  const origSave = window.save;
  window.save = function () { const r = origSave.apply(this, arguments); clearTimeout(kopieTimer); kopieTimer = setTimeout(ordnerKopien, 4000); return r; };

  // Zeile auf der Personen-Seite
  window.ordnerZeile = p => !DESKTOP || !OH.ordnerWaehlen ? '' : `<div class="pordner"><span class="small muted">${icon('dokumente')}${T('Ordner auf dem Computer', 'المجلد على الكمبيوتر')}</span>
    ${p.ordner ? `<div class="small" style="word-break:break-all"><b>${esc(p.ordner)}</b></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      <button class="btn sm" data-act="ordOeffnen" data-id="${p.id}">${icon('auge')}${T('Öffnen', 'فتح')}</button><button class="btn sm" data-act="ordImport" data-id="${p.id}">${icon('plus')}${T('Dateien übernehmen', 'استيراد ملفات')}</button><button class="btn sm" data-act="ordWahl" data-id="${p.id}">${T('Ändern', 'تغيير')}</button></div>`
    : `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn sm" data-act="ordWahl" data-id="${p.id}">${T('Ordner wählen', 'اختيار مجلد')}</button><button class="btn sm" data-act="ordNeu" data-id="${p.id}">${T('Neuen Ordner anlegen', 'إنشاء مجلد جديد')}</button></div>`}</div>`;
  Object.assign(ACT, {
    ordWahl: async d => { const p = getPerson(d.id); if (p && await ordnerWaehlen(p)) { render(); if (confirm(T('Vorhandene Dateien aus diesem Ordner jetzt ansehen und übernehmen?', 'بدك تشوف الملفات الموجودة بهالمجلد وتستوردها هلأ؟'))) ordnerImport(p); } },
    ordNeu: async d => { const p = getPerson(d.id); if (p && await ordnerAnlegen(p)) { render(); toast(T('Ordner angelegt', 'انعمل المجلد')); } },
    ordOeffnen: d => { const p = getPerson(d.id); if (p && p.ordner) OH.ordnerOeffnen(p.ordner); },
    ordImport: d => { const p = getPerson(d.id); if (p) ordnerImport(p); }
  });
  window.ohOrdnerImport = ordnerImport;

  /* =====================================================================================
     Teil 2: Hilfe je Seite (einmal beim ersten Besuch, danach über „?“) und Rundgang
     ===================================================================================== */
  const H = (titel, titelAr, de, ar) => ({ titel, titelAr, de, ar });
  const HILFE = {
    dashboard: H('Dashboard', 'لوحة المتابعة', ['Der Überblick: was überfällig ist, was in 7 Tagen fällig wird, offene Vorgänge, Fixkosten und Kündigungsfristen.', 'Oben rechts legst du schnell eine Frist, einen Vorgang, ein Dokument oder einen Brief an.', 'Oben links wählst du „Alle“ oder eine Person – das gilt im ganzen Programm.'],
      ['النظرة العامة: شو متأخر، شو مستحق خلال 7 أيام، الملفات المفتوحة، التكاليف الثابتة ومهل الإلغاء.', 'فوق على اليمين بتضيف بسرعة مهلة أو ملف أو مستند أو رسالة.', 'فوق بتختار «الكل» أو شخص معيّن – وهالاختيار بيسري على كل البرنامج.']),
    office: H('Büro', 'المكتب', ['Dein virtuelles Büro: 8 Mitarbeiter zeigen, was gerade passiert (Post, Termine, Finanzen, Archiv …).', 'Grün = arbeitet, Orange = Pause, Rot = keine Aufgaben. Der Briefkasten leuchtet, wenn neue Post da ist.', 'Rückfragen der Sekretärin beantwortest du hier – die Mitarbeiter entscheiden nie ohne dich.'],
      ['مكتبك الافتراضي: 8 موظفين بيورجوك شو عم يصير (بريد، مواعيد، مالية، أرشيف …).', 'أخضر = عم يشتغل، برتقالي = استراحة، أحمر = ما عندو شغل. صندوق البريد بيضوي لما يوصل بريد جديد.', 'أسئلة السكرتيرة بتجاوب عليها هون – الموظفين ما بياخدو قرار بدونك.']),
    mail: H('E-Mail', 'البريد', ['Posteingang deines Postfachs. Jede Stunde prüft die Sekretärin auf neue E-Mails und fragt, welche bearbeitet werden sollen.', '„Ans Büro“: Gemini liest die E-Mail samt Anhängen und schlägt Termine, Fristen, Zahlungen und Kontakte vor – eingetragen wird erst nach deiner Bestätigung.', '„Einzeln durchgehen“: neue E-Mails nacheinander hinzufügen oder überspringen.', 'Bilder und Anhänge öffnest du mit einem Klick; „Gesendet“ zeigt, was du verschickt hast.'],
      ['صندوق الوارد تبع بريدك. كل ساعة السكرتيرة بتشيك على إيميلات جديدة وبتسألك شو لازم ينعمل فيها.', '«Ans Büro»: Gemini بيقرا الإيميل مع المرفقات وبيقترح مواعيد ومهل ودفعات وجهات اتصال – وما بينكتب شي إلا بعد موافقتك.', '«Einzeln durchgehen»: بتمرق على الإيميلات الجديدة وحدة وحدة: إضافة أو تخطي.', 'الصور والمرفقات بتفتحها بضغطة؛ «Gesendet» بيورجيك شو بعتت.']),
    calendar: H('Kalender', 'التقويم', ['Alle Termine, Fristen, Kündigungsfristen und festen Zahlungen an einem Ort – als Liste, Monat oder Woche.', 'Erinnerungen kommen 1 Woche und 1 Tag vorher (bei Uhrzeit auch 1 Stunde vorher).', 'Mit Google verbunden erscheinen die Termine auch auf dem Handy – und was du am Handy einträgst, kommt hierher.'],
      ['كل المواعيد والمهل ومهل الإلغاء والدفعات الثابتة بمكان واحد – كقائمة أو شهر أو أسبوع.', 'التذكير بيوصل قبل بأسبوع وبيوم (ولو في ساعة كمان قبل بساعة).', 'إذا ربطتو بـ Google المواعيد بتطلع على الجوال – واللي بتكتبو بالجوال بيوصل لهون.']),
    stats: H('Statistik', 'الإحصائيات', ['Wie läuft die Arbeit: erledigte Aufgaben, Pünktlichkeit, Dauer der Vorgänge und Wartezeit je Behörde.'], ['كيف ماشي الشغل: المهام المنجزة، الالتزام بالمواعيد، مدة الملفات ووقت الانتظار عند كل جهة.']),
    finance: H('Finanzen', 'المالية', ['Einnahmen und Ausgaben je Monat. Verträge zählen automatisch als Ausgaben.', 'Kontoauszüge als CSV importieren: Kategorien werden erkannt, Doppelte übersprungen.', 'Die Prognose zeigt, wie viel am Monatsende übrig bleibt.'], ['المدخول والمصروف كل شهر. العقود بتنحسب مصروف لحالها.', 'كشوف الحساب بتستوردها كـ CSV: التصنيفات بتنعرف لحالها والمكرر بيتخطاه.', 'التوقع بيورجيك قديش رح يضل آخر الشهر.']),
    cases: H('Vorgänge', 'الملفات (Vorgänge)', ['Ein Vorgang = eine Angelegenheit, z. B. „Pflegegrad beantragen“. Mit Schritten, Verlauf, Briefen und Dokumenten.', 'Status zeigt, ob du auf eine Antwort wartest – die Statistik misst daraus die Wartezeit.'], ['الملف = قضية وحدة، مثلاً «طلب درجة رعاية». فيه خطوات وسجل ورسائل ومستندات.', 'الحالة بتورجي إذا عم تستنى رد – والإحصائيات بتحسب منها وقت الانتظار.']),
    tasks: H('Fristen & Aufgaben', 'المهل والمهام', ['Alles, was bis zu einem Datum erledigt sein muss. Haken setzen = erledigt.', 'Rot = überfällig, Gelb = bald fällig. Erinnerung kommt auch als Windows-Meldung.'], ['كل شي لازم يخلص لتاريخ معيّن. علامة الصح = خلص.', 'أحمر = متأخر، أصفر = قرّب. التذكير بيوصل كمان كإشعار ويندوز.']),
    letters: H('Brief schreiben', 'كتابة رسالة', ['181 Vorlagen in 29 Kategorien. Gelbe Stellen sind noch auszufüllen – Klick darauf springt zum passenden Feld.', 'Briefe nach DIN 5008 mit deinem Logo, deiner Unterschrift und dem Vollmacht-Link.', 'Drucken, als PDF speichern oder direkt „Als E-Mail senden“. Mit Internetmarke aus dem Vorrat.'], ['181 قالب بـ 29 فئة. الأماكن الصفرا لسا لازم تتعبى – الضغط عليها بياخدك عالخانة.', 'رسائل حسب DIN 5008 مع شعارك وتوقيعك ورابط الوكالة.', 'طباعة، حفظ PDF أو مباشرة «إرسال كإيميل». مع طابع بريد من المخزون.']),
    brief: null,
    documents: H('Dokumente', 'المستندات', ['Alle Unterlagen je Person. Neue Dokumente liest Gemini und schlägt vor, was eingetragen wird.', 'Hat die Person einen Ordner, liegt von jedem neuen Dokument eine Kopie in „<Ordner>\\Home Office“.'], ['كل الأوراق لكل شخص. Gemini بيقرا المستندات الجديدة وبيقترح شو ينكتب.', 'إذا الشخص إلو مجلد، كل مستند جديد بتنحط نسخة منو بـ «<المجلد>\\Home Office».']),
    scan: H('Scanner', 'الماسح الضوئي', ['Scannen mit Drucker/Scanner, mit dem Handy (QR-Code, nur im Heimnetz), aus Dateien oder einem überwachten Ordner.', 'Ecken werden erkannt und gerade gezogen; mehrere Seiten werden zu einem PDF.'], ['المسح بالسكانر، أو بالجوال (رمز QR، بس بشبكة البيت)، أو من ملفات أو من مجلد مراقَب.', 'الزوايا بتنعرف وبتتعدل؛ وكذا صفحة بيصيرو PDF واحد.']),
    contracts: H('Verträge & Fixkosten', 'العقود والتكاليف الثابتة', ['Strom, Handy, Versicherung … mit Laufzeit. Home Office rechnet aus, bis wann du kündigen musst, und erinnert dich.'], ['كهربا، جوال، تأمين … مع مدة العقد. البرنامج بيحسب لإيمتى لازم تلغي وبيذكرك.']),
    assets: H('Konten & Vermögen', 'الحسابات والأملاك', ['Bankkonten und Vermögen je Person mit Stand – Grundlage für Kontostand und Prognose.'], ['الحسابات البنكية والأملاك لكل شخص مع الرصيد – أساس الرصيد والتوقع.']),
    notes: H('Notizen', 'الملاحظات', ['Telefonnotizen, Zugangsinfos (keine Passwörter – dafür ist der Tresor), Wissenswertes.'], ['ملاحظات تلفون، معلومات (بدون كلمات سر – هي إلها الخزنة)، أشياء مهمة.']),
    report: H('Monatsbericht', 'التقرير الشهري', ['Ein Bericht pro Monat zum Drucken: Erledigtes, Briefe, Dokumente, offene Fristen, Einnahmen und Ausgaben – z. B. als Nachweis für Behörden oder für die Familie.'], ['تقرير كل شهر للطباعة: المنجز، الرسائل، المستندات، المهل المفتوحة، المدخول والمصروف – مثلاً كإثبات للدوائر أو للعيلة.']),
    persons: H('Personen & Vollmachten', 'الأشخاص والوكالات', ['Die Daten jeder Person werden automatisch in Briefe eingesetzt (Name, Geburtsdatum, Anschrift).', 'Vollmacht als PDF hinterlegen und als Link freigeben – er steht dann unter jedem Brief.', 'Ordner auf dem Computer: dort sucht Home Office nach vorhandenen Unterlagen und legt neue ab.'], ['بيانات كل شخص بتنحط لحالها بالرسائل (الاسم، تاريخ الميلاد، العنوان).', 'احفظ الوكالة PDF وشاركها كرابط – بيطلع تحت كل رسالة.', 'المجلد على الكمبيوتر: البرنامج بيدوّر فيه على الأوراق الموجودة وبيحفظ فيه الجديدة.']),
    contacts: H('Adressbuch', 'دفتر العناوين', ['Behörden, Firmen und Privatpersonen – Empfänger und Absender für Briefe. Gemini ergänzt neue Kontakte nach deiner Bestätigung.'], ['دوائر وشركات وأشخاص – مستلمين ومرسلين للرسائل. Gemini بيضيف جهات جديدة بعد موافقتك.']),
    vault: H('Tresor', 'الخزنة', ['Passwörter und PINs – verschlüsselt mit deinem Hauptpasswort. Niemand sonst (auch keine KI) kann sie lesen.', 'Den Wiederherstellungsschlüssel unbedingt aufschreiben und sicher aufbewahren.'], ['كلمات السر والأرقام السرية – مشفّرة بكلمة سرك الرئيسية. ما حدا غيرك (ولا أي ذكاء اصطناعي) بيقدر يقراها.', 'اكتب مفتاح الاسترجاع وخبّيه بمكان آمن – ضروري.']),
    settings: H('Einstellungen', 'الإعدادات', ['Meine Daten, Briefgestaltung, Vollmacht, Kalender/Google/Gemini, Sicherung und Update.', 'Sicherung regelmäßig herunterladen – deine Daten liegen nur auf diesem Computer.', 'Diese Hilfe und den Rundgang findest du unter „Allgemein“ wieder.'], ['بياناتي، شكل الرسائل، الوكالة، التقويم/Google/Gemini، النسخ الاحتياطي والتحديث.', 'نزّل نسخة احتياطية بشكل منتظم – بياناتك موجودة بس على هالكمبيوتر.', 'هالشرح والجولة بتلاقيهن تحت «Allgemein».'])
  };
  HILFE.brief = HILFE.letters; HILFE.case = HILFE.cases;
  const RUNDGANG = ['dashboard', 'office', 'mail', 'calendar', 'tasks', 'documents', 'letters', 'cases', 'contracts', 'finance', 'persons', 'contacts', 'vault', 'settings'];
  let tour = -1;
  function hilfeHTML(route, imRundgang) {
    const h = HILFE[route]; if (!h) return '';
    const punkte = AR ? h.ar : h.de;
    return `<div class="card ohhilfe no-i18n" id="ohHilfe"><div class="ohhkopf">${icon('info')}<b>${esc(AR ? h.titelAr : h.titel)}</b>${imRundgang ? `<span class="small muted">${T('Rundgang', 'جولة')} ${tour + 1} / ${RUNDGANG.length}</span>` : ''}<span class="grow"></span>
      <button class="btn sm ghost" data-hilfe="zu" title="${T('Schließen', 'إغلاق')}">${icon('schliessen')}</button></div>
      <ul>${punkte.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="acts">${imRundgang ? `<button class="btn sm" data-hilfe="ende">${T('Rundgang beenden', 'إنهاء الجولة')}</button>${tour > 0 ? `<button class="btn sm" data-hilfe="zurueck">${T('Zurück', 'رجوع')}</button>` : ''}<button class="btn sm pri" data-hilfe="weiter">${tour < RUNDGANG.length - 1 ? T('Weiter', 'التالي') : T('Fertig', 'تم')}</button>`
        : `<button class="btn sm pri" data-hilfe="ok">${T('Verstanden', 'فهمت')}</button>`}</div></div>`;
  }
  function hilfeZeigen(erzwingen) {
    if (MODE !== 'live' || !(S.settings.setup && S.settings.setup.fertig)) return;
    const main = document.getElementById('main'); if (!main || document.getElementById('ohHilfe')) return;
    const route = parseHash().route, su = setup(); su.hilfe = su.hilfe || {};
    if (tour >= 0) { if (RUNDGANG[tour] !== route) return; }
    else if (!erzwingen && (su.hilfe[route] || su.hilfeAus)) return;
    const html = hilfeHTML(route, tour >= 0); if (!html) return;
    main.insertAdjacentHTML('afterbegin', html);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hilfe]'); if (!b) return;
    const a = b.dataset.hilfe, su = setup(); su.hilfe = su.hilfe || {}; const route = parseHash().route;
    const box = document.getElementById('ohHilfe'); if (box) box.remove();
    if (a === 'ok' || a === 'zu') { su.hilfe[route] = true; if (tour >= 0 && a === 'zu') tour = -1; save(); return; }
    if (a === 'ende') { tour = -1; su.tour = true; save(); return; }
    if (a === 'weiter' || a === 'zurueck') { su.hilfe[route] = true; tour += a === 'weiter' ? 1 : -1;
      if (tour >= RUNDGANG.length) { tour = -1; su.tour = true; save(); toast(T('Rundgang beendet – Hilfe gibt es jederzeit über „?“ oben.', 'خلصت الجولة – الشرح موجود دايماً من زر «؟» فوق.')); return; }
      save(); location.hash = '#/' + RUNDGANG[tour]; setTimeout(() => hilfeZeigen(true), 400); }
  });
  function rundgang() { tour = 0; location.hash = '#/' + RUNDGANG[0]; setTimeout(() => { if (parseHash().route === RUNDGANG[0]) { const x = document.getElementById('ohHilfe'); if (x) x.remove(); hilfeZeigen(true); } }, 400); }
  window.ohRundgang = rundgang;
  window.ohHilfe = () => { const x = document.getElementById('ohHilfe'); if (x) x.remove(); else hilfeZeigen(true); };
  // nach jedem Neuzeichnen von #main prüfen (render wird vom hashchange-Listener direkt aufgerufen)
  const mainEl = document.getElementById('main');
  if (mainEl) new MutationObserver(() => { if (!document.getElementById('ohHilfe')) setTimeout(() => hilfeZeigen(false), 60); }).observe(mainEl, { childList: true });
  // „?“-Knopf oben neben der Glocke
  (function hilfeKnopf() {
    const bell = document.getElementById('bell'); if (!bell) return setTimeout(hilfeKnopf, 500);
    if (document.getElementById('ohHilfeBtn')) return;
    const b = document.createElement('button'); b.id = 'ohHilfeBtn'; b.className = 'btn ohhbtn'; b.title = T('Hilfe zu dieser Seite', 'شرح هالصفحة'); b.textContent = '?';
    b.addEventListener('click', () => window.ohHilfe()); bell.parentNode.insertBefore(b, bell);
  })();

  /* =====================================================================================
     Teil 3: Assistent (Ersteinrichtung)
     ===================================================================================== */
  let el = null, pill = null;
  const SCHRITTE = ['sprache', 'willkommen', 'ich', 'marke', 'personen', 'person', 'ordner', 'gedaechtnis', 'verbindungen', 'email', 'fertig'];
  function rahmen(inhalt, fuss, nr) {
    const i = SCHRITTE.indexOf(setup().schritt || 'sprache');
    return `<div class="ohsbox"><div class="ohskopf"><span class="ohslogo">L</span><b>${esc(window.ohFarben ? window.ohFarben.name() : 'Home Office')}</b><span class="grow"></span>
      ${i > 0 ? `<span class="small muted">${T('Schritt', 'خطوة')} ${i} / ${SCHRITTE.length - 1}</span>` : ''}${i > 1 ? `<button class="btn sm ghost" data-su="pause" title="${T('Später fortsetzen', 'كمّل بعدين')}">${T('Später', 'بعدين')}</button>` : ''}</div>
      <div class="ohsfort"><i style="width:${Math.round(Math.max(0, i) / (SCHRITTE.length - 1) * 100)}%"></i></div>
      <div class="ohsinhalt">${inhalt}</div><div class="ohsfuss">${fuss || ''}</div></div>`;
  }
  const knopf = (su, l, cls, ic) => `<button class="btn ${cls || ''}" data-su="${su}">${ic ? icon(ic) : ''}${l}</button>`;
  const feld = (id, l, v, typ, ph) => `<div class="fld"><label>${l}</label><input id="${id}" type="${typ || 'text'}" value="${esc(v || '')}" placeholder="${esc(ph || '')}" autocomplete="off"></div>`;

  async function zeichne() {
    if (!el) return; const su = setup(), s = su.schritt || 'sprache';
    let html = '';
    if (s === 'sprache') html = rahmen(`<h2>Willkommen · أهلاً وسهلاً</h2><p>Bitte wähle die Sprache der Bedienung.<br>اختار لغة البرنامج.</p>
      <div class="ohswahl">${knopf('lang:de', 'Deutsch', 'big')}${knopf('lang:ar', 'العربية', 'big')}</div>
      <p class="small muted">Briefe, Vorlagen und Berichte bleiben immer Deutsch (DIN 5008). · الرسائل والقوالب والتقارير بتضل دايماً بالألماني.</p>`);
    else if (s === 'willkommen') html = rahmen(`<h2>${T('Willkommen bei Home Office', 'أهلاً فيك بـ Home Office')}</h2>
      <p>${T('Home Office ist dein Familienbüro: Du erledigst hier den Papierkram für dich und deine Angehörigen.', 'Home Office هو مكتب العيلة تبعك: هون بتخلّص كل الأوراق إلك ولأهلك.')}</p>
      <ul class="ohsliste">${(AR ? ['كل أوراق العيلة بمكان واحد – منفصلة لكل شخص.', 'رسائل رسمية حسب DIN 5008 بقوالب جاهزة وتوقيعك والوكالة.', 'المهل والمواعيد والعقود والمالية دايماً قدامك – والتذكير كمان عالجوال.', 'الذكاء الاصطناعي (Gemini) بيقرا الرسائل والإيميلات والمسح وبيقترح شو ينكتب – بس بعد موافقتك.', 'كل البيانات بتضل على كمبيوترك.']
        : ['Alle Unterlagen deiner Familie an einem Ort – getrennt je Person.', 'Briefe nach DIN 5008 mit fertigen Vorlagen, deiner Unterschrift und der Vollmacht.', 'Fristen, Termine, Verträge und Finanzen im Blick – Erinnerungen auch aufs Handy.', 'Die KI (Gemini) liest Briefe, E-Mails und Scans und schlägt vor, was eingetragen wird – nur nach deiner Bestätigung.', 'Alle Daten bleiben auf deinem Computer.']).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p>${T('Die Einrichtung dauert etwa 10 Minuten. Du kannst jederzeit unterbrechen und später weitermachen.', 'الإعداد بياخد تقريباً 10 دقايق. فيك توقف بأي وقت وتكمّل بعدين.')}</p>
      <div class="banner blue">${icon('info')}<div>${T('Erst ausprobieren? Im Demo-Modus siehst du das Programm mit vielen Beispieldaten – deine echten Daten bleiben leer. Oben „Live“ bringt dich zurück zur Einrichtung.', 'بدك تجرّب أول؟ بالوضع التجريبي بتشوف البرنامج مع بيانات أمثلة كتير – وبياناتك الحقيقية بتضل فاضية. زر «Live» فوق بيرجعك للإعداد.')}</div></div>`,
      knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('demo', T('Erst die Demo ansehen', 'شوف التجريبي أول'), '', 'auge') + knopf('weiter', T('Einrichtung starten', 'ابدأ الإعداد'), 'pri'));
    else if (s === 'ich') { const me = S.settings.me;
      html = rahmen(`<h2>${T('Deine Daten', 'بياناتك')}</h2><p>${T('Du bist der Bevollmächtigte bzw. Absender. Diese Angaben stehen als Absender in deinen Briefen.', 'إنت الوكيل أو المرسل. هالمعلومات بتنكتب كمرسل برسائلك.')}</p>
        <div class="ohsform">${feld('suName', T('Vor- und Nachname', 'الاسم الكامل') + ' *', me.name)}${feld('suStreet', T('Straße und Hausnummer', 'الشارع ورقم البيت'), me.street)}${feld('suZip', T('PLZ', 'الرمز البريدي'), me.zip)}${feld('suCity', T('Ort', 'المدينة'), me.city)}${feld('suPhone', T('Telefon', 'التلفون'), me.phone)}${feld('suEmail', T('E-Mail', 'الإيميل'), me.email, 'email')}</div>`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri')); }
    else if (s === 'marke') {
      html = rahmen(`<h2>${T('Dein Programm: Name und Farben', 'برنامجك: الاسم والألوان')}</h2>
        <p>${T('Gib dem Programm deinen eigenen Namen und wähle deine vier Lieblingsfarben – oder tippe die Farbcodes ein. Du siehst die Änderung sofort im ganzen Programm. Später geht das jederzeit unter Einstellungen → Allgemein.', 'سمّي البرنامج باسمك واختار أربع ألوان بتحبهن – أو اكتب أكواد الألوان. بتشوف التغيير فوراً بكل البرنامج. وبعدين فيك تغيّر بأي وقت من الإعدادات ← عام.')}</p>
        ${window.ohFarben ? window.ohFarben.auswahlHTML() : ''}`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri'));
      setTimeout(() => { const b = el && el.querySelector('[data-ohf]'); if (b && window.ohFarben) window.ohFarben.binden(b, true); }, 0); }
    else if (s === 'personen') { su.liste = su.liste || [];
      html = rahmen(`<h2>${T('Für wen erledigst du Papierkram?', 'لمين بتخلّص الأوراق؟')}</h2><p>${T('Füge jede Person hinzu (auch mehrfach, z. B. zwei Töchter). Für jede bekommst du einen eigenen Bereich und einen Ordner.', 'ضيف كل شخص (حتى لو مكرر، مثلاً بنتين). كل واحد إلو قسم خاص ومجلد.')}</p>
        <div class="ohschips">${ROLLEN.map(r => `<button class="pill" data-su="add:${esc(r[0])}">+ ${esc(AR ? r[1] : r[0])}</button>`).join('')}<button class="pill" data-su="add:">+ ${T('Andere …', 'غير …')}</button></div>
        <div class="ohspers">${su.liste.length ? su.liste.map((x, i) => `<div class="ohsprow"><span class="dot" style="background:${FARBEN[i % FARBEN.length]}"></span><input data-rolle="${i}" value="${esc(x.role)}" placeholder="${T('Bezeichnung, z. B. Schwester', 'التسمية، مثلاً أخت')}">
          <select data-anrede="${i}">${['Herr', 'Frau', '—'].map(a => `<option ${x.salutation === a ? 'selected' : ''}>${a}</option>`).join('')}</select><button class="btn sm ghost" data-su="del:${i}" title="${T('Entfernen', 'إزالة')}">${icon('schliessen')}</button></div>`).join('')
          : `<div class="empty">${T('Noch niemand hinzugefügt.', 'لسا ما ضفت حدا.')}</div>`}</div>`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri')); }
    else if (s === 'person') { const p = S.persons[su.pi || 0]; if (!p) { su.schritt = 'ordner'; return zeichne(); }
      const vorher = S.persons.slice(0, su.pi || 0).find(x => x.street);
      html = rahmen(`<h2>${esc(AR ? rolleAr(p.role) : p.role)} <span class="small muted">(${(su.pi || 0) + 1} / ${S.persons.length})</span></h2>
        <p>${T('Diese Daten setzt Home Office automatisch in Briefe ein. Was du nicht weißt, kannst du leer lassen und später ergänzen.', 'هالبيانات البرنامج بيحطها لحالو بالرسائل. اللي ما بتعرفو خليه فاضي وكمّلو بعدين.')}</p>
        <div class="ohsform">${feld('pFirst', T('Vorname', 'الاسم'), p.firstName)}${feld('pLast', T('Nachname', 'الكنية'), p.lastName)}${feld('pBirth', T('Geburtsdatum', 'تاريخ الميلاد'), p.birth, 'date')}${feld('pPhone', T('Telefon', 'التلفون'), p.phone)}
          ${feld('pStreet', T('Straße und Hausnummer', 'الشارع ورقم البيت'), p.street)}${feld('pZip', T('PLZ', 'الرمز البريدي'), p.zip)}${feld('pCity', T('Ort', 'المدينة'), p.city)}${feld('pEmail', T('E-Mail', 'الإيميل'), p.email, 'email')}</div>
        ${vorher && !p.street ? `<button class="btn sm" data-su="adr">${T('Anschrift von ' + vorher.role + ' übernehmen', 'خد عنوان ' + rolleAr(vorher.role))}</button>` : ''}
        <div class="ohsordner"><b>${icon('dokumente')}${T('Ordner auf dem Computer', 'المجلد على الكمبيوتر')}</b>
          <p class="small">${T('Wo liegen die Unterlagen dieser Person? Home Office liest den Ordner (du entscheidest, was übernommen wird) und legt neue Dokumente dort als Kopie ab.', 'وين موجودة أوراق هالشخص؟ البرنامج بيقرا المجلد (وإنت بتقرر شو ينضاف) وبيحفظ فيه نسخة من المستندات الجديدة.')}</p>
          ${p.ordner ? `<div class="small" style="word-break:break-all"><b>${esc(p.ordner)}</b></div>` : `<div class="small muted">${T('Noch kein Ordner gewählt.', 'لسا ما اخترت مجلد.')}</div>`}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${knopf('owahl', p.ordner ? T('Anderen Ordner wählen', 'اختار مجلد تاني') : T('Vorhandenen Ordner wählen', 'اختار مجلد موجود'), 'sm')}${p.ordner ? '' : knopf('oneu', T('Neuen Ordner anlegen', 'اعمل مجلد جديد'), 'sm')}</div></div>`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri')); }
    else if (s === 'ordner') { const mit = S.persons.filter(p => p.ordner);
      html = rahmen(`<h2>${T('Vorhandene Unterlagen übernehmen', 'استيراد الأوراق الموجودة')}</h2>
        ${mit.length ? `<p>${T('In den Ordnern liegen vielleicht schon Unterlagen. Sieh sie dir an und wähle aus, was Home Office als Dokument übernehmen soll. Du kannst das auch später unter „Personen“ machen.', 'يمكن بالمجلدات في أوراق من قبل. شوفها واختار شو البرنامج ياخد كمستند. فيك تعمل هالشي بعدين من «Personen».')}</p>
          <div class="ohspers">${mit.map(p => `<div class="ohsprow"><span class="dot" style="background:${esc(p.color)}"></span><span class="grow"><b>${esc(AR ? rolleAr(p.role) : p.role)}</b><br><span class="small muted" style="word-break:break-all">${esc(p.ordner)}</span></span>
            <span class="small muted" data-ozahl="${p.id}">…</span><button class="btn sm" data-su="oimp:${p.id}">${T('Durchsehen', 'تصفّح')}</button></div>`).join('')}</div>`
          : `<p>${T('Du hast noch keinen Ordner gewählt – das geht jederzeit unter „Personen“.', 'لسا ما اخترت مجلد – فيك بأي وقت من «Personen».')}</p>`}`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri'));
      setTimeout(async () => { for (const p of mit) { const r = await OH.ordnerListe(p.ordner, 2000); const z = el && el.querySelector(`[data-ozahl="${p.id}"]`); if (!z) continue;
        const schon = new Set(S.documents.filter(d => d.personId === p.id && d.ordnerRel).map(d => d.ordnerRel)); const n = r && r.ok ? r.dateien.filter(f => !schon.has(f.rel) && !/^Home Office[\\/]/i.test(f.rel)).length : 0;
        z.textContent = n + T(' neue Dateien', ' ملف جديد'); } }, 30); }
    else if (s === 'gedaechtnis') {
      // Gedächtnis: Memory-Engine, Obsidian-Vault oder keins (dann nur die Personen-Ordner)
      const m = memCfg(), st = (typeof MEM !== 'undefined' && MEM.status) || null, wahl = su.gedaechtnis || (m.root ? (st && st.art) || 'memory' : '');
      const karte = (v, titel, text) => `<button class="ohsgwahl ${wahl === v ? 'on' : ''}" data-su="g:${v}"><b>${titel}</b><span class="small">${text}</span></button>`;
      let detail = '';
      if ((wahl === 'memory' || wahl === 'obsidian') && m.root) {
        if (st && st.ok) detail = `<p class="small" style="color:var(--ok)">✓ ${st.art === 'obsidian' ? T('Obsidian-Vault verbunden', 'Obsidian مربوط') : T('Memory verbunden', 'الذاكرة مربوطة')}: <b style="word-break:break-all">${esc(m.root)}</b></p>
          <p class="small">${T('Wähle für jede Person ihren Ordner darin. Home Office liest und schreibt für diese Person nur dort.', 'اختار لكل شخص المجلد تبعو جوّا. البرنامج بيقرا وبيكتب لهالشخص بس هونيك.')}</p>
          <div class="ohspers">${S.persons.map(p => `<div class="ohsprow"><span class="dot" style="background:${esc(p.color)}"></span><span class="grow"><b>${esc(AR ? rolleAr(p.role) : p.role)}</b><br><span class="small muted">${m.map[p.id] ? esc(memDirLabel(m.map[p.id])) : T('noch kein Ordner', 'لسا ما في مجلد')}</span></span>
            ${knopf('gdir:' + p.id, m.map[p.id] ? T('Ändern', 'غيّر') : T('Ordner wählen', 'اختار مجلد'), 'sm')}</div>`).join('')}</div>`;
        else detail = `<p class="small" style="color:var(--danger)">${esc((st && st.message) || T('Ordner nicht erreichbar.', 'المجلد مش موجود.'))}</p>`;
        detail += `<div style="margin-top:8px">${knopf('g:' + wahl, T('Anderen Ordner wählen', 'اختار مجلد تاني'), 'sm')}</div>`;
      } else if (wahl === 'ohne') detail = `<p class="small">${T('Gut – Home Office liest dann nur die Ordner, die du bei den Personen verbunden hast. Du kannst das Gedächtnis später unter Einstellungen → „Claude & Gedächtnis“ verbinden.', 'تمام – البرنامج بيقرا بس المجلدات اللي ربطتها مع الأشخاص. فيك تربط الذاكرة بعدين من الإعدادات.')}</p>`;
      html = rahmen(`<h2>${T('Gedächtnis verbinden?', 'نربط الذاكرة؟')}</h2>
        <p>${T('Home Office kann sich mit deinen Notizen verbinden: Beim Schreiben siehst du, was schon bekannt ist, und gesendete Briefe, E-Mails und Vorgänge werden dort festgehalten – auf Wunsch mit Erinnerung.', 'البرنامج بيقدر ينربط بملاحظاتك: وقت تكتب بتشوف شو معروف من قبل، والرسائل والإيميلات والملفات المبعوتة بتنحفظ هونيك – وإذا بدك مع تذكير.')}</p>
        <div class="ohsgrid">
          ${karte('memory', T('Mein Gedächtnis (Memory)', 'ذاكرتي (Memory)'), T('Ordner mit der Memory-Engine wählen.', 'اختار مجلد الـ Memory.'))}
          ${karte('obsidian', 'Obsidian', T('Einen Obsidian-Vault wählen. Notizen landen als Markdown im Ordner „Home Office“.', 'اختار Vault تبع Obsidian. الملاحظات بتنحفظ كـ Markdown بمجلد «Home Office».'))}
          ${karte('ohne', T('Ohne', 'بدون'), T('Nur die Ordner der Personen lesen – das reicht für den Anfang.', 'بس يقرا مجلدات الأشخاص – بيكفي بالبداية.'))}
        </div>
        ${wahl === 'obsidian' && !m.root ? `<p class="small">${T('Noch kein Obsidian? Kostenlos hier:', 'ما عندك Obsidian؟ ببلاش من هون:')} <a href="https://obsidian.md" target="_blank">obsidian.md</a></p>` : ''}
        ${detail}`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri')); }
    else if (s === 'verbindungen') {
      try { if (typeof kiRefresh === 'function') await kiRefresh(); if (typeof gRefreshStatus === 'function') await gRefreshStatus(); } catch (e) {}
      const k = (typeof KI !== 'undefined' && KI.status) || {}, g = (typeof GS !== 'undefined' && GS.status) || {};
      const karte = (ok, titel, text, su2) => `<div class="ohsverb"><span class="badge ${ok ? 'green' : 'amber'}">${ok ? T('eingerichtet', 'جاهز') : T('noch offen', 'لسا')}</span><b>${titel}</b><p class="small">${text}</p>${knopf(su2, ok ? T('Ansehen', 'عرض') : T('Jetzt einrichten', 'جهّز هلأ'), 'sm' + (ok ? '' : ' pri'))}</div>`;
      html = rahmen(`<h2>${T('Verbindungen', 'الربط')}</h2><p>${T('Damit Home Office für dich lesen und erinnern kann, verbindest du zwei Dienste von Google. Beides ist freiwillig – das Programm funktioniert auch ohne.', 'مشان البرنامج يقرا ويذكّرك، بتربط خدمتين من Google. الاتنين اختياري – البرنامج بيشتغل بدونهن كمان.')}</p>
        ${karte(k.hasKey, T('Gemini (KI liest Dokumente und E-Mails)', 'Gemini (الذكاء الاصطناعي بيقرا المستندات والإيميلات)'), T('Du brauchst einen API-Schlüssel aus Google AI Studio (aistudio.google.com). Für persönliche Daten die kostenpflichtige Stufe verwenden – in der kostenlosen darf Google Inhalte nutzen.', 'بدك مفتاح API من Google AI Studio (aistudio.google.com). للبيانات الشخصية استعمل الخطة المدفوعة – بالمجانية Google بيحق إلو يستعمل المحتوى.'), 'gemini')}
        ${karte(g.connected, T('Google Kalender (Termine aufs Handy)', 'تقويم Google (المواعيد عالجوال)'), T('Einmalig in der Google Cloud Console ein Projekt anlegen und eine Client-ID erstellen (Anleitung in den Einstellungen und in der Datei für Claude).', 'مرة وحدة بتعمل مشروع بـ Google Cloud Console وبتعمل Client-ID (الشرح بالإعدادات وبملف Claude).'), 'google')}
        <div class="banner blue">${icon('info')}<div>${T('Tipp: Lass dich von Claude Schritt für Schritt durch die Google-Einrichtung führen (Datei „ANLEITUNG_FUER_CLAUDE.md“).', 'نصيحة: خلي Claude يمشي معك خطوة خطوة بإعداد Google (ملف «ANLEITUNG_FUER_CLAUDE.md»).')}</div></div>`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri')); }
    else if (s === 'email') {
      let konten = []; try { konten = OH.mailKonten ? await OH.mailKonten() : []; } catch (e) {}
      const z = su.mailZeitraum || 'monat';
      html = rahmen(`<h2>${T('E-Mail verbinden', 'ربط الإيميل')}</h2>
        ${konten.length ? `<p>${T('Verbunden: ', 'مربوط: ')}<b>${esc(konten.map(k => k.user).join(', '))}</b></p>
          <p>${T('Welche E-Mails soll Home Office jetzt holen? Danach gehst du sie einzeln durch und entscheidest, was das Büro bearbeitet und was übersprungen wird.', 'أي إيميلات بدك البرنامج يجيب هلأ؟ بعدين بتمرق عليهن وحدة وحدة وبتقرر شو المكتب يشتغل عليه وشو يتخطى.')}</p>
          <div class="ohswahl klein">${[['woche', T('Letzte Woche', 'آخر أسبوع')], ['monat', T('Letzter Monat', 'آخر شهر')], ['jahr', T('Letztes Jahr', 'آخر سنة')], ['alle', T('Alle (neueste 1000)', 'الكل (أحدث 1000)')], ['keine', T('Keine – nur neue ab jetzt', 'ولا شي – بس الجديد من هلأ')]]
            .map(([v, l]) => `<label class="ohsradio"><input type="radio" name="suZeit" value="${v}" ${z === v ? 'checked' : ''}>${l}</label>`).join('')}</div>
          <div id="suMailStatus" class="small" style="margin-top:8px">${su.mailErgebnis ? esc(su.mailErgebnis) : ''}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${knopf('mholen', T('E-Mails holen', 'جيب الإيميلات'), 'pri', 'update')}${su.mailIds && su.mailIds.length ? knopf('mdurch', T('Jetzt einzeln durchgehen', 'امرق عليهن وحدة وحدة'), '', 'mail') : ''}</div>`
        : `<p>${T('Verbinde dein Postfach (z. B. mail.de, GMX, Gmail). Dafür brauchst du die E-Mail-Adresse und ein App-Passwort deines Anbieters – das Passwort wird verschlüsselt gespeichert.', 'اربط بريدك (مثلاً mail.de أو GMX أو Gmail). بدك عنوان الإيميل وكلمة سر تطبيق من الشركة – كلمة السر بتنحفظ مشفّرة.')}</p>
          ${knopf('mkonto', T('E-Mail-Konto verbinden', 'ربط حساب إيميل'), 'pri', 'mail')}<p class="small muted">${T('Du kannst diesen Schritt überspringen und später im Bereich „E-Mail“ verbinden.', 'فيك تتخطى هالخطوة وتربط بعدين من قسم «E-Mail».')}</p>`}`,
        knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('weiter', T('Weiter', 'التالي'), 'pri')); }
    else if (s === 'fertig') html = rahmen(`<h2>${T('Fertig – Home Office ist eingerichtet', 'خلصنا – البرنامج جاهز')}</h2>
      <p>${T('Im Rundgang zeigt dir Home Office jeden Bereich und erklärt, wofür er da ist und wie du ihn am besten nutzt. Hilfe zu jeder Seite gibt es jederzeit über „?“ oben rechts.', 'بالجولة البرنامج بيورجيك كل قسم وبيشرحلك لشو هو وكيف تستفيد منو بأحسن شكل. الشرح لكل صفحة موجود دايماً من زر «؟» فوق.')}</p>
      <ul class="ohsliste">${(AR ? ['ارفع مستند أو امسح ورقة – Gemini بيقرا وبيقترح.', 'اكتب أول رسالة من قالب.', 'نزّل نسخة احتياطية من وقت لوقت (الإعدادات ← النسخ والتحديث).', 'البرنامج بيشيك على تحديثات كل 10 دقايق وبينبّهك.']
        : ['Lade ein Dokument hoch oder scanne einen Brief – Gemini liest mit und schlägt vor.', 'Schreibe deinen ersten Brief aus einer Vorlage.', 'Lade ab und zu eine Sicherung herunter (Einstellungen → Sicherung & Update).', 'Home Office prüft alle 10 Minuten auf Updates und sagt dir Bescheid.']).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`,
      knopf('zurueck', T('Zurück', 'رجوع')) + '<span class="grow"></span>' + knopf('los', T('Direkt loslegen', 'ابدأ مباشرة')) + knopf('tour', T('Rundgang starten', 'ابدأ الجولة'), 'pri'));
    el.innerHTML = html;
  }

  function merkeFelder() {
    const su = setup(), s = su.schritt, v = id => (el.querySelector('#' + id) || {}).value;
    if (s === 'ich') Object.assign(S.settings.me, { name: (v('suName') || '').trim(), street: v('suStreet') || '', zip: v('suZip') || '', city: v('suCity') || '', phone: v('suPhone') || '', email: v('suEmail') || '' });
    if (s === 'personen') { (su.liste || []).forEach((x, i) => { const r = el.querySelector(`[data-rolle="${i}"]`), a = el.querySelector(`[data-anrede="${i}"]`); if (r) x.role = r.value.trim(); if (a) x.salutation = a.value; }); }
    if (s === 'person') { const p = S.persons[su.pi || 0]; if (p) Object.assign(p, { firstName: (v('pFirst') || '').trim(), lastName: (v('pLast') || '').trim(), birth: v('pBirth') || '', phone: v('pPhone') || '', street: v('pStreet') || '', zip: v('pZip') || '', city: v('pCity') || '', email: v('pEmail') || '' }); }
    if (s === 'email') { const r = el.querySelector('input[name=suZeit]:checked'); if (r) su.mailZeitraum = r.value; }
    save();
  }
  // Personenliste aus dem Assistenten übernehmen (frische Installation: Vorgaben „Vater/Mutter“ werden ersetzt, Daten bleiben erhalten)
  function personenAnlegen() {
    const su = setup(), alt = S.persons.slice(), neu = [];
    (su.liste || []).filter(x => x.role).forEach((x, i) => {
      const vorh = x.id && alt.find(p => p.id === x.id);
      const p = vorh || { id: (x.role === 'Vater' && !neu.some(n => n.id === 'p_vater')) ? 'p_vater' : (x.role === 'Mutter' && !neu.some(n => n.id === 'p_mutter')) ? 'p_mutter' : 'p_' + uid(),
        firstName: '', lastName: '', birth: '', street: '', zip: '', city: '', phone: '', email: '', taxId: '', pensionNo: '', healthInsurance: '', poaDate: '', poaScope: '', notes: '' };
      if (!vorh) { const a = alt.find(q => q.id === p.id); if (a) Object.assign(p, a); }
      p.role = x.role; p.salutation = x.salutation || 'Herr'; p.color = p.color && vorh ? p.color : FARBEN[i % FARBEN.length]; x.id = p.id; neu.push(p);
    });
    S.persons = neu; save();
  }
  async function aktion(a) {
    const su = setup(), s = su.schritt || 'sprache';
    if (a.startsWith('lang:')) { const l = a.slice(5); su.schritt = 'willkommen'; await sichern(); if ((window.OH_LANG || 'de') !== l && window.ohSetLang) return window.ohSetLang(l); return zeichne(); }
    if (a === 'pause') { merkeFelder(); verstecken(true); return; }
    if (a === 'demo') { merkeFelder(); await sichern(); if (typeof setMode === 'function') setMode('demo'); return; }
    if (a.startsWith('add:')) { merkeFelder(); const r = a.slice(4), d = ROLLEN.find(x => x[0] === r); su.liste = su.liste || []; su.liste.push({ role: r, salutation: d ? d[2] : '—' }); save(); zeichne();
      if (!r) setTimeout(() => { const i = el.querySelectorAll('[data-rolle]'); if (i.length) i[i.length - 1].focus(); }, 30); return; }
    if (a.startsWith('del:')) { merkeFelder(); su.liste.splice(Number(a.slice(4)), 1); save(); return zeichne(); }
    if (a === 'adr') { merkeFelder(); const p = S.persons[su.pi || 0], q = S.persons.slice(0, su.pi || 0).find(x => x.street); if (p && q) Object.assign(p, { street: q.street, zip: q.zip, city: q.city }); save(); return zeichne(); }
    if (a === 'owahl' || a === 'oneu') { merkeFelder(); const p = S.persons[su.pi || 0]; if (p) { if (a === 'owahl') await ordnerWaehlen(p); else await ordnerAnlegen(p); } return zeichne(); }
    if (a.startsWith('oimp:')) { const p = getPerson(a.slice(5)); if (p) ordnerImport(p, () => zeichne()); return; }
    if (a === 'g:ohne') { su.gedaechtnis = 'ohne'; memCfg().root = ''; if (typeof MEM !== 'undefined') MEM.status = null; save(); return zeichne(); }
    if (a === 'g:memory' || a === 'g:obsidian') {
      const art = a.slice(2); su.gedaechtnis = art; save();
      if (art === 'obsidian' && !memCfg().root) { zeichne(); }
      const r = OH.memPickRoot ? await OH.memPickRoot() : ''; if (!r) return zeichne();
      memCfg().root = r; save(); await memLoadStatus();
      const st = MEM.status;
      if (st && st.ok && st.art !== art) alert(art === 'obsidian' ? T('Das ist ein Memory-Ordner, kein Obsidian-Vault. Er wird trotzdem als Memory verbunden.', 'هاد مجلد Memory مش Vault تبع Obsidian. رح ينربط كـ Memory.') : T('Das ist ein Obsidian-Vault. Er wird als Obsidian verbunden.', 'هاد Vault تبع Obsidian. رح ينربط كـ Obsidian.'));
      if (st && st.ok) su.gedaechtnis = st.art;
      save(); return zeichne();
    }
    if (a.startsWith('gdir:')) { if (ACT.memPickDir) await ACT.memPickDir({ id: a.slice(5) }); return zeichne(); }
    if (a === 'gemini' || a === 'google') { verstecken(false); location.hash = '#/settings?tab=google'; return; }
    if (a === 'mkonto') { verstecken(false); location.hash = '#/mail'; return; }
    if (a === 'mholen') { merkeFelder(); const z = su.mailZeitraum || 'monat'; const st = el.querySelector('#suMailStatus');
      if (z === 'keine') { su.mailErgebnis = T('Keine alten E-Mails geholt – neue kommen ab jetzt stündlich.', 'ما جبت إيميلات قديمة – الجداد بيوصلو كل ساعة من هلأ.'); su.mailIds = []; save(); return zeichne(); }
      if (st) st.textContent = T('E-Mails werden geholt … das kann bei vielen E-Mails einige Minuten dauern.', 'عم جيب الإيميلات … إذا كتار ممكن ياخد كم دقيقة.');
      el.querySelectorAll('button').forEach(b => { b.disabled = true; });
      const r = window.EG ? await window.EG.mailsAbrufen(false, { seit: z, max: 1000 }) : { neu: 0 };
      su.mailIds = r.ids || []; su.mailErgebnis = (r.neu || 0) + T(' E-Mail(s) geholt', ' إيميل انجاب') + (r.gesamt && r.gesamt > (r.neu || 0) ? ' (' + T('von ', 'من ') + r.gesamt + ')' : '') + '.'; save(); return zeichne(); }
    if (a === 'mdurch') { if (window.EG && window.EG.durchgehen) window.EG.durchgehen(su.mailIds); return; }
    if (a === 'los' || a === 'tour') { su.fertig = true; su.fertigAm = new Date().toISOString(); delete su.liste; await sichern(); verstecken(false, true); location.hash = '#/dashboard'; if (a === 'tour') setTimeout(rundgang, 300); return; }
    // Weiter / Zurück
    if (a === 'weiter' || a === 'zurueck') {
      merkeFelder();
      if (a === 'weiter') {
        if (s === 'ich' && !S.settings.me.name) { alert(T('Bitte deinen Namen eingeben.', 'اكتب اسمك لو سمحت.')); return; }
        if (s === 'personen') { if (!(su.liste || []).some(x => x.role)) { alert(T('Bitte mindestens eine Person hinzufügen.', 'ضيف شخص واحد عالأقل.')); return; } personenAnlegen(); su.pi = 0; su.schritt = 'person'; save(); return zeichne(); }
        if (s === 'person' && (su.pi || 0) < S.persons.length - 1) { su.pi = (su.pi || 0) + 1; save(); return zeichne(); }
      } else {
        if (s === 'person' && (su.pi || 0) > 0) { su.pi--; save(); return zeichne(); }
        if (s === 'personen') { su.liste = su.liste || []; }
        if (s === 'ordner') { su.pi = Math.max(0, S.persons.length - 1); su.schritt = 'person'; save(); return zeichne(); }
      }
      const i = SCHRITTE.indexOf(s), n = SCHRITTE[Math.max(0, Math.min(SCHRITTE.length - 1, i + (a === 'weiter' ? 1 : -1)))];
      if (n === 'personen' && !(su.liste && su.liste.length)) su.liste = S.persons.filter(p => p.firstName || p.lastName).map(p => ({ id: p.id, role: p.role, salutation: p.salutation }));
      su.schritt = n; save(); zeichne();
    }
  }
  function verstecken(pause, fertig) {
    if (el) el.style.display = 'none'; document.body.classList.remove('ohsetup-an');
    if (fertig) { if (pill) pill.remove(); pill = null; return; }
    if (!pill) { pill = document.createElement('button'); pill.className = 'ohspill no-i18n'; pill.addEventListener('click', () => zeigen()); document.body.appendChild(pill); }
    pill.innerHTML = `${icon('einstellungen')}${pause ? T('Einrichtung fortsetzen', 'كمّل الإعداد') : T('Zurück zur Einrichtung', 'رجوع للإعداد')}`;
    pill.style.display = '';
  }
  function zeigen() {
    if (!offen()) return;
    if (!el) { el = document.createElement('div'); el.id = 'ohSetup'; el.className = 'ohsetup no-i18n'; document.body.appendChild(el);
      el.addEventListener('click', e => { const b = e.target.closest('[data-su]'); if (b && !b.disabled) aktion(b.dataset.su); }); }
    el.style.display = ''; document.body.classList.add('ohsetup-an'); if (pill) pill.style.display = 'none';
    zeichne();
  }
  // Start: nur Live-Modus, nur wenn noch nicht eingerichtet; beim Wechsel Demo → Live erneut prüfen
  function pruefen() {
    if (!window.OH_READY) return;
    const elAn = el && el.style.display !== 'none', pillAn = pill && pill.style.display !== 'none';
    if (offen()) { if (!elAn && !pillAn) { if (pill) pill.style.display = ''; else zeigen(); } }
    else { if (elAn) { el.style.display = 'none'; document.body.classList.remove('ohsetup-an'); } if (pillAn) pill.style.display = 'none'; }
  }
  (function warte() { if (!window.OH_READY) return setTimeout(warte, 300); pruefen(); setInterval(pruefen, 1500); })();
  window.ohEinrichtung = { zeigen, setup, rundgang, ordnerImport, neuStarten: () => { const su = setup(); su.fertig = false; su.schritt = 'willkommen'; save(); zeigen(); } };
})();
