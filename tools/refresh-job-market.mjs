import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const appId=process.env.ADZUNA_APP_ID||'',appKey=process.env.ADZUNA_APP_KEY||'',location=(process.env.JOB_MARKET_LOCATION||'').trim();
const outPath=path.resolve('data/job-market.json'),now=new Date();
const taxonomy={CertTrackerV3:{careerFramework:{}},state:{},CERTS:[],save:{}};taxonomy.window=taxonomy;
vm.runInNewContext(fs.readFileSync('src/career-options.js','utf8'),taxonomy);
vm.runInNewContext(fs.readFileSync('src/career-think-tank.js','utf8'),taxonomy);
const cleanQuery=value=>String(value||'').toLowerCase().replace(/ — .*/,'').replace(/\s+/g,' ').trim();
const PRIORITY_QUERIES=[...new Set(Array.from(taxonomy.CertTrackerV3.careerThinkTank?.SEARCH_QUERIES||[]).map(cleanQuery).filter(Boolean))];
const prioritySet=new Set(PRIORITY_QUERIES);
const GENERAL_QUERIES=[...new Set(taxonomy.CertTrackerV3.careerOptions.ROLES.map(r=>cleanQuery(r.title)).filter(q=>q&&!prioritySet.has(q)))];
const QUERIES=[...PRIORITY_QUERIES,...GENERAL_QUERIES];
function existing(){try{return JSON.parse(fs.readFileSync(outPath,'utf8'));}catch{return{jobs:[]};}}
function isoDate(value){if(value==null||value==='')return null;const d=new Date(typeof value==='number'&&value<1e12?value*1000:value);return Number.isFinite(d.getTime())&&d<=now?d.toISOString():null;}
function cleanText(value=''){return String(value).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
function freshEnough(job){const t=Date.parse(isoDate(job?.created)||'');return Number.isFinite(t)&&now.getTime()-t>=0&&now.getTime()-t<=14*86400000;}
function normalise(job,query){return{id:'adzuna:'+String(job.id||job.redirect_url),source:'Adzuna',title:cleanText(job.title),company:cleanText(job.company?.display_name),location:cleanText(job.location?.display_name),workMode:job.work_mode||null,remote:job.remote===true,created:isoDate(job.created),lastSeenAt:now.toISOString(),currency:'GBP',salaryPeriod:job.salary_period==='annual'?'annual':null,salaryMin:Number(job.salary_min)||null,salaryMax:Number(job.salary_max)||null,description:cleanText(job.description||'').slice(0,1800),url:String(job.redirect_url||''),query};}
const before=existing(),previous=before.requestBudget||{},hour=now.toISOString().slice(0,13),day=now.toISOString().slice(0,10),month=now.toISOString().slice(0,7);
const budget={hour,day,month,hourCount:previous.hour===hour?previous.hourCount||0:0,dayCount:previous.day===day?previous.dayCount||0:0,monthCount:previous.month===month?previous.monthCount||0:0};
// Caps include manual runs and failed requests; no paid quota is assumed.
const available=Math.max(0,Math.min(3-budget.hourCount,75-budget.dayCount,2400-budget.monthCount));
let priorityCursor=Number(before.priorityQueryCursor)||0,generalCursor=Number(before.generalQueryCursor??before.queryCursor)||0,successes=0,failures=0;
const fetched=[],providerStatus=[],batch=[],observed={...(before.queryObservedAt||{})};
function nextQuery(slot){
  // Personalised market intelligence gets two of three hourly requests; the
  // remaining request preserves broad-market discovery and prevents tunnel vision.
  const usePriority=PRIORITY_QUERIES.length&&(slot%3!==2||!GENERAL_QUERIES.length);
  if(usePriority){const q=PRIORITY_QUERIES[priorityCursor%PRIORITY_QUERIES.length];priorityCursor++;return{query:q,bucket:'priority'};}
  if(GENERAL_QUERIES.length){const q=GENERAL_QUERIES[generalCursor%GENERAL_QUERIES.length];generalCursor++;return{query:q,bucket:'general'};}
  const q=PRIORITY_QUERIES[priorityCursor%PRIORITY_QUERIES.length];priorityCursor++;return{query:q,bucket:'priority'};
}
if(appId&&appKey){
  for(let i=0;i<available;i++){
    const {query,bucket}=nextQuery(i);batch.push({query,bucket});budget.hourCount++;budget.dayCount++;budget.monthCount++;
    try{
      const params=new URLSearchParams({app_id:appId,app_key:appKey,results_per_page:'50',what:query,'content-type':'application/json',sort_by:'date'});if(location)params.set('where',location);
      const r=await fetch('https://api.adzuna.com/v1/api/jobs/gb/search/1?'+params,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
      if(!r.ok)throw Error('Unavailable');const data=await r.json();if(!Array.isArray(data.results))throw Error('Invalid response');successes++;observed[query]=now.toISOString();for(const job of data.results)fetched.push(normalise(job,query));
      await new Promise(resolve=>setTimeout(resolve,2600));
    }catch{failures++; /* Never log credential-bearing URLs or provider error details. */}
  }
  providerStatus.push(available?'Adzuna: '+successes+'/'+available+' queries fetched':'Provider request budget reached; snapshot has not been redated');
}else providerStatus.push('Adzuna credentials not configured');
const merged=new Map();for(const row of [...(before.jobs||[]).filter(freshEnough),...fetched].filter(freshEnough))merged.set(row.id||row.url,row);
const jobs=[...merged.values()].sort((a,b)=>String(b.created).localeCompare(String(a.created))).slice(0,500);
const priorSuccess=before.schemaVersion>=4?isoDate(before.lastSuccessfulFetchAt):before.status==='live'&&before.providerCoverage?.successes>0?isoDate(before.lastSuccessfulFetchAt):null;
const lastSuccessfulFetchAt=successes?now.toISOString():priorSuccess;
const feed={schemaVersion:5,lastAttemptAt:now.toISOString(),lastSuccessfulFetchAt,fetchedAt:lastSuccessfulFetchAt,status:successes&&!failures?'live':appId&&appKey&&!available?(before.status||'degraded'):'degraded',provider:'Adzuna',providerUrl:'https://www.adzuna.co.uk/',country:'gb',location:location||'United Kingdom',refreshTargetMinutes:60,requestBudget:budget,queryCursor:generalCursor,priorityQueryCursor:priorityCursor,generalQueryCursor:generalCursor,queryObservedAt:observed,providerCoverage:{successes,failures,queries:QUERIES.length,priorityQueries:PRIORITY_QUERIES.length,generalQueries:GENERAL_QUERIES.length,prioritySweepHours:Math.ceil(PRIORITY_QUERIES.length/2),generalSweepHours:GENERAL_QUERIES.length,allocation:'2 priority : 1 general'},priorityQueries:PRIORITY_QUERIES,generalQueries:GENERAL_QUERIES,queries:QUERIES,lastBatch:batch,providerStatus,jobs};
fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(feed,null,2)+'\n');console.log('Market refresh: '+successes+' successful queries; '+jobs.length+' retained listings. Priority '+PRIORITY_QUERIES.length+' / general '+GENERAL_QUERIES.length+'. '+providerStatus.join(' · '));
