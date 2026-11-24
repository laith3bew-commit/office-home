/* Vorlagen-Katalog für „Brief schreiben“.
   Kategorien und Reihenfolge nach der Gliederung von brief-wechsel.de/vorlagen (nur Gliederung und Titel als Stichworte);
   alle Brieftexte sind eigene Formulierungen. Platzhalter: {…} wird automatisch ausgefüllt, […] gelb = selbst ausfüllen.
   window.TPL_EXTRA: zusätzliche Vorlagen; window.TPL_KAT: Kategorien mit den IDs ihrer Vorlagen (eine Vorlage kann in mehreren stehen). */
(function () {
  const V = '{VollmachtAbsatz}';
  const L = [];
  const T = (id, name, subject, body) => { L.push({ id: 'bw_' + id, name, subject, body: body + V }); return 'bw_' + id; };
  const BEST = 'Bitte bestätigen Sie mir den Eingang dieses Schreibens.';
  // Bausteine (eigene Formulierungen)
  // Betreff: „Kündigung – <Stichwort> – Nr. {Kundennummer}“. Stichwort aus KS (sonst aus dem Titel); KN = ohne Nummer.
  const KS = { arbeitsvertrag: 'Arbeitsverhältnis', minijob: 'geringfügige Beschäftigung', kita: 'Betreuungsvertrag', mietvertrag: 'Mietverhältnis [Anschrift]',
    miete_sonder: 'Sonderkündigung des Mietverhältnisses [Anschrift]', gewerbemiete: 'Gewerbemietvertrag [Anschrift]', krankenkasse_sonder: 'Sonderkündigung wegen Zusatzbeitrag',
    krankenkasse: 'Mitgliedschaft {Name}', kfz_versicherung: 'Kfz-Versicherung [Kennzeichen]', studienvertrag: 'Studienvertrag', dating: 'Premium-Abonnement', tv_hd: 'TV-Zusatzoption HD' };
  const KN = ['arbeitsvertrag', 'minijob', 'kita', 'mietvertrag', 'miete_sonder', 'gewerbemiete', 'krankenkasse', 'studienvertrag', 'dating'];
  const K = (id, name, what, wann, extra) => T(id, name, `Kündigung – ${KS[id] || name.replace(/\s+(außerordentlich\s+)?kündigen.*$/i, '')}${KN.includes(id) ? '' : ' – Nr. {Kundennummer}'}`,
    `hiermit kündige ich{Vertretung} ${what} ${wann || 'fristgerecht zum nächstmöglichen Zeitpunkt'}.${extra ? '\n\n' + extra : ''}\n\nBitte bestätigen Sie mir die Kündigung und das genaue Vertragsende schriftlich. Einer Kontaktaufnahme zu Werbe- oder Rückgewinnungszwecken widerspreche ich. Eine erteilte Einzugsermächtigung endet mit dem Vertragsende.`);
  const W = (id, name, gegen, grund) => T(id, name, `Widerspruch gegen ${gegen} vom [Datum] – Aktenzeichen {Aktenzeichen}`,
    `hiermit lege ich{Vertretung} gegen ${gegen} vom [Datum], Aktenzeichen {Aktenzeichen}, fristgerecht Widerspruch ein.\n\nBegründung:\n${grund || '[Begründung]'}\n\nIch bitte um Überprüfung und um einen neuen, rechtsmittelfähigen Bescheid. Bis zur Entscheidung bitte ich, von Vollstreckungsmaßnahmen abzusehen.\n\n${BEST}`);
  const A = (id, name, subject, was, grund) => T(id, name, subject,
    `hiermit beantrage ich{Vertretung} ${was}.\n\n${grund || 'Begründung:\n[Begründung]'}\n\nDie erforderlichen Nachweise füge ich bei. Bitte teilen Sie mir Ihre Entscheidung schriftlich mit.`);

  const K_ = {}; // Kategorie → IDs
  const cat = (name, ids) => { K_[name] = ids; };

  /* 1 Arbeit & Beruf */
  const ab = {
    zeugnis: T('zeugnis', 'Arbeitszeugnis anfordern', 'Bitte um Erteilung eines qualifizierten Arbeitszeugnisses',
      'mein Arbeitsverhältnis bei Ihnen [endete am / endet am] [Datum]. Hiermit bitte ich um die Ausstellung eines qualifizierten Arbeitszeugnisses, das sich auf Leistung und Verhalten erstreckt (§ 109 GewO).\n\nBitte senden Sie mir das Zeugnis bis zum [Datum] an die oben genannte Anschrift.'),
    zeugnisber: T('zeugnis_berichtigung', 'Arbeitszeugnis-Berichtigung verlangen', 'Berichtigung meines Arbeitszeugnisses vom [Datum]',
      'vielen Dank für das Arbeitszeugnis vom [Datum]. Folgende Stellen entsprechen nicht meiner tatsächlichen Leistung bzw. den Tatsachen:\n\n– [Stelle im Zeugnis] → [gewünschte Formulierung]\n– [Stelle im Zeugnis] → [gewünschte Formulierung]\n\nIch bitte Sie, das Zeugnis entsprechend zu berichtigen und mir die neue Fassung bis zum [Datum] zuzusenden.'),
    lohn: T('lohn', 'Ausstehenden Lohn einfordern', 'Ausstehende Vergütung für [Monat/Zeitraum]',
      'für den Zeitraum [Monat/Zeitraum] habe ich bislang keine bzw. nur eine unvollständige Vergütung erhalten. Offen ist ein Betrag von [Betrag] € brutto.\n\nIch fordere Sie auf, diesen Betrag bis spätestens [Datum] auf mein Ihnen bekanntes Konto zu überweisen. Nach Ablauf der Frist behalte ich mir weitere Schritte vor.'),
    nachreichen: T('nachreichen', 'Fehlende Unterlagen nachreichen', 'Nachreichung von Unterlagen – Aktenzeichen {Aktenzeichen}',
      'in der oben genannten Angelegenheit reiche ich{Vertretung} die angeforderten Unterlagen nach:\n\n– [Unterlage 1]\n– [Unterlage 2]\n\nDamit sollten die Unterlagen vollständig sein. Sollte noch etwas fehlen, bitte ich um kurze Mitteilung.'),
    abmahnung: T('gegendarstellung', 'Gegendarstellung zur Abmahnung', 'Gegendarstellung zur Abmahnung vom [Datum]',
      'gegen die Abmahnung vom [Datum] nehme ich wie folgt Stellung:\n\n[Darstellung des Sachverhalts aus meiner Sicht]\n\nDie Abmahnung ist aus meiner Sicht unberechtigt. Ich bitte darum, sie aus meiner Personalakte zu entfernen, zumindest aber diese Gegendarstellung zur Personalakte zu nehmen (§ 83 Abs. 2 BetrVG).'),
    arbeitsvertrag: K('arbeitsvertrag', 'Kündigen Sie Ihren Arbeitsvertrag', 'mein Arbeitsverhältnis', 'ordentlich und fristgerecht zum [Datum], hilfsweise zum nächstmöglichen Termin',
      'Ich bitte um ein qualifiziertes Arbeitszeugnis sowie die Arbeitspapiere. Bitte rechnen Sie noch offenen Urlaub und Überstunden ab.'),
    minijob: K('minijob', 'Kündigen Sie Ihren Minijob', 'mein geringfügiges Beschäftigungsverhältnis', 'fristgerecht zum [Datum], hilfsweise zum nächstmöglichen Termin',
      'Bitte senden Sie mir die Abmeldebestätigung der Minijob-Zentrale und ein Arbeitszeugnis zu.'),
    neben: T('nebentaetigkeit', 'Nebentätigkeit anmelden', 'Anzeige einer Nebentätigkeit',
      'hiermit zeige ich an, dass ich ab dem [Datum] eine Nebentätigkeit als [Tätigkeit] bei [Arbeitgeber/Auftraggeber] aufnehmen möchte.\n\nUmfang: ca. [Stunden] Stunden pro Woche, außerhalb meiner Arbeitszeit. Die Tätigkeit steht nicht im Wettbewerb zu Ihrem Unternehmen und beeinträchtigt meine Arbeitsleistung nicht.\n\nBitte bestätigen Sie mir die Kenntnisnahme bzw. Genehmigung schriftlich.'),
    ueberzahlung: T('ueberzahlung', 'Rückforderung einer Gehaltsüberzahlung abwehren', 'Ihre Rückforderung vom [Datum] – angebliche Überzahlung',
      'Sie fordern mit Schreiben vom [Datum] einen Betrag von [Betrag] € als Überzahlung zurück. Diese Forderung weise ich zurück.\n\nIch habe die Zahlung in gutem Glauben erhalten und bereits verbraucht (§ 818 Abs. 3 BGB). [Ggf.: Zudem ist der Anspruch nach der Ausschlussfrist im Arbeitsvertrag verfallen.]\n\nBitte bestätigen Sie mir, dass Sie die Rückforderung nicht weiter verfolgen.'),
    teilzeit: A('teilzeit', 'Teilzeit beantragen', 'Antrag auf Verringerung der Arbeitszeit (§ 8 TzBfG)',
      'ab dem [Datum] die Verringerung meiner wöchentlichen Arbeitszeit von [Stunden] auf [Stunden] Stunden nach § 8 TzBfG', 'Gewünschte Verteilung der Arbeitszeit: [z. B. Montag bis Donnerstag, 8 bis 14 Uhr].'),
    sonderurlaub: A('sonderurlaub', 'Unbezahlten Sonderurlaub beantragen', 'Antrag auf unbezahlten Sonderurlaub',
      'unbezahlten Sonderurlaub für die Zeit vom [Datum] bis [Datum]', 'Grund: [Grund]. Ich habe meine Vertretung bereits mit [Name] abgesprochen.'),
    abgeltung: T('urlaubsabgeltung', 'Urlaubsabgeltung beantragen', 'Abgeltung des Resturlaubs',
      'mein Arbeitsverhältnis endet am [Datum]. Zu diesem Zeitpunkt stehen mir noch [Anzahl] Tage Urlaub zu, die ich wegen [Grund] nicht mehr nehmen kann.\n\nIch bitte um Abgeltung dieser Urlaubstage nach § 7 Abs. 4 BUrlG mit der letzten Gehaltsabrechnung.'),
    resturlaub: T('resturlaub', 'Verfall von Resturlaub widersprechen', 'Resturlaub aus [Jahr] – Widerspruch gegen den Verfall',
      'Sie haben mir mitgeteilt, dass mein Resturlaub aus [Jahr] verfallen sei. Dem widerspreche ich.\n\nUrlaub verfällt nur, wenn der Arbeitgeber rechtzeitig und konkret auf den drohenden Verfall hingewiesen hat. Ein solcher Hinweis ist nicht erfolgt. Ich bitte daher um Bestätigung, dass mir [Anzahl] Tage weiterhin zustehen.'),
    ueberstunden: T('ueberstunden', 'Überstunden auszahlen lassen', 'Auszahlung von Überstunden',
      'laut Arbeitszeiterfassung habe ich bis zum [Datum] insgesamt [Anzahl] Überstunden geleistet, die angeordnet bzw. geduldet wurden.\n\nIch bitte um Auszahlung dieser Stunden mit der nächsten Gehaltsabrechnung [oder: um Freizeitausgleich am [Datum]].')
  };
  cat('Arbeit & Beruf', [ab.zeugnis, ab.zeugnisber, ab.lohn, ab.nachreichen, ab.abmahnung, ab.arbeitsvertrag, ab.minijob, ab.neben, ab.ueberzahlung, ab.teilzeit, ab.sonderurlaub, ab.abgeltung, ab.resturlaub, ab.ueberstunden]);

  /* 2 Bank & Konto */
  const bk = {
    bafin: T('bafin', 'BaFin-Antrag bei abgelehntem Basiskonto', 'Antrag auf Durchführung eines Verwaltungsverfahrens nach § 48 ZKG',
      'die [Bank] hat meinen{Vertretung} Antrag auf Eröffnung eines Basiskontos vom [Datum] am [Datum] abgelehnt [bzw. nicht innerhalb von zehn Geschäftstagen beantwortet].\n\nIch beantrage, die Bank zur Eröffnung des Basiskontos zu verpflichten (§ 48 ZKG). Den Antrag und das Ablehnungsschreiben füge ich bei.'),
    basis: A('basiskonto', 'Basiskonto beantragen', 'Antrag auf Eröffnung eines Basiskontos (§ 31 ZKG) – {Name}',
      'die Eröffnung eines Basiskontos für {NameMitAnrede}, geboren am {Geburtsdatum}, nach § 31 ZKG', 'Ein anderes Zahlungskonto in Deutschland besteht nicht. Das ausgefüllte Antragsformular füge ich bei; ich bitte um Eröffnung innerhalb von zehn Geschäftstagen.'),
    darlehen: K('darlehen', 'Darlehensvertrag kündigen', 'den Darlehensvertrag Nr. [Nummer]', 'zum [Datum], hilfsweise zum nächstmöglichen Termin',
      'Bitte teilen Sie mir die zum Kündigungstermin offene Restschuld mit und bestätigen Sie mir nach Rückzahlung die vollständige Tilgung.'),
    giro: K('giro', 'Girokonto kündigen und Guthaben überweisen', 'das Girokonto mit der IBAN [IBAN]', 'zum [Datum], hilfsweise zum nächstmöglichen Termin',
      'Bitte überweisen Sie das Restguthaben auf das Konto IBAN [neue IBAN] bei [Bank] und senden Sie mir einen Kontoabschluss.'),
    iban: T('iban', 'IBAN-Diskriminierung beanstanden', 'Ablehnung meiner ausländischen IBAN – Verstoß gegen Art. 9 SEPA-VO',
      'Sie haben die Zahlung per Lastschrift bzw. Überweisung von meinem{Vertretung} Konto mit der IBAN [IBAN] abgelehnt, weil es sich um ein Konto in [Land] handelt.\n\nNach Art. 9 der SEPA-Verordnung (EU) Nr. 260/2012 dürfen Sie die Zahlung von einem Konto in einem anderen SEPA-Land nicht ablehnen. Ich bitte Sie, das Konto bis zum [Datum] zu akzeptieren.'),
    pkonto: A('pkonto', 'P-Konto beantragen', 'Umwandlung in ein Pfändungsschutzkonto – IBAN [IBAN]',
      'die Umwandlung des Girokontos mit der IBAN [IBAN] in ein Pfändungsschutzkonto (P-Konto) nach § 850k ZPO', 'Ich versichere, dass kein weiteres P-Konto besteht. Bitte führen Sie die Umwandlung innerhalb von vier Geschäftstagen durch.'),
    sparkasse: K('sparkasse', 'Sparkasse Girokonto kündigen', 'das bei Ihnen geführte Girokonto mit der IBAN [IBAN]', 'zum [Datum], hilfsweise zum nächstmöglichen Termin',
      'Bitte überweisen Sie das Guthaben auf das Konto IBAN [neue IBAN]. Zugehörige Karten vernichte ich bzw. sende sie Ihnen zurück.'),
    abbuchung: T('abbuchung', 'Widerspruch gegen Abbuchung ohne Einzugsermächtigung', 'Widerspruch gegen eine Lastschrift ohne Mandat – IBAN [IBAN]',
      'am [Datum] wurde von meinem{Vertretung} Konto mit der IBAN [IBAN] ein Betrag von [Betrag] € zugunsten von [Zahlungsempfänger] abgebucht. Ein Lastschriftmandat habe ich dafür nie erteilt.\n\nIch widerspreche dieser Belastung und bitte um sofortige Rückbuchung des Betrags (§ 675u BGB).')
  };
  cat('Bank & Konto', [bk.bafin, bk.basis, bk.darlehen, bk.giro, bk.iban, bk.pkonto, bk.sparkasse, 'sepa', bk.abbuchung]);

  /* 3 Briefvorlagen & DIN 5008 */
  const dn = {
    kopf: T('briefkopf', 'Briefkopf nach DIN', '[Betreff]', '[Text des Briefes]\n\nAnschrift, Infoblock, Datum und Falzmarken setzt Home Office automatisch nach DIN 5008.'),
    muster: T('musterbrief', 'Musterbrief', '[Betreff]', 'hiermit [Anliegen in einem Satz].\n\n[Erläuterung]\n\nFür Rückfragen stehe ich gern zur Verfügung.'),
    schweiz: T('schweiz', 'Standardbrief in die Schweiz mit angepasstem Briefkopf', '[Betreff]',
      '[Text des Briefes]\n\nHinweis für die Anschrift: Zeile „SCHWEIZ“ in Großbuchstaben als letzte Zeile, Postleitzahl vierstellig vor dem Ort.')
  };
  cat('Briefvorlagen & DIN 5008', [dn.kopf, 'frei', dn.muster, dn.schweiz]);

  /* 4 Datenschutz */
  const ds = {
    beschwerde: T('dsb', 'Beschwerde bei der Datenschutzbehörde', 'Beschwerde nach Art. 77 DSGVO gegen [Unternehmen]',
      'hiermit lege ich{Vertretung} Beschwerde gegen [Unternehmen, Anschrift] ein.\n\nSachverhalt: [Was ist passiert, wann, welche Daten]\n\nMeine Anfrage vom [Datum] wurde [nicht / unvollständig] beantwortet. Kopien des Schriftverkehrs füge ich bei. Ich bitte um Prüfung und Mitteilung des Ergebnisses.'),
    nachkuend: T('dsgvo_konto', 'DSGVO-Auskunft nach Kontokündigung', 'Auskunft und Löschung nach Beendigung des Vertrags – Kundennummer {Kundennummer}',
      'der Vertrag bzw. das Konto mit der Kundennummer {Kundennummer} wurde zum [Datum] beendet.\n\nIch bitte{Vertretung} um Auskunft nach Art. 15 DSGVO, welche Daten noch gespeichert sind, und um Löschung aller Daten, für die keine gesetzliche Aufbewahrungspflicht besteht (Art. 17 DSGVO). Bitte bestätigen Sie mir die Löschung innerhalb eines Monats.'),
    werbung: T('werbung', 'Widerruf zur Nutzung meiner Daten für werbliche Zwecke', 'Widerruf der Einwilligung und Widerspruch gegen Werbung – Kundennummer {Kundennummer}',
      'hiermit widerrufe ich{Vertretung} jede erteilte Einwilligung zur Nutzung meiner Daten für Werbung und widerspreche der Verarbeitung für Zwecke der Direktwerbung (Art. 21 Abs. 2 DSGVO).\n\nBitte senden Sie künftig keine Werbung mehr – weder per Post, E-Mail noch Telefon – und bestätigen Sie mir dies schriftlich.'),
    epaforsch: T('epa_forschung', 'Widerspruch ePA-Forschungsdaten', 'Widerspruch gegen die Weitergabe von ePA-Daten zu Forschungszwecken – {Name} – {Krankenkasse}',
      'für {NameMitAnrede}, geboren am {Geburtsdatum}, Versichertennummer [Nummer], widerspreche ich{Vertretung} der Übermittlung von Daten aus der elektronischen Patientenakte an das Forschungsdatenzentrum (§ 363 SGB V).\n\nBitte bestätigen Sie mir den Eingang und die Umsetzung des Widerspruchs.')
  };
  cat('Datenschutz', [ds.beschwerde, 'dsgvo', ds.nachkuend, ds.werbung, ds.epaforsch]);

  /* 5 Familie & Kinder */
  const fk = {
    elternzeit: A('elternzeit', 'Elternzeit beantragen', 'Anmeldung der Elternzeit',
      'Elternzeit für mein Kind [Name], geboren am [Datum], für die Zeit vom [Datum] bis [Datum] (§ 16 BEEG)', 'Eine Kopie der Geburtsurkunde füge ich bei. Bitte bestätigen Sie mir die Elternzeit schriftlich.'),
    kita: K('kita', 'Kita kündigen', 'den Betreuungsvertrag für mein Kind [Name], geboren am [Datum],', 'zum [Datum]', 'Bitte erstatten Sie zu viel gezahlte Beiträge und eine eventuelle Kaution.'),
    rueckkehr: T('rueckkehr_teilzeit', 'Rückkehr aus Elternzeit mit Teilzeit', 'Rückkehr aus der Elternzeit und Antrag auf Teilzeit',
      'meine Elternzeit endet am [Datum]. Ab dem [Datum] möchte ich in Teilzeit mit [Stunden] Stunden pro Woche zurückkehren (§ 15 BEEG bzw. § 8 TzBfG).\n\nGewünschte Verteilung: [Tage/Uhrzeiten]. Bitte bestätigen Sie mir Rückkehr und Arbeitszeit schriftlich.')
  };
  cat('Familie & Kinder', [fk.elternzeit, fk.kita, fk.rueckkehr]);

  /* 6 Finanzamt & Steuern */
  const fa = {
    est: W('einspruch_est', 'Einspruch gegen Einkommensteuerbescheid', 'den Einkommensteuerbescheid für [Jahr]', '[z. B. Werbungskosten / außergewöhnliche Belastungen wurden nicht berücksichtigt]. Belege füge ich bei. Zugleich beantrage ich die Aussetzung der Vollziehung.'),
    grund: W('einspruch_grundsteuer', 'Einspruch gegen Grundsteuerbescheid', 'den Grundsteuerwertbescheid bzw. Grundsteuermessbescheid', '[z. B. falsche Wohnfläche / falscher Bodenrichtwert]'),
    frist: T('steuer_frist', 'Steuererklärung Fristverlängerung', 'Antrag auf Fristverlängerung für die Steuererklärung [Jahr] – Steuer-ID {SteuerID}',
      'hiermit beantrage ich{Vertretung} die Verlängerung der Frist zur Abgabe der Steuererklärung für [Jahr] bis zum [Datum].\n\nBegründung: [z. B. Es fehlen noch Unterlagen von Dritten / Krankheit].'),
    voraus: A('steuer_voraus', 'Steuervorauszahlung anpassen', 'Antrag auf Herabsetzung der Vorauszahlungen – Steuernummer [Steuernummer]',
      'die Herabsetzung der Einkommensteuer-Vorauszahlungen ab dem [Quartal/Jahr]', 'Die Einkünfte werden voraussichtlich deutlich geringer ausfallen: [Begründung, erwartete Einkünfte].')
  };
  cat('Finanzamt & Steuern', [fa.est, fa.grund, fa.frist, fa.voraus]);

  /* 7 Gewerbe & Selbstständigkeit */
  const gw = {
    gbrief: T('geschaeftsbrief', 'Geschäftsbrief Vorlage DIN 5008', '[Betreff]', '[Anliegen]\n\n[Details, Angebot oder Anfrage]\n\nFür Rückfragen stehen wir Ihnen gern zur Verfügung.'),
    gewmiete: K('gewerbemiete', 'Gewerbemietvertrag kündigen', 'das Mietverhältnis über die Gewerberäume [Anschrift der Räume]', 'fristgerecht zum [Datum]', 'Bitte vereinbaren Sie mit mir einen Termin zur Übergabe und rechnen Sie die Kaution ab.'),
    neueroeff: T('neueroeffnung', 'Neueröffnung mit neuer Geschäftsadresse', 'Neue Geschäftsadresse ab [Datum]',
      'wir freuen uns, Ihnen mitzuteilen, dass wir ab dem [Datum] unter neuer Anschrift für Sie da sind:\n\n[neue Anschrift]\n\nTelefon und E-Mail bleiben unverändert. Bitte passen Sie Ihre Unterlagen an.'),
    rfrei: T('rechnung_frei', 'Rechnungsmuster für Freiberufler', 'Rechnung Nr. [Nummer]',
      'für meine Leistungen im Zeitraum [Zeitraum] stelle ich in Rechnung:\n\n[Leistung] – [Menge] × [Preis] € = [Betrag] €\nNetto: [Betrag] €\nUmsatzsteuer [19] %: [Betrag] €\nGesamt: [Betrag] €\n\nLeistungsdatum: [Datum] · Steuernummer: [Steuernummer]\nBitte überweisen Sie den Betrag bis [Datum] auf IBAN [IBAN].'),
    rklein: T('rechnung_klein', 'Rechnungsmuster für Kleinunternehmer', 'Rechnung Nr. [Nummer]',
      'für meine Leistungen stelle ich in Rechnung:\n\n[Leistung] – [Betrag] €\nGesamt: [Betrag] €\n\nGemäß § 19 UStG wird keine Umsatzsteuer berechnet.\nLeistungsdatum: [Datum] · Steuernummer: [Steuernummer]\nBitte überweisen Sie den Betrag bis [Datum] auf IBAN [IBAN].'),
    kleinw: A('kleinunternehmer', 'Wechsel zur Kleinunternehmer-Regelung', 'Anwendung der Kleinunternehmerregelung ab [Jahr] – Steuernummer [Steuernummer]',
      'ab dem [Datum] die Anwendung der Kleinunternehmerregelung nach § 19 UStG', 'Der Umsatz lag im Vorjahr bei [Betrag] € und wird im laufenden Jahr voraussichtlich [Betrag] € betragen.')
  };
  cat('Gewerbe & Selbstständigkeit', [gw.gbrief, gw.gewmiete, gw.neueroeff, gw.rfrei, gw.rklein, gw.kleinw]);

  /* 8 Handy, Internet & TV */
  const ht = {
    handy: K('handy', 'Handyvertrag kündigen', 'den Mobilfunkvertrag für die Rufnummer [Rufnummer]', 'fristgerecht zum Ende der Mindestlaufzeit, hilfsweise zum nächstmöglichen Termin', 'Bitte senden Sie mir den Code zur Rufnummernmitnahme (Portierung) zu.'),
    umzug: K('internet_umzug', 'Internetzugang wegen Umzug kündigen', 'den Internet- bzw. Festnetzvertrag am Anschluss [Anschrift]', 'nach § 60 Abs. 2 TKG mit einer Frist von einem Monat zum [Datum]',
      'Ich ziehe am [Datum] nach [neue Anschrift]. Dort kann die Leistung [nicht / nicht in gleicher Qualität] erbracht werden. Eine Meldebestätigung füge ich bei.'),
    telekom: K('telekom', 'Telekom Vertrag kündigen', 'den Vertrag für den Anschluss [Rufnummer]', 'fristgerecht zum nächstmöglichen Zeitpunkt', 'Leihgeräte (z. B. Router) sende ich nach Erhalt eines Rücksendeetiketts zurück.'),
    tvhd: K('tv_hd', 'Vodafone TV HD Paket kündigen', 'die Zusatzoption „HD“ bzw. das TV-Paket zum Vertrag {Kundennummer}', 'fristgerecht zum nächstmöglichen Zeitpunkt', 'Der übrige Vertrag soll unverändert bestehen bleiben.')
  };
  cat('Handy, Internet & TV', [ht.handy, ht.umzug, ht.telekom, ht.tvhd]);

  /* 9 Hausrecht */
  const hr = {
    firma: T('hausverbot_firma', 'Hausverbot auf Firmengelände erteilen', 'Erteilung eines Hausverbots',
      'hiermit erteilen wir Ihnen mit sofortiger Wirkung ein unbefristetes Hausverbot für das gesamte Firmengelände [Anschrift], einschließlich Parkplätzen und Nebengebäuden.\n\nAnlass: [Vorfall am Datum]\n\nBei Zuwiderhandlung stellen wir Strafantrag wegen Hausfriedensbruchs (§ 123 StGB).'),
    grund: T('hausverbot_grund', 'Hausverbot auf Grundstück erteilen', 'Erteilung eines Hausverbots',
      'hiermit erteile ich{Vertretung} Ihnen mit sofortiger Wirkung Hausverbot für das Grundstück [Anschrift] einschließlich Garten, Zufahrt und Gebäuden.\n\nAnlass: [Vorfall]\n\nBei Zuwiderhandlung werde ich Strafantrag wegen Hausfriedensbruchs stellen.')
  };
  cat('Hausrecht', [hr.firma, hr.grund]);

  /* 10 Inkasso & Forderungen */
  const ik = {
    verj: T('verjaehrung', 'Einrede der Verjährung erheben', 'Ihre Forderung vom [Datum] – Einrede der Verjährung – Zeichen {Aktenzeichen}',
      'Sie machen eine Forderung über [Betrag] € aus [Grund, Datum] geltend. Diese Forderung ist verjährt (§§ 195, 199 BGB).\n\nIch erhebe{Vertretung} hiermit ausdrücklich die Einrede der Verjährung. Zahlungen werden nicht geleistet. Bitte bestätigen Sie mir, dass die Angelegenheit erledigt ist.'),
    vollstr: T('vollstreckungsbescheid', 'Einspruch gegen Vollstreckungsbescheid', 'Einspruch gegen den Vollstreckungsbescheid vom [Datum] – Geschäftszeichen {Aktenzeichen}',
      'in dem Mahnverfahren [Antragsteller] gegen {NameMitAnrede} lege ich{Vertretung} gegen den Vollstreckungsbescheid vom [Datum], zugestellt am [Datum], Einspruch ein (§ 700 ZPO).\n\nDie Forderung wird in vollem Umfang bestritten. Ich beantrage zugleich, die Zwangsvollstreckung einstweilen einzustellen.'),
    gewinn: T('gewinnspiel', 'Gewinnspiel-Forderung abwehren', 'Ihre Forderung vom [Datum] – Zeichen {Aktenzeichen}',
      'Sie fordern einen Betrag von [Betrag] € für eine angebliche Teilnahme an einem Gewinnspiel bzw. ein Abonnement. Einen Vertrag habe ich{Vertretung} nicht geschlossen.\n\nVorsorglich widerrufe ich jede etwaige Erklärung und fechte sie an. Ich werde nicht zahlen. Bitte legen Sie mir andernfalls einen Vertragsnachweis vor.'),
    inkasso: T('inkasso', 'Inkasso-Forderung abwehren', 'Ihre Forderung im Auftrag von [Gläubiger] – Zeichen {Aktenzeichen}',
      'Sie machen im Auftrag von [Gläubiger] eine Forderung über [Betrag] € geltend. Diese Forderung bestreite ich{Vertretung} dem Grunde und der Höhe nach.\n\nBitte legen Sie mir den zugrunde liegenden Vertrag, eine Aufstellung der Hauptforderung und der Kosten sowie Ihre Inkassovollmacht vor. Bis dahin erfolgt keine Zahlung. Einer Weitergabe meiner Daten an Auskunfteien widerspreche ich.')
  };
  cat('Inkasso & Forderungen', ['raten', ik.verj, ik.vollstr, ik.gewinn, ik.inkasso]);

  /* 11 Jobcenter & Sozialleistungen */
  const jc = {
    bg: A('buergergeld', 'Bürgergeld beantragen', 'Antrag auf Bürgergeld – {Name}, geb. {Geburtsdatum}',
      'für {NameMitAnrede} ab dem [Datum] Leistungen der Grundsicherung (Bürgergeld) nach dem SGB II', 'Der Antrag gilt ab Eingang dieses Schreibens als gestellt. Bitte senden Sie mir die Antragsformulare zu.'),
    eil: T('eilantrag', 'Eilantrag beim Sozialgericht', 'Antrag auf Erlass einer einstweiligen Anordnung – {Name} gegen [Behörde]',
      'hiermit beantrage ich{Vertretung} den Erlass einer einstweiligen Anordnung (§ 86b Abs. 2 SGG), mit der [Behörde] verpflichtet wird, [Leistung] vorläufig zu gewähren.\n\nAnordnungsanspruch: [Warum besteht der Anspruch]\nAnordnungsgrund (Eilbedürftigkeit): [z. B. drohender Stromabschaltung / Wohnungsverlust / keine Mittel für Lebensunterhalt]\n\nBescheid, Widerspruch und Nachweise füge ich bei.'),
    erstaus: A('erstausstattung', 'Erstausstattung Wohnung beantragen', 'Antrag auf Erstausstattung der Wohnung – {Name} – BG-Nr. {Aktenzeichen}',
      'Leistungen für die Erstausstattung der Wohnung nach § 24 Abs. 3 SGB II', 'Anlass: [z. B. erste eigene Wohnung / Trennung / Wohnungsbrand]. Benötigt werden: [Möbel, Haushaltsgeräte].'),
    orts: A('ortsabwesenheit', 'Ortsabwesenheit beantragen', 'Antrag auf Zustimmung zur Ortsabwesenheit – BG-Nr. {Aktenzeichen}',
      'die Zustimmung zu einer Ortsabwesenheit vom [Datum] bis [Datum]', 'Ich bin in dieser Zeit erreichbar unter: [Anschrift/Telefon].'),
    anhoerung: T('anhoerung', 'Stellungnahme zur Anhörung des Jobcenters', 'Stellungnahme zur Anhörung vom [Datum] – BG-Nr. {Aktenzeichen}',
      'zu Ihrem Anhörungsschreiben vom [Datum] nehme ich{Vertretung} wie folgt Stellung:\n\n[Darstellung des Sachverhalts, Gründe]\n\nIch bitte, diese Gründe zu berücksichtigen und von einer Minderung bzw. Rückforderung abzusehen.'),
    sanktion: W('sanktion', 'Widerspruch Sanktionsbescheid', 'Ihren Minderungsbescheid (Sanktion)', '[Es lag ein wichtiger Grund vor: …] Die Anhörung wurde nicht ordnungsgemäß durchgeführt bzw. meine Gründe wurden nicht berücksichtigt.')
  };
  cat('Jobcenter & Sozialleistungen', [jc.bg, 'jc_weiter', 'jc_aenderung', 'jc_44', jc.eil, jc.erstaus, jc.orts, jc.anhoerung, jc.sanktion]);

  /* 12 Kauf & Reklamation */
  const kr = {
    nichtErh: T('ware_nicht_erhalten', 'Bezahlte Ware nicht erhalten', 'Bestellung Nr. [Bestellnummer] vom [Datum] – Ware nicht erhalten',
      'am [Datum] habe ich{Vertretung} bei Ihnen [Artikel] bestellt und [Betrag] € bezahlt. Die Ware ist bis heute nicht eingetroffen.\n\nIch setze Ihnen eine Frist zur Lieferung bis zum [Datum]. Nach fruchtlosem Ablauf trete ich vom Vertrag zurück und verlange die Rückzahlung des Kaufpreises.'),
    hwTermin: T('handwerker_termin', 'Handwerker Termin nicht eingehalten', 'Nicht eingehaltener Termin am [Datum] – Auftrag [Nummer]',
      'für den [Datum] war mit Ihnen ein Termin für [Arbeiten] vereinbart. Leider ist niemand erschienen und es erfolgte keine Absage.\n\nIch bitte um einen verbindlichen neuen Termin bis zum [Datum]. Andernfalls werde ich den Auftrag anderweitig vergeben.'),
    maengel: T('maengelruege', 'Mängelrüge an den Handwerker', 'Mängelrüge – Auftrag [Nummer] vom [Datum]',
      'die von Ihnen am [Datum] ausgeführten Arbeiten weisen folgende Mängel auf:\n\n– [Mangel 1]\n– [Mangel 2]\n\nIch fordere Sie auf, die Mängel bis zum [Datum] zu beseitigen. Bis zur Beseitigung behalte ich einen angemessenen Teil der Vergütung ein.'),
    nichtLief: T('ruecktritt_lieferung', 'Rücktritt vom Kaufvertrag wegen Nichtlieferung', 'Rücktritt vom Kaufvertrag – Bestellung [Bestellnummer]',
      'die mit Schreiben vom [Datum] gesetzte Frist zur Lieferung ist ergebnislos abgelaufen. Ich trete{Vertretung} hiermit vom Kaufvertrag zurück.\n\nBitte erstatten Sie den bereits gezahlten Betrag von [Betrag] € bis zum [Datum] auf das Konto IBAN [IBAN].'),
    sachm: T('ruecktritt_mangel', 'Rücktritt vom Kaufvertrag wegen Sachmangel', 'Rücktritt vom Kaufvertrag – [Artikel], gekauft am [Datum]',
      'der am [Datum] gekaufte Artikel [Artikel] weist folgenden Mangel auf: [Mangel]. Eine Nachbesserung ist [fehlgeschlagen / verweigert worden / nicht erfolgt].\n\nIch trete{Vertretung} deshalb vom Kaufvertrag zurück und bitte um Erstattung des Kaufpreises von [Betrag] € gegen Rückgabe der Ware.'),
    widerruf: T('widerruf_vertrag', 'Verbrauchervertrag widerrufen', 'Widerruf des Vertrags vom [Datum] – Bestell-/Vertragsnummer {Kundennummer}',
      'hiermit widerrufe ich{Vertretung} den von mir abgeschlossenen Vertrag über [Ware/Dienstleistung] vom [Datum] (§ 355 BGB).\n\nBitte erstatten Sie alle geleisteten Zahlungen innerhalb von 14 Tagen und bestätigen Sie mir den Widerruf.')
  };
  cat('Kauf & Reklamation', [kr.nichtErh, kr.hwTermin, kr.maengel, kr.nichtLief, kr.sachm, kr.widerruf]);

  /* 13 Kfz & Fahrzeug */
  const kf = {
    adac: K('adac', 'ADAC Mitgliedschaft kündigen – Frist 30. November', 'die Mitgliedschaft Nr. {Kundennummer}', 'zum Ende des laufenden Mitgliedsjahres'),
    bussgeld: T('bussgeld', 'Einspruch Bußgeldbescheid', 'Einspruch gegen den Bußgeldbescheid vom [Datum] – Aktenzeichen {Aktenzeichen}',
      'gegen den Bußgeldbescheid vom [Datum], zugestellt am [Datum], lege ich{Vertretung} Einspruch ein (§ 67 OWiG).\n\nZur Begründung bitte ich zunächst um Akteneinsicht, insbesondere in Messprotokoll, Eichschein und Fotos. Die Begründung folgt danach.'),
    kfzv: K('kfz_versicherung', 'Kfz-Versicherung kündigen', 'die Kfz-Versicherung für das Fahrzeug mit dem Kennzeichen [Kennzeichen], Versicherungsschein-Nr. {Kundennummer},', 'zum [Datum], hilfsweise zum nächstmöglichen Termin'),
    kasko: T('kasko', 'PKW Kasko Schadensmeldung', 'Schadensmeldung Kaskoversicherung – Versicherungsschein {Kundennummer} – Kennzeichen [Kennzeichen]',
      'hiermit melde ich{Vertretung} einen Schaden an dem bei Ihnen versicherten Fahrzeug:\n\nDatum/Ort: [Datum, Ort]\nHergang: [Beschreibung]\nSchaden: [Beschreibung]\n\nFotos und [Polizeiaktenzeichen] füge ich bei. Bitte teilen Sie mir mit, wie die Begutachtung erfolgen soll.'),
    unfall: T('unfall', 'PKW Unfallmeldung an eine Versicherung', 'Schadensmeldung Ihres Versicherungsnehmers – Kennzeichen [Kennzeichen]',
      'am [Datum] um [Uhrzeit] kam es in [Ort] zu einem Unfall mit Ihrem Versicherungsnehmer [Name], Kennzeichen [Kennzeichen].\n\nHergang: [Beschreibung]\n\nIch mache{Vertretung} den entstandenen Schaden geltend und bitte um Bestätigung Ihrer Eintrittspflicht bis zum [Datum].'),
    veraeuss: T('veraeusserung', 'Veräußerungsanzeige Fahrzeug', 'Veräußerungsanzeige – Kennzeichen [Kennzeichen] – Versicherungsschein {Kundennummer}',
      'hiermit zeige ich{Vertretung} an, dass das Fahrzeug [Marke/Modell], FIN [FIN], Kennzeichen [Kennzeichen], am [Datum] um [Uhrzeit] verkauft wurde.\n\nKäufer: [Name, Anschrift]\n\nEine Kopie des Kaufvertrags füge ich bei.')
  };
  cat('Kfz & Fahrzeug', [kf.adac, kf.bussgeld, kf.kfzv, kf.kasko, kf.unfall, kf.veraeuss]);

  /* 14 Krankenkasse (einschließlich Pflege) */
  const kk = {
    famv: A('familienversicherung', 'Familienversicherung beantragen', 'Antrag auf Familienversicherung – Mitgliedsnummer [Nummer]',
      'die Aufnahme von [Name], geboren am [Datum], in die beitragsfreie Familienversicherung ab dem [Datum] (§ 10 SGB V)', 'Den ausgefüllten Fragebogen und die Nachweise füge ich bei.'),
    fiktion: T('genehmigungsfiktion', 'Genehmigungsfiktion Krankenkasse', 'Eintritt der Genehmigungsfiktion – Antrag vom [Datum] – {Name}',
      'am [Datum] habe ich{Vertretung} die Leistung [Leistung] beantragt. Sie haben weder innerhalb von drei bzw. fünf Wochen entschieden noch mir rechtzeitig einen Grund für die Verzögerung mitgeteilt.\n\nDie Leistung gilt damit nach § 13 Abs. 3a SGB V als genehmigt. Ich bitte um Bestätigung bzw. Kostenerstattung.'),
    praev: A('praevention', 'Kostenerstattung Präventionsmaßnahme beantragen', 'Antrag auf Bezuschussung eines Präventionskurses – {Name} – {Krankenkasse}',
      'die Erstattung der Kosten für den Präventionskurs [Kursname] vom [Datum] bis [Datum] (§ 20 SGB V)', 'Teilnahmebescheinigung und Rechnung über [Betrag] € füge ich bei. Bitte überweisen Sie den Zuschuss auf IBAN [IBAN].'),
    schwanger: A('schwangerschaft', 'Kostenerstattung Schwangerschaftsvorsorge beantragen', 'Antrag auf Kostenerstattung – Schwangerschaftsvorsorge – {Krankenkasse}',
      'die Erstattung der Kosten für [Leistung, z. B. Ultraschall/Test] vom [Datum]', 'Rechnung über [Betrag] € und ärztliche Bescheinigung füge ich bei.'),
    kuend: K('krankenkasse', 'Krankenkasse kündigen', 'die Mitgliedschaft von {NameMitAnrede}, Versichertennummer [Nummer],', 'zum Ablauf des übernächsten Kalendermonats (§ 175 SGB V)', 'Die neue Krankenkasse wird Ihnen die Mitgliedschaft elektronisch melden.'),
    transport: A('fahrtkosten_erstattung', 'Rückerstattung der Fahrtkosten für Krankentransport', 'Antrag auf Erstattung von Fahrkosten – {Name} – {Krankenkasse}',
      'die Erstattung der Fahrkosten für Fahrten zur Behandlung am [Daten] bei [Praxis/Klinik]', 'Die Verordnung einer Krankenbeförderung sowie die Belege über [Betrag] € füge ich bei.'),
    sonder: K('krankenkasse_sonder', 'Sonderkündigung Krankenkasse (Zusatzbeitrag)', 'die Mitgliedschaft von {NameMitAnrede}, Versichertennummer [Nummer],', 'außerordentlich wegen der Erhöhung des Zusatzbeitrags zum [Datum] (§ 175 Abs. 4 SGB V)'),
    epa: T('epa', 'Widerspruch elektronische Patientenakte (ePA)', 'Widerspruch gegen die elektronische Patientenakte – {Name} – {Krankenkasse}',
      'für {NameMitAnrede}, geboren am {Geburtsdatum}, Versichertennummer [Nummer], widerspreche ich{Vertretung} der Einrichtung einer elektronischen Patientenakte (§ 342 SGB V). Ist bereits eine Akte angelegt, bitte ich um deren Löschung.\n\nBitte bestätigen Sie mir die Umsetzung schriftlich.'),
    reha: W('reha', 'Widerspruch gegen Reha-Ablehnung', 'Ihren Bescheid über die Ablehnung der Rehabilitationsmaßnahme', '[Medizinische Notwendigkeit, ärztliche Stellungnahme von … liegt bei]. Ambulante Maßnahmen reichen nicht aus.')
  };
  cat('Krankenkasse', [kk.famv, kk.fiktion, kk.praev, kk.schwanger, kk.kuend, kk.transport, 'kk_fahrt', 'kk_hilfsmittel', kk.sonder, ds.epaforsch, kk.epa, kk.reha, 'pk_antrag', 'pk_hoeher', 'pk_widerspruch', 'pk_entlastung', 'pk_verhinderung', 'kk_zuzahlung']);

  /* 15 Kündigungen */
  const kd = {
    abo: K('abo', 'Abonnement kündigen', 'das Abonnement [Titel/Dienst], Kundennummer {Kundennummer},'),
    bahncard: K('bahncard', 'Bahncard 25 oder 50 kündigen', 'das BahnCard-Abonnement [BahnCard 25/50], BahnCard-Nr. [Nummer],', 'zum Ende der aktuellen Geltungsdauer'),
    mietBest: T('miete_kuend_bestaetigung', 'Bestätigung der Kündigung des Mietvertrags', 'Bestätigung Ihrer Kündigung – Wohnung [Anschrift]',
      'hiermit bestätige ich den Eingang Ihrer Kündigung vom [Datum] für die Wohnung [Anschrift]. Das Mietverhältnis endet damit am [Datum].\n\nFür die Wohnungsübergabe schlage ich den [Datum] um [Uhrzeit] vor.'),
    fitAusser: T('fitness_ausserordentlich', 'Fitnessstudio außerordentlich kündigen', 'Außerordentliche Kündigung – Mitgliedsnummer {Kundennummer}',
      'hiermit kündige ich{Vertretung} meine Mitgliedschaft außerordentlich mit sofortiger Wirkung, hilfsweise zum nächstmöglichen Zeitpunkt.\n\nGrund: [z. B. Krankheit – ärztliches Attest liegt bei / Umzug nach … ].\n\nBitte bestätigen Sie mir die Kündigung und stellen Sie die Beitragseinzüge ein.'),
    fit: K('fitness', 'Fitnessstudio kündigen', 'meine Mitgliedschaft, Mitgliedsnummer {Kundennummer},'),
    fristlosMa: T('fristlos_ma', 'Fristlose Kündigung eines Mitarbeiters', 'Außerordentliche Kündigung Ihres Arbeitsverhältnisses',
      'hiermit kündigen wir das mit Ihnen bestehende Arbeitsverhältnis außerordentlich und fristlos aus wichtigem Grund (§ 626 BGB), hilfsweise ordentlich zum nächstmöglichen Termin.\n\nSie sind verpflichtet, sich unverzüglich bei der Agentur für Arbeit arbeitsuchend zu melden. Arbeitspapiere und Zeugnis erhalten Sie gesondert.'),
    igm: K('ig_metall', 'IG Metall kündigen', 'meine Mitgliedschaft, Mitgliedsnummer {Kundennummer},', 'zum Ende des Quartals unter Einhaltung der satzungsgemäßen Frist'),
    dating: K('dating', 'Kündigung Dating App', 'mein Premium-Abonnement für das Konto [E-Mail/Benutzername]', 'zum Ende der aktuellen Laufzeit', 'Bitte löschen Sie zugleich mein Profil und alle Daten (Art. 17 DSGVO).'),
    miete: K('mietvertrag', 'Mietvertrag kündigen', 'das Mietverhältnis über die Wohnung [Anschrift, Lage]', 'fristgerecht zum [Datum], hilfsweise zum nächstmöglichen Termin',
      'Für die Übergabe schlage ich den [Datum] vor. Bitte rechnen Sie die Kaution ab und überweisen Sie sie auf IBAN [IBAN].'),
    ma: T('ma_kuendigen', 'Mitarbeiter kündigen', 'Ordentliche Kündigung Ihres Arbeitsverhältnisses',
      'hiermit kündigen wir das mit Ihnen bestehende Arbeitsverhältnis ordentlich und fristgerecht zum [Datum], hilfsweise zum nächstmöglichen Termin.\n\nBitte melden Sie sich spätestens drei Monate vor Beendigung bzw. innerhalb von drei Tagen nach Erhalt dieser Kündigung bei der Agentur für Arbeit arbeitsuchend. Restliche Urlaubsansprüche [werden gewährt / werden abgegolten].'),
    mitglied: K('mitgliedschaft', 'Mitgliedschaft kündigen', 'meine Mitgliedschaft im [Verein/Verband], Mitgliedsnummer {Kundennummer},'),
    riester: T('riester', 'Riester ins Altersvorsorgedepot übertragen', 'Kündigung und Übertragung des Riester-Vertrags {Kundennummer}',
      'hiermit kündige ich{Vertretung} den Riester-Vertrag Nr. {Kundennummer} zum [Datum] mit dem Ziel der Übertragung des Guthabens auf einen anderen zertifizierten Altersvorsorgevertrag (§ 1 Abs. 1 Nr. 10 AltZertG).\n\nNeuer Anbieter: [Anbieter, Vertragsnummer]. Eine Bestätigung des neuen Anbieters füge ich bei.'),
    sovd: K('sovd', 'SoVD kündigen', 'meine Mitgliedschaft im Sozialverband, Mitgliedsnummer {Kundennummer},'),
    mietSonder: K('miete_sonder', 'Sonderkündigung nach Mieterhöhung', 'das Mietverhältnis über die Wohnung [Anschrift]', 'nach § 561 BGB zum Ablauf des übernächsten Monats, also zum [Datum]', 'Anlass ist Ihr Mieterhöhungsverlangen vom [Datum].'),
    sport: K('sportverein', 'Sportverein kündigen', 'meine Mitgliedschaft im [Verein], Mitgliedsnummer {Kundennummer},'),
    strom: K('strom', 'Stromanbieter kündigen', 'den Stromliefervertrag für die Lieferstelle [Anschrift], Zählernummer [Zählernummer],', 'fristgerecht zum [Datum], hilfsweise zum nächstmöglichen Termin', 'Zählerstand am [Datum]: [Stand]. Bitte senden Sie mir die Schlussrechnung.'),
    studium: K('studienvertrag', 'Studienvertrag kündigen', 'den Studienvertrag für den Studiengang [Studiengang], Matrikelnummer [Nummer],'),
    vdk: K('vdk', 'VdK kündigen', 'meine Mitgliedschaft im Sozialverband VdK, Mitgliedsnummer {Kundennummer},'),
    vers: K('versicherung', 'Versicherungsvertrag kündigen', 'den Versicherungsvertrag Nr. {Kundennummer}', 'zum Ablauf der Versicherungsperiode, hilfsweise zum nächstmöglichen Termin')
  };
  cat('Kündigungen', ['kuendigung', kf.adac, kd.abo, kd.bahncard, kd.mietBest, bk.darlehen, kd.fitAusser, kd.fit, kd.fristlosMa, gw.gewmiete, bk.giro, ht.handy, kd.igm, ht.umzug, kf.kfzv, fk.kita, kk.kuend,
    ab.arbeitsvertrag, ab.minijob, kd.dating, kd.miete, kd.ma, kd.mitglied, kd.riester, kd.sovd, kk.sonder, kd.mietSonder, bk.sparkasse, kd.sport, kd.strom, kd.studium, ht.telekom, kd.vdk, kd.vers, ht.tvhd]);

  /* 16 Mahnen & Rechnungen */
  const mr = {
    m2geb: T('mahnung2_geb', '2. Mahnung mit Teilzahlungs-Angebot und Mahngebühren', '2. Mahnung – Rechnung Nr. [Nummer] vom [Datum]',
      'trotz unserer Zahlungserinnerung vom [Datum] ist die Rechnung Nr. [Nummer] über [Betrag] € noch offen.\n\nBitte überweisen Sie den Betrag zuzüglich Mahngebühren von [Betrag] € bis zum [Datum]. Ist Ihnen das nicht in einer Summe möglich, bieten wir Ihnen eine Zahlung in [Anzahl] Raten an – bitte melden Sie sich bis zu diesem Datum.'),
    m2: T('mahnung2', '2. Mahnung ohne Mahngebühren', '2. Mahnung – Rechnung Nr. [Nummer] vom [Datum]',
      'leider konnten wir zu unserer Zahlungserinnerung vom [Datum] noch keinen Zahlungseingang feststellen. Offen ist weiterhin ein Betrag von [Betrag] €.\n\nBitte überweisen Sie den Betrag bis spätestens [Datum] auf IBAN [IBAN].'),
    m1: T('mahnung1', 'Zahlungserinnerung (1. Mahnung)', 'Zahlungserinnerung – Rechnung Nr. [Nummer] vom [Datum]',
      'sicher ist es Ihrer Aufmerksamkeit entgangen: Die Rechnung Nr. [Nummer] vom [Datum] über [Betrag] € ist seit dem [Datum] fällig.\n\nBitte überweisen Sie den Betrag bis zum [Datum]. Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie es bitte als gegenstandslos.')
  };
  cat('Mahnen & Rechnungen', [mr.m2geb, mr.m2, mr.m1]);

  /* 17 Personal & Arbeitgeber */
  const pa = {
    alkohol: T('abmahnung_alkohol', 'Abmahnung Alkohol am Arbeitsplatz', 'Abmahnung',
      'am [Datum] haben Sie während der Arbeitszeit unter Alkoholeinfluss gearbeitet [Beschreibung des Vorfalls]. Damit haben Sie gegen das betriebliche Alkoholverbot bzw. Ihre arbeitsvertraglichen Pflichten verstoßen.\n\nWir mahnen Sie wegen dieses Verhaltens ab und fordern Sie auf, es künftig zu unterlassen. Im Wiederholungsfall müssen Sie mit einer Kündigung rechnen.'),
    initiativ: T('absage_initiativ', 'Absage Initiativbewerbung', 'Ihre Initiativbewerbung vom [Datum]',
      'vielen Dank für Ihre Initiativbewerbung und Ihr Interesse an unserem Unternehmen. Leider haben wir derzeit keine passende Stelle zu besetzen.\n\nIhre Unterlagen senden wir zurück bzw. löschen sie nach Ablauf von sechs Monaten. Wir wünschen Ihnen für Ihren weiteren Weg alles Gute.'),
    ezBest: T('elternzeit_best', 'Bestätigung Elternzeit durch Arbeitgeber', 'Bestätigung Ihrer Elternzeit',
      'wir bestätigen den Eingang Ihrer Anmeldung vom [Datum]. Ihre Elternzeit beginnt am [Datum] und endet am [Datum].\n\nWährend der Elternzeit ruht das Arbeitsverhältnis. [Der Urlaubsanspruch wird für jeden vollen Monat der Elternzeit um ein Zwölftel gekürzt.]'),
    absage: T('bewerbungsabsage', 'Bewerbungsabsage', 'Ihre Bewerbung als [Position]',
      'vielen Dank für Ihre Bewerbung und das Interesse an der Stelle als [Position]. Nach sorgfältiger Prüfung haben wir uns für eine andere Bewerberin bzw. einen anderen Bewerber entschieden.\n\nWir wünschen Ihnen für Ihre weitere berufliche Zukunft viel Erfolg.'),
    freist: T('freistellung_ma', 'Widerrufliche Freistellung eines Angestellten', 'Freistellung von der Arbeitsleistung',
      'mit Wirkung ab dem [Datum] stellen wir Sie widerruflich von der Pflicht zur Arbeitsleistung frei. Ihre Vergütung wird in dieser Zeit fortgezahlt.\n\nDie Freistellung erfolgt unter Anrechnung auf Resturlaub und Überstunden. Bitte halten Sie sich für eine Rückkehr an den Arbeitsplatz bereit.')
  };
  cat('Personal & Arbeitgeber', [pa.alkohol, pa.initiativ, pa.ezBest, pa.absage, kd.fristlosMa, kd.ma, pa.freist]);

  /* 18 Reise & Verkehr */
  const rv = {
    flug: T('flugverspaetung', 'Entschädigung bei Flugverspätung', 'Ausgleichszahlung nach Art. 7 VO (EG) 261/2004 – Flug [Flugnummer] am [Datum]',
      'der Flug [Flugnummer] von [Abflugort] nach [Zielort] am [Datum] erreichte das Ziel mit einer Verspätung von [Stunden] Stunden. Buchungsnummer: [Nummer].\n\nIch mache{Vertretung} eine Ausgleichszahlung von [250/400/600] € pro Person geltend und bitte um Überweisung bis zum [Datum] auf IBAN [IBAN].'),
    gepaeck: T('gepaeck', 'Gepäckschaden reklamieren', 'Gepäckschaden – Flug [Flugnummer] am [Datum] – PIR [Nummer]',
      'mein Gepäckstück wurde auf dem Flug [Flugnummer] am [Datum] beschädigt. Die Schadensanzeige (PIR) wurde am Flughafen aufgenommen.\n\nSchaden: [Beschreibung]\nHöhe: [Betrag] €\n\nBelege und Fotos füge ich bei. Ich bitte um Erstattung bis zum [Datum].'),
    minderung: T('reisepreisminderung', 'Reisepreisminderung fordern', 'Minderung des Reisepreises – Buchungsnummer [Nummer]',
      'während der Pauschalreise vom [Datum] bis [Datum] nach [Ziel] traten folgende Mängel auf, die ich vor Ort angezeigt habe:\n\n– [Mangel, Zeitraum]\n\nIch mache{Vertretung} eine Minderung des Reisepreises von [Prozent] %, also [Betrag] €, geltend (§ 651m BGB) und bitte um Erstattung bis zum [Datum].')
  };
  cat('Reise & Verkehr', [rv.flug, rv.gepaeck, rv.minderung]);

  /* 19 Rente & Altersvorsorge */
  cat('Rente & Altersvorsorge', ['rv_verlauf', 'rv_konten', 'rv_formlos', kd.riester]);

  /* 20 Rundfunkbeitrag */
  const rf = {
    bar: T('rundfunk_bar', 'Barzahlung von Rundfunkgebühr', 'Angebot der Barzahlung – Beitragsnummer {Kundennummer}',
      'für die Beitragsnummer {Kundennummer} biete ich{Vertretung} die Zahlung des Rundfunkbeitrags in bar an. Bitte teilen Sie mir mit, wo und wie die Zahlung entgegengenommen wird.'),
    befreiung: A('rundfunk_befreiung', 'Befreiung vom Rundfunkbeitrag', 'Antrag auf Befreiung vom Rundfunkbeitrag – Beitragsnummer {Kundennummer}',
      'für {NameMitAnrede} die Befreiung von der Rundfunkbeitragspflicht (§ 4 RBStV)', 'Grund: Bezug von [Grundsicherung / Bürgergeld / Pflegeleistung / Merkzeichen RF]. Den Bescheid in Kopie füge ich bei.'),
    wg: T('rundfunk_wg', 'Rundfunkbeitrag WG abmelden', 'Abmeldung – Beitragsnummer {Kundennummer}',
      'in der Wohnung [Anschrift] zahlt bereits [Name] den Rundfunkbeitrag unter der Beitragsnummer [Nummer]. Da pro Wohnung nur ein Beitrag anfällt, melde ich{Vertretung} mein Beitragskonto zum [Datum] ab.'),
    fest: W('rundfunk_fest', 'Widerspruch gegen Festsetzungsbescheid (Rundfunkbeitrag)', 'Ihren Festsetzungsbescheid (Rundfunkbeitrag)', '[z. B. Die Wohnung ist bereits angemeldet / Befreiung lag vor / falscher Zeitraum].'),
    vorbehalt: T('rundfunk_vorbehalt', 'Zahlung von Rundfunkbeiträgen unter Rechtsvorbehalt', 'Zahlung unter Vorbehalt – Beitragsnummer {Kundennummer}',
      'die Rundfunkbeiträge für die Beitragsnummer {Kundennummer} zahle ich{Vertretung} ab sofort nur unter dem Vorbehalt der Rückforderung. Eine Anerkennung der Forderung ist damit nicht verbunden.')
  };
  cat('Rundfunkbeitrag', [rf.bar, rf.befreiung, rf.wg, rf.fest, rf.vorbehalt]);

  /* 21 Schule & Studium */
  const sc = {
    arzt: T('entschuldigung_arzt', 'Entschuldigung wegen Arzttermin', 'Entschuldigung für [Name des Kindes], Klasse [Klasse]',
      'bitte entschuldigen Sie das Fehlen meines Kindes [Name] am [Datum] von [Uhrzeit] bis [Uhrzeit] wegen eines nicht verschiebbaren Arzttermins.'),
    krank: T('entschuldigung_krank', 'Entschuldigung wegen Krankheit', 'Entschuldigung für [Name des Kindes], Klasse [Klasse]',
      'mein Kind [Name] konnte vom [Datum] bis [Datum] wegen Krankheit nicht am Unterricht teilnehmen. Ich bitte, das Fehlen zu entschuldigen.'),
    exma: A('exmatrikulation', 'Exmatrikulation beantragen', 'Antrag auf Exmatrikulation – Matrikelnummer [Nummer]',
      'meine Exmatrikulation zum [Datum]', 'Studiengang: [Studiengang]. Bitte senden Sie mir die Exmatrikulationsbescheinigung zu.'),
    sport: T('sport_frei', 'Freistellung vom Sportunterricht wegen Krankheit', 'Befreiung vom Sportunterricht – [Name des Kindes], Klasse [Klasse]',
      'mein Kind [Name] kann wegen [Erkrankung/Verletzung] vom [Datum] bis voraussichtlich [Datum] nicht am Sportunterricht teilnehmen. Ein ärztliches Attest füge ich bei.'),
    unterricht: A('unterricht_frei', 'Freistellung vom Unterricht', 'Antrag auf Unterrichtsbefreiung – [Name des Kindes], Klasse [Klasse]',
      'die Befreiung meines Kindes [Name] vom Unterricht am [Datum]', 'Grund: [z. B. Familienfeier / religiöser Feiertag / Behördentermin].'),
    arbeit: A('studienarbeit_frist', 'Fristverlängerung Studienarbeit beantragen', 'Antrag auf Verlängerung der Bearbeitungszeit – Matrikelnummer [Nummer]',
      'die Verlängerung der Abgabefrist meiner [Haus-/Abschlussarbeit] „[Thema]“ vom [Datum] bis zum [Datum]', 'Grund: [z. B. Krankheit – Attest liegt bei].')
  };
  cat('Schule & Studium', [sc.arzt, sc.krank, sc.exma, sc.sport, sc.unterricht, sc.arbeit, kd.studium]);

  /* 22 Urkunden & Bescheinigungen */
  const uk = {
    geburt: A('geburtsurkunde', 'Geburtsurkunde beantragen', 'Antrag auf Ausstellung einer Geburtsurkunde – {Name}',
      'die Ausstellung von [Anzahl] Geburtsurkunde(n) für {NameMitAnrede}, geboren am {Geburtsdatum} in [Geburtsort]', 'Verwendungszweck: [Zweck]. Die Gebühr überweise ich nach Erhalt Ihrer Rechnung.'),
    name: T('namensaenderung', 'Namensänderung nach Hochzeit', 'Mitteilung der Namensänderung – Kundennummer {Kundennummer}',
      'durch meine Eheschließung am [Datum] hat sich mein Nachname geändert:\n\nbisher: [alter Name]\nneu: [neuer Name]\n\nBitte ändern Sie Ihre Unterlagen entsprechend. Eine Kopie der Eheurkunde füge ich bei.'),
    insolvenz: A('negativ_insolvenz', 'Negativbescheinigung Insolvenz', 'Antrag auf Negativbescheinigung – {Name}',
      'die Ausstellung einer Bescheinigung, dass über das Vermögen von {NameMitAnrede}, geboren am {Geburtsdatum}, kein Insolvenzverfahren anhängig ist', 'Verwendungszweck: [Zweck].'),
    sorge: A('negativ_sorge', 'Negativbescheinigung Sorgerecht', 'Antrag auf Negativbescheinigung zum Sorgerecht – Kind [Name]',
      'die Ausstellung einer Bescheinigung, dass für mein Kind [Name], geboren am [Datum], keine Sorgeerklärungen abgegeben wurden (§ 58a SGB VIII)', 'Ich bin die Mutter des Kindes und mit dem Vater nicht verheiratet.')
  };
  cat('Urkunden & Bescheinigungen', [uk.geburt, uk.name, uk.insolvenz, uk.sorge]);

  /* 23 Versicherung */
  const vs = {
    beginn: A('beginnverlegung', 'Antrag auf Beginnverlegung einer Versicherung', 'Antrag auf Verlegung des Versicherungsbeginns – Antrag/Vertrag {Kundennummer}',
      'den Versicherungsbeginn des Vertrags {Kundennummer} vom [Datum] auf den [Datum] zu verlegen', 'Grund: [Grund].'),
    leben: T('lebensversicherung', 'Lebensversicherung widerrufen (Widerrufsjoker)', 'Widerruf des Lebensversicherungsvertrags {Kundennummer}',
      'hiermit widerrufe ich{Vertretung} den Lebens- bzw. Rentenversicherungsvertrag Nr. {Kundennummer}. Die Widerrufsbelehrung bei Vertragsschluss war fehlerhaft, sodass die Widerrufsfrist nicht zu laufen begonnen hat.\n\nIch fordere die Rückzahlung aller Beiträge zuzüglich gezogener Nutzungen und bitte um eine Abrechnung bis zum [Datum].'),
    reise: A('reiseruecktritt', 'Reiserücktrittskosten erstatten', 'Schadensmeldung Reiserücktritt – Versicherungsnummer {Kundennummer}',
      'die Erstattung der Stornokosten von [Betrag] € für die Reise vom [Datum] bis [Datum]', 'Grund für den Rücktritt: [z. B. unerwartete schwere Erkrankung – Attest liegt bei]. Buchungsbestätigung und Stornorechnung füge ich bei.'),
    frei: A('beitragsfrei', 'Versicherung beitragsfrei stellen', 'Antrag auf Beitragsfreistellung – Vertrag {Kundennummer}',
      'die Beitragsfreistellung des Vertrags {Kundennummer} zum [Datum]', 'Bitte teilen Sie mir die beitragsfreie Versicherungssumme und die Bedingungen einer späteren Wiederaufnahme mit.')
  };
  cat('Versicherung', [vs.beginn, vs.leben, vs.reise, vs.frei, kd.vers]);

  /* 24 Verträge & Abos */
  const va = {
    still: A('stilllegung', 'Mitgliedschaft stilllegen', 'Antrag auf Ruhen der Mitgliedschaft – Mitgliedsnummer {Kundennummer}',
      'die Stilllegung meiner Mitgliedschaft vom [Datum] bis [Datum]', 'Grund: [z. B. Krankheit / Schwangerschaft / Auslandsaufenthalt]. Nachweise füge ich bei. Bitte setzen Sie die Beiträge in dieser Zeit aus.')
  };
  cat('Verträge & Abos', [kd.abo, kd.bahncard, kd.fitAusser, kd.fit, kd.igm, kd.dating, kd.mitglied, va.still, kd.sovd, kd.sport, kd.strom, kd.vdk]);

  /* 25 Vollmacht & Bürgschaft */
  const vb = {
    buergEinf: T('buergschaft', 'Einfache Bürgschaft', 'Bürgschaftserklärung',
      'hiermit übernehme ich gegenüber [Gläubiger] die Bürgschaft für die Verbindlichkeiten von [Schuldner] aus [Vertrag vom Datum] bis zu einem Höchstbetrag von [Betrag] €.\n\nDie Bürgschaft ist eine Ausfallbürgschaft; die Einrede der Vorausklage bleibt mir erhalten.'),
    elternb: T('elternbuergschaft', 'Elternbürgschaft für Mietvertrag', 'Bürgschaft für den Mietvertrag von [Name des Kindes]',
      'für die Verpflichtungen meines Kindes [Name] aus dem Mietvertrag über die Wohnung [Anschrift] vom [Datum] übernehme ich die Bürgschaft bis zur Höhe von drei Nettokaltmieten, also [Betrag] €.'),
    mietb: T('mietbuergschaft', 'Mietbürgschaftserklärung', 'Mietbürgschaft – Wohnung [Anschrift]',
      'hiermit verbürge ich mich gegenüber [Vermieter] für alle Ansprüche aus dem Mietverhältnis mit [Mieter] über die Wohnung [Anschrift] bis zu einem Höchstbetrag von [Betrag] € (§ 551 BGB).'),
    ausst: T('vollmacht_ausstellen', 'Vollmacht ausstellen', 'Vollmacht',
      'hiermit bevollmächtige ich, [Vollmachtgeber, Geburtsdatum, Anschrift],\n\n[Bevollmächtigte Person, Geburtsdatum, Anschrift],\n\nmich in folgenden Angelegenheiten zu vertreten: [Umfang, z. B. gegenüber Behörden, Banken, Versicherungen].\n\nDie Vollmacht gilt [ab sofort / vom … bis …] und kann jederzeit widerrufen werden.\n\n[Ort, Datum, Unterschrift des Vollmachtgebers]'),
    kind: T('vollmacht_kind', 'Vollmacht zur Kontoeröffnung für Kind', 'Vollmacht zur Kontoeröffnung für [Name des Kindes]',
      'als gemeinsam sorgeberechtigte Eltern von [Name], geboren am [Datum], bevollmächtige ich [Name des anderen Elternteils], allein ein Konto für unser Kind bei [Bank] zu eröffnen und zu verwalten.')
  };
  cat('Vollmacht & Bürgschaft', ['vollmacht', vb.buergEinf, vb.elternb, vb.mietb, vb.ausst, vb.kind]);

  /* 26 Widerruf */
  cat('Widerruf', [vs.leben, kr.widerruf, 'sepa', ds.werbung]);

  /* 27 Widerspruch & Einspruch */
  const wo = {
    mieterh: T('mieterhoehung', 'Mieterhöhung widersprechen', 'Ihr Mieterhöhungsverlangen vom [Datum] – Wohnung [Anschrift]',
      'Ihrem Verlangen vom [Datum], die Miete auf [Betrag] € zu erhöhen, stimme ich{Vertretung} nicht zu.\n\nBegründung: [z. B. Die ortsübliche Vergleichsmiete laut Mietspiegel liegt bei … € / die Kappungsgrenze ist überschritten / formale Mängel].'),
    eigen: T('eigenbedarf', 'Widerspruch gegen Eigenbedarfskündigung', 'Widerspruch gegen Ihre Kündigung vom [Datum] – Wohnung [Anschrift]',
      'gegen Ihre Kündigung wegen Eigenbedarfs vom [Datum] lege ich{Vertretung} Widerspruch ein und verlange die Fortsetzung des Mietverhältnisses (§ 574 BGB).\n\nDie Beendigung wäre eine nicht zu rechtfertigende Härte: [z. B. hohes Alter, Krankheit, Pflegebedürftigkeit, fehlender Ersatzwohnraum]. Den Eigenbedarf bestreite ich vorsorglich.'),
    nk: T('nebenkosten', 'Widerspruch gegen Nebenkostenabrechnung', 'Einwendungen gegen die Nebenkostenabrechnung [Jahr] – Wohnung [Anschrift]',
      'gegen Ihre Nebenkostenabrechnung für [Jahr] vom [Datum] erhebe ich{Vertretung} folgende Einwendungen (§ 556 Abs. 3 BGB):\n\n– [Position, Grund]\n\nBis zur Klärung zahle ich die Nachforderung nur unter Vorbehalt bzw. nicht. Ich bitte um Einsicht in die Belege.')
  };
  cat('Widerspruch & Einspruch', ['widerspruch', kf.bussgeld, fa.est, fa.grund, ik.vollstr, ab.abmahnung, wo.mieterh, jc.sanktion, kk.epa, bk.abbuchung, wo.eigen, rf.fest, wo.nk, kk.reha, 'pk_widerspruch', 'jc_44']);

  /* 28 Wohnen & Miete */
  const wm = {
    adresse: T('adressaenderung', 'Adressänderung nach Umzug mitteilen', 'Neue Anschrift – Kundennummer {Kundennummer}',
      'ab dem [Datum] lautet die Anschrift{Vertretung}:\n\n[neue Anschrift]\n\nBitte senden Sie künftige Post an diese Adresse und bestätigen Sie mir die Änderung.'),
    belege: T('belegeinsicht', 'Belegeinsicht Nebenkostenabrechnung', 'Belegeinsicht zur Nebenkostenabrechnung [Jahr]',
      'zur Prüfung der Nebenkostenabrechnung [Jahr] vom [Datum] bitte ich{Vertretung} um Einsicht in die Originalbelege (§ 259 BGB). Bitte nennen Sie mir einen Termin bis zum [Datum] oder senden Sie mir Kopien gegen Kostenerstattung.'),
    laerm: T('nachbar_laerm', 'Brief an den Nachbarn wegen Lärm', 'Ruhestörung',
      'leider kommt es in letzter Zeit häufig zu Lärm aus Ihrer Wohnung, zuletzt am [Daten], vor allem [Uhrzeit/Art des Lärms].\n\nIch möchte das gern freundlich klären und bitte Sie, besonders während der Ruhezeiten Rücksicht zu nehmen. Für ein Gespräch bin ich jederzeit offen.'),
    eigentuemer: T('eigentuemerwechsel', 'Eigentümerwechsel einer Mietwohnung', 'Eigentümerwechsel – Wohnung [Anschrift]',
      'hiermit teilen wir Ihnen mit, dass das Eigentum an der von Ihnen gemieteten Wohnung [Anschrift] zum [Datum] auf [neuer Eigentümer] übergegangen ist. Das Mietverhältnis besteht unverändert fort (§ 566 BGB).\n\nBitte überweisen Sie die Miete ab [Monat] auf das Konto IBAN [IBAN].'),
    balkon: T('balkonkraftwerk', 'Erlaubnis für Balkonkraftwerk anfragen', 'Antrag auf Zustimmung zu einem Steckersolargerät – Wohnung [Anschrift]',
      'ich möchte{Vertretung} am Balkon der Wohnung [Anschrift] ein Steckersolargerät mit [Leistung] W installieren. Die Befestigung erfolgt sicher und ohne Eingriff in die Bausubstanz.\n\nIch bitte um Ihre Zustimmung (§ 554 BGB). Produktdatenblatt und Fotos füge ich bei.'),
    sat: T('satellit', 'Erlaubnis für Satellitenschüssel anfragen', 'Antrag auf Erlaubnis einer Satellitenschüssel – Wohnung [Anschrift]',
      'ich bitte{Vertretung} um die Erlaubnis, an [Ort, z. B. Balkon] eine Satellitenschüssel anzubringen. Grund: [z. B. Empfang muttersprachlicher Programme]. Die Montage erfolgt fachgerecht; Kosten und Rückbau übernehme ich.'),
    tier: T('tierhaltung', 'Erlaubnis zur Tierhaltung beantragen', 'Antrag auf Erlaubnis zur Tierhaltung – Wohnung [Anschrift]',
      'ich bitte{Vertretung} um Ihre Erlaubnis, in der Wohnung [Anschrift] einen [Tierart, Rasse, Größe] zu halten. Das Tier ist [ruhig / gut erzogen]; eine Haftpflichtversicherung besteht.'),
    unterv: T('untervermietung', 'Erlaubnis zur Untervermietung beantragen', 'Antrag auf Erlaubnis zur Untervermietung – Wohnung [Anschrift]',
      'ich bitte{Vertretung} um die Erlaubnis, ab dem [Datum] einen Teil der Wohnung an [Name, Beruf] unterzuvermieten (§ 553 BGB). Berechtigtes Interesse: [Grund, z. B. finanzielle Veränderung].'),
    heiz: T('heizkosten', 'Heizkostenabrechnung kürzen', 'Kürzung der Heizkostenabrechnung [Jahr] um 15 %',
      'die Heizkosten für [Jahr] wurden nicht verbrauchsabhängig abgerechnet bzw. nicht fernablesbar erfasst. Ich kürze{Vertretung} den auf mich entfallenden Anteil daher um 15 % (§ 12 HeizkostenV).'),
    minderung: T('mietminderung', 'Mietminderung aufgrund von Mängeln', 'Mietminderung wegen Mängeln – Wohnung [Anschrift]',
      'die am [Datum] angezeigten Mängel ([Mangel]) bestehen weiterhin. Ab dem [Datum] mindere ich{Vertretung} die Miete um [Prozent] % (§ 536 BGB) und zahle die Differenz nur unter Vorbehalt.\n\nBitte beseitigen Sie die Mängel bis zum [Datum].'),
    maengel: T('wohnung_maengel', 'Mängel in der Wohnung anzeigen', 'Mängelanzeige – Wohnung [Anschrift]',
      'in der Wohnung [Anschrift] sind folgende Mängel aufgetreten (§ 536c BGB):\n\n– [Mangel, seit wann]\n\nIch bitte{Vertretung} um Beseitigung bis zum [Datum]. Fotos füge ich bei. Für einen Termin bin ich erreichbar unter [Telefon].'),
    nachm: T('nachmieter', 'Nachmieter vorschlagen', 'Vorschlag eines Nachmieters – Wohnung [Anschrift]',
      'für die Wohnung [Anschrift] schlage ich{Vertretung} Ihnen folgenden Nachmieter vor:\n\n[Name, Beruf, Kontakt]\n\nDie Person ist bereit, den Mietvertrag zu den bisherigen Bedingungen ab dem [Datum] zu übernehmen. Ich bitte um vorzeitige Entlassung aus dem Mietvertrag.'),
    nkMieter: T('nk_an_mieter', 'Nebenkostenabrechnung an einen Mieter', 'Betriebskostenabrechnung [Jahr] – Wohnung [Anschrift]',
      'anbei erhalten Sie die Betriebskostenabrechnung für den Zeitraum [Datum] bis [Datum].\n\nGesamtkosten Ihr Anteil: [Betrag] €\nVorauszahlungen: [Betrag] €\nErgebnis: [Nachzahlung/Guthaben] [Betrag] €\n\nBitte überweisen Sie die Nachzahlung bis zum [Datum] bzw. wir erstatten das Guthaben auf Ihr Konto.'),
    renov: T('renovierung', 'Renovierung beim Auszug zurückweisen', 'Ihre Forderung nach Schönheitsreparaturen – Wohnung [Anschrift]',
      'Sie verlangen die Renovierung der Wohnung [Anschrift] beim Auszug. Die Klausel im Mietvertrag ist unwirksam [z. B. starre Fristen / Wohnung unrenoviert übernommen].\n\nIch werde{Vertretung} daher keine Schönheitsreparaturen durchführen.'),
    kaution: T('kaution', 'Rückzahlung der Mietkaution', 'Rückzahlung der Mietkaution – Wohnung [Anschrift]',
      'das Mietverhältnis über die Wohnung [Anschrift] endete am [Datum]; die Wohnung wurde ordnungsgemäß übergeben.\n\nIch bitte{Vertretung} um Rückzahlung der Kaution von [Betrag] € zuzüglich Zinsen bis zum [Datum] auf IBAN [IBAN].'),
    ruhe: T('vermieter_ruhe', 'Vermieter über Ruhestörung informieren', 'Ruhestörung im Haus [Anschrift]',
      'seit [Zeitraum] kommt es durch die Bewohner der Wohnung [Lage] regelmäßig zu erheblichen Ruhestörungen, insbesondere [Zeiten, Art]. Ein Lärmprotokoll füge ich bei.\n\nIch bitte{Vertretung} Sie, auf die Einhaltung der Hausordnung hinzuwirken.'),
    wgb: T('wohnungsgeber', 'Wohnungsgeberbestätigung anfordern', 'Bitte um Wohnungsgeberbestätigung – Wohnung [Anschrift]',
      'zum [Datum] bin ich{Vertretung} in die Wohnung [Anschrift] eingezogen. Für die Anmeldung beim Bürgeramt benötige ich eine Wohnungsgeberbestätigung (§ 19 BMG). Bitte senden Sie sie mir bis zum [Datum] zu.'),
    bremse: T('mietpreisbremse', 'Zu hohe Miete zurückerstatten (Mietpreisbremse)', 'Rüge nach § 556g BGB – Wohnung [Anschrift]',
      'die vereinbarte Miete von [Betrag] € übersteigt die ortsübliche Vergleichsmiete um mehr als 10 %. Ich rüge{Vertretung} hiermit einen Verstoß gegen die Mietpreisbremse (§ 556g BGB).\n\nBitte erteilen Sie mir Auskunft über die Vormiete und erstatten Sie die zu viel gezahlte Miete ab Zugang dieser Rüge.')
  };
  cat('Wohnen & Miete', [wm.adresse, 'aenderung', wm.belege, kd.mietBest, wm.laerm, wm.eigentuemer, wm.balkon, wm.sat, wm.tier, wm.unterv, wm.heiz, wo.mieterh, wm.minderung, kd.miete, wm.maengel, wm.nachm, wm.nkMieter, wm.renov, wm.kaution,
    kd.mietSonder, wm.ruhe, wo.eigen, wo.nk, wm.wgb, wm.bremse]);

  // Allgemeine Briefe (eigene Vorlagen von Home Office) – stehen oben als „Häufig genutzt“
  const top = { 'Häufig genutzt': ['vollmacht', 'antrag', 'unterlagen', 'sachstand', 'frist', 'aenderung', 'kuendigung', 'widerspruch', 'raten', 'frei'] };
  window.TPL_EXTRA = L;
  window.TPL_KAT = Object.entries(Object.assign(top, K_)).map(([k, ids]) => ({ k, ids: [...new Set(ids)] }));
})();
