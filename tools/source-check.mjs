import fs from 'node:fs';
import vm from 'node:vm';

const base=fs.readFileSync('src/source-registry.js','utf8');
const current=fs.readFileSync('src/source-registry-current.js','utf8');
const sandbox={window:{CertTrackerV3:{}},Object};vm.createContext(sandbox);vm.runInContext(`${base}\n${current}`,sandbox,{timeout:1000});
const registry=sandbox.window.CertTrackerV3.sourceRegistry||{};
const urls=[...new Map(Object.entries(registry).map(([id,row])=>[row.url,{id,url:row.url,level:row.level}])).values()];
const failures=[],warnings=[];let verified=0;
async function check(row){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const headers={'User-Agent':'Mozilla/5.0 (compatible; Cert-Tracker-source-health/2.0)','Accept':'text/html,application/xhtml+xml'};
    let response=await fetch(row.url,{method:'HEAD',redirect:'follow',signal:controller.signal,headers});
    // Some issuers reject, misroute or synthesize 404s for HEAD. A broken-link
    // verdict always requires a real GET so bot behaviour is not called fact.
    if([403,404,405,410,429].includes(response.status))response=await fetch(row.url,{method:'GET',redirect:'follow',signal:controller.signal,headers:{...headers,'Range':'bytes=0-8191'}});
    if(response.status===404||response.status===410)failures.push(`${row.id}: official source returned ${response.status} — ${row.url}`);
    else if(!response.ok)warnings.push(`${row.id}: source returned ${response.status} — ${row.url}`);
    else if(!String(response.url||row.url).startsWith('https://'))failures.push(`${row.id}: source redirected away from HTTPS.`);
    else verified++;
  }catch(error){warnings.push(`${row.id}: source check unavailable (${error.name||error.message}).`);}finally{clearTimeout(timer);}
}
for(let i=0;i<urls.length;i+=4)await Promise.all(urls.slice(i,i+4).map(check));
if(warnings.length){console.warn(`Source warnings (${warnings.length}):`);warnings.forEach(x=>console.warn(`- ${x}`));}
if(failures.length){console.error(`Source failures (${failures.length}):`);failures.forEach(x=>console.error(`- ${x}`));process.exit(1);}
console.log(`Official-source reachability: ${verified}/${urls.length} confirmed by HTTP. This does not verify credential facts, blueprint alignment or teaching quality.`);
if(warnings.length){console.error('Source verification incomplete; unavailable sources were not counted as passed.');process.exit(2);}
