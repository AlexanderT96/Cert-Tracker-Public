import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import {pathToFileURL} from 'node:url';

const FIELDS=['identity','availability','eligibility','blueprint','renewal','price'];
export function catalogue(){
  const s={console};s.window=s;vm.createContext(s);
  for(const f of ['certs.js','src/cert-extensions.js','src/catalogue-currentness.js','src/catalogue-policy-normalize.js','src/config.js','src/source-registry.js','src/source-registry-current.js','src/learning-resources.js','src/learning-resources-normalize.js'])vm.runInContext(fs.readFileSync(f,'utf8'),s,{timeout:10000});
  s.CertTrackerV3.careerFramework={};vm.runInContext(fs.readFileSync('src/career-options.js','utf8'),s);
  return {certs:vm.runInContext('CERTS',s),CT:s.CertTrackerV3};
}
export function inventory({certs,CT}){
  const urls=new Map();
  function add(value,ref){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return;u.hash='';const url=u.href;if(!urls.has(url))urls.set(url,{url,refs:[]});const row=urls.get(url);if(!row.refs.includes(ref))row.refs.push(ref);}catch{}}
  function walk(value,ref){if(typeof value==='string'){if(value.startsWith('https://'))add(value,ref);}else if(value&&typeof value==='object')Object.values(value).forEach(v=>walk(v,ref));}
  for(const c of certs){add(CT.sourceRegistry[c.id]?.url,'cert:'+c.id);walk(c.factChecks,'fact:'+c.id);walk(CT.learningResources.profile(c),'learning:'+c.id);}
  for(const role of CT.careerOptions.ROLES)add(role.source,'role:'+role.id);
  for(const f of ['src/market-value.js','src/market-readiness.js'])for(const m of fs.readFileSync(f,'utf8').matchAll(/https:\/\/[^\s'"`<>]+/g))add(m[0],'market-reference');
  return [...urls.values()];
}
export function publicAddress(ip){
  if(net.isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127);}
  return net.isIP(ip)===6&&/^[23]/i.test(ip)&&!/^2001:db8:/i.test(ip);
}
async function permittedURL(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')throw Error('Unsafe URL');const addresses=await dns.lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(r=>!publicAddress(r.address)))throw Error('Non-public host');return u;}
export function robotsAllowed(text,path){
  const groups=[];let group={agents:[],rules:[]};
  for(const line of text.split(/\r?\n/)){const [raw,...rest]=line.replace(/#.*/,'').split(':'),name=raw.trim().toLowerCase(),value=rest.join(':').trim();if(name==='user-agent'){if(group.rules.length){groups.push(group);group={agents:[],rules:[]};}group.agents.push(value.toLowerCase());}else if(['allow','disallow'].includes(name)&&value)group.rules.push({name,value});}groups.push(group);
  const specific=groups.filter(g=>g.agents.some(a=>a!=='*'&&'cert-tracker-audit'.includes(a))),selected=specific.length?specific:groups.filter(g=>g.agents.includes('*'));let best=-1,allowed=true;
  for(const {name,value}of selected.flatMap(g=>g.rules)){const pattern=value.split('*')[0].replace(/\$$/,'');if(path.startsWith(pattern)&&(pattern.length>best||pattern.length===best&&name==='allow')){best=pattern.length;allowed=name==='allow';}}
  return allowed;
}
async function download(url,limit=1000000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{for(let n=0;n<5;n++){const u=await permittedURL(url);const r=await fetch(u,{redirect:'manual',signal:controller.signal,headers:{'User-Agent':'Cert-Tracker-Audit/1.0','Accept':'text/html,text/plain,application/json'}});if(r.status>=300&&r.status<400){await r.body?.cancel();url=new URL(r.headers.get('location'),u).href;continue;}if(!r.ok){await r.body?.cancel();return{status:r.status,url:u.href,type:'',text:''};}const type=r.headers.get('content-type')||'';if(!/html|text|json|xml/.test(type)){await r.body?.cancel();return{status:r.status,url:u.href,type,text:''};}const reader=r.body.getReader();let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Oversized response');}chunks.push(value);}return{status:r.status,url:u.href,type,text:Buffer.concat(chunks).toString('utf8')};}throw Error('Redirect limit');}finally{clearTimeout(timer);}
}
export function visibleText(html){return html.replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
export function comparePage(row,content,prior){
  const text=visibleText(content),hash=crypto.createHash('sha256').update(text).digest('hex');
  const signals={retirement:/\b(retired|retiring|discontinued|no longer available)\b/i.test(text),prerequisites:/\b(prerequisite|eligibility|endorsement)\b/i.test(text),renewal:/\b(recertification|renewal|valid for|expires)\b/i.test(text),blueprint:/\b(exam objectives|exam guide|blueprint|syllabus)\b/i.test(text),prices:[...new Set(text.match(/[£$€]\s?\d[\d,.]{0,9}/g)||[])].slice(0,10)};
  return {...row,hash,changed:!!prior?.hash&&prior.hash!==hash,baseline:!prior?.hash,signals};
}
export async function runAudit(){
  const startedAt=new Date().toISOString(),model=catalogue(),sources=inventory(model);let previous={};try{previous=JSON.parse(fs.readFileSync('data/tracker-audit.json','utf8'));}catch{}
  const prior=new Map((previous.sources||[]).map(r=>[r.url,r])),robots=new Map(),results=[],texts=new Map();
  async function check(row){const old=prior.get(row.url),at=new Date().toISOString(),base={...row,attemptedAt:at,lastSuccessfulAt:old?.lastSuccessfulAt||null,hash:old?.hash||null};
    if(/[?&](q|query|search_query|search)=|\/results\?|\/courses\/search/.test(row.url))return{...base,status:'discovery-link',reason:'Search results are not a verified learning resource'};
    try{const u=new URL(row.url);if(!robots.has(u.origin))robots.set(u.origin,download(u.origin+'/robots.txt',150000).then(r=>r.status===404?'':r.status===200?r.text:null).catch(()=>null));const policy=await robots.get(u.origin);if(policy===null||!robotsAllowed(policy,u.pathname+u.search))return{...base,status:'blocked',reason:'Robots policy unavailable or disallows automated access'};
      const r=await download(row.url);if(r.status===404||r.status===410)return{...base,status:'broken',httpStatus:r.status};if(r.status!==200)return{...base,status:'unavailable',httpStatus:r.status};if(!r.text)return{...base,status:'manual-review',reason:'Non-text source requires separate review'};
      if(/just a moment|verify you are human|captcha|access denied/i.test(r.text.slice(0,15000)))return{...base,status:'blocked',reason:'Access challenge; not bypassed'};
      texts.set(row.url,visibleText(r.text).toLowerCase());return{...comparePage(base,r.text,old),status:'checked',lastSuccessfulAt:at,finalUrl:r.url};
    }catch{return{...base,status:'unavailable',reason:'Timeout, size limit or public-access failure'};}}
  for(let i=0;i<sources.length;i+=4){results.push(...await Promise.all(sources.slice(i,i+4).map(check)));console.log(`Source audit ${Math.min(i+4,sources.length)}/${sources.length}`);}
  const byURL=new Map(results.map(r=>[r.url,r]));
  const facts=model.certs.map(c=>{const entry=model.CT.sourceRegistry[c.id],source=byURL.get(entry?.url),text=texts.get(entry?.url)||'',identity=entry?.level==='CERT'&&text.includes(String(c.name).toLowerCase());return{id:c.id,name:c.name,source:entry?.url,fields:Object.fromEntries(FIELDS.map(field=>[field,{status:field==='identity'&&identity?'source-match':'needs-review',reason:field==='identity'&&identity?'Exact catalogue name found on mapped certification source':'A source visit alone cannot establish this field',recordedCheckAt:c.factChecks?.[field]?.checkedAt||null}])),changed:!!source?.changed,availabilitySignal:!!source?.signals?.retirement};});
  let market={};try{const f=JSON.parse(fs.readFileSync('data/job-market.json','utf8'));market={status:f.status,lastAttemptAt:f.lastAttemptAt,lastSuccessfulFetchAt:f.lastSuccessfulFetchAt,providers:f.providerStatus,listings:f.jobs?.length||0,queries:f.queries?.length||0};}catch{}
  const count=status=>results.filter(r=>r.status===status).length;
  const report={schemaVersion:2,startedAt,completedAt:new Date().toISOString(),codeCommit:process.env.GITHUB_SHA||null,runUrl:process.env.GITHUB_RUN_ID?`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:null,status:count('unavailable')||count('blocked')||count('broken')?'partial':'complete-with-review',summary:{certifications:model.certs.length,roles:model.CT.careerOptions.ROLES.length,navigationalLinks:results.length,evidenceSources:results.length-count('discovery-link'),checked:count('checked'),changed:results.filter(r=>r.changed).length,newBaselines:results.filter(r=>r.baseline).length,broken:count('broken'),unavailable:count('unavailable'),blocked:count('blocked'),discoveryLinks:count('discovery-link'),manualReview:count('manual-review'),identityMatches:facts.filter(r=>r.fields.identity.status==='source-match').length,fieldsRequiringReview:facts.reduce((n,r)=>n+Object.values(r.fields).filter(f=>f.status==='needs-review').length,0)},market,facts,sources:results,limits:['Navigational and discovery links are reported separately from evidence sources. A search result is never learning coverage.','Automated name matches and page changes are review evidence, not independent verification of all facts.','No issuer facts, personal data or recorded verification dates are overwritten.','Prices may refer to unrelated items, currencies or taxes; signals require review.','Course currency, exact prerequisites, salary calibration and role eligibility need contextual review.']};
  fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/tracker-audit.json',JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runAudit();
