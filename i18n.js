// Home Office – Arabische Oberfläche (Version 2.13).
// Übersetzt die sichtbare Bedienung (Texte, Platzhalter, Tooltips, Meldungen) von Deutsch nach Arabisch und schaltet auf
// Rechts-nach-links. Nicht übersetzt werden: Briefe/Vorlagen/Vorschau (bleiben Deutsch nach DIN 5008), Monatsbericht,
// eigene Eingaben (Titel, Notizen …) und Druck. Ziffern bleiben 0–9, Formate deutsch (24.11.2026, 12,50 €).
'use strict';
(function () {
const LANG = (() => { try { return localStorage.getItem('oh-lang') || 'de'; } catch (e) { return 'de'; } })();
window.OH_LANG = LANG;

/* ---------- Wörterbuch: genaue Texte ---------- */
const W = {
  // Menü und Kopf
  'Übersicht': 'نظرة عامة', 'Büro': 'المكتب', 'Dashboard': 'لوحة المتابعة', 'Kalender': 'التقويم', 'Statistik': 'الإحصائيات', 'Finanzen': 'المالية',
  'Arbeiten': 'العمل', 'Vorgänge': 'الملفات (Vorgänge)', 'Fristen & Aufgaben': 'المهل والمهام', 'Brief schreiben': 'كتابة رسالة', 'Dokumente': 'المستندات', 'Scanner': 'الماسح الضوئي',
  'Überblick behalten': 'المتابعة', 'Verträge & Fixkosten': 'العقود والتكاليف الثابتة', 'Konten & Vermögen': 'الحسابات والأملاك', 'Notizen': 'الملاحظات', 'Monatsbericht': 'التقرير الشهري',
  'Stammdaten': 'البيانات الأساسية', 'Personen & Vollmachten': 'الأشخاص والوكالات (Vollmachten)', 'Adressbuch': 'دفتر العناوين', 'Tresor': 'الخزنة', 'Einstellungen': 'الإعدادات',
  'Daten nur auf diesem Computer.': 'البيانات على هذا الحاسوب فقط.', 'Datensicherung': 'النسخ الاحتياطي', 'Alle': 'الكل', 'Live': 'حقيقي', 'Demo': 'تجريبي',
  'DEMO-MODUS · Beispieldaten': 'الوضع التجريبي · بيانات أمثلة', 'Neu erzeugen': 'إنشاء من جديد', 'Alles durchsuchen … (Enter)': 'ابحث في كل شيء … (Enter)',
  'Demo-Modus: Beispieldaten – deine echten Daten bleiben unberührt': 'الوضع التجريبي: بيانات أمثلة – بياناتك الحقيقية لا تتأثر', 'Live-Modus: deine echten Daten': 'الوضع الحقيقي: بياناتك الحقيقية',
  'Vater': 'الأب', 'Mutter': 'الأم', 'Allgemein': 'عام', 'Allgemein / beide': 'عام / كلاهما', 'Gespeichert': 'تم الحفظ',
  // Dashboard
  'Frist': 'مهلة', 'Vorgang': 'ملف', 'Dokument': 'مستند', 'Brief': 'رسالة', 'Überfällig': 'متأخرة', 'Offene Vorgänge': 'الملفات المفتوحة', 'Fixkosten / Monat': 'التكاليف الثابتة / شهر',
  'Aktivität': 'النشاط', 'Finanzen →': 'المالية ←', 'Fristen-Ausblick': 'نظرة على المهل', 'Alle Statistiken →': 'كل الإحصائيات ←', 'überf.': 'متأخر', 'diese W.': 'هذا الأسبوع',
  'Anstehende Fristen': 'المهل القادمة', 'alle anzeigen': 'عرض الكل', 'Vertrag': 'عقد', 'Details': 'التفاصيل', 'Vollmacht': 'وكالة (Vollmacht)', 'Nächste Frist': 'المهلة التالية',
  'Vermögen (Saldo)': 'الأملاك (الرصيد)', 'Zuletzt hinzugefügt': 'أُضيف مؤخراً', 'nicht eingetragen': 'غير مُدخلة', 'Noch nichts vorhanden': 'لا يوجد شيء بعد', 'Keine offenen Vorgänge': 'لا توجد ملفات مفتوحة',
  'Keine Fristen in den nächsten 30 Tagen 🎉': 'لا مهل خلال الـ 30 يوماً القادمة 🎉', 'Willkommen bei Home Office!': 'أهلاً بك في Home Office!', 'Jetzt sichern': 'احفظ نسخة الآن',
  'Noch keine Datensicherung erstellt.': 'لم تُنشأ نسخة احتياطية بعد.', 'Oder zuerst im Demo-Modus mit vielen Beispieldaten ausprobieren →': 'أو جرّب أولاً الوضع التجريبي مع بيانات كثيرة ←',
  'Trage zuerst': 'أدخل أولاً', 'deine eigenen Daten': 'بياناتك أنت', '(als Bevollmächtigter) und die': '(بصفتك الوكيل) و', 'Daten deiner Eltern': 'بيانات والديك', 'ein – dann werden Briefe automatisch richtig ausgefüllt.': '– عندها تُملأ الرسائل تلقائياً بشكل صحيح.',
  // Statistik
  'Wie läuft die Arbeit? Erledigtes, Pünktlichkeit, Dauer der Vorgänge und Wartezeiten – die Auswahl oben (Alle / Personen) gilt auch hier.': 'كيف يسير العمل؟ المنجز، الالتزام بالمواعيد، مدة الملفات وأوقات الانتظار – الاختيار في الأعلى (الكل / الأشخاص) ينطبق هنا أيضاً.',
  'vs Vormonat': 'مقارنة بالشهر السابق', 'Offene Aufgaben': 'المهام المفتوحة', 'Ø Dauer eines Vorgangs': 'متوسط مدة الملف', 'Ø Wartezeit auf Antwort': 'متوسط انتظار الرد',
  'Aufgaben: erledigt und neu': 'المهام: منجزة وجديدة', 'neu angelegt': 'أُنشئت حديثاً', 'Fristen: pünktlich oder verspätet': 'المهل: في وقتها أو متأخرة', 'pünktlich': 'في الوقت', 'verspätet': 'متأخرة',
  'Woche': 'أسبوع', 'Monat': 'شهر', 'Jahr': 'سنة', 'Aktivitäten': 'أنشطة', 'Erledigt': 'منجز', 'Briefe': 'الرسائل', 'Jahreslauf · Aktivität': 'مسار السنة · النشاط',
  'Vorgänge nach Status': 'الملفات حسب الحالة', 'offen': 'مفتوح', 'in Bearbeitung': 'قيد المعالجة', 'wartet auf Antwort': 'بانتظار الرد', 'erledigt': 'منجز',
  'Wartezeit / Dauer nach Behörde': 'الانتظار / المدة حسب الجهة', 'Tage': 'أيام', 'rosa = wartet gerade (Tage seit Status „wartet auf Antwort“), grün = Ø Dauer erledigter Vorgänge': 'وردي = ينتظر حالياً (أيام منذ حالة «بانتظار الرد»)، أخضر = متوسط مدة الملفات المنجزة',
  'Briefe und Dokumente': 'الرسائل والمستندات', 'Vergleich der Personen': 'مقارنة بين الأشخاص', 'offene Vorgänge': 'ملفات مفتوحة', 'Dokumente': 'المستندات',
  // Finanzen
  'Einnahmen, Ausgaben, Kontostand und Prognose – Verträge werden automatisch als Ausgabe gezählt.': 'الإيرادات والمصاريف والرصيد والتوقعات – العقود تُحسب تلقائياً كمصروف.',
  'Kontoauszug (CSV)': 'كشف حساب (CSV)', 'Buchung': 'قيد مالي', 'Saldo des Monats': 'رصيد الشهر', 'Einnahmen minus Ausgaben': 'الإيرادات ناقص المصاريف', 'Prognose Monatsende': 'التوقع لنهاية الشهر',
  'Kontostand & Prognose': 'الرصيد والتوقعات', 'Kontostand': 'الرصيد', 'Prognose': 'توقع', 'Ende': 'النهاية', 'Einnahmen & Ausgaben': 'الإيرادات والمصاريف', 'Einnahmen': 'الإيرادات', 'Ausgaben': 'المصاريف',
  'Ausgaben nach Kategorie': 'المصاريف حسب الفئة', 'Jahreslauf · Ausgaben': 'مسار السنة · المصاريف', 'Monatsschnitt': 'المتوسط الشهري', 'Jahr gesamt': 'مجموع السنة', 'Teuerster Monat': 'أغلى شهر',
  'Noch fällig bis Monatsende': 'مستحق حتى نهاية الشهر', 'Keine Einträge': 'لا توجد قيود', 'Verträge automatisch als Ausgabe zählen': 'احسب العقود تلقائياً كمصروف', 'Datum': 'التاريخ',
  'Empfänger / Beschreibung': 'المستفيد / الوصف', 'Kategorie': 'الفئة', 'Person': 'الشخص', 'Betrag': 'المبلغ', 'Import': 'استيراد',
  'Wohnen': 'السكن', 'Gesundheit & Pflege': 'الصحة والرعاية', 'Lebensmittel': 'المواد الغذائية', 'Bargeld': 'نقداً', 'Versicherungen': 'التأمينات', 'Verträge & Abos': 'العقود والاشتراكات',
  'Sonstiges': 'أخرى', 'Mobilität': 'التنقل', 'Behörden & Gebühren': 'الجهات الرسمية والرسوم', 'Gehalt': 'الراتب', 'Sozialleistung': 'معونة اجتماعية', 'Rente': 'التقاعد (Rente)',
  // Vorgänge
  'Jede Angelegenheit (Antrag, Bescheid, Streitfall …) als eigene Akte – mit Schritten, Fristen, Dokumenten, Briefen und Verlauf.': 'كل قضية (طلب، قرار (Bescheid)، نزاع …) كملف مستقل – مع الخطوات والمهل والمستندات والرسائل والسجل.',
  'Neuer Vorgang': 'ملف جديد', 'Offen': 'مفتوحة', 'Behörde / Stelle': 'الجهة / الدائرة', 'Aktenzeichen': 'رقم الملف (Aktenzeichen)', 'Fortschritt': 'التقدم', 'Status': 'الحالة',
  '← Vorgänge': 'الملفات →', 'Brief zu diesem Vorgang': 'رسالة لهذا الملف', 'Beschreibung': 'الوصف', 'Schritte': 'الخطوات', 'Hinzufügen': 'إضافة', 'Noch keine Briefe.': 'لا توجد رسائل بعد.',
  'Verlauf / Notizen': 'السجل / الملاحظات', 'Eintragen': 'تسجيل', 'Neuer Schritt …': 'خطوة جديدة …', 'z. B. Anruf beim Sachbearbeiter, Ergebnis …': 'مثلاً: اتصال بالموظف المسؤول، النتيجة …',
  'Pflegegrad beantragen': 'طلب درجة الرعاية (Pflegegrad)', 'Rentenantrag': 'طلب التقاعد (Rentenantrag)', 'Wohngeld beantragen': 'طلب بدل السكن (Wohngeld)', 'Schwerbehindertenausweis': 'بطاقة الإعاقة (Schwerbehindertenausweis)',
  'Umzug / Ummeldung': 'انتقال / تغيير العنوان (Ummeldung)', 'Weiterbewilligung Bürgergeld': 'تمديد المعونة (Weiterbewilligung Bürgergeld)', 'Zuzahlungsbefreiung Krankenkasse': 'إعفاء من المساهمة (Zuzahlungsbefreiung)', 'Vertrag kündigen': 'إلغاء عقد',
  // Fristen
  'Wiederkehrende Termine (z. B. jährliche Nachweise) mit ↻ werden nach dem Abhaken automatisch neu angesetzt.': 'المواعيد المتكررة (مثلاً الإثباتات السنوية) المعلّمة بـ ↻ تُجدول تلقائياً بعد إنجازها.',
  'In Kalender exportieren (.ics)': 'تصدير إلى التقويم (.ics)', 'Neue Frist': 'مهلة جديدة', 'Bearbeiten': 'تعديل', 'Später': 'لاحقاً', 'Kündigungsfristen von Verträgen': 'مهل إلغاء العقود',
  'Kündigung schreiben': 'كتابة إلغاء (Kündigung)', 'Offene': 'مفتوحة', 'ohne Datum': 'بدون تاريخ', 'heute': 'اليوم', 'morgen': 'غداً', 'überfällig': 'متأخرة',
  // Verträge
  'Laufzeiten und Kündigungsfristen werden automatisch berechnet – du wirst rechtzeitig erinnert.': 'المدد ومهل الإلغاء تُحسب تلقائياً – وستصلك تذكيرات في الوقت المناسب.', 'Neuer Vertrag': 'عقد جديد',
  'Fixkosten pro Monat': 'التكاليف الثابتة شهرياً', 'Pro Jahr': 'سنوياً', 'Aktive Verträge': 'العقود السارية', 'Per Lastschrift': 'بالخصم المباشر', 'Anbieter': 'المزوّد', 'Kundennr.': 'رقم العميل',
  '/ Monat': '/ شهر', 'Laufzeit bis': 'المدة حتى', 'Kündigen bis': 'الإلغاء حتى', 'unbefristet': 'غير محدد المدة', 'Kündigen': 'إلغاء', 'beendet': 'منتهٍ', 'Kündigungsfrist': 'مهلة الإلغاء',
  // Dokumente
  'Briefe von Behörden, Bescheide, Verträge, Vollmachten – gescannt oder als PDF.': 'رسائل الجهات الرسمية، القرارات (Bescheide)، العقود، الوكالات – ممسوحة أو كملف PDF.', 'Dokument hinzufügen': 'إضافة مستند',
  'Dateien hierher ziehen oder': 'اسحب الملفات إلى هنا أو', 'auswählen': 'اخترها', '· Tipp: Mit dem Handy scannen (z. B. Adobe Scan) und die PDF hier ablegen.': '· نصيحة: امسح بالهاتف (مثلاً Adobe Scan) وضع ملف PDF هنا.',
  'Alle Kategorien': 'كل الفئات', 'Titel': 'العنوان', 'Absender': 'المرسل', 'ohne Datei': 'بدون ملف', 'Suchen in Titel, Absender, Schlagwörtern …': 'ابحث في العنوان والمرسل والكلمات المفتاحية …', 'Herunterladen': 'تنزيل',
  'Behörde': 'جهة رسمية', 'Jobcenter / Sozialamt': 'مركز العمل / الشؤون الاجتماعية (Jobcenter / Sozialamt)', 'Krankenkasse': 'التأمين الصحي (Krankenkasse)', 'Pflegekasse': 'تأمين الرعاية (Pflegekasse)',
  'Finanzamt / Steuer': 'دائرة الضرائب (Finanzamt)', 'Bank': 'البنك', 'Versicherung': 'التأمين', 'Wohnen / Miete': 'السكن / الإيجار', 'Arzt / Medizin': 'الطبيب / الطب', 'Ausweis / Urkunde': 'الهوية / الوثائق',
  'Mit KI lesen: Termine, Fristen und Kontakte übernehmen': 'اقرأ بالذكاء الاصطناعي: نقل المواعيد والمهل وجهات الاتصال',
  // Konten, Notizen, Personen, Adressbuch
  'Bankkonten, Versicherungen, Rente, Immobilien, Fahrzeuge, Schulden – alles auf einen Blick.': 'الحسابات البنكية، التأمينات، التقاعد، العقارات، السيارات، الديون – كل شيء بنظرة واحدة.', 'Neuer Eintrag': 'إدخال جديد',
  'Saldo gesamt': 'الرصيد الكلي', 'Bezeichnung': 'التسمية', 'Institut': 'المؤسسة', 'Nummer': 'الرقم', 'Ansprechpartner': 'الشخص المسؤول', 'Wert': 'القيمة', 'Stand': 'بتاريخ',
  'Zugangsinfos, Telefonnotizen, Arzttermine, Wissenswertes …': 'معلومات الدخول، ملاحظات الهاتف، مواعيد الأطباء، معلومات مفيدة …', 'Neue Notiz': 'ملاحظة جديدة',
  'Die Daten werden automatisch in Briefe eingesetzt (Name, Geburtsdatum, Anschrift).': 'تُدرج البيانات تلقائياً في الرسائل (الاسم، تاريخ الميلاد، العنوان).', 'Person hinzufügen': 'إضافة شخص',
  'Name': 'الاسم', 'Geburtsdatum': 'تاريخ الميلاد', 'Anschrift': 'العنوان', 'Telefon / E-Mail': 'الهاتف / البريد الإلكتروني', 'Steuer-ID': 'الرقم الضريبي (Steuer-ID)', 'Rentenvers.-Nr.': 'رقم التأمين التقاعدي',
  'Vollmacht-Dokument': 'مستند الوكالة', 'Vollmacht hochladen': 'رفع الوكالة',
  'Tipp: Die Daten von Vater und Mutter bleiben getrennt. Über die Auswahl oben („Alle / Vater / Mutter“) siehst du jeweils nur die Unterlagen einer Person.': 'نصيحة: بيانات الأب والأم تبقى منفصلة. من الاختيار في الأعلى («الكل / الأب / الأم») ترى أوراق شخص واحد فقط.',
  'Behörden, Firmen und Privatpersonen – als Empfänger oder Absender für Briefe.': 'الجهات الرسمية والشركات والأفراد – كمستلمين أو مرسلين للرسائل.', 'Neuer Kontakt': 'جهة اتصال جديدة',
  'Behörden & Firmen': 'الجهات والشركات', 'Privatpersonen': 'الأفراد', 'Abteilung': 'القسم', 'Telefon': 'الهاتف', 'E-Mail': 'البريد الإلكتروني', '· privat': '· خاص', 'Name, Ort, Telefon …': 'الاسم، المدينة، الهاتف …',
  // Briefe (Bedienung arabisch, Inhalt bleibt deutsch)
  'Briefe nach DIN 5008 mit fertigen Vorlagen – Daten, Unterschrift und Vollmachtshinweis werden automatisch eingesetzt.': 'رسائل وفق DIN 5008 بقوالب جاهزة – البيانات والتوقيع وإشارة الوكالة تُدرج تلقائياً. (نص الرسالة يبقى بالألمانية)',
  'Neuer Brief': 'رسالة جديدة', 'Schnellstart mit Vorlage': 'بداية سريعة بقالب', 'Gespeicherte Briefe': 'الرسائل المحفوظة', 'Betreff': 'الموضوع', 'Empfänger': 'المستلم', 'Versand': 'الإرسال', 'Löschen': 'حذف',
  '← Briefe': 'الرسائل →', 'Als Vorlage speichern': 'حفظ كقالب', 'Speichern': 'حفظ', 'Drucken': 'طباعة', 'Als PDF speichern': 'حفظ كـ PDF', 'Ich schreibe …': 'أكتب …',
  'als Bevollmächtigter für eine Person': 'كوكيل عن شخص', 'im Namen der Person (Person ist Absender)': 'باسم الشخص (الشخص هو المرسل)', 'für mich selbst': 'لنفسي', 'Absender im Briefkopf': 'المرسل في ترويسة الرسالة',
  'Automatisch (passend zu „Ich schreibe …“)': 'تلقائي (حسب «أكتب …»)', '+ Neu': '+ جديد', 'Vorgang (optional)': 'الملف (اختياري)', 'Aus Kontakten': 'من جهات الاتصال', 'Anschrift (max. 6 Zeilen)': 'العنوان (6 أسطر كحد أقصى)',
  'Name, Anschrift, Telefon und E-Mail kommen aus Einstellungen, Personen oder Adressbuch. Unterschrift und Stempel nur, wenn du selbst Absender bist.': 'الاسم والعنوان والهاتف والبريد تأتي من الإعدادات أو الأشخاص أو دفتر العناوين. التوقيع والختم فقط إذا كنت أنت المرسل.',
  'Versandart (Vermerk)': 'طريقة الإرسال (ملاحظة)', 'Einschreiben Einwurf': 'بريد مسجّل (Einschreiben Einwurf)', 'Per E-Mail vorab': 'مسبقاً بالبريد الإلكتروني', 'Persönlich abgegeben': 'سُلّم شخصياً',
  'Ihr Zeichen / Aktenzeichen': 'إشارتكم / رقم الملف', 'Kunden- / Vertragsnummer': 'رقم العميل / العقد', 'Vorlage': 'القالب', '– Vorlage wählen –': '– اختر قالباً –', 'Anrede': 'التحية',
  'Text': 'النص', 'Platzhalter in {…} werden automatisch ausgefüllt. Stellen in […] gelb markiert = noch selbst ausfüllen.': 'الحقول بين {…} تُملأ تلقائياً. المواضع بين […] باللون الأصفر = املأها بنفسك.',
  'Grußformel': 'عبارة الختام', 'Anlagen (eine pro Zeile)': 'المرفقات (واحد في كل سطر)', '„Kopie der Vollmacht“ wird bei Vollmacht automatisch ergänzt.': '«نسخة من الوكالة» تُضاف تلقائياً عند الوكالة.',
  'Unterschrift einfügen': 'إدراج التوقيع', '(in Einstellungen hochladen)': '(ارفعه من الإعدادات)', 'Stempel einfügen': 'إدراج الختم', 'Internetmarke (Porto) im Adressfeld drucken': 'طباعة طابع البريد (Internetmarke) في حقل العنوان',
  'Internetmarke als Bild laden (PNG/JPG)': 'تحميل طابع البريد كصورة (PNG/JPG)', 'Vorschau': 'معاينة', 'Tipp: direkt im Brief klicken und schreiben': 'نصيحة: انقر داخل الرسالة واكتب مباشرة', 'Große Vorschau': 'معاينة كبيرة', 'Formular zeigen': 'عرض النموذج',
  'Internetmarke bei der Deutschen Post online kaufen, als Bild speichern und hier laden. Vor dem ersten Versand einmal Probe drucken und mit Fensterumschlag (DL) prüfen.': 'اشترِ طابع البريد من موقع Deutsche Post، احفظه كصورة وحمّله هنا. قبل أول إرسال اطبع تجربة وافحصها مع ظرف بنافذة (DL).',
  'Kopie': 'نسخة', 'Entwurf': 'مسودة',
  // Monatsbericht
  'Übersicht eines Monats zum Drucken oder als PDF – z. B. für die eigenen Unterlagen oder zur Abstimmung in der Familie. Die Auswahl oben (Alle / Vater / Mutter) gilt auch hier.': 'ملخص شهر للطباعة أو كملف PDF – مثلاً لأوراقك أو للتنسيق مع العائلة. الاختيار في الأعلى ينطبق هنا أيضاً. (التقرير نفسه بالألمانية)',
  'Ausdrucken': 'طباعة',
  // Einstellungen
  'Darstellung': 'المظهر', 'Hell': 'فاتح', 'Dunkel': 'داكن', 'System': 'حسب النظام', '„System“ folgt der Einstellung von Windows (hell oder dunkel). Briefe und Berichte bleiben immer auf weißem Papier.': '«حسب النظام» يتبع إعداد Windows (فاتح أو داكن). الرسائل والتقارير تبقى دائماً على ورق أبيض.',
  'Sprache der Bedienung': 'لغة الواجهة', 'Briefe, Vorlagen und Berichte bleiben immer Deutsch (DIN 5008).': 'الرسائل والقوالب والتقارير تبقى دائماً بالألمانية (DIN 5008).',
  'Meine Daten (Bevollmächtigter / Absender)': 'بياناتي (الوكيل / المرسل)', 'Vor- und Nachname': 'الاسم الأول والأخير', 'Straße und Hausnummer': 'الشارع ورقم المنزل', 'PLZ': 'الرمز البريدي', 'Ort': 'المدينة',
  'Wird automatisch als Absender in Briefe übernommen.': 'يُستخدم تلقائياً كمرسل في الرسائل.', 'Briefgestaltung': 'تصميم الرسالة', 'Schriftart': 'نوع الخط', 'Schriftgröße': 'حجم الخط', 'Datumsformat': 'صيغة التاريخ',
  'Falz- und Lochmarken': 'علامات الطي والتثقيب', 'anzeigen': 'إظهار', 'ausblenden': 'إخفاء', 'Standard-Grußformel': 'عبارة الختام الافتراضية', 'Sprache': 'لغة الرسالة', 'Deutsch': 'الألمانية',
  'Briefvorlage (Design)': 'قالب الرسالة (التصميم)', 'Gilt für alle Briefe. Anschriftfeld und Infoblock bleiben bei jedem Design nach DIN 5008 Form B, passend für Fensterumschläge.': 'ينطبق على كل الرسائل. حقل العنوان وكتلة المعلومات تبقى في كل تصميم وفق DIN 5008 نموذج B، مناسبة للأظرف ذات النافذة.',
  'Klassisch': 'كلاسيكي', 'Schlicht, Name fett oben links': 'بسيط، الاسم عريض أعلى اليسار', 'Modern': 'عصري', 'Name und Linie in Akzentfarbe': 'الاسم وخط باللون المميّز', 'Elegant': 'أنيق', 'Zentrierter Briefkopf mit Serifen': 'ترويسة في المنتصف بخط مذيّل',
  'Sachlich': 'رسمي', 'Behördenstil, Kopf rechtsbündig': 'أسلوب الجهات الرسمية، الترويسة يميناً', 'Farbband': 'شريط ملوّن', 'Farbiger Briefkopf über die ganze Breite': 'ترويسة ملونة بكامل العرض', 'Randlinie': 'خط جانبي', 'Farbige Linie am linken Rand': 'خط ملوّن على الحافة اليسرى',
  'Akzentfarbe (Modern, Farbband, Randlinie)': 'اللون المميّز (عصري، شريط ملوّن، خط جانبي)', 'Dunkelblau': 'أزرق داكن', 'Petrol': 'بترولي', 'Dunkelgrün': 'أخضر داكن', 'Bordeaux': 'خمري', 'Anthrazit': 'رمادي فحمي', 'Navy': 'كحلي',
  'Unterschrift & Stempel': 'التوقيع والختم', 'Unterschrift auf weißem Papier mit dunklem Stift, abfotografieren oder scannen, zuschneiden und hier laden (PNG mit transparentem Hintergrund ist ideal).': 'وقّع على ورق أبيض بقلم داكن، صوّره أو امسحه، قصّه وحمّله هنا (PNG بخلفية شفافة هو الأفضل).',
  'Unterschrift': 'التوقيع', 'keine': 'لا يوجد', 'Laden': 'تحميل', 'Entfernen': 'إزالة', 'entfernen': 'إزالة', 'Stempel / Siegel': 'الختم', 'keiner': 'لا يوجد', 'Erinnerungen': 'التذكيرات', 'Vertragskündigungen anzeigen (Tage vorher)': 'إظهار إلغاءات العقود (قبل بأيام)',
  'Kalender & KI': 'التقويم والذكاء الاصطناعي', 'Im Demo-Modus wird nichts an Google oder die KI geschickt. Für echte Daten oben auf „Live“ umschalten.': 'في الوضع التجريبي لا يُرسل شيء إلى Google أو الذكاء الاصطناعي. للبيانات الحقيقية بدّل في الأعلى إلى «حقيقي».',
  'Dokumente lesen (Google Gemini)': 'قراءة المستندات (Google Gemini)', 'kostenpflichtige Stufe': 'الباقة المدفوعة', 'kein Schlüssel': 'لا يوجد مفتاح', 'Schlüssel gespeichert': 'المفتاح محفوظ',
  'Jedes neue Dokument (Upload, Scanner, Handy) wird an Gemini geschickt. Termine, Fristen und Gültigkeiten landen im Kalender, Ansprechpartner im Adressbuch. Bitte die': 'كل مستند جديد (رفع، ماسح، هاتف) يُرسل إلى Gemini. المواعيد والمهل ومدد الصلاحية تذهب إلى التقويم، والأشخاص المسؤولون إلى دفتر العناوين. يُرجى استخدام',
  'von Google AI Studio nutzen – in der kostenlosen darf Google die Inhalte verwenden.': 'من Google AI Studio – في المجانية يحق لـ Google استخدام المحتوى.', 'Gemini-API-Schlüssel (aus aistudio.google.com)': 'مفتاح Gemini API (من aistudio.google.com)', 'Modell': 'النموذج',
  'jedes neue Dokument automatisch lesen': 'قراءة كل مستند جديد تلقائياً', 'Schlüssel löschen': 'حذف المفتاح', 'Google Kalender (beide Richtungen)': 'تقويم Google (بالاتجاهين)',
  'Termine aus Home Office erscheinen in deinem Google Kalender (und damit auf dem Handy mit Erinnerung); Termine aus Google erscheinen hier.': 'مواعيد Home Office تظهر في تقويم Google (وبالتالي على الهاتف مع تذكير)؛ ومواعيد Google تظهر هنا.',
  'Client-ID': 'معرّف العميل (Client-ID)', 'Clientschlüssel': 'سر العميل (Client secret)', 'Zugang speichern': 'حفظ بيانات الدخول', 'Mit Google verbinden': 'الربط مع Google', 'Jetzt abgleichen': 'مزامنة الآن', 'Trennen': 'فصل', 'verbunden': 'متصل', 'Zugang eingetragen': 'بيانات الدخول مُدخلة',
  'Windows meldet sich 1 Woche und 1 Tag vorher (bei Terminen mit Uhrzeit auch 1 Stunde vorher). Damit das auch bei geschlossenem Fenster klappt, läuft Home Office mit einem Symbol neben der Uhr weiter.': 'يُذكّرك Windows قبل أسبوع وقبل يوم (وللمواعيد ذات الساعة قبل ساعة أيضاً). ولكي يعمل ذلك والنافذة مغلقة، يبقى Home Office يعمل برمز بجانب الساعة.',
  'Beim Schließen im Hintergrund weiterlaufen': 'متابعة العمل في الخلفية عند الإغلاق', 'Mit Windows starten (unsichtbar)': 'التشغيل مع Windows (بشكل مخفي)', 'Claude-Anbindung (MCP)': 'ربط Claude (MCP)',
  'Claude Desktop oder Claude Code können Home Office lesen – mit deinem normalen Claude-Abo, ohne API-Schlüssel. Die Daten bleiben hier; Claude bekommt nur, was du in einer Unterhaltung abfragst.': 'يستطيع Claude Desktop أو Claude Code قراءة Home Office – باشتراكك العادي في Claude، بدون مفتاح API. البيانات تبقى هنا؛ ولا يحصل Claude إلا على ما تطلبه في المحادثة.',
  'Verbindung einschalten': 'تشغيل الاتصال', 'Claude darf eintragen (Aufgaben, Notizen, Verlauf, Briefentwürfe, Buchungen)': 'يُسمح لـ Claude بالإدخال (مهام، ملاحظات، سجل، مسودات رسائل، قيود)', 'aus': 'متوقف', 'an': 'يعمل',
  'Programm-Update': 'تحديث البرنامج', 'Installierte Version:': 'النسخة المثبّتة:', 'Nach Updates suchen': 'البحث عن تحديثات', 'Das Programm sucht beim Start automatisch nach einer neuen Version (Internet nötig).': 'يبحث البرنامج تلقائياً عند التشغيل عن نسخة جديدة (يلزم إنترنت).',
  '✓ Du hast die neueste Version.': '✓ لديك أحدث نسخة.', 'Suche nach Updates …': 'جارٍ البحث عن تحديثات …', 'Herunterladen und installieren': 'تنزيل وتثبيت', 'Jetzt installieren und neu starten': 'التثبيت وإعادة التشغيل الآن',
  'Gedächtnis (Memory)': 'الذاكرة (Memory)', 'Memory-Ordner:': 'مجلد الذاكرة:', 'nicht gewählt': 'غير محدد', 'Ordner wählen': 'اختيار مجلد', 'Verbindung trennen': 'قطع الاتصال', 'Suchen': 'بحث',
  'Verbindet Home Office mit deinem Gedächtnis: Beim Schreiben siehst du, was schon bekannt ist (Aktenzeichen, letzte Schreiben), und gesendete Briefe, E-Mails und Vorgänge werden mit Inhalt festgehalten – auf Wunsch mit Erinnerung.': 'يربط Home Office بذاكرتك: أثناء الكتابة ترى ما هو معروف (أرقام الملفات، آخر المراسلات)، وتُحفظ الرسائل والإيميلات والملفات المرسلة مع محتواها – مع تذكير عند الطلب.',
  'Alle Daten liegen': 'كل البيانات موجودة', 'nur auf diesem Computer': 'على هذا الحاسوب فقط', '(im Browser-Speicher dieses Programms). Erstelle regelmäßig eine Sicherung und speichere sie z. B. auf einem USB-Stick.': '(في ذاكرة هذا البرنامج). أنشئ نسخة احتياطية بانتظام واحفظها مثلاً على ذاكرة USB.',
  'Sicherung herunterladen': 'تنزيل النسخة الاحتياطية', 'Sicherung wiederherstellen': 'استعادة نسخة احتياطية', 'Alle Daten löschen': 'حذف كل البيانات', 'noch nie': 'أبداً',
  'öffnen und ein neues Projekt „Home Office“ anlegen.': 'افتحه وأنشئ مشروعاً جديداً باسم «Home Office».', 'aktivieren.': 'فعّله.', 'Extern': 'خارجي (External)', 'In Produktion': 'قيد الإنتاج (In production)', 'Desktop-App': 'تطبيق سطح المكتب (Desktop app)',
  'Client-ID und Clientschlüssel unten einfügen und „Mit Google verbinden“ klicken.': 'الصق معرّف العميل والسر في الأسفل وانقر «الربط مع Google».', ', Anwendungstyp': '، نوع التطبيق', ', App-Name „Home Office“, deine E-Mail. Danach den Status auf': '، اسم التطبيق «Home Office»، بريدك. بعدها اضبط الحالة على',
  'setzen (sonst läuft die Anmeldung nach 7 Tagen ab). Die Warnung „App nicht überprüft“ beim Verbinden mit „Erweitert → Weiter“ bestätigen – es ist deine eigene App.': '(وإلا تنتهي صلاحية الربط بعد 7 أيام). وعند تحذير «التطبيق غير موثّق» اختر «متقدم ← متابعة» – إنه تطبيقك أنت.',
  '„OAuth-Zustimmungsbildschirm“: Nutzertyp': '«شاشة الموافقة OAuth»: نوع المستخدم', '„APIs und Dienste“ → „Bibliothek“ →': '«APIs والخدمات» ← «المكتبة» ←', '„Anmeldedaten“ → „Anmeldedaten erstellen“ →': '«بيانات الاعتماد» ← «إنشاء بيانات اعتماد» ←',
  // Tresor
  'Zugangsdaten für Banken, Ämter und Websites – verschlüsselt mit deinem Hauptpasswort.': 'بيانات الدخول للبنوك والدوائر والمواقع – مشفّرة بكلمة المرور الرئيسية.', 'Tresor einrichten': 'إعداد الخزنة', 'Wähle ein': 'اختر', 'Hauptpasswort': 'كلمة مرور رئيسية',
  'niemand': 'لا أحد', 'den Tresor öffnen – auch nicht bei Diebstahl des Computers.': 'يستطيع فتح الخزنة – حتى عند سرقة الحاسوب.', 'Hauptpasswort wiederholen': 'كرّر كلمة المرور الرئيسية', 'Tresor anlegen': 'إنشاء الخزنة',
  'Tresor entsperren': 'فتح الخزنة', 'Entsperren': 'فتح', 'Jetzt sperren': 'اقفل الآن',
  // Scanner
  'Briefe mit Drucker, Handy oder aus Dateien erfassen – jede Sendung wird ein PDF und kann direkt als Dokument abgelegt werden.': 'التقط الرسائل بالطابعة أو الهاتف أو من الملفات – كل رسالة تصبح PDF ويمكن حفظها مباشرة كمستند.',
  'Mit Drucker scannen': 'المسح بالطابعة', 'Mit Handy scannen': 'المسح بالهاتف', 'Dateien hinzufügen': 'إضافة ملفات', 'Neue Seiten verarbeiten als': 'معالجة الصفحات الجديدة كـ', 'Dokument (schwarz-weiß, klar)': 'مستند (أبيض وأسود، واضح)',
  'Graustufen': 'تدرّج رمادي', 'Farbe': 'ألوان', 'Überwachter Ordner (z. B. Scan-Ordner des Druckers oder OneDrive)': 'مجلد مراقَب (مثلاً مجلد مسح الطابعة أو OneDrive)', 'Aus': 'إيقاف',
  'Neue PDFs/Fotos dort kommen automatisch hierher und werden danach in den Unterordner „importiert“ verschoben.': 'ملفات PDF والصور الجديدة هناك تأتي تلقائياً إلى هنا ثم تُنقل إلى المجلد الفرعي «importiert».',
  'Dateien (Fotos oder PDF) hierher ziehen': 'اسحب الملفات (صور أو PDF) إلى هنا', 'Noch nichts gescannt. Wähle oben Drucker, Handy oder Dateien.': 'لم يُمسح شيء بعد. اختر في الأعلى الطابعة أو الهاتف أو الملفات.',
  'PDF ansehen': 'عرض PDF', 'Weitere Seite scannen': 'مسح صفحة أخرى', 'Als Dokument ablegen': 'حفظ كمستند', 'Verbindung beenden': 'إنهاء الاتصال', 'Handy verbinden': 'ربط الهاتف',
  // Kalender
  'Termine, Fristen, Kündigungen und Zahlungen – für alle Personen': 'المواعيد والمهل والإلغاءات والدفعات – لكل الأشخاص', 'Demo – kein Google-Abgleich': 'تجريبي – بدون مزامنة Google', 'Termin': 'موعد',
  'Liste': 'قائمة', 'ganztags': 'طوال اليوم', 'Diese Woche': 'هذا الأسبوع', 'Was ist zu tun:': 'المطلوب:', 'aus Dokument erkannt': 'مُستخرج من مستند', 'Nächste Woche': 'الأسبوع القادم', 'für alle': 'للجميع',
  'Farben': 'الألوان', 'Frist / Aufgabe': 'مهلة / مهمة', 'Zahlung': 'دفعة', 'aus Dokument (KI)': 'من مستند (ذكاء اصطناعي)', 'Heute': 'اليوم', 'zurück': 'رجوع', 'weiter': 'التالي', 'Als Nächstes': 'التالي',
  'Feste Zahlung': 'دفعة ثابتة', 'ohne Erinnerung': 'بدون تذكير', 'Google Kalender verbinden': 'ربط تقويم Google', 'Google Kalender': 'تقويم Google', 'Termin anlegen': 'إنشاء موعد', 'Neuer Termin': 'موعد جديد', 'Termin bearbeiten': 'تعديل الموعد',
  'Im Kalender ansehen': 'عرض في التقويم', 'Keine Termine und Fristen in den nächsten 4 Monaten.': 'لا مواعيد ولا مهل خلال الأشهر الأربعة القادمة.', 'Offen in 30 Tagen': 'مفتوح خلال 30 يوماً', 'Gleiche ab …': 'جارٍ المزامنة …',
  'Abweichende Kontaktdaten': 'بيانات اتصال مختلفة', 'Markierte übernehmen': 'اعتماد المحدد',
  // Formulare
  'Abbrechen': 'إلغاء', 'Art': 'النوع', 'Anrede (nur bei Privatperson)': 'التحية (للأفراد فقط)', 'Name (Behörde / Firma oder Vor- und Nachname)': 'الاسم (الجهة / الشركة أو الاسم الكامل)', 'Abteilung / Stelle': 'القسم / الدائرة',
  'Ansprechpartner/in': 'الشخص المسؤول', 'erscheint als „z. Hd. …“': 'يظهر كـ «z. Hd. …» (عناية)', 'Straße / Postfach': 'الشارع / صندوق البريد', 'Fax': 'فاكس', 'Behörde / Firma': 'جهة رسمية / شركة', 'Privatperson': 'فرد',
  'Titel des Vorgangs': 'عنوان الملف', 'Aktenzeichen / Geschäftszeichen': 'رقم الملف (Aktenzeichen)', 'Priorität': 'الأولوية', 'Begonnen am': 'بدأ في', 'Schritte-Vorlage (optional)': 'قالب الخطوات (اختياري)', 'normal': 'عادية', 'hoch': 'عالية', 'niedrig': 'منخفضة',
  'Neue Aufgabe / Frist': 'مهمة / مهلة جديدة', 'Aufgabe / Frist': 'المهمة / المهلة', 'Fällig am': 'مستحق في', 'Wiederholen': 'التكرار', 'nein': 'لا', 'monatlich': 'شهرياً', 'vierteljährlich': 'كل ثلاثة أشهر', 'halbjährlich': 'كل ستة أشهر', 'jährlich': 'سنوياً',
  'Aufgabe bearbeiten': 'تعديل المهمة', 'Vorgang bearbeiten': 'تعديل الملف', 'Kontakt bearbeiten': 'تعديل جهة الاتصال', 'Vertrag bearbeiten': 'تعديل العقد', 'Eintrag bearbeiten': 'تعديل الإدخال', 'Notiz bearbeiten': 'تعديل الملاحظة', 'Person bearbeiten': 'تعديل الشخص', 'Dokument bearbeiten': 'تعديل المستند',
  'Strom': 'كهرباء', 'Gas': 'غاز', 'Wasser': 'ماء', 'Internet / Telefon': 'إنترنت / هاتف', 'Mobilfunk': 'هاتف محمول', 'Miete': 'إيجار', 'Rundfunkbeitrag': 'رسوم البث (Rundfunkbeitrag)', 'Abo / Streaming': 'اشتراك / بث', 'Fitness / Verein': 'رياضة / نادٍ', 'Kredit': 'قرض',
  'Kontakt (für Kündigung)': 'جهة الاتصال (للإلغاء)', 'Kunden- / Vertragsnummer ': 'رقم العميل / العقد', 'Zahlungsart': 'طريقة الدفع', 'Lastschrift': 'خصم مباشر', 'Überweisung': 'تحويل', 'Dauerauftrag': 'أمر دائم', 'Betrag (€)': 'المبلغ (€)', 'Zahlungsintervall': 'دورية الدفع',
  'Vertragsbeginn': 'بداية العقد', 'leer = unbefristet / jederzeit kündbar': 'فارغ = غير محدد / قابل للإلغاء في أي وقت', 'Kündigungsfrist (Monate)': 'مهلة الإلغاء (بالأشهر)', 'Verlängert sich um (Monate)': 'يتجدد لمدة (بالأشهر)', '0 = endet automatisch': '0 = ينتهي تلقائياً', 'Vertrag ist beendet / gekündigt': 'العقد منتهٍ / مُلغى',
  'Bankkonto': 'حساب بنكي', 'Sparkonto / Depot': 'حساب توفير / محفظة', 'Rente / Altersvorsorge': 'تقاعد / ادخار للشيخوخة', 'Immobilie': 'عقار', 'Fahrzeug': 'مركبة', 'Wertgegenstand': 'غرض ثمين', 'Schulden / Kredit': 'ديون / قرض',
  'Bank / Institut / Gesellschaft': 'البنك / المؤسسة / الشركة', 'IBAN / Nummer / Kennzeichen': 'IBAN / رقم / لوحة', 'Wert (€)': 'القيمة (€)', 'Schulden als negativer Wert': 'الديون كقيمة سالبة', 'Ansprechpartner / Telefon': 'الشخص المسؤول / الهاتف', 'Stand vom': 'بتاريخ',
  'Inhalt': 'المحتوى', 'Oben anheften': 'تثبيت في الأعلى', 'Datei (PDF, Bild …)': 'ملف (PDF، صورة …)', 'Datum des Schreibens': 'تاريخ الرسالة', 'Frist im Schreiben': 'المهلة في الرسالة', 'Frist als Aufgabe anlegen': 'إنشاء المهلة كمهمة',
  'Schlagwörter': 'كلمات مفتاحية', 'durch Komma getrennt': 'مفصولة بفاصلة', 'Notizen / Inhalt in Kürze': 'ملاحظات / المحتوى باختصار', 'Datei ersetzen (optional)': 'استبدال الملف (اختياري)',
  'Uhrzeit (leer = ganztägig)': 'الساعة (فارغ = طوال اليوم)', 'Für wen': 'لمن', 'Frist / Abgabe': 'مهلة / تسليم', 'Was ist zu tun / Notiz': 'المطلوب / ملاحظة', 'z. B. was mitbringen, einreichen oder vorbereiten': 'مثلاً: ما يجب إحضاره أو تقديمه أو تحضيره',
  'Ort / Raum': 'المكان / الغرفة', 'Dauer': 'المدة', 'Stelle / Kontakt': 'الجهة / جهة الاتصال', 'Neue Buchung': 'قيد جديد', 'Ausgabe': 'مصروف', 'Einnahme': 'إيراد', 'Konto': 'الحساب', 'Empfänger / Auftraggeber': 'المستفيد / الآمر',
  'Beschreibung / Verwendungszweck': 'الوصف / الغرض', 'Bezeichnung (z. B. Vater)': 'التسمية (مثلاً الأب)', 'Vorname': 'الاسم الأول', 'Nachname': 'اسم العائلة', 'Rentenversicherungsnummer': 'رقم التأمين التقاعدي (Rentenversicherungsnummer)',
  'Krankenkasse & Versichertennummer': 'التأمين الصحي ورقم المؤمَّن', 'Vollmacht vom': 'الوكالة بتاريخ', 'Umfang der Vollmacht': 'نطاق الوكالة', 'z. B. Generalvollmacht, Behörden, Bank': 'مثلاً: وكالة عامة، الجهات الرسمية، البنك', 'Herr': 'السيد', 'Frau': 'السيدة', '—': '—',
  'Neue Person': 'شخص جديد', 'Person hinzufügen ': 'إضافة شخص', 'Neuer Kontakt ': 'جهة اتصال جديدة', 'Wirklich löschen?': 'هل تريد الحذف فعلاً؟', 'schließen': 'إغلاق', 'Mehr': 'المزيد',
  // Büro-Platzhalter
  'Das Büro läuft in einem eigenen Fenster': 'المكتب يعمل في نافذة مستقلة', 'Büro-Fenster nach vorne holen': 'إحضار نافذة المكتب إلى الأمام', 'Zurück ins Programm holen': 'إعادته إلى البرنامج',
  'Du kannst das Fenster auf einen anderen Bildschirm ziehen und dort groß machen. Home Office merkt sich Bildschirm, Position und Größe für das nächste Mal.': 'يمكنك سحب النافذة إلى شاشة أخرى وتكبيرها هناك. يتذكر Home Office الشاشة والموضع والحجم للمرة القادمة.',
  'Die Mitarbeiter arbeiten dort weiter mit deinen Daten – Rückfragen erscheinen im Büro-Fenster und als Zahl neben „Büro“ hier im Menü.': 'يواصل الموظفون العمل هناك ببياناتك – والأسئلة تظهر في نافذة المكتب وكرقم بجانب «المكتب» في القائمة هنا.',
  // Meldungen
  'Fristen kannst du unter „Fristen & Aufgaben“ als .ics-Datei in deinen Kalender (Outlook, Google, Apple) übernehmen – mit Erinnerung 2 Tage vorher.': 'يمكنك نقل المهل من «المهل والمهام» كملف .ics إلى تقويمك (Outlook، Google، Apple) – مع تذكير قبل يومين.',
  '– am besten 3–4 Wörter, z. B. „Birne-Fahrrad-Wolke-7“. Ohne dieses Passwort (oder den Wiederherstellungsschlüssel) kann': '– والأفضل 3–4 كلمات، مثلاً «Birne-Fahrrad-Wolke-7». بدون كلمة المرور هذه (أو مفتاح الاستعادة)',
  'Der Scanner (PDF-Erstellung, Drucker, Handy) funktioniert nur im installierten Home-Office-Programm.': 'الماسح (إنشاء PDF، الطابعة، الهاتف) يعمل فقط في برنامج Home Office المثبّت.',
  'Drucken / PDF': 'طباعة / PDF', 'Einschreiben': 'بريد مسجّل (Einschreiben)', 'Einschreiben mit Rückschein': 'بريد مسجّل مع إشعار استلام (Rückschein)', 'Per Fax vorab': 'مسبقاً بالفاكس', '(ohne Betreff)': '(بدون موضوع)',
  'Brief löschen?': 'حذف الرسالة؟', 'Vorlage löschen?': 'حذف القالب؟', 'Diese Seite löschen?': 'حذف هذه الصفحة؟', 'Erledigt': 'تم', 'Keine Datei hinterlegt': 'لا يوجد ملف مرفق', 'Sicherung erstellt': 'تم إنشاء النسخة الاحتياطية'
};
/* Wochentage, Monate */
const MON = { 'Januar': 'يناير', 'Februar': 'فبراير', 'März': 'مارس', 'April': 'أبريل', 'Mai': 'مايو', 'Juni': 'يونيو', 'Juli': 'يوليو', 'August': 'أغسطس', 'September': 'سبتمبر', 'Oktober': 'أكتوبر', 'November': 'نوفمبر', 'Dezember': 'ديسمبر' };
const MONK = { 'Jan': 'يناير', 'Feb': 'فبراير', 'Mär': 'مارس', 'Apr': 'أبريل', 'Mai': 'مايو', 'Jun': 'يونيو', 'Jul': 'يوليو', 'Aug': 'أغسطس', 'Sep': 'سبتمبر', 'Okt': 'أكتوبر', 'Nov': 'نوفمبر', 'Dez': 'ديسمبر' };
const TAG = { 'Mo': 'الإثنين', 'Di': 'الثلاثاء', 'Mi': 'الأربعاء', 'Do': 'الخميس', 'Fr': 'الجمعة', 'Sa': 'السبت', 'So': 'الأحد' };
const TAGK = { 'Mo': 'إثن', 'Di': 'ثلا', 'Mi': 'أرب', 'Do': 'خمي', 'Fr': 'جمع', 'Sa': 'سبت', 'So': 'أحد' };
Object.assign(W, MONK, TAGK);
/* 2.14: Einstellungen in Abschnitten, Logo, Fußzeile, Vollmacht-Link */
Object.assign(W, {
  'Allgemein': 'عام', 'Meine Daten': 'بياناتي', 'Briefe': 'الرسائل', 'Vollmacht': 'الوكالة', 'Kalender, Google & KI': 'التقويم وGoogle والذكاء الاصطناعي',
  'Claude & Gedächtnis': 'Claude والذاكرة', 'Sicherung & Update': 'النسخ الاحتياطي والتحديث',
  'Darstellung und Sprache der Bedienung.': 'المظهر ولغة الواجهة.',
  'Deine Angaben als Bevollmächtigter – erscheinen als Absender in Briefen.': 'بياناتك كوكيل – تظهر كمرسل في الرسائل.',
  'Design, Schrift, Logo, Unterschrift und Fußzeile – gilt für alle Briefe und wird dauerhaft gespeichert.': 'التصميم والخط والشعار والتوقيع والتذييل – لكل الرسائل ويُحفظ بشكل دائم.',
  'Freigabelinks der Vollmachten, die automatisch unter jedem Brief stehen.': 'روابط مشاركة الوكالات التي تظهر تلقائياً تحت كل رسالة.',
  'Google Kalender und Drive, Gemini, Erinnerungen und Hintergrundbetrieb.': 'تقويم Google وDrive وGemini والتذكيرات والعمل في الخلفية.',
  'Anbindung an Claude (MCP) und an das Gedächtnis.': 'الربط مع Claude (MCP) ومع الذاكرة.',
  'Datensicherung, Wiederherstellung und Programm-Updates.': 'النسخ الاحتياطي والاستعادة وتحديثات البرنامج.',
  'Schrift & Format': 'الخط والتنسيق', 'Logo & Unterschrift': 'الشعار والتوقيع', 'Logo': 'الشعار', 'keins': 'لا يوجد',
  'Größe Logo': 'حجم الشعار', 'Größe Unterschrift': 'حجم التوقيع', 'In jedem neuen Brief automatisch einsetzen': 'إدراجه تلقائياً في كل رسالة جديدة',
  'Vorschau Briefkopf': 'معاينة رأس الرسالة', 'Vorschau Unterschrift & Fußzeile': 'معاينة التوقيع والتذييل', 'Fußzeile': 'التذييل (Fußzeile)',
  'Text der Fußzeile (mehrere Zeilen möglich)': 'نص التذييل (يمكن عدة أسطر)', 'Farbe': 'اللون', 'Grau': 'رمادي', 'Schwarz': 'أسود', 'Rot': 'أحمر', 'Navy': 'كحلي', 'Stahl': 'فولاذي',
  'Das Logo steht immer oben rechts im Briefkopf. Unterschrift auf weißem Papier mit dunklem Stift, scannen oder abfotografieren, zuschneiden und laden (PNG mit transparentem Hintergrund ist ideal).': 'الشعار دائماً أعلى اليمين في رأس الرسالة. وقّع على ورق أبيض بقلم غامق، امسحه أو صوّره، قصّه وحمّله (PNG بخلفية شفافة هو الأفضل).',
  'Steht unten auf jedem Brief, z. B. „Dieses Schreiben wurde maschinell erstellt und ist mit einer digitalen Unterschrift gültig.“ Leer lassen = keine Fußzeile.': 'يظهر أسفل كل رسالة، مثلاً «Dieses Schreiben wurde maschinell erstellt …». اتركه فارغاً = بدون تذييل.',
  'Vollmacht-Link in Briefen': 'رابط الوكالة في الرسائل', 'Link automatisch in jeden Brief setzen (im Brief einzeln abschaltbar)': 'إضافة الرابط تلقائياً لكل رسالة (يمكن إيقافه لكل رسالة)',
  'Verwalten': 'إدارة', 'Link aktiv': 'الرابط فعّال', 'kein Link': 'لا يوجد رابط', 'Link kopieren': 'نسخ الرابط', 'Aktualisieren': 'تحديث', 'Link aufheben': 'إلغاء الرابط',
  'Freigabelink erstellen': 'إنشاء رابط مشاركة', 'Neue Fassung hochladen': 'رفع نسخة جديدة', 'Vollmacht als PDF hochladen': 'رفع الوكالة PDF', 'Angaben fehlen': 'بيانات ناقصة', 'ausfüllen': 'تعبئة',
  'Art der Vollmacht': 'نوع الوكالة', 'Beglaubigung': 'التصديق', 'Im Zentralen Vorsorgeregister eingetragen': 'مسجلة في السجل المركزي للوكالات',
  'Erst die Vollmacht als PDF hochladen, dann kann ein Link erstellt werden.': 'ارفع الوكالة PDF أولاً، بعدها يمكن إنشاء الرابط.',
  'Lädt die Vollmacht in deinen Google Drive (Ordner „Home Office – Vollmachten“). Jeder mit dem Link kann sie ansehen und drucken.': 'يرفع الوكالة إلى Google Drive (مجلد «Home Office – Vollmachten»). كل من لديه الرابط يستطيع عرضها وطباعتها.',
  'Logo oben rechts': 'الشعار أعلى اليمين', 'Link zur Vollmacht unter dem Text': 'رابط الوكالة تحت النص', 'Verträge': 'العقود',
  '4 · Unterschrift, Logo, Vollmacht & Internetmarke': '4 · التوقيع والشعار والوكالة وطابع البريد',
  'Nur im Desktop-Programm verfügbar.': 'متاح فقط في برنامج سطح المكتب.', 'Drive': 'Drive', 'ohne Drive': 'بدون Drive',
  'Name und Anschrift zusätzlich oben im Briefkopf zeigen': 'إظهار الاسم والعنوان فوق برأس الرسالة كمان',
  'Aus = keine Wiederholung: Absender steht schon in der Rücksendezeile und im Infoblock.': 'مطفي = بدون تكرار: المرسل مكتوب أصلاً بسطر الإرجاع وبمربع المعلومات.',
  'Mit Bildern': 'مع الصور', 'Nur Text': 'نص بس', 'Bilder laden': 'تحميل الصور', 'Als Dokument': 'كمستند', 'Öffnen': 'فتح',
  'Bilder aus dem Internet sind blockiert (Schutz vor Werbe- und Zählpixeln).': 'صور الإنترنت مسكّرة (حماية من صور التتبع والإعلانات).',
  'Bilder und Anhänge werden aus dem Postfach nachgeladen …': 'عم ننزّل الصور والمرفقات من الصندوق …',
  'Posteingang': 'الوارد', 'Gesendet': 'المرسل', 'Neu laden': 'إعادة تحميل', 'Nicht mehr fragen': 'ما عاد تسألني', 'Ans Büro': 'للمكتب', 'Alle auswählen': 'تحديد الكل',
  'Gesendete E-Mail links auswählen.': 'اختار إيميل مرسل من اليسار.', 'Keine gesendeten E-Mails gefunden.': 'ما في إيميلات مرسلة.',
  'E-Mail': 'الإيميل', 'Konten': 'الحسابات', 'Abrufen': 'جلب البريد', 'Neue E-Mail': 'إيميل جديد', 'Ungelesen': 'غير مقروء', 'Im Büro': 'بالمكتب', 'Erledigt': 'خلص', 'Nicht bearbeitet': 'ما انعالج',
  'Ans Büro (Gemini liest)': 'للمكتب (Gemini بيقرا)', 'Antworten': 'رد', 'Nicht bearbeiten': 'ما تعالجو', 'Senden': 'إرسال', 'E-Mail links auswählen.': 'اختار إيميل من اليسار.', 'Keine E-Mails.': 'ما في إيميلات.',
  'Postfach verbinden': 'ربط صندوق البريد', 'Verbinden und testen': 'ربط وتجربة', 'E-Mail-Adresse': 'عنوان الإيميل', 'Passwort / App-Passwort': 'كلمة السر / App-Passwort', 'Absendername': 'اسم المرسل',
  'Gehört zu': 'تابع لـ', 'Mir (Leon)': 'إلي (ليون)', 'E-Mail-Konten': 'حسابات الإيميل', 'Eingang': 'الوارد', 'Erst nach deiner Bestätigung wird etwas eingetragen': 'ما بينضاف شي قبل تأكيدك',
  'Bestätigen': 'تأكيد', 'Später': 'بعدين', 'Verwerfen': 'تجاهل', 'Datei': 'الملف', 'Nichts wird eingetragen, bevor du bestätigst.': 'ما بينضاف شي قبل ما تأكد.', 'Ausgewählte ans Büro': 'المختار للمكتب',
  'Keine': 'ولا شي', 'Noch einmal lesen': 'اقرا مرة تانية', 'Aktualisieren': 'تحديث', 'Allgemein': 'عام',
  'Menü einklappen': 'طي القائمة', 'Menü ausklappen': 'فتح القائمة',
  'Nächste freie Marke': 'الطابع الفاضي الجاي', 'Marke wählen': 'اختيار طابع', 'Marken-PDF laden': 'رفع PDF الطوابع', 'Internetmarken – Vorrat': 'مخزون طوابع البريد', 'benutzt': 'مستخدم',
  'Als benutzt markieren': 'تعليم كمستخدم', 'Wieder frei': 'إرجاعه فاضي', 'Benutzte entfernen': 'حذف المستخدمة', 'Ausgewählte übernehmen': 'اعتماد المختار', 'Porto je Marke (€)': 'سعر الطابع (€)',
  'oder einzelne Marke als Bild laden': 'أو رفع طابع واحد كصورة', 'keine Marke': 'بدون طابع', 'eigenes Bild': 'صورة خاصة', 'für einen Brief reserviert': 'محجوز لرسالة', 'Schließen': 'إغلاق',
  'Mitteilungen': 'الإشعارات', 'Alle gelesen': 'تعليم الكل كمقروء', 'Heute': 'اليوم', 'Früher': 'سابقاً', 'Keine Mitteilungen.': 'لا توجد إشعارات.', 'Was ist neu?': 'شو الجديد؟',
  'Erinnerungen einstellen': 'ضبط التذكيرات', 'gerade eben': 'هلق', 'Erinnerung': 'تذكير', 'Update': 'تحديث', 'Büro': 'المكتب', 'Hinweis': 'تنبيه', 'Neu': 'جديد',
  'Fragen ans Gedächtnis und an deine Dokumente': 'أسئلة للذاكرة ولمستنداتك', 'Schnellaktionen': 'إجراءات سريعة', 'Datei hochladen': 'رفع ملف', 'Offene Rückfragen': 'الأسئلة المفتوحة',
  'Fristen heute & diese Woche': 'مهل اليوم وهذا الأسبوع', 'Dokumente durchsuchen': 'البحث في المستندات', 'Antwort': 'الجواب', 'Neue Anfrage': 'سؤال جديد', 'Du': 'أنت', 'Gedächtnis': 'الذاكرة',
  'Anlegen': 'إنشاء', 'Abbrechen': 'إلغاء', 'Brief öffnen': 'فتح الرسالة', 'Andere Vorlage': 'قالب آخر', 'Öffnen': 'فتح', 'Im Büro zeigen': 'عرض في المكتب', 'Im Kalender ansehen': 'عرض في التقويم',
  'Neue Frist anlegen?': 'إنشاء مهلة جديدة؟', 'Brief mit Vorlage öffnen?': 'فتح رسالة بقالب؟', 'Neuen Brief öffnen?': 'فتح رسالة جديدة؟', 'Für wen ist die Datei?': 'لمن هذا الملف؟',
  'Es gibt keine offenen Rückfragen.': 'لا توجد أسئلة مفتوحة.', 'Diese Woche ist nichts fällig.': 'لا شيء مستحق هذا الأسبوع.', 'Andere Schreibweisen': 'كتابات أخرى للاسم',
  'Mit Vorlage beginnen': 'ابدأ من قالب', 'Alle Vorlagen': 'كل القوالب', 'Vorlage wählen': 'اختيار قالب', 'keine Vorlage': 'بدون قالب', 'Keine Vorlage gefunden.': 'لم يتم العثور على قالب.',
  'Häufig genutzt': 'الأكثر استخداماً', 'Arbeit & Beruf': 'العمل والمهنة', 'Bank & Konto': 'البنك والحساب', 'Briefvorlagen & DIN 5008': 'قوالب الرسائل وDIN 5008', 'Datenschutz': 'حماية البيانات',
  'Familie & Kinder': 'العائلة والأطفال', 'Finanzamt & Steuern': 'الضرائب', 'Gewerbe & Selbstständigkeit': 'التجارة والعمل الحر', 'Handy, Internet & TV': 'الجوال والإنترنت والتلفاز', 'Hausrecht': 'حق المنزل',
  'Inkasso & Forderungen': 'التحصيل والمطالبات', 'Jobcenter & Sozialleistungen': 'الجوب سنتر والمساعدات', 'Kauf & Reklamation': 'الشراء والشكاوى', 'Kfz & Fahrzeug': 'السيارة', 'Krankenkasse': 'التأمين الصحي',
  'Kündigungen': 'الإلغاءات', 'Mahnen & Rechnungen': 'التذكير والفواتير', 'Personal & Arbeitgeber': 'الموظفون وصاحب العمل', 'Reise & Verkehr': 'السفر والمواصلات', 'Rente & Altersvorsorge': 'التقاعد',
  'Rundfunkbeitrag': 'رسوم البث', 'Schule & Studium': 'المدرسة والدراسة', 'Urkunden & Bescheinigungen': 'الوثائق والشهادات', 'Versicherung': 'التأمين', 'Verträge & Abos': 'العقود والاشتراكات',
  'Vollmacht & Bürgschaft': 'الوكالة والكفالة', 'Widerruf': 'التراجع (Widerruf)', 'Widerspruch & Einspruch': 'الاعتراض', 'Wohnen & Miete': 'السكن والإيجار', 'Eigene Vorlagen': 'قوالبي',
  'Ändern': 'تغيير', 'Ordner wählen': 'اختيار المجلد', 'noch kein Ordner gewählt – Gedächtnis für diese Person aus': 'لم يتم اختيار مجلد بعد – الذاكرة متوقفة لهذا الشخص',
  'Ganzer Arbeitsbereich gewählt – liegen darin auch andere Personen, besser deren Unterordner wählen.': 'تم اختيار مساحة عمل كاملة – إذا كان فيها أشخاص آخرون، الأفضل اختيار المجلد الفرعي.',
  'Jede Person bekommt ihren eigenen Ordner im Memory-Ordner (z. B. „Fa. Akili › Maha“). Für eine Person liest Home Office nur Treffer aus diesem Ordner und schreibt nur dorthin (Notizen unter „<Ordner>/.memory/office-home/“). Neue Personen fragen beim Anlegen nach ihrem Ordner. Erinnerungen landen in der Aufgabenliste des Gedächtnisses (Dashboard → Tasks). Keine Passwörter oder PINs in festgehaltene Texte schreiben.':
    'لكل شخص مجلده الخاص داخل مجلد الذاكرة (مثلاً «Fa. Akili › Maha»). لهذا الشخص يقرأ Home Office فقط من هذا المجلد ويكتب فيه فقط. عند إضافة شخص جديد يسألك البرنامج عن مجلده. التذكيرات تذهب لقائمة مهام الذاكرة. لا تكتب كلمات سر أو PIN في النصوص المحفوظة.'
});
const MON_RE = new RegExp('\\b(' + Object.keys(MON).join('|') + ')\\b', 'g');
const Z = '([\\d.,]+)';
const DATUM_RE = new RegExp('^((Mo|Di|Mi|Do|Fr|Sa|So),? )?(\\d{1,2}\\.? )?(' + Object.keys(MON).join('|') + ')( \\d{4})?$');
const n = (x, eins, viele) => (x === '1' ? eins : viele.replace('#', x));

/* ---------- Muster mit Zahlen ---------- */
const R = [
  [new RegExp('^' + Z + ' überfällige Fristen?!$'), (m, a) => a + ' مهل متأخرة!'], [new RegExp('^' + Z + ' überfällig$'), (m, a) => a + ' متأخرة'],
  [new RegExp('^Fällig in ' + Z + ' Tagen$'), (m, a) => 'مستحق خلال ' + a + ' أيام'], [new RegExp('^in ' + Z + ' Tagen$'), (m, a) => 'خلال ' + a + ' أيام'], [new RegExp('^in ' + Z + ' Tagen · (.+)$'), (m, a, b) => 'خلال ' + a + ' أيام · ' + b],
  [new RegExp('^Nächste ' + Z + ' Tage$'), (m, a) => 'الأيام الـ ' + a + ' القادمة'], [new RegExp('^' + Z + ' Tage$'), (m, a) => a + ' يوماً'], [new RegExp('^' + Z + ' Monate$'), (m, a) => a + ' أشهر'],
  [new RegExp('^' + Z + ' warten auf Antwort$'), (m, a) => a + ' بانتظار الرد'], [new RegExp('^' + Z + ' € im Jahr$'), (m, a) => a + ' € في السنة'],
  [new RegExp('^Kündigungsfristen \\(' + Z + ' T\\.\\)$'), (m, a) => 'مهل الإلغاء (' + a + ' يوماً)'], [new RegExp('^überfällig \\((.+)\\)$'), (m, a) => 'متأخرة (' + a + ')'],
  [new RegExp('^' + Z + ' Dokument\\(e\\)$'), (m, a) => a + ' مستند'], [new RegExp('^' + Z + '/' + Z + ' Schritte$'), (m, a, b) => a + '/' + b + ' خطوات'],
  [new RegExp('^' + Z + ' pünktlich · ' + Z + ' verspätet$'), (m, a, b) => a + ' في الوقت · ' + b + ' متأخرة'], [new RegExp('^Fristen pünktlich \\(' + Z + ' Monate\\)$'), (m, a) => 'المهل في وقتها (' + a + ' أشهر)'],
  [new RegExp('^' + Z + ' erledigte Vorgänge$'), (m, a) => a + ' ملفات منجزة'], [new RegExp('^' + Z + ' Vorgänge warten$'), (m, a) => a + ' ملفات تنتظر'], [new RegExp('^' + Z + ' erledigt$'), (m, a) => a + ' منجز'], [new RegExp('^' + Z + ' wartet( ·)?$'), (m, a, b) => a + ' ينتظر' + (b || '')],
  [new RegExp('^vs ' + Z + ' vorherige ' + Z + ' Tage$'), (m, a, b) => 'مقارنة بـ ' + a + ' في الأيام الـ ' + b + ' السابقة'], [new RegExp('^vs ' + Z + ' Vorwoche$'), (m, a) => 'مقارنة بـ ' + a + ' الأسبوع السابق'],
  [new RegExp('^heute ' + Z + ' € · noch ' + Z + ' € Fixkosten · Ø ' + Z + ' €/Tag$'), (m, a, b, c) => 'اليوم ' + a + ' € · متبقٍ ' + b + ' € تكاليف ثابتة · متوسط ' + c + ' €/يوم'],
  [/^Erledigt im (.+)$/, (m, a) => 'المنجز في ' + a], [/^(Einnahmen|Ausgaben|Buchungen) (\S+ \d{4})$/, (m, a, b) => ({ Einnahmen: 'إيرادات', Ausgaben: 'مصاريف', Buchungen: 'قيود' }[a]) + ' ' + b.replace(MON_RE, x => MON[x])],
  [/^Geldfluss (\S+)$/, (m, a) => 'التدفق المالي · ' + (MONK[a] || a)], [/^Jahr (\d{4})$/, (m, a) => 'سنة ' + a], [/^Ab heute · (.+)$/, (m, a) => 'من اليوم · ' + a],
  [/^seit (.+)$/, (m, a) => 'منذ ' + a], [/^vom (.+)$/, (m, a) => 'بتاريخ ' + a], [/^für (.+)$/, (m, a) => { const x = T(a); return x.startsWith('ال') ? 'لل' + x.slice(2) : 'لـ' + x; }], [/^Gültig bis (.+)\.?$/, (m, a) => 'صالح حتى ' + a],
  [/^Suche: „(.+)“$/, (m, a) => 'بحث: «' + a + '»'], [/^Letzte Sicherung: (.*)$/, (m, a) => 'آخر نسخة احتياطية: ' + T(a.replace(/ ·$/, '')) + (a.endsWith('·') ? ' ·' : '')],
  [new RegExp('^Belegter Speicher: ' + Z + ' MB$'), (m, a) => 'المساحة المستخدمة: ' + a + ' MB'], [/^Modell: (.+)$/, (m, a) => 'النموذج: ' + a], [/^Laufzeit bis (.+)$/, (m, a) => 'المدة حتى ' + a],
  [new RegExp('^Hauptpasswort \\(mind\\. ' + Z + ' Zeichen\\)$'), (m, a) => 'كلمة المرور الرئيسية (' + a + ' أحرف على الأقل)'], [new RegExp('^' + Z + ' Minuten$'), (m, a) => a + ' دقيقة'],
  [new RegExp('^' + Z + ' Stunden?$'), (m, a) => n(a, 'ساعة', '# ساعات')], [/^Erinnerung (.+) vorher$/, (m, a) => 'تذكير قبل ' + zeit(a)], [/^(.+) vorher$/, (m, a) => 'قبل ' + zeit(a)],
  [new RegExp('^Offen in ' + Z + ' Tagen$'), (m, a) => 'مفتوح خلال ' + a + ' يوماً'], [new RegExp('^' + Z + ' aus Dokumenten erkannt · ' + Z + ' Termine$'), (m, a, b) => a + ' مُستخرجة من مستندات · ' + b + ' مواعيد'],
  [/^Letzter Tag zum Kündigen – das Vertragsende wäre am (.+)$/, (m, a) => 'آخر يوم للإلغاء – نهاية العقد ستكون في ' + a], [/^Feste Zahlung · (.+)$/, (m, a) => 'دفعة ثابتة · ' + T(a)],
  [/^Kündigungsfrist (.+)$/, (m, a) => 'مهلة الإلغاء: ' + a], [/^Kündigungsfrist: (.+)$/, (m, a) => 'مهلة الإلغاء: ' + a], [/^· Laufzeit bis (.+)$/, (m, a) => '· المدة حتى ' + a],
  [/^(Mo|Di|Mi|Do|Fr|Sa|So) (\d+\.(\d+\.)?)$/, (m, a, b) => TAG[a] + ' ' + b], [/^(.+) \((\d+)\)$/, (m, a, b) => (W[a] ? W[a] + ' (' + b + ')' : null)],
  [/^Rückfrage geklärt: (.+)$/, (m, a) => 'تم توضيح السؤال: ' + T(a)], [/^Version (\S+) verfügbar\.?$/, (m, a) => 'النسخة ' + a + ' متوفرة.'], [/^Neue Version (\S+) verfügbar$/, (m, a) => 'نسخة جديدة ' + a + ' متوفرة'],
  [/^Ordner von (.+)$/, (m, a) => 'مجلد ' + T(a)], [/^Überschneidet sich mit (.+) – bitte für jede Person einen eigenen Ordner wählen\.$/, (m, a) => 'يتداخل مع ' + a + ' – اختر مجلداً خاصاً لكل شخص.']
];
/* ---------- Büro (3D): Rollen, Status, Sprechblasen – Namen bleiben deutsch ---------- */
Object.assign(W, {
  'Sekretariat': 'السكرتارية', 'Terminmanager': 'مدير المواعيد', 'Finanzexpertin': 'خبيرة المالية', 'Statistik & Überblick': 'الإحصائيات والمتابعة', 'Schreibbüro': 'مكتب الكتابة', 'Archiv': 'الأرشيف', 'Büroleitung': 'إدارة المكتب',
  'Posteingang': 'البريد الوارد', 'prüft': 'يفحص', 'verteilt': 'يوزّع', 'Termine': 'المواعيد', 'Finanzierung': 'التمويل', 'Konten': 'الحسابات', 'Aufgaben': 'المهام', 'Fristen': 'المهل', 'E-Mails': 'الإيميلات', 'Vorlagen': 'القوالب', 'Kopien': 'النسخ',
  'arbeitet': 'يعمل', 'eilt zum Platz': 'يسرع إلى مكانه', 'hat eine Frage': 'لديه سؤال', 'bereit': 'جاهز', 'Pause': 'استراحة', 'leitet die Morgenbesprechung': 'يدير الاجتماع الصباحي', 'in der Morgenbesprechung': 'في الاجتماع الصباحي',
  'hat eine Frage an dich': 'لديه سؤال لك', 'geht zum Platz': 'يذهب إلى مكانه', 'unterwegs': 'في الطريق', 'macht Kaffee': 'يحضّر القهوة', 'Pause auf dem Sofa': 'استراحة على الكنبة', 'plaudert': 'يدردش', 'schaut aus dem Fenster': 'ينظر من النافذة', 'am Platz': 'في مكانه',
  'wartet auf deine Antwort': 'ينتظر ردّك', 'verteilt die Aufgaben': 'يوزّع المهام', 'arbeitet nach deiner Antwort weiter': 'يتابع العمل بعد ردّك', 'holt die Post': 'يجلب البريد', 'bringt die Post zum Platz': 'يأخذ البريد إلى مكانه', 'legt den Brief ab': 'يحفظ الرسالة',
  'übergibt die Akte': 'يسلّم الملف', 'Morgenbesprechung beginnt': 'يبدأ الاجتماع الصباحي', 'Brief im Archiv abgelegt': 'حُفظت الرسالة في الأرشيف', 'Neuer Brief im Briefkasten': 'رسالة جديدة في صندوق البريد', 'Monatsstatistik aktualisiert': 'تم تحديث الإحصائيات الشهرية',
  'aktualisiert die Monatsstatistik': 'يحدّث الإحصائيات الشهرية', 'prüft den erkannten Termin': 'يفحص الموعد المُستخرج', 'Termin aus Dokument erkannt': 'تم استخراج موعد من مستند', 'sichtet den neuen Datenbestand': 'يراجع البيانات الجديدة',
  'prüft alle Fristen': 'يفحص كل المهل', 'Keine Frist überfällig': 'لا توجد مهلة متأخرة', 'bereitet die Termine für morgen vor': 'يحضّر مواعيد الغد', 'prüft Kündigungsfristen': 'يفحص مهل الإلغاء', 'prüft die festen Zahlungen der Woche': 'يفحص الدفعات الثابتة لهذا الأسبوع', 'sichtet das Archiv': 'يراجع الأرشيف',
  'Noch einmal': 'مرة أخرى', 'Begrüßung': 'الترحيب', 'Rückfrage': 'سؤال', 'Rückfrage geklärt': 'تم توضيح السؤال', 'Antwort erhalten': 'وصل الرد', 'Frage von': 'سؤال من', 'Öffnet in Home Office': 'يفتح في Home Office', 'Jetzt:': 'الآن:',
  'Danke, ich mache weiter!': 'شكراً، سأتابع!', 'Hier, für dich!': 'تفضّل، هذا لك!', 'Heute noch nichts erledigt.': 'لم يُنجز شيء اليوم بعد.', 'Bereich öffnen': 'فتح القسم', 'Kamera folgen': 'متابعة بالكاميرا', 'Letzte Ereignisse': 'آخر الأحداث',
  'Büro-Einstellungen': 'إعدادات المكتب', 'Wenn das Büro nicht sichtbar ist': 'عندما لا يكون المكتب ظاهراً', '3D anhalten, Mitarbeiter arbeiten weiter': 'إيقاف العرض ثلاثي الأبعاد، والموظفون يتابعون العمل', 'alles weiterlaufen lassen': 'استمرار كل شيء',
  'Leise Büro-Geräusche': 'أصوات مكتب هادئة', 'Büro-Geräusche': 'أصوات المكتب', 'Grafik': 'الرسوميات', 'höchste Qualität': 'أعلى جودة', 'ausgewogen': 'متوازنة', 'leicht': 'خفيفة', 'Kamera dreht sich langsam': 'الكاميرا تدور ببطء', 'Über den Köpfen': 'فوق الرؤوس',
  'Aufgabenbereich': 'مجال العمل', 'Name und Aufgabenbereich': 'الاسم ومجال العمل', 'Brief hier fallen lassen – er kommt in den Briefkasten': 'أفلت الرسالة هنا – ستذهب إلى صندوق البريد', 'In eigenem Fenster': 'في نافذة مستقلة', 'Zurück ins Programm': 'العودة إلى البرنامج',
  'Ziehen = drehen · Mausrad = zoomen · Klick auf eine Person = Details · Dateien auf das Büro ziehen = Briefkasten': 'السحب = تدوير · عجلة الفأرة = تكبير · النقر على شخص = التفاصيل · سحب الملفات إلى المكتب = صندوق البريد',
  'Büro in einem eigenen Fenster öffnen, z. B. für den zweiten Bildschirm': 'فتح المكتب في نافذة مستقلة، مثلاً للشاشة الثانية',
  'Live · alle 5 Sekunden': 'مباشر · كل 5 ثوانٍ', 'Erst mal Kaffee.': 'أولاً القهوة.', 'Fünf Minuten Pause.': 'استراحة خمس دقائق.', 'Gern, mit Milch.': 'بكل سرور، مع حليب.', "Gibt's was Neues vom Jobcenter?": 'هل من جديد من Jobcenter؟',
  'Hast du die neue Vorlage gesehen?': 'هل رأيت القالب الجديد؟', 'Heute ist viel Post gekommen.': 'وصل بريد كثير اليوم.', "Ich hab's gesehen – Lena ist schon dran.": 'رأيته – Lena تعمل عليه.', 'Ich kümmere mich drum.': 'سأهتم بالأمر.', 'Ich setz mir eine Erinnerung.': 'سأضع لنفسي تذكيراً.',
  'Ich war gestern dran!': 'كان دوري أمس!', 'Ja, der Briefkopf ist jetzt viel klarer.': 'نعم، ترويسة الرسالة صارت أوضح بكثير.', 'Ja, endlich wieder Sonne.': 'نعم، أخيراً عادت الشمس.', 'Kurz die Nachrichten lesen.': 'أقرأ الأخبار قليلاً.', 'Kurz durchatmen.': 'أتنفس قليلاً.',
  'Noch einen Kaffee?': 'فنجان قهوة آخر؟', 'Noch nicht, aber die Frist ist notiert.': 'ليس بعد، لكن المهلة مدوّنة.', 'Ruhig. Endlich mal ausgeschlafen.': 'هادئ. أخيراً نمت جيداً.', 'Schöne Aussicht heute.': 'منظر جميل اليوم.', 'Schönes Wetter da draußen.': 'الطقس جميل في الخارج.',
  'Sehr gut, dann ist der Bericht schnell fertig.': 'ممتاز، إذاً سينتهي التقرير بسرعة.', 'Wer macht heute den Abwasch?': 'من سيغسل الصحون اليوم؟', 'Wie war dein Wochenende?': 'كيف كانت عطلتك؟', 'Ahh, frisch gemahlen.': 'آه، مطحونة طازجة.',
  'Die Pflanze braucht Wasser.': 'النبتة تحتاج ماء.', 'Der Bescheid läuft bald ab.': 'القرار (Bescheid) ستنتهي صلاحيته قريباً.', 'Die Kontoauszüge stimmen diesen Monat.': 'كشوف الحساب صحيحة هذا الشهر.',
  'Der Bescheid nennt keinen Namen – gehört er zu Vater oder Mutter?': 'القرار (Bescheid) لا يذكر اسماً – هل هو للأب أم للأم؟', 'Bescheid gelesen – eine Stelle ist unklar': 'قُرئ القرار (Bescheid) – هناك نقطة غير واضحة',
  'Brief gelesen: Termin + Ansprechpartnerin gefunden': 'قُرئت الرسالة: وُجد موعد + الشخص المسؤول', 'Buchungen zugeordnet, 2 auffällig': 'تم تصنيف القيود، 2 لافتة للنظر', 'Entwurf Widerspruch liegt bereit': 'مسودة الاعتراض (Widerspruch) جاهزة',
  'Erinnerungen für die Woche gesetzt': 'تم ضبط تذكيرات الأسبوع', 'Kündigung als Entwurf gespeichert': 'حُفظ الإلغاء (Kündigung) كمسودة', 'bereitet einen Widerspruch vor': 'يحضّر اعتراضاً (Widerspruch)', 'liest einen Bescheid der Pflegekasse': 'يقرأ قراراً من تأمين الرعاية (Pflegekasse)',
  'notiert die Widerspruchsfrist': 'يدوّن مهلة الاعتراض', 'plant Erinnerungen ein': 'يخطط التذكيرات', 'prüft Verträge und Kündigungsfristen': 'يفحص العقود ومهل الإلغاء', 'prüft die Fristen der Woche': 'يفحص مهل الأسبوع', 'prüft einen Kontoauszug (CSV)': 'يفحص كشف حساب (CSV)',
  'schreibt die Kündigung vor': 'يكتب مسودة الإلغاء', 'sortiert neue Scans': 'يرتّب المسوحات الجديدة'
});
const BQ = '„(.+?)“', bq = x => '«' + x + '»';
R.unshift(
  [/^(Begrüßung|Rückfrage geklärt|Rückfrage|Antwort erhalten|Neuer Brief im Briefkasten|Frage von|Öffnet in Home Office): (.+)$/, (m, a, b) => W[a] + ': ' + T(b)],
  [/^Frage von (.+)$/, (m, a) => 'سؤال من ' + a], [/^Live · (.+)$/, (m, a) => 'مباشر · ' + T(a)], [/^(\d+) arbeiten$/, (m, a) => a + ' يعملون'], [/^Rückfragen an dich \((\d+)\)$/, (m, a) => 'أسئلة لك (' + a + ')'], [/^· noch (\d+) Aufgabe\(n\)$/, (m, a) => '· متبقٍ ' + a + ' مهام'],
  [new RegExp('^liest ' + BQ + '( mit Gemini)?$'), (m, a, g) => 'يقرأ ' + bq(a) + (g ? ' بواسطة Gemini' : '')], [new RegExp('^' + BQ + ' (geprüft und verteilt|gelesen und verteilt)$'), (m, a) => 'تم فحص ' + bq(a) + ' وتوزيعه'],
  [new RegExp('^legt ' + BQ + ' ab$'), (m, a) => 'يحفظ ' + bq(a)], [new RegExp('^' + BQ + ' im Archiv abgelegt$'), (m, a) => 'حُفظ ' + bq(a) + ' في الأرشيف'],
  [/^übernimmt (\d+) Termin\(e\) aus Google$/, (m, a) => 'ينقل ' + a + ' مواعيد من Google'], [/^(\d+) Termin\(e\) aus Google übernommen$/, (m, a) => 'نُقلت ' + a + ' مواعيد من Google'],
  [new RegExp('^trägt ' + BQ + ' am (.+) ein$'), (m, a, d) => 'يسجّل ' + bq(a) + ' في ' + d], [new RegExp('^Termin ' + BQ + ' \\((.+)\\) eingetragen$'), (m, a, d) => 'سُجّل الموعد ' + bq(a) + ' (' + d + ')'],
  [/^trägt den Termin am (.+) ein$/, (m, d) => 'يسجّل الموعد في ' + d], [/^Termin ([\d.,: ]+) eingetragen$/, (m, d) => 'سُجّل الموعد ' + d],
  [new RegExp('^notiert ' + BQ + '$'), (m, a) => 'يدوّن ' + bq(a)], [new RegExp('^Frist ' + BQ + '(?: bis (.+))? notiert$'), (m, a, d) => 'دُوّنت المهلة ' + bq(a) + (d ? ' حتى ' + d : '')],
  [new RegExp('^hakt ' + BQ + ' ab$'), (m, a) => 'يُنهي ' + bq(a)], [new RegExp('^' + BQ + ' erledigt$'), (m, a) => 'أُنجز ' + bq(a)],
  [/^bucht (\d+) neue Buchung\(en\)$/, (m, a) => 'يسجّل ' + a + ' قيود جديدة'], [/^(\d+) Buchung\(en\) verbucht$/, (m, a) => 'سُجّلت ' + a + ' قيود'], [/^ordnet (\d+) Buchungen zu$/, (m, a) => 'يصنّف ' + a + ' قيود'],
  [new RegExp('^(überarbeitet|schreibt) ' + BQ + '$'), (m, v, a) => (v === 'schreibt' ? 'يكتب ' : 'يعدّل ') + bq(a)], [new RegExp('^Brief ' + BQ + ' gespeichert$'), (m, a) => 'حُفظت الرسالة ' + bq(a)],
  [new RegExp('^nimmt ' + BQ + ' ins Adressbuch auf$'), (m, a) => 'يضيف ' + bq(a) + ' إلى دفتر العناوين'], [new RegExp('^' + BQ + ' im Adressbuch$'), (m, a) => bq(a) + ' في دفتر العناوين'],
  [new RegExp('^legt die Person ' + BQ + ' an$'), (m, a) => 'ينشئ الشخص ' + bq(T(a))], [new RegExp('^Person ' + BQ + ' angelegt$'), (m, a) => 'أُنشئ الشخص ' + bq(T(a))],
  [new RegExp('^erfasst den Vertrag ' + BQ + '$'), (m, a) => 'يسجّل العقد ' + bq(a)], [new RegExp('^Vertrag ' + BQ + ' erfasst$'), (m, a) => 'سُجّل العقد ' + bq(a)],
  [new RegExp('^legt die Notiz ' + BQ + ' ab$'), (m, a) => 'يحفظ الملاحظة ' + bq(a)], [new RegExp('^Notiz ' + BQ + ' abgelegt$'), (m, a) => 'حُفظت الملاحظة ' + bq(a)],
  [new RegExp('^erfasst ' + BQ + '$'), (m, a) => 'يسجّل ' + bq(a)], [new RegExp('^' + BQ + ' bei Konten & Vermögen erfasst$'), (m, a) => 'سُجّل ' + bq(a) + ' في الحسابات والأملاك'],
  [/^nimmt (\d+) neuen Scan an$/, (m, a) => 'يستلم ' + a + ' مسح جديد'], [/^(\d+) Scan\(s\) im Scanner$/, (m, a) => a + ' مسح في الماسح'], [/^(\d+) Scans als Dokumente abgelegt$/, (m, a) => 'حُفظت ' + a + ' مسوحات كمستندات'],
  [/^Datenbestand neu geladen \((\d+) Änderungen\)$/, (m, a) => 'أُعيد تحميل البيانات (' + a + ' تغييرات)'], [new RegExp('^Für wen ist ' + BQ + '\\?$'), (m, a) => 'لمن ' + bq(a) + '؟'],
  [new RegExp('^Ich konnte ' + BQ + ' nicht lesen \\((.*)\\)\\. Noch einmal versuchen\\?$'), (m, a, b) => 'لم أستطع قراءة ' + bq(a) + ' (' + b + '). أحاول مرة أخرى؟'],
  [/^(\d+) Frist\(en\) überfällig – bitte ansehen$/, (m, a) => a + ' مهل متأخرة – يُرجى الاطلاع'], [/^Morgen: (.+)$/, (m, a) => 'غداً: ' + a], [/^Bald kündbar: (.+)$/, (m, a) => 'قابل للإلغاء قريباً: ' + a.replace(/ bis /g, ' حتى ')],
  [/^(\d+) feste Zahlung\(en\) diese Woche, zusammen (.+)$/, (m, a, b) => a + ' دفعات ثابتة هذا الأسبوع، المجموع ' + b], [/^(\d+) Dokument\(e\) ohne Person – beim Bearbeiten zuordnen$/, (m, a) => a + ' مستندات بدون شخص – حدّد الشخص عند التعديل'],
  [/^bringt die Akte zu (.+)$/, (m, a) => 'يأخذ الملف إلى ' + a], [/^Kontoauszug geprüft – (\d+) Buchungen$/, (m, a) => 'فُحص كشف الحساب – ' + a + ' قيود'], [/^Widerspruchsfrist bis (.+) notiert$/, (m, a) => 'دُوّنت مهلة الاعتراض حتى ' + a],
  [/^(\d+) Fristen diese Woche, (\d+) überfällig$/, (m, a, b) => a + ' مهل هذا الأسبوع، ' + b + ' متأخرة'], [/^(.+): kündbar bis (.+)$/, (m, a, b) => a + ': قابل للإلغاء حتى ' + b],
  [/^(.+) ins Adressbuch übernommen$/, (m, a) => 'أُضيف ' + a + ' إلى دفتر العناوين'], [/^ergänzt (.+) im Adressbuch$/, (m, a) => 'يكمل بيانات ' + a + ' في دفتر العناوين'],
  [/^(Guten Morgen|Guten Tag|Guten Abend)! (\d+) (?:neuer Brief|neue Briefe)(?: heute| im Kasten), (\d+) (?:Frist|Fristen)(?: fällig| heute)? und (\d+) (?:Termin|Termine) diese Woche\.$/,
    (m, g, a, b, c) => { const z = (n, keine, eins, zwei, viele, einzahl) => { n = +n; return n === 0 ? keine : n === 1 ? eins : n === 2 ? zwei : n <= 10 ? n + ' ' + viele : n + ' ' + einzahl; };
      return ({ 'Guten Morgen': 'صباح الخير!', 'Guten Tag': 'نهارك سعيد!', 'Guten Abend': 'مساء الخير!' }[g]) + ' '
        + z(a, 'لا رسائل جديدة اليوم', 'رسالة جديدة واحدة اليوم', 'رسالتان جديدتان اليوم', 'رسائل جديدة اليوم', 'رسالة جديدة اليوم') + '، '
        + z(b, 'لا مهل مستحقة', 'مهلة مستحقة واحدة', 'مهلتان مستحقتان', 'مهل مستحقة', 'مهلة مستحقة') + '، و'
        + z(c, 'لا مواعيد هذا الأسبوع', 'موعد واحد هذا الأسبوع', 'موعدان هذا الأسبوع', 'مواعيد هذا الأسبوع', 'موعداً هذا الأسبوع') + '.'; }],
  [/^Heute: (\d+) Termine?, (\d+) Fristen? fällig, (\d+) (?:offener Vorgang|offene Vorgänge)\.(?: Als Nächstes: (.+) am (\S+?)(?: um (\S+?))?\.)?$/,
    (m, a, b, c, x, d, u) => 'اليوم: ' + a + ' مواعيد، ' + b + ' مهل مستحقة، ' + c + ' ملفات مفتوحة.' + (x ? ' التالي: ' + x + ' في ' + d + (u ? ' الساعة ' + u : '') + '.' : '')]
);
function zeit(a) { return a.split(' + ').map(x => ({ '1 Woche': 'أسبوع', '1 Tag': 'يوم', '1 Stunde': 'ساعة' }[x] || x)).join(' + '); }

/* ---------- Übersetzen ---------- */
const CACHE = new Map();
function T(s) {
  if (LANG !== 'ar' || s == null) return s;
  const roh = String(s), t = roh.replace(/\s+/g, ' ').trim();
  if (!t || !/[A-Za-zÄÖÜäöüß]/.test(t)) return roh;
  if (CACHE.has(t)) { const c = CACHE.get(t); return c === null ? roh : roh.replace(roh.trim(), c); }
  let out = null;
  if (W[t] !== undefined) out = W[t];
  if (out === null && W[t.replace(/ \*$/, '')] !== undefined) out = W[t.replace(/ \*$/, '')] + ' *';
  if (out === null) for (const [re, f] of R) { const m = t.match(re); if (m) { const r = f(...m); if (r) { out = r; break; } } }
  if (out === null && DATUM_RE.test(t)) out = t.replace(/(\d{1,2})\. /, '$1 ').replace(MON_RE, x => MON[x]);
  MON_RE.lastIndex = 0;
  if (out === null) out = teile(t);
  CACHE.set(t, out);
  return out === null ? roh : roh.replace(roh.trim(), out);
}
/* Zusammengesetzte Texte: an Trennzeichen zerlegen und Teile einzeln übersetzen */
function teile(t) {
  for (const sep of [' · ', ': ', ' – ', ' → ']) {
    if (!t.includes(sep)) continue;
    const p = t.split(sep); let geaendert = false;
    const q = p.map(x => { const y = T(x); if (y !== x) geaendert = true; return y; });
    if (geaendert) return q.join(sep === ' → ' ? ' ← ' : sep);
  }
  return null;
}
window.ohT = T;

/* ---------- Anwenden auf die Oberfläche ---------- */
const SKIP = '.letter,.report,#print-root,.dstile .pv,script,style,textarea,[contenteditable],#bueroFrame,.no-i18n';
/* Datum/Uhrzeit-Felder behalten deutsche Ziffern und Formate (0123, 24.11.2026) */
const DT = 'input[type=date],input[type=time],input[type=month],input[type=datetime-local],input[type=week]';
function deutscheFelder(n) { if (n.nodeType !== 1) return; if (n.matches(DT)) n.lang = 'de'; n.querySelectorAll && n.querySelectorAll(DT).forEach(e => { e.lang = 'de'; }); }
function knoten(n) {
  deutscheFelder(n);
  if (n.nodeType === 3) { const p = n.parentElement; if (!p || p.closest(SKIP)) return; const v = n.nodeValue, w = T(v); if (w !== v) n.nodeValue = w; return; }
  if (n.nodeType !== 1 || n.closest(SKIP)) return;
  for (const a of ['placeholder', 'title', 'aria-label']) { const v = n.getAttribute && n.getAttribute(a); if (v) { const w = T(v); if (w !== v) n.setAttribute(a, w); } }
  const tw = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let k;
  while ((k = tw.nextNode())) {
    if (k.nodeType === 1) { if (k.matches(SKIP)) continue; for (const a of ['placeholder', 'title', 'aria-label']) { const v = k.getAttribute(a); if (v) { const w = T(v); if (w !== v) k.setAttribute(a, w); } } continue; }
    const p = k.parentElement; if (!p || p.closest(SKIP)) continue; const v = k.nodeValue, w = T(v); if (w !== v) k.nodeValue = w;
  }
}
/* Andere Fenster (Büro) laden neu, wenn die Sprache umgestellt wird */
window.addEventListener('storage', e => { if (e.key === 'oh-lang') location.reload(); });
const SCHRIFT = [400, 500, 600, 700].map(w => "@font-face{font-family:'IBM Plex Sans Arabic';src:url('fonts/ibm-plex-sans-arabic-arabic-" + w + "-normal.woff2') format('woff2');font-weight:" + w + ";font-display:swap;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC}").join('')
  + "html[dir=rtl] body,html[dir=rtl] button,html[dir=rtl] select,html[dir=rtl] input{font-family:'Manrope','IBM Plex Sans Arabic','Segoe UI',system-ui,sans-serif}";
function starten() {
  if (LANG !== 'ar') return;
  const st = document.createElement('style'); st.textContent = SCHRIFT; document.head.appendChild(st);
  document.documentElement.dir = 'rtl'; // lang bleibt de: Datumsfelder zeigen so 0123 document.body.classList.add('rtl');
  knoten(document.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') knoten(m.target); else m.addedNodes.forEach(knoten); if (m.type === 'attributes' && m.target.nodeType === 1) knoten(m.target); } })
    .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] });
  // Meldungsfenster des Browsers
  const al = window.alert, co = window.confirm, pr = window.prompt;
  window.alert = m => al.call(window, T(m)); window.confirm = m => co.call(window, T(m)); window.prompt = (m, d) => pr.call(window, T(m), d);
}
/* Sprache wählen (Einstellungen → Darstellung) */
window.ohSetLang = l => {
  try { localStorage.setItem('oh-lang', l); } catch (e) {}
  try { if (window.officeHome && window.officeHome.setLang) window.officeHome.setLang(l); } catch (e) {}
  // Büro im eigenen Fenster neu laden (dort kommt kein storage-Ereignis an)
  try { if (window.officeHome && window.officeHome.bueroTheme && typeof buTheme === 'function') window.officeHome.bueroTheme(buTheme()); } catch (e) {}
  setTimeout(() => location.reload(), 150);
};
try { if (window.officeHome && window.officeHome.setLang) window.officeHome.setLang(LANG); } catch (e) {}   // Hauptprogramm: Symbol/Meldungen
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starten); else starten();
})();
