/* Mitteilungszentrale (Glocke oben) und Fenster „Neu in dieser Version“.
   Mitteilungen liegen in S.mitteilungen (getrennt für Live/Demo), höchstens 200, neueste zuerst.
   Quellen: KI-Hinweise (noticeCard), Erinnerungen von Windows, Programm-Updates, Rückfragen des Büros, tägliche Fristen-Übersicht, neue Version.
   Läuft nach dem Hauptskript und nutzt dessen Globale (S, save, $, esc, icon, toast, render, BU, UPD …). */
(function () {
  /* ---------- Neuigkeiten je Version (neueste zuerst) ---------- */
  const NEU = [
    { v: '2.17.1', datum: '2026-11-25', de: [
        'Übersicht: Der Willkommens-Hinweis erscheint nur noch beim allerersten Start – nach der Einrichtung ist er weg.'
      ], ar: [
        'الصفحة الرئيسية: رسالة الترحيب بتطلع بس أول مرة بتشغّل البرنامج – بعد الإعداد بتختفي.'
      ] },
    { v: '2.17.0', datum: '2026-11-25', de: [
        'Neue Installation: Ein Assistent richtet Home Office Schritt für Schritt ein – Sprache, eigene Daten, Personen (Vater, Mutter, Ehefrau, Schwester …), je Person ein Ordner auf dem Computer, Gemini, Google Kalender und E-Mail.',
        'Ordner je Person: Home Office zeigt die vorhandenen Dateien, du wählst aus, was übernommen wird; neue Dokumente werden als Kopie dort abgelegt; die Frage-Leiste sucht auch im Ordner.',
        'E-Mail: beim Einrichten wählen, ab wann E-Mails geholt werden (Woche, Monat, Jahr, alle), und jede einzeln „Hinzufügen“ oder „Überspringen“ – auch später über „Einzeln durchgehen“.',
        'Hilfe: „?“ oben erklärt jede Seite; Rundgang durch alle Bereiche unter Einstellungen → Allgemein.',
        'Updates: Home Office sucht jetzt alle 10 Minuten nach einer neuen Version.',
        'Briefe: Langer Text geht sauber auf Seite 2 (und weiter) – Fußzeile und Unterschrift überlappen nicht mehr, Grußformel bleibt bei der Unterschrift, „Seite 1 von 2“; gilt für Vorschau, Drucken, PDF und E-Mail.',
        'Menü: Neben jedem Bereich steht, wie viele neue Einträge die Mitarbeiter eingetragen haben (z. B. „Kalender +2“). Beim Ansehen verschwindet die Zahl; bleibt etwas länger liegen, erinnert dich der zuständige Mitarbeiter im Büro.',
        'Dashboard: Statt „Fristen-Ausblick“ zeigt die Karte „Büro-Team“ alle Mitarbeiter in 3D mit ihrem Status.'
      ], ar: [
        'تثبيت جديد: معالج بيجهّز البرنامج خطوة خطوة – اللغة، بياناتك، الأشخاص (أب، أم، زوجة، أخت …)، مجلد لكل شخص على الكمبيوتر، Gemini، تقويم Google والإيميل.',
        'مجلد لكل شخص: البرنامج بيورجيك الملفات الموجودة وإنت بتختار شو ينضاف؛ المستندات الجديدة بتنحفظ نسخة منها هونيك؛ والـ Command بيدوّر كمان بالمجلد.',
        'الإيميل: وقت الإعداد بتختار من إيمتى تنجاب الإيميلات (أسبوع، شهر، سنة، الكل) وبتمرق عليهن وحدة وحدة «إضافة» أو «تخطي» – وكمان بعدين من «Einzeln durchgehen».',
        'الشرح: زر «؟» فوق بيشرح كل صفحة؛ والجولة بكل الأقسام من الإعدادات ← Allgemein.',
        'التحديثات: البرنامج صار يدوّر على نسخة جديدة كل 10 دقايق.',
        'الرسائل: النص الطويل بينتقل مرتب للصفحة 2 (وأكتر) – الفوتر والتوقيع ما عادو يتداخلو، والتحية بتضل مع التوقيع، و«Seite 1 von 2»؛ بالمعاينة والطباعة والـ PDF والإيميل.',
        'القائمة: جنب كل قسم بيطلع عدد المعلومات الجديدة اللي ضافها الموظفين (مثلاً «Kalender +2»). لما تشوفها بيختفي الرقم؛ وإذا ضلت مدة بدون ما تشوفها، الموظف المسؤول بيذكرك بالمكتب.',
        'لوحة المتابعة: بدل «Fristen-Ausblick» صار في بطاقة «Büro-Team» بتورجي كل الموظفين ثلاثي الأبعاد مع حالتهم.'
      ] },
    { v: '2.16.5', datum: '2026-11-25', de: [
        'Farbige Punkte „Neu aus dem Eingang“ stehen jetzt direkt vor dem Titel des Eintrags – im Kalender, bei Aufgaben, Dokumenten, Kontakten, Notizen und Finanzen.',
        'Google Kalender: Du kannst wählen, mit welchem Kalender Home Office abgleicht (Einstellungen → Kalender, Google & KI). Gibt es einen Kalender „Home Office“, wird er automatisch genommen und die bisherigen Termine werden dorthin verschoben – auf dem Handy erscheinen sie dann in diesem Kalender, Termine vom Handy kommen ins Programm.',
        'Einmal nötig: In den Einstellungen Google „Trennen“ und neu verbinden (für die Kalender-Auswahl).',
        'Eingang: Unter jeder Karte „Aufgabe hinzufügen“ – schreib, was zu tun ist (z. B. „Antwort schreiben, Unterlagen kommen bis Freitag“). Gemini entwirft den Brief, du liest ihn im Command und öffnest ihn als Brief.',
        'Brief-Editor: Neuer Knopf „Als E-Mail senden“ – der Brief kommt als PDF in den Anhang und sein Text in die E-Mail; den Empfänger trägst du selbst ein.'
      ], ar: [
        'النقاط الملونة «جديد من الوارد» صارت قبل عنوان البند مباشرة – بالتقويم والمهام والمستندات والعناوين والملاحظات والمالية.',
        'تقويم Google: صار فيك تختار مع أي تقويم بيتزامن البرنامج (الإعدادات ← Kalender, Google & KI). إذا في تقويم اسمو «Home Office» بينختار تلقائياً والمواعيد القديمة بتنتقل عليه – بتطلع على الجوال بهالتقويم، واللي بتكتبو من الجوال بيوصل للبرنامج.',
        'مرة وحدة لازم: بالإعدادات افصل Google («Trennen») وارجع اربطو (مشان اختيار التقويم).',
        'الوارد: تحت كل كرت «إضافة مهمة» – اكتب شو لازم ينعمل (مثلاً «اكتب رد، الأوراق بتوصل الجمعة»). Gemini بيكتب مسودة الرسالة، بتقراها بالـ Command وبتفتحها كرسالة.',
        'محرر الرسائل: زر جديد «إرسال كإيميل» – الرسالة بتنرفق PDF ونصها بينحط بالإيميل، والمستلم بتكتبو إنت.'
      ] },
    { v: '2.16.4', datum: '2026-11-25', de: [
        'E-Mail → Gesendet: Bilder und Dateien (z. B. PDF) in gesendeten E-Mails öffnen – mit Vorschaubildern, Bildbetrachter, „Als Dokument“ und eingebetteten Bildern wie im Posteingang.',
        'Die gesendete E-Mail wird beim Anklicken aus dem Postfach geladen und belegt keinen Platz im Programm.'
      ], ar: [
        'البريد ← المرسل: فتح الصور والملفات (متل PDF) بالإيميلات المرسلة – مع صور مصغرة وعارض صور و«كمستند» والصور المضمنة متل الوارد.',
        'الإيميل المرسل بينحمّل من البريد لما تضغط عليه وما بياخد مساحة بالبرنامج.'
      ] },
    { v: '2.16.3', datum: '2026-11-24', de: [
        'Punkte „Neu aus dem Eingang“ sitzen jetzt überall an derselben Stelle: am Anfang der Zeile (bei Notizen oben in der Ecke). Im Kalender bekommen auch Termine und Fristen ihren Punkt.',
        'Büro: Die Leuchtringe der Mitarbeiter verschwinden nicht mehr unter Teppichen und Bodenflächen.',
        'Büro: Das Namensschild steht über dem Status-Kristall statt davor.'
      ], ar: [
        'نقاط «جديد من الوارد» صارت بنفس المكان بكل الصفحات: ببداية السطر (وبالملاحظات بالزاوية فوق). وبالتقويم صار للمواعيد والمهل نقطتها كمان.',
        'المكتب: حلقات الضو تحت الموظفين ما عادت تختفي تحت السجاد والأرضيات.',
        'المكتب: يافطة الاسم صارت فوق كريستالة الحالة مش قدامها.'
      ] },
    { v: '2.16.2', datum: '2026-11-24', de: [
        'E-Mail: Bilder und Dateien in E-Mails öffnen – Anhänge als Kacheln mit Vorschaubild, Klick auf ein Foto öffnet den Bildbetrachter (mit Vor/Zurück), andere Dateien öffnen im Standardprogramm.',
        'Jeden Anhang mit einem Klick „Als Dokument“ ablegen.',
        'E-Mails werden mit ihrer Gestaltung und den eingebetteten Bildern angezeigt („Mit Bildern“ / „Nur Text“). Bilder aus dem Internet bleiben zum Schutz vor Zählpixeln blockiert, bis du „Bilder laden“ drückst.',
        'Behoben: Der Wechsel weg von „gemini-2.5-flash“ hat nicht geklappt, weil Google das alte Modell weiter in der Liste führt – jetzt wird es übersprungen und ein neueres Flash-Modell genommen. Die roten Einträge im Command werden automatisch neu gelesen.',
        'Behoben: Dieselbe E-Mail stand mehrfach in der Liste, wenn „Ans Büro“ öfter gedrückt wurde. Doppelte werden entfernt.'
      ], ar: [
        'البريد: فتح الصور والملفات داخل الإيميلات – المرفقات كبطاقات مع صورة مصغرة، الضغط على صورة يفتح عارض الصور (مع التالي/السابق)، والملفات الأخرى تفتح بالبرنامج الافتراضي.',
        'حفظ أي مرفق «كمستند» بضغطة واحدة.',
        'الإيميلات تظهر بتنسيقها وصورها المضمنة («مع الصور» / «نص فقط»). صور الإنترنت محجوبة للحماية من بكسلات التتبع حتى تضغط «تحميل الصور».',
        'إصلاح: التبديل من «gemini-2.5-flash» ما كان يشتغل لأن Google لسا بتعرض الموديل القديم بالقائمة – هلأ بيتخطاه وبياخد موديل Flash أحدث. البنود الحمرا بالـ Command بتنقرا من جديد تلقائياً.',
        'إصلاح: نفس الإيميل كان يطلع أكتر من مرة بالقائمة إذا انضغط «للمكتب» أكتر من مرة. المكرر بينحذف.'
      ] },
    { v: '2.16.1', datum: '2026-11-24', de: [
        'Gemini: Google hat das Modell „gemini-2.5-flash“ für neue Nutzer abgeschaltet. Home Office wählt jetzt automatisch das neueste Flash-Modell und wechselt selbst, wenn Google eins abschaltet.',
        'Dokumente, die daran gescheitert sind, werden automatisch noch einmal gelesen.',
        'E-Mail-Auswahl: „Alle auswählen“, markierte ans Büro geben oder „Nicht mehr fragen“ – gelöscht wird nichts, die E-Mails bleiben im Posteingang.',
        'E-Mail: neuer Ordner „Gesendet“ – zeigt deine verschickten E-Mails direkt aus dem Postfach (auch vom Handy oder Browser gesendete).'],
      ar: ['Gemini: جوجل وقّفت موديل «gemini-2.5-flash» للمستخدمين الجداد. البرنامج صار يختار لحالو أحدث موديل Flash، وبيغيّر لحالو إذا جوجل وقّفت موديل.', 'الملفات اللي فشلت بسبب هالشي بتنقرا مرة تانية لحالها.', 'اختيار الإيميلات: «تحديد الكل»، والمحدد بيروح للمكتب أو «ما عاد تسألني» – ما بينحذف شي، الإيميلات بتضل بالوارد.', 'الإيميل: مجلد جديد «Gesendet» بيعرض الإيميلات اللي بعتتها من الصندوق مباشرة (حتى اللي من الجوال أو المتصفح).'] },
    { v: '2.16.0', datum: '2026-11-24', de: [
        'E-Mail (mail.de): Postfach verbinden, Posteingang lesen, antworten und senden – Anhänge auch aus dem Programm.',
        'Eingangskette: E-Mail, Upload, Scan, Handy und Ordner gehen der Reihe nach durchs Büro – Briefkasten leuchtet, Sekretärin holt, Gemini liest.',
        'Nichts ohne dich: Zu jedem Eingang kommt eine Karte im Command mit allen vorgeschlagenen Schritten zum Abhaken (Termin, Frist, Zahlung, Unterlagen, Adressbuch, Notiz, Gedächtnis, Ablage).',
        'Die Sekretärin prüft das Postfach jede Stunde und fragt dich, welche E-Mails bearbeitet werden sollen.',
        'Farbpunkte: rot = wichtig, orange = Termin/Frist oder Ergänzung, grün = Bestätigung – am Command-Knopf und an jedem neuen Eintrag, bis du ihn öffnest.',
        'Knopf „Aktualisieren“ im Command: sucht neue E-Mails, Scans, Handy-Fotos und ungelesene Dateien.',
        'Demo-Modus: „Aufgabe probieren“ – ein Testbrief läuft sichtbar durchs Büro, mit Rückfragen, Karte zum Bestätigen und Demo-Gedächtnis; jederzeit neu startbar. Live bleibt unberührt.'],
      ar: ['الإيميل (mail.de): ربط الصندوق، قراءة الوارد، الرد والإرسال – والمرفقات كمان من البرنامج.',
        'سلسلة الوارد: الإيميل والرفع والسكان والجوال والمجلد بيمروا بالمكتب واحد ورا التاني – الصندوق بيضوي، السكرتيرة بتستلم، Gemini بيقرا.',
        'ما في شي بدونك: لكل وارد بطاقة بالـ Command فيها كل الخطوات المقترحة مع ✓ (موعد، مهلة، دفع، أوراق، دفتر العناوين، ملاحظة، ذاكرة، حفظ).',
        'السكرتيرة بتفحص البريد كل ساعة وبتسألك أي إيميلات تنعالج.',
        'نقاط ملونة: أحمر = مهم، برتقالي = موعد/مهلة أو إضافة، أخضر = تأكيد – على زر Command وجنب كل شي جديد لحد ما تفتحو.',
        'زر «تحديث» بالـ Command: بيدوّر على إيميلات وسكانات وصور جوال وملفات ما انقرت.',
        'وضع الديمو: «Aufgabe probieren» – رسالة تجريبية بتمرق قدامك بالمكتب، مع أسئلة وبطاقة تأكيد وذاكرة تجريبية، وفيك تعيد تشغيلها. الوضع الحقيقي ما بيتأثر.'] },
    { v: '2.15.2', datum: '2026-11-24', de: [
        'Briefkopf ohne doppelten Namen und doppelte Anschrift oben (in Einstellungen → Briefe wieder einschaltbar).',
        'Mit Internetmarke steht die Rücksendezeile jetzt in einer Zeile unter der Marke.'],
      ar: ['رأس الرسالة بدون تكرار الاسم والعنوان فوق (فيك ترجّعو من الإعدادات ← الرسائل).', 'مع طابع البريد، سطر عنوان المرسل صار بسطر واحد تحت الطابع.'] },
    { v: '2.15.1', datum: '2026-11-24', de: [
        'Fenster „Vorlage wählen“, Internetmarken und „Neu in Version“ mit sauberen Abständen; Suchfeld gestaltet.',
        'Gedächtnis-Kasten im Brief: Ordner der Person übersichtlich, Suchfeld über die ganze Breite.',
        'Dialoge liegen jetzt immer über dem Command-Knopf.'],
      ar: ['نوافذ «اختيار قالب» والطوابع و«الجديد بالنسخة» صارت مرتبة مع مسافات، وخانة البحث صار إلها شكل.', 'مربع الذاكرة بالرسالة: مجلد الشخص واضح وخانة البحث بعرض كامل.', 'النوافذ صارت دايماً فوق زر Command.'] },
    { v: '2.15.0', datum: '2026-11-24', de: [
        'Büro: leuchtende Zustände wie bei Swipii – Ring am Boden, Kristall und Bildschirme grün (arbeitet), orange (Pause), rot (außer Dienst, keine Aufgaben). Briefkasten leuchtet weiß, bis die Sekretärin die Post geholt hat.',
        'Seitenleiste einklappbar (Knopf oben neben dem Logo): nur Symbole – Maus drüber klappt sie auf, Maus weg wieder zu.',
        'Internetmarken-Vorrat: Marken-PDF einmal laden – die Marken werden erkannt und ausgeschnitten. Jeder Brief nimmt die nächste freie Marke, nach dem Drucken wird sie als „benutzt“ markiert. Druck in Originalgröße.',
        'Glocke oben: Mitteilungszentrale sammelt alle Hinweise – Erinnerungen, KI-Ergebnisse, Updates und Rückfragen des Büros.',
        'Nach jedem Update erscheint dieses Fenster mit den Neuerungen.',
        'Command (Strg+K): schwebender Knopf – Fragen ans Gedächtnis und an deine Dokumente, z. B. „Versichertennummer Mutter“, auch auf Arabisch. Nummern verdeckt, mit Kopieren.',
        'Command-Befehle mit Bestätigung: Frist anlegen, Brief mit Vorlage öffnen, Bereich öffnen. Datei hochladen landet beim richtigen Menschen und im Gedächtnis.',
        'Gemini merkt sich jetzt die wichtigen Nummern aus jedem Dokument (Versichertennummer, Aktenzeichen, IBAN …).',
        'Brief schreiben: 181 Vorlagen in 29 Kategorien mit Suche und Auswahlfenster.',
        'Gelbe Stellen in der Vorschau anklicken springt direkt zum passenden Feld.',
        'Gedächtnis: Jede Person hat ihren eigenen Ordner – gelesen und geschrieben wird nur dort.',
        'Personen: neues Feld „Andere Schreibweisen“ (z. B. arabisch مها) für die Suche.'],
      ar: [
        'المكتب: حالات متوهجة متل Swipii – حلقة عالأرض وكريستالة وشاشات خضرا (عم يشتغل)، برتقالي (استراحة)، أحمر (خارج الخدمة، ما في مهام). صندوق البريد بيضوي أبيض لحد ما السكرتيرة تفضّيه.',
        'القائمة الجانبية بتنطوي (زر فوق جنب اللوغو): بتضل الأيقونات بس – بتقرّب الماوس بتفتح، بتبعد بتسكر.',
        'مخزون طوابع البريد: بترفع PDF الطوابع مرة وحدة – البرنامج بيلاقي الطوابع وبيقصها. كل رسالة بتاخد الطابع الفاضي الجاي، وبعد الطباعة بيتعلّم «benutzt». بينطبع بحجمه الأصلي.',
        'جرس فوق: مركز الإشعارات بيجمع كل التنبيهات – التذكيرات، نتائج الذكاء الاصطناعي، التحديثات وأسئلة المكتب.',
        'بعد كل تحديث بتطلع هالنافذة وفيها الميزات الجديدة.',
        'Command (Strg+K): زر عايم – بتسأل الذاكرة ومستنداتك، مثلاً «شو رقم تأمين ماما». الأرقام مخفية ومعها زر نسخ.',
        'أوامر Command مع تأكيد: مهلة جديدة، رسالة بقالب، فتح قسم. رفع ملف بيروح للشخص الصح وللذاكرة.',
        'Gemini صار يحفظ الأرقام المهمة من كل مستند (رقم التأمين، Aktenzeichen، IBAN …).',
        'كتابة الرسائل: 181 قالب بـ 29 تصنيف مع بحث ونافذة اختيار.',
        'الكبس على الأماكن الصفرا بالمعاينة بياخدك عالخانة الصح.',
        'الذاكرة: لكل شخص مجلده الخاص – القراءة والكتابة فيه بس.',
        'الأشخاص: خانة جديدة «Andere Schreibweisen» (مثلاً مها بالعربي) للبحث.'] },
    { v: '2.14.0', datum: '2026-11-24', de: [
        'Logo immer oben rechts, Größe von Logo und Unterschrift einstellbar.',
        'Fußzeile für Briefe in den Einstellungen (Text und Farbe).',
        'Einstellungen in Abschnitten mit Seitenleiste.',
        'Vollmacht als PDF hochladen und als Google-Drive-Link automatisch unter jeden Brief setzen.'],
      ar: ['اللوغو دايماً فوق عاليمين، وحجمو وحجم التوقيع بينضبطوا من الإعدادات.', 'تذييل للرسائل بالإعدادات (النص واللون).', 'الإعدادات صارت أقسام مع قائمة عالجنب.', 'رفع الوكالة PDF ورابط Google Drive بينحط لحالو تحت كل رسالة.'] }
  ];
  window.OH_NEU = NEU;
  const vcmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
  const AR = () => (window.OH_LANG || 'de') === 'ar';

  /* ---------- Speicher ---------- */
  const TYP = { ki: ['ki', 'KI'], erinnerung: ['kalender', 'Erinnerung'], update: ['update', 'Update'], buero: ['alle', 'Büro'], frist: ['fristen', 'Fristen'], neu: ['info', 'Neu'], system: ['info', 'Hinweis'] };
  const liste = () => { if (!Array.isArray(S.mitteilungen)) S.mitteilungen = []; return S.mitteilungen; };
  const WARTE = [];
  function melden(m) {
    // Erst nach dem Laden der Daten speichern (sonst könnte der leere Anfangszustand gespeichert werden)
    if (!window.OH_READY) { WARTE.push(m); return; }
    const L = liste();
    if (m.key && L.some(x => x.key === m.key)) return;
    L.unshift({ id: uid(), at: new Date().toISOString(), typ: m.typ || 'system', title: String(m.title || '').slice(0, 160), lines: (m.lines || []).slice(0, 8).map(l => String(l).slice(0, 300)), link: m.link || '', key: m.key || '', read: false });
    if (L.length > 200) L.length = 200;
    save(); badge(); if (MZ.open) zeichnen();
  }
  window.ohMelden = melden;
  const ungelesen = () => liste().filter(m => !m.read).length;

  /* ---------- Glocke + Panel ---------- */
  const MZ = { open: false };
  const BELL = '<svg class="i" viewBox="0 0 24 24"><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.8H5z"/><path d="M10 20.3a2.1 2.1 0 0 0 4 0"/><circle cx="17.6" cy="5.6" r="2" fill="var(--icon-dot, #4F6785)" stroke="none"/></svg>';
  function aufbauen() {
    const top = document.querySelector('.top'), search = top && top.querySelector('.search'); if (!top) return;
    const b = document.createElement('button'); b.id = 'bell'; b.className = 'bell'; b.setAttribute('aria-label', 'Mitteilungen'); b.title = 'Mitteilungen';
    b.innerHTML = BELL + '<span class="bellcnt" id="bellcnt"></span>';
    if (search) search.after(b); else top.appendChild(b);
    const p = document.createElement('div'); p.id = 'mzPanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Mitteilungen'); document.body.appendChild(p);
    b.addEventListener('click', e => { e.stopPropagation(); MZ.open ? zu() : auf(); });
    document.addEventListener('click', e => { if (MZ.open && !e.target.closest('#mzPanel') && !e.target.closest('#bell')) zu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && MZ.open) zu(); });
    p.addEventListener('click', klick);
    window.addEventListener('resize', () => { if (MZ.open) lage(); });
    badge();
  }
  function badge() { const c = document.getElementById('bellcnt'); if (!c) return; const n = ungelesen(); c.textContent = n > 99 ? '99+' : n || ''; c.style.display = n ? '' : 'none'; document.getElementById('bell').classList.toggle('has', !!n); }
  function lage() { const b = document.getElementById('bell').getBoundingClientRect(), p = document.getElementById('mzPanel'), w = Math.min(400, window.innerWidth - 24);
    p.style.width = w + 'px'; p.style.top = (b.bottom + 8) + 'px';
    const rtl = document.documentElement.dir === 'rtl'; p.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, rtl ? b.left : b.right - w)) + 'px'; }
  function auf() { MZ.open = true; lage(); zeichnen(); document.getElementById('mzPanel').classList.add('on'); }
  function zu() { MZ.open = false; const p = document.getElementById('mzPanel'); if (p) p.classList.remove('on'); }
  const zeit = iso => { const d = new Date(iso), min = Math.round((Date.now() - d) / 60000);
    if (min < 1) return 'gerade eben'; if (min < 60) return 'vor ' + min + ' Min.'; if (min < 24 * 60 && d.toDateString() === new Date().toDateString()) return 'heute ' + d.toTimeString().slice(0, 5);
    return fmtDate(iso.slice(0, 10)) + ' ' + d.toTimeString().slice(0, 5); };
  function zeichnen() {
    const p = document.getElementById('mzPanel'); if (!p) return;
    const L = liste(), heute = new Date().toDateString();
    const g = [['Heute', L.filter(m => new Date(m.at).toDateString() === heute)], ['Früher', L.filter(m => new Date(m.at).toDateString() !== heute)]].filter(x => x[1].length);
    p.innerHTML = `<div class="mzhead"><b>${icon('info')}Mitteilungen</b><span class="grow"></span>${ungelesen() ? '<button class="btn sm" data-mz="alle">Alle gelesen</button>' : ''}${L.length ? '<button class="btn sm" data-mz="leeren" title="Alle löschen">' + icon('loeschen') + '</button>' : ''}</div>
      <div class="mzlist">${g.length ? g.map(([t, arr]) => `<div class="mzgrp">${t}</div>${arr.map(m => { const [ic, lab] = TYP[m.typ] || TYP.system;
        return `<div class="mzitem ${m.read ? '' : 'neu'} ${m.link ? 'link' : ''}" data-mz="item" data-id="${m.id}"><span class="mzic t-${esc(m.typ)}">${icon(ic)}</span><div class="grow"><div class="mzt">${esc(m.title)}</div>${m.lines.length ? `<ul>${m.lines.slice(0, 4).map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}<div class="small muted">${esc(lab)} · ${esc(zeit(m.at))}</div></div><button class="mzx" data-mz="weg" data-id="${m.id}" title="Entfernen">${icon('schliessen')}</button></div>`; }).join('')}`).join('')
        : `<div class="empty">${icon('info')}<div>Keine Mitteilungen.</div></div>`}</div>
      <div class="mzfoot"><button class="btn sm" data-mz="neu">${icon('info')}Was ist neu?</button><span class="grow"></span><a class="small" href="#/settings?tab=google" data-mz="zu">Erinnerungen einstellen</a></div>`;
  }
  function klick(e) {
    const b = e.target.closest('[data-mz]'); if (!b) return; const a = b.dataset.mz, L = liste();
    if (a === 'weg') { e.stopPropagation(); S.mitteilungen = L.filter(m => m.id !== b.dataset.id); save(); badge(); return zeichnen(); }
    if (a === 'alle') { L.forEach(m => m.read = true); save(); badge(); return zeichnen(); }
    if (a === 'leeren') { if (!confirm('Alle Mitteilungen löschen?')) return; S.mitteilungen = []; save(); badge(); return zeichnen(); }
    if (a === 'neu') { zu(); return neuFenster(null, true); }
    if (a === 'zu') return zu();
    if (a === 'item') { const m = L.find(x => x.id === b.dataset.id); if (!m) return; m.read = true; save(); badge();
      if (m.typ === 'neu') { zu(); return neuFenster(m.key ? m.key.replace(/^neu:/, '') : null, true); }
      if (m.link && m.link.startsWith('cmd:')) { zu(); if (window.ohCommand) window.ohCommand.karte(m.link.slice(4)); return; }
      if (m.link) { zu(); location.hash = m.link; } else zeichnen(); }
  }

  /* ---------- Fenster „Neu in dieser Version“ ---------- */
  function neuFenster(seit, alle) {
    const cur = NEU[0].v;
    // seit = zuletzt gesehene Version; ohne (erster Start mit dieser Funktion) nur die aktuelle Version
    const eintr = alle ? NEU.slice(0, 3) : seit ? NEU.filter(n => vcmp(n.v, seit) > 0) : NEU.slice(0, 1);
    if (!eintr.length) return;
    if (typeof closeModal === 'function') closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    const ar = AR();
    bg.innerHTML = `<div class="modal neuwin"><div class="neuhero"><span class="neulogo">${icon('update')}</span><div><div class="small muted">${ar ? 'تم التحديث' : 'Update installiert'}</div><h3>${ar ? 'الجديد بالنسخة ' : 'Neu in Version '}${esc(cur)}</h3></div></div>
      <div class="neulist">${eintr.map(n => `<div class="neuv"><div class="neuvh"><b>${esc(n.v)}</b><span class="small muted">${fmtDate(n.datum)}</span></div><ul>${(ar ? n.ar : n.de).map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="acts"><span class="sp"></span><button class="btn pri" data-neu="ok">${ar ? 'تمام' : 'Alles klar'}</button></div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-neu]')) bg.remove(); });
  }
  window.ohNeuFenster = neuFenster;
  async function neuPruefen() {
    let ver = NEU[0].v;
    try { if (window.officeHome && window.officeHome.version) ver = (await window.officeHome.version()) || ver; } catch (e) {}
    let seen = null; try { seen = localStorage.getItem('oh-neu-gesehen'); } catch (e) {}
    if (seen === ver) return;
    try { localStorage.setItem('oh-neu-gesehen', ver); } catch (e) {}
    if (!NEU.some(n => n.v === ver) && !(seen && NEU.some(n => vcmp(n.v, seen) > 0))) return;
    melden({ typ: 'neu', key: 'neu:' + (seen || ''), title: 'Neu in Version ' + ver, lines: (NEU.find(n => n.v === ver) || NEU[0]).de.slice(0, 3) });
    setTimeout(() => neuFenster(seen, false), 900);
  }

  /* ---------- Quellen ---------- */
  function quellen() {
    // KI-Hinweise und andere Karten unten rechts
    const orig = window.noticeCard;
    if (typeof orig === 'function') window.noticeCard = function (title, lines, acts) { try { melden({ typ: /KI|Gemini|gelesen|lesen/i.test(title) ? 'ki' : 'system', title, lines: lines || [], link: /Kalender|Termin|Frist/i.test((lines || []).join(' ')) ? '#/calendar' : '#/documents' }); } catch (e) {} return orig.apply(this, arguments); };
    if (window.officeHome) {
      // Erinnerungen, die Windows gezeigt hat
      if (window.officeHome.onReminder) window.officeHome.onReminder(r => melden({ typ: 'erinnerung', key: 'rem:' + (r.id || ''), title: r.title || 'Erinnerung', lines: r.body ? [r.body] : [], link: '#/calendar' }));
      // Updates
      if (window.officeHome.onUpdate) window.officeHome.onUpdate(d => {
        if (d.type === 'available') melden({ typ: 'update', key: 'upd:a:' + d.version, title: 'Neue Version ' + d.version + ' verfügbar', lines: ['Unter Einstellungen → Sicherung & Update installieren.'], link: '#/settings?tab=system' });
        if (d.type === 'downloaded') melden({ typ: 'update', key: 'upd:d:' + d.version, title: 'Update ' + d.version + ' ist bereit', lines: ['Zum Installieren Home Office neu starten.'], link: '#/settings?tab=system' });
      });
    }
    // Rückfragen des Büros (Zähler steigt)
    let letzte = 0;
    setInterval(() => {
      const n = (typeof BU !== 'undefined' && BU.fragen) || 0;
      if (n > letzte) melden({ typ: 'buero', title: n === 1 ? 'Das Büro hat eine Rückfrage' : 'Das Büro hat ' + n + ' Rückfragen', lines: ['Im Büro beantworten.'], link: '#/office', key: 'buero:' + today() + ':' + n });
      letzte = n;
    }, 6000);
    // Einmal am Tag: überfällige und heute fällige Fristen
    const taeglich = () => {
      if (!window.OH_READY) return setTimeout(taeglich, 1000);
      const T = today(); if (liste().some(m => m.key === 'tag:' + T + ':' + MODE)) return;
      const ueber = S.tasks.filter(t => !t.done && t.due && t.due < T), heute = S.tasks.filter(t => !t.done && t.due === T), term = (S.events || []).filter(e => !e.done && e.date === T);
      if (!ueber.length && !heute.length && !term.length) return;
      melden({ typ: 'frist', key: 'tag:' + T + ':' + MODE, title: 'Heute: ' + [ueber.length ? ueber.length + ' überfällig' : '', heute.length ? heute.length + ' Frist(en) fällig' : '', term.length ? term.length + ' Termin(e)' : ''].filter(Boolean).join(', '),
        lines: [...ueber, ...heute].slice(0, 4).map(t => (t.due < T ? 'überfällig: ' : '') + t.title).concat(term.slice(0, 3).map(e => (e.time ? e.time + ' ' : '') + e.title)), link: '#/tasks' });
    };
    setTimeout(taeglich, 4000); setInterval(taeglich, 30 * 60 * 1000);
  }

  function start() {
    aufbauen(); quellen();
    const bereit = () => { if (!window.OH_READY) return setTimeout(bereit, 300); WARTE.splice(0).forEach(melden); badge(); neuPruefen(); };
    setTimeout(bereit, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // Nach dem Laden des Zustands (Live/Demo-Wechsel) Zähler neu
  setInterval(badge, 3000);
})();
