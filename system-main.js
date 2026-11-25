// Home Office – Systemprüfung (Hauptprozess)
// Prüft, ob alles da ist, was das Programm für den vollen Betrieb braucht, und liefert für Fehlendes
// den offiziellen Download-Link und die winget-ID (damit Claude es auf Wunsch installieren kann).
// Es wird hier nichts installiert – nur geprüft.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');
const { execFile } = require('child_process');

const run = (cmd, args) => new Promise(res => execFile(cmd, args, { encoding: 'utf8', windowsHide: true, timeout: 8000 }, (err, out) => res(err ? null : String(out || ''))));
const da = p => { try { return !!p && fs.existsSync(p); } catch (e) { return false; } };
const ENV = k => process.env[k] || '';

async function pruefen() {
  const sys = ENV('SystemRoot') || 'C:\\Windows';
  const L = ENV('LOCALAPPDATA'), A = ENV('APPDATA'), PF = ENV('ProgramFiles'), PF86 = ENV('ProgramFiles(x86)');
  const liste = [];
  const add = (o) => liste.push(Object.assign({ ok: false, stufe: 'empfohlen' }, o));

  // 1. Windows 10/11
  const rel = os.release().split('.').map(Number);
  add({ id: 'windows', ok: rel[0] >= 10, stufe: 'pflicht', name: 'Windows 10 oder 11', nameAr: 'ويندوز 10 أو 11',
    wofuer: 'Das Programm läuft nur unter Windows 10 und 11.', wofuerAr: 'البرنامج بيشتغل بس على ويندوز 10 و 11.', info: 'Windows ' + os.release() });

  // 2. PowerShell (Scanner über Windows-WIA)
  add({ id: 'powershell', ok: da(path.join(sys, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')), stufe: 'pflicht', name: 'Windows PowerShell', nameAr: 'Windows PowerShell',
    wofuer: 'Wird für das Scannen mit Drucker/Scanner gebraucht. Gehört zu Windows.', wofuerAr: 'لازم للمسح بالطابعة/السكانر. جزء من ويندوز.', link: 'https://aka.ms/powershell' });

  // 3. Windows-Bilderfassung (WIA) für Scanner
  const wia = await run(path.join(sys, 'System32', 'sc.exe'), ['query', 'stisvc']);
  add({ id: 'wia', ok: !!(wia && /stisvc/i.test(wia)), stufe: 'empfohlen', name: 'Windows-Bilderfassung (WIA)', nameAr: 'خدمة التقاط الصور بويندوز (WIA)',
    wofuer: 'Damit Briefe direkt vom Drucker oder Scanner eingelesen werden. Für den Scanner muss außerdem sein Treiber installiert sein.', wofuerAr: 'مشان تمسح الرسائل مباشرة من الطابعة أو السكانر. ولازم يكون تعريف السكانر مثبّت كمان.' });

  // 4. Programm zum Öffnen von PDF-Dateien
  const pdf = await run(path.join(sys, 'System32', 'reg.exe'), ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.pdf\\UserChoice', '/v', 'ProgId']);
  const pdfHKCR = pdf ? null : await run(path.join(sys, 'System32', 'reg.exe'), ['query', 'HKCR\\.pdf', '/ve']);
  const pdfId = (/ProgId\s+REG_SZ\s+(\S+)/i.exec(pdf || '') || /REG_SZ\s+(\S+)/i.exec(pdfHKCR || '') || [])[1] || '';
  add({ id: 'pdf', ok: !!pdfId, stufe: 'empfohlen', name: 'PDF-Programm', nameAr: 'برنامج لفتح ملفات PDF',
    wofuer: 'Zum Öffnen und Drucken von Briefen, Bescheiden und Scans als PDF. Microsoft Edge reicht, Adobe Acrobat Reader geht auch.', wofuerAr: 'لفتح وطباعة الرسائل والقرارات والممسوحات كـ PDF. Microsoft Edge بيكفي، و Adobe Acrobat Reader كمان بيمشي.',
    link: 'https://get.adobe.com/de/reader/', winget: 'Adobe.Acrobat.Reader.64-bit' });

  // 5. Internet (Gemini, Google Kalender, E-Mail, Updates)
  const netz = await new Promise(res => dns.lookup('generativelanguage.googleapis.com', e => res(!e)));
  add({ id: 'internet', ok: netz, stufe: 'empfohlen', name: 'Internetverbindung', nameAr: 'اتصال بالإنترنت',
    wofuer: 'Für die KI (Gemini), Google Kalender, E-Mail und Programm-Updates. Ohne Internet funktioniert alles andere weiter.', wofuerAr: 'للذكاء الاصطناعي (Gemini) وتقويم Google والإيميل والتحديثات. بدون إنترنت كل شي تاني بيضل شغّال.' });

  // 6. Claude Desktop (Einrichtungshilfe und Claude-Anbindung)
  const claude = [path.join(L, 'AnthropicClaude'), path.join(L, 'Programs', 'Claude'), path.join(L, 'Programs', 'claude-desktop'), path.join(PF, 'Claude'), path.join(PF86 || PF, 'Claude'), path.join(A, 'Claude', 'claude_desktop_config.json')].some(da)
    || !!(await run(path.join(sys, 'System32', 'reg.exe'), ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', '/s', '/f', 'Claude', '/d']) || '').match(/Claude/i);
  add({ id: 'claude', ok: claude, stufe: 'optional', name: 'Claude Desktop', nameAr: 'Claude Desktop',
    wofuer: 'Claude hilft Schritt für Schritt bei der Einrichtung und kann (wenn du es erlaubst) Fragen zu deinen Daten beantworten.', wofuerAr: 'Claude بيساعدك خطوة خطوة بالإعداد وبيقدر (إذا سمحتلو) يجاوب أسئلة عن بياناتك.',
    link: 'https://claude.ai/download', winget: 'Anthropic.Claude' });

  // 7. winget (damit Claude Programme installieren kann)
  // winget.exe ist ein App-Ausführungsalias: existsSync folgt dem Link und scheitert, deshalb lstat
  const winget = (() => { try { fs.lstatSync(path.join(L, 'Microsoft', 'WindowsApps', 'winget.exe')); return true; } catch (e) { return false; } })();
  add({ id: 'winget', ok: winget, stufe: 'optional', name: 'Windows-Paketverwaltung (winget)', nameAr: 'مدير الحزم بويندوز (winget)',
    wofuer: 'Damit Claude fehlende Programme für dich installieren kann. Kommt mit dem „App Installer“ aus dem Microsoft Store.', wofuerAr: 'مشان Claude يقدر يثبّتلك البرامج الناقصة. بيجي مع «App Installer» من متجر مايكروسوفت.',
    link: 'https://apps.microsoft.com/detail/9NBLGGH4NNS1' });

  return { zeit: new Date().toISOString(), liste };
}

module.exports = ({ ipcMain }) => { ipcMain.handle('oh:systemPruefen', () => pruefen()); };
module.exports.pruefen = pruefen;
