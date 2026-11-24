// Home Office – E-Mail (Hauptprozess): Postfächer per IMAP abrufen, Mails per SMTP senden (Kopie in „Gesendet“).
// Konten in oh-prefs.json (ohne Passwort), Passwörter nur verschlüsselt (safeStorage) in oh-secrets.json unter „mail:<id>“.
// Die Oberfläche bekommt nie ein Passwort zurück.
'use strict';
const path = require('path');
const fs = require('fs');

module.exports = function setupMail({ app, ipcMain, safeStorage }) {
  const file = n => path.join(app.getPath('userData'), n);
  const readJson = (n, d) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch (e) { return d; } };
  const writeJson = (n, v) => { const f = file(n), t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(v), { encoding: 'utf8', mode: 0o600 }); fs.renameSync(t, f); };
  const errText = e => String(e && (e.responseText || e.message) || e).split('\n')[0];
  const secret = k => { const raw = readJson('oh-secrets.json', {}); try { return raw[k] && safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(raw[k], 'base64')) : ''; } catch (e) { return ''; } };
  const setSecret = (k, v) => { const raw = readJson('oh-secrets.json', {}); if (!v) delete raw[k]; else { if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows-Verschlüsselung ist nicht verfügbar.'); raw[k] = safeStorage.encryptString(String(v)).toString('base64'); } writeJson('oh-secrets.json', raw); };
  const konten = () => (readJson('oh-prefs.json', {}).mail || []);
  const speichereKonten = list => { const p = readJson('oh-prefs.json', {}); p.mail = list; writeJson('oh-prefs.json', p); };
  const VORGABE = { host: 'imap.mail.de', port: 993, smtpHost: 'smtp.mail.de', smtpPort: 465 };
  const sauber = a => ({ id: String(a.id), user: String(a.user || '').trim(), name: String(a.name || '').trim(), personId: String(a.personId || ''),
    host: String(a.host || VORGABE.host).trim(), port: Number(a.port) || VORGABE.port, smtpHost: String(a.smtpHost || VORGABE.smtpHost).trim(), smtpPort: Number(a.smtpPort) || VORGABE.smtpPort,
    lastUid: Number(a.lastUid) || 0, uidValidity: String(a.uidValidity || ''), lastCheck: a.lastCheck || '' });

  let ImapFlow, simpleParser, nodemailer;
  const libs = () => { if (!ImapFlow) { ImapFlow = require('imapflow').ImapFlow; simpleParser = require('mailparser').simpleParser; nodemailer = require('nodemailer'); } };
  const imap = a => { libs(); return new ImapFlow({ host: a.host, port: a.port, secure: true, auth: { user: a.user, pass: secret('mail:' + a.id) }, logger: false, socketTimeout: 60000 }); };

  ipcMain.handle('oh:mailKonten', () => konten().map(a => Object.assign(sauber(a), { hatPasswort: !!secret('mail:' + a.id) })));
  // Konto anlegen/ändern; Passwort nur, wenn neu eingegeben. Danach Anmeldung testen.
  ipcMain.handle('oh:mailKontoSpeichern', async (e, a, pass) => {
    try {
      a = sauber(Object.assign({ id: 'k' + Date.now().toString(36) }, a));
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.user)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
      const list = konten(), i = list.findIndex(x => x.id === a.id);
      if (i >= 0) a = Object.assign({}, list[i], a, { lastUid: list[i].lastUid, uidValidity: list[i].uidValidity }); else list.push(a);
      if (i >= 0) list[i] = a;
      if (pass) setSecret('mail:' + a.id, String(pass));
      if (!secret('mail:' + a.id)) throw new Error('Bitte das Passwort (App-Passwort) eingeben.');
      const c = imap(a); await c.connect(); await c.logout();
      speichereKonten(list);
      return { ok: true, id: a.id };
    } catch (err) { return { ok: false, message: /auth|login|credentials|AUTHENTICATIONFAILED/i.test(errText(err)) ? 'Anmeldung abgelehnt – E-Mail oder Passwort falsch (bei Zwei-Faktor ein App-Passwort verwenden, IMAP in mail.de einschalten).' : errText(err) }; }
  });
  ipcMain.handle('oh:mailKontoLoeschen', (e, id) => { speichereKonten(konten().filter(x => x.id !== id)); try { setSecret('mail:' + id, ''); } catch (err) {} return { ok: true }; });

  // Neue Mails seit dem letzten Abruf (beim ersten Mal: die letzten 7 Tage, höchstens 40). Anhänge: PDF und Bilder bis 15 MB.
  ipcMain.handle('oh:mailAbrufen', async (e, id) => {
    const list = konten(), a = list.find(x => x.id === id); if (!a) return { ok: false, message: 'Konto nicht gefunden.' };
    const c = imap(a); const out = [];
    try {
      await c.connect();
      const lock = await c.getMailboxLock('INBOX');
      try {
        const box = c.mailbox; const uv = String(box.uidValidity || '');
        let uids;
        if (a.uidValidity === uv && a.lastUid) uids = await c.search({ uid: (a.lastUid + 1) + ':*' }, { uid: true });
        else uids = await c.search({ since: new Date(Date.now() - 7 * 864e5) }, { uid: true });
        uids = (uids || []).filter(u => u > (a.uidValidity === uv ? a.lastUid : 0)).sort((x, y) => x - y).slice(-40);
        for (const uid of uids) {
          const msg = await c.fetchOne(String(uid), { source: true, internalDate: true }, { uid: true }); if (!msg || !msg.source) continue;
          if (msg.source.length > 30 * 1024 * 1024) { out.push({ uid, zuGross: true }); continue; }
          const m = await simpleParser(msg.source);
          const from = (m.from && m.from.value && m.from.value[0]) || {};
          out.push({ uid, msgId: m.messageId || '', from: from.address || '', fromName: from.name || '', to: (m.to && m.to.text) || '', subject: m.subject || '(ohne Betreff)',
            date: (m.date || msg.internalDate || new Date()).toISOString(), text: String(m.text || (m.html ? String(m.html).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ') : '')).replace(/\n{3,}/g, '\n\n').slice(0, 60000),
            atts: (m.attachments || []).filter(x => {
                const t = String(x.contentType || '').toLowerCase(), pdf = t === 'application/pdf' || /\.pdf$/i.test(x.filename || '');
                const bild = /^image\/(jpeg|png|webp|heic|heif)$/.test(t) && x.contentDisposition !== 'inline' && x.size > 20 * 1024; // keine Logos aus Signaturen
                return (pdf || bild) && x.size <= 15 * 1024 * 1024; })
              .slice(0, 10).map(x => ({ name: x.filename || 'anhang', type: (x.contentType || '').toLowerCase(), size: x.size, data: new Uint8Array(x.content) })) });
        }
        const neu = list.find(x => x.id === id); neu.uidValidity = uv; if (uids.length) neu.lastUid = Math.max(a.uidValidity === uv ? a.lastUid : 0, ...uids); neu.lastCheck = new Date().toISOString();
        speichereKonten(list);
      } finally { lock.release(); }
      await c.logout();
      return { ok: true, mails: out };
    } catch (err) { try { await c.logout(); } catch (e2) {} return { ok: false, message: errText(err) }; }
  });

  // Ordner „Gesendet“ lesen (nur lesen): die letzten n Mails, neueste zuerst; Anhänge nur als Namen
  ipcMain.handle('oh:mailGesendet', async (e, id, n) => {
    const a = konten().find(x => x.id === id); if (!a) return { ok: false, message: 'Konto nicht gefunden.' };
    n = Math.min(100, Math.max(5, Number(n) || 40));
    const c = imap(a), out = [];
    try {
      await c.connect();
      const boxes = await c.list();
      const sent = (boxes.find(b => b.specialUse === '\\Sent') || boxes.find(b => /^(sent|gesendet)/i.test(b.name)) || {}).path;
      if (!sent) { await c.logout(); return { ok: false, message: 'Im Postfach wurde kein Ordner „Gesendet“ gefunden.' }; }
      const lock = await c.getMailboxLock(sent);
      try {
        const total = c.mailbox.exists || 0;
        if (total) for await (const msg of c.fetch(`${Math.max(1, total - n + 1)}:*`, { uid: true, envelope: true, size: true, source: { maxLength: 400000 } })) {
          let text = '', atts = [];
          try { const m = await simpleParser(msg.source); text = String(m.text || '').replace(/\n{3,}/g, '\n\n').slice(0, 20000); atts = (m.attachments || []).map(x => x.filename).filter(Boolean).slice(0, 10); } catch (err) {}
          const env = msg.envelope || {};
          out.push({ uid: msg.uid, to: (env.to || []).map(t => t.name ? t.name + ' <' + t.address + '>' : t.address).join(', '), subject: env.subject || '(ohne Betreff)', date: (env.date ? new Date(env.date) : new Date()).toISOString(),
            text, atts, gross: (msg.size || 0) > 400000 });
        }
      } finally { lock.release(); }
      await c.logout();
      return { ok: true, ordner: sent, mails: out.sort((x, y) => y.date.localeCompare(x.date)) };
    } catch (err) { try { await c.logout(); } catch (e2) {} return { ok: false, message: errText(err) }; }
  });

  // Senden: SMTP (SSL 465), danach Kopie in den Ordner „Gesendet“ (special-use \Sent)
  ipcMain.handle('oh:mailSenden', async (e, id, m) => {
    const a = konten().find(x => x.id === id); if (!a) return { ok: false, message: 'Konto nicht gefunden.' };
    try {
      libs();
      const to = String(m.to || '').split(/[;,]/).map(s => s.trim()).filter(Boolean); if (!to.length || to.some(x => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.replace(/^.*<|>$/g, '')))) throw new Error('Bitte gültige Empfänger-Adresse(n) eingeben.');
      const mail = { from: a.name ? `"${a.name.replace(/"/g, '')}" <${a.user}>` : a.user, to: to.join(', '), subject: String(m.subject || ''), text: String(m.text || ''),
        inReplyTo: m.inReplyTo || undefined, references: m.inReplyTo || undefined,
        attachments: (m.atts || []).slice(0, 10).map(x => ({ filename: String(x.name || 'anhang'), contentType: x.type || undefined, content: Buffer.from(x.data) })) };
      const tr = nodemailer.createTransport({ host: a.smtpHost, port: a.smtpPort, secure: a.smtpPort === 465, auth: { user: a.user, pass: secret('mail:' + a.id) } });
      const info = await tr.sendMail(mail);
      // Kopie in „Gesendet“
      try {
        const MailComposer = require('nodemailer/lib/mail-composer');
        const raw = await new Promise((res, rej) => new MailComposer(Object.assign({}, mail, { messageId: info.messageId })).compile().build((err, b) => err ? rej(err) : res(b)));
        const c = imap(a); await c.connect();
        const boxes = await c.list(); const sent = (boxes.find(b => b.specialUse === '\\Sent') || boxes.find(b => /^(sent|gesendet)/i.test(b.name)) || {}).path;
        if (sent) await c.append(sent, raw, ['\\Seen']);
        await c.logout();
      } catch (err) {}
      return { ok: true, messageId: info.messageId };
    } catch (err) { return { ok: false, message: errText(err) }; }
  });
};
