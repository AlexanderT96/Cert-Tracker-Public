import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const require=(condition,message)=>{if(!condition)errors.push(message);};

const index=read('index.html');
const githubSync=read('src/github-sync.js');
const accountConnections=read('src/account-connections.js');
const accountConnectionsUI=read('src/account-connections-ui.js');
const sync=read('src/sync.js');
const hardening=read('src/security-hardening.js');
const ui=read('src/learning-resources-ui.js');

require(/Content-Security-Policy/i.test(index),'Missing Content Security Policy meta policy.');
for(const directive of ["object-src 'none'","base-uri 'none'","form-action 'self'","worker-src 'self'","upgrade-insecure-requests"]){
  require(index.includes(directive),`CSP is missing ${directive}.`);
}
require(/<meta name="referrer" content="no-referrer">/i.test(index),'Referrer policy must be no-referrer.');
require(index.includes('src/security-hardening.js'),'Runtime security hardening is not loaded.');
require(index.includes('src/browser-compat.js'),'Browser capability detector is not loaded.');
require(index.includes('src/account-connections.js'),'Account Connections core is not loaded.');
require(index.includes('src/account-connections-ui.js'),'Account Connections UI is not loaded.');
require(!/<script[^>]+src=["']https?:\/\//i.test(index),'Remote third-party scripts are forbidden.');
require(!/<link[^>]+href=["']https?:\/\//i.test(index),'Remote third-party stylesheets are forbidden.');

require(/let session=null/.test(githubSync),'GitHub sync secrets must remain session-memory only.');
require(!/localStorage\.setItem\([^\n]*(token|passphrase)/i.test(githubSync),'GitHub token/passphrase must never be persisted to localStorage.');
require(/Fine-grained GitHub token/i.test(read('src/github-sync-ui.js')),'Least-privilege GitHub token guidance is missing.');
require(/AES-GCM-256/.test(sync)&&/PBKDF2-SHA256/.test(sync),'Encrypted sync must use AES-GCM with PBKDF2-SHA256.');
require(/250000/.test(sync),'PBKDF2 work factor unexpectedly changed.');
require(/Sync endpoint must use HTTPS/.test(sync),'WebDAV sync must enforce HTTPS.');
require(/Do not embed WebDAV credentials/.test(sync),'WebDAV URL credential rejection is missing.');
require(/credentials:'omit'/.test(sync)&&/referrerPolicy:'no-referrer'/.test(sync),'WebDAV transport must omit ambient credentials and referrers.');

require(/Authorization Code \+ PKCE/i.test(accountConnections),'Outlook connection must document Authorization Code + PKCE.');
require(/code_challenge_method','S256'/.test(accountConnections),'Outlook OAuth must enforce PKCE S256.');
require(/storageSet\(sessionStorage,SESSION_KEY/.test(accountConnections),'Outlook tokens must be written only to sessionStorage.');
require(!/storageSet\(localStorage,SESSION_KEY/.test(accountConnections),'Outlook session tokens must never be written to localStorage.');
require(!/client_secret/i.test(accountConnections),'SPA Outlook integration must not contain or request a client secret.');
require(/credentials:'omit'/.test(accountConnections)&&/referrerPolicy:'no-referrer'/.test(accountConnections),'Outlook OAuth/Graph transport must omit ambient credentials and referrers.');
require(/Calendars\.ReadWrite/.test(accountConnections),'Outlook calendar integration must explicitly request delegated calendar permission.');
require(/includeMail/.test(accountConnections)&&/Mail\.Read/.test(accountConnections),'Outlook mail access must remain an explicit optional scope.');
require(/tokens stay in <strong>session storage only<\/strong>/i.test(accountConnectionsUI),'Account Connections UI must explain Outlook token storage.');
require(/cannot reuse the Outlook permission granted to ChatGPT/i.test(accountConnectionsUI),'Account Connections UI must explain connector isolation.');

require(/noopener noreferrer/.test(ui),'External learning links must use noopener noreferrer.');
require(/SAFE_PROTOCOLS=new Set\(\['http:','https:','mailto:'\]\)/.test(hardening),'Security URL protocol allow-list changed unexpectedly.');
require(!/SAFE_PROTOCOLS[^\n]+javascript:/i.test(hardening),'javascript: must never be an allowed navigation protocol.');
require(/target==='_blank'/.test(hardening)&&/noopener/.test(hardening)&&/noreferrer/.test(hardening),'Reverse-tabnabbing protection is missing.');
require(/referrerPolicy='no-referrer'/.test(hardening),'External navigation referrer suppression is missing.');

const srcDir=path.join(root,'src');
for(const file of fs.readdirSync(srcDir).filter(name=>name.endsWith('.js'))){
  const content=fs.readFileSync(path.join(srcDir,file),'utf8');
  if(/\beval\s*\(/.test(content))errors.push(`${file}: eval() is forbidden.`);
  if(/\bnew\s+Function\s*\(/.test(content))errors.push(`${file}: new Function() is forbidden.`);
  if(/document\.write\s*\(/.test(content))errors.push(`${file}: document.write() is forbidden.`);
}

if(errors.length){console.error(`Security gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Security hardening checks passed.');
