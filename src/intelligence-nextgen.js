// Cert Tracker — next-generation reasoning over the five-pillar intelligence timeline.
// Privacy-safe: learns only from browser-local feedback + managed Outlook metadata.
(function initNextGenIntelligence(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.personalIntelligence)return;
  const text=v=>String(v??'').trim();
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const STORAGE_KEY='certtracker.nextgen-intelligence-feedback.v1';
  const HORIZON_ORDER=Object.freeze(['TODAY','7D','30D','90D','12M','LONG','PAST']);

  function safeParse(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
  function loadFeedback(){
    try{return safeParse(global.localStorage?.getItem(STORAGE_KEY)||'',{})||{}}catch{return {}}
  }
  function saveFeedback(data){try{global.localStorage?.setItem(STORAGE_KEY,JSON.stringify(data||{}))}catch{}}
  function feedbackKey(row){return text(row?.key||row?.id||row?.subject).slice(0,240)}
  function recordFeedback(rowOrKey,signal){
    const key=typeof rowOrKey==='string'?rowOrKey:feedbackKey(rowOrKey);
    if(!key)return;
    const map=loadFeedback(),entry=map[key]||{score:0,acted:0,dismissed:0,snoozed:0,last:''};
    const s=text(signal).toUpperCase();
    if(s==='ACTED'){entry.score=clamp((entry.score||0)+8,-30,30);entry.acted=(entry.acted||0)+1;}
    else if(s==='DISMISSED'){entry.score=clamp((entry.score||0)-7,-30,30);entry.dismissed=(entry.dismissed||0)+1;}
    else if(s==='SNOOZED'){entry.score=clamp((entry.score||0)-2,-30,30);entry.snoozed=(entry.snoozed||0)+1;}
    else if(s==='VALUABLE'){entry.score=clamp((entry.score||0)+5,-30,30);}
    entry.last=new Date().toISOString();map[key]=entry;saveFeedback(map);
  }

  // Optional second line emitted by watches:
  // NextGen: Thread: axis-os-13 | Forecast: DELAY@35 | Source: 92 | Attention: 55 | Outcome: PENDING | Horizon: 30D | Causal: windows-server;milestone-xprotect
  function parseNextGen(row){
    const source=`${text(row?.bodyPreview)}\n${text(row?.subject)}`;
    const line=source.match(/NextGen:\s*Thread:\s*([^|\r\n]+)\s*\|\s*Forecast:\s*([^|\r\n]+)\s*\|\s*Source:\s*(\d{1,3})\s*\|\s*Attention:\s*(\d{1,3})\s*\|\s*Outcome:\s*([^|\r\n]+)\s*\|\s*Horizon:\s*([^|\r\n]+)\s*\|\s*Causal:\s*([^\r\n|]*)/i);
    if(!line)return Object.freeze({explicit:false,thread:'',forecast:'NONE',forecastProbability:null,sourceReliability:null,attention:null,outcome:'NA',horizon:'',causal:Object.freeze([])});
    const forecastRaw=text(line[2]).toUpperCase();
    const fm=forecastRaw.match(/^([^@]+)(?:@(\d{1,3}))?$/);
    return Object.freeze({
      explicit:true,
      thread:text(line[1]).toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-|-$/g,''),
      forecast:text(fm?.[1]||'NONE').replace(/\s+/g,'_'),
      forecastProbability:fm?.[2]!=null?clamp(fm[2]):null,
      sourceReliability:clamp(line[3]),attention:clamp(line[4]),
      outcome:text(line[5]).toUpperCase().replace(/\s+/g,'_'),
      horizon:text(line[6]).toUpperCase().replace(/\s+/g,''),
      causal:Object.freeze(text(line[7]).split(/[;,]/).map(x=>x.trim().toLowerCase()).filter(Boolean))
    });
  }

  function inferredThread(row){
    const key=text(row?.key).toLowerCase();
    if(key)return key.split(':').slice(0,3).join(':').replace(/[^a-z0-9._:-]+/g,'-');
    return text(row?.subject).toLowerCase().replace(/^\[[^\]]+\]\s*/,'').replace(/\s+[—-].*$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
  }
  function horizonFromDays(days){
    if(!Number.isFinite(days))return 'LONG';
    if(days<0)return 'PAST';if(days<=1)return 'TODAY';if(days<=7)return '7D';if(days<=30)return '30D';if(days<=90)return '90D';if(days<=365)return '12M';return 'LONG';
  }
  function feedbackAdjustment(row){
    const entry=loadFeedback()[feedbackKey(row)];return clamp(entry?.score||0,-30,30);
  }
  function inferredAttention(row){
    const action=Number(row?.actionScore||0),urg=Number(row?.urgency||0),score=Number(row?.personalScore||0);
    return clamp(Math.round(action*.45+urg*.35+score*.20));
  }
  function enrich(row){
    const ng=parseNextGen(row),adjust=feedbackAdjustment(row);
    const adjustedPersonalScore=clamp(Math.round(Number(row.personalScore||0)+adjust));
    const thread=ng.thread||inferredThread(row);
    const horizon=HORIZON_ORDER.includes(ng.horizon)?ng.horizon:horizonFromDays(Number(row.daysUntil));
    const attention=ng.attention??inferredAttention(row);
    const sourceReliability=ng.sourceReliability??Math.min(95,Math.max(50,Number(row.confidence||70)));
    const outcome=ng.outcome||'NA';
    const forecast=ng.forecast||'NONE';
    const packCandidate=adjustedPersonalScore>=78&&(Number(row.confidence||0)>=65||sourceReliability>=75);
    return Object.freeze({...row,nextGen:ng,thread,horizon,attention,sourceReliability,outcome,forecast,forecastProbability:ng.forecastProbability,causal:ng.causal,feedbackAdjustment:adjust,adjustedPersonalScore,packCandidate});
  }

  function buildStorylines(rows){
    const map=new Map();
    for(const row of rows){
      const key=row.thread||inferredThread(row);if(!key)continue;
      const group=map.get(key)||[];group.push(row);map.set(key,group);
    }
    return Object.freeze([...map.entries()].map(([id,items])=>{
      const sorted=items.slice().sort((a,b)=>new Date(a?.start?.dateTime||a?.start||0)-new Date(b?.start?.dateTime||b?.start||0));
      const first=sorted[0],last=sorted[sorted.length-1];
      const active=sorted.filter(x=>['OPEN','WAITING','NEEDS REVIEW'].includes(text(x.actionState).toUpperCase())).length;
      const peak=Math.max(...sorted.map(x=>Number(x.adjustedPersonalScore||0)),0);
      const forecastOpen=sorted.filter(x=>x.forecast&&x.forecast!=='NONE'&&['PENDING','NA'].includes(x.outcome)).length;
      return Object.freeze({id,pillar:last?.pillar||first?.pillar||'',count:sorted.length,active,peak,forecastOpen,first,last,items:Object.freeze(sorted)});
    }).sort((a,b)=>b.peak-a.peak||b.count-a.count));
  }

  function calibration(rows){
    const resolved=rows.filter(x=>x.forecast&&x.forecast!=='NONE'&&x.forecastProbability!=null&&['CONFIRMED','MISSED','PARTIAL'].includes(x.outcome));
    if(!resolved.length)return Object.freeze({count:0,brier:null,accuracy:null});
    let brier=0,hits=0;
    for(const row of resolved){
      const p=clamp(row.forecastProbability)/100;
      const y=row.outcome==='CONFIRMED'?1:row.outcome==='PARTIAL'?.5:0;
      brier+=(p-y)*(p-y);if((p>=.5&&y>=.5)||(p<.5&&y<.5))hits++;
    }
    return Object.freeze({count:resolved.length,brier:Number((brier/resolved.length).toFixed(3)),accuracy:Math.round(hits/resolved.length*100)});
  }

  function sourceLedger(rows){
    const buckets={OPERATIONS:[],SECURITY:[],CAREER:[],LEARNING:[],INTERESTS:[]};
    for(const row of rows)(buckets[row.pillar]||=[]).push(row.sourceReliability);
    return Object.freeze(Object.fromEntries(Object.entries(buckets).map(([pillar,vals])=>[pillar,Object.freeze({count:vals.length,score:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0})])));
  }

  function attentionBudget(rows){
    const active=rows.filter(x=>x.horizon!=='PAST'&&x.adjustedPersonalScore>=45&&x.attention>=35);
    const byPillar={};let load=0;
    for(const row of active){const w=row.horizon==='TODAY'?1:row.horizon==='7D'?.85:row.horizon==='30D'?.55:.3;const cost=row.attention*w;load+=cost;byPillar[row.pillar]=(byPillar[row.pillar]||0)+cost;}
    const scaled=clamp(Math.round(load/4));
    const state=scaled>=85?'OVERLOADED':scaled>=65?'HEAVY':scaled>=40?'BALANCED':'LIGHT';
    const deferrable=active.filter(x=>x.adjustedPersonalScore<70&&x.urgency<60).sort((a,b)=>b.attention-a.attention).slice(0,5);
    return Object.freeze({score:scaled,state,byPillar:Object.freeze(byPillar),deferrable:Object.freeze(deferrable)});
  }

  function causalGraph(rows){
    const nodes=new Map(rows.map(x=>[x.thread,x]));const edges=[];
    for(const row of rows)for(const parent of row.causal||[])edges.push(Object.freeze({from:parent,to:row.thread,resolved:nodes.has(parent),pillar:row.pillar}));
    return Object.freeze({nodes:Object.freeze([...nodes.keys()]),edges:Object.freeze(edges),unresolved:Object.freeze(edges.filter(e=>!e.resolved))});
  }

  function historicalPatterns(storylines){
    const patterns=[];
    for(const s of storylines){
      if(s.items.length<3)continue;
      const times=s.items.map(x=>new Date(x?.start?.dateTime||x?.start||0).getTime()).filter(Number.isFinite).sort((a,b)=>a-b);
      if(times.length<3)continue;
      const gaps=[];for(let i=1;i<times.length;i++)gaps.push((times[i]-times[i-1])/86400000);
      const avg=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);
      const span=Math.round((times[times.length-1]-times[0])/86400000);
      patterns.push(Object.freeze({thread:s.id,pillar:s.pillar,count:times.length,averageGapDays:avg,spanDays:span,signal:avg<=14?'HIGH_CADENCE':avg<=60?'REGULAR_CADENCE':'SPARSE_CADENCE'}));
    }
    return Object.freeze(patterns.sort((a,b)=>b.count-a.count).slice(0,20));
  }

  function horizonBuckets(rows){
    const out=Object.fromEntries(HORIZON_ORDER.map(k=>[k,[]]));
    for(const row of rows)(out[row.horizon]||out.LONG).push(row);
    for(const k of HORIZON_ORDER)out[k]=Object.freeze(out[k].sort((a,b)=>b.adjustedPersonalScore-a.adjustedPersonalScore));
    return Object.freeze(out);
  }

  function evidencePack(row,storyline){
    return Object.freeze({
      thread:row.thread,pillar:row.pillar,subject:row.subject,score:row.adjustedPersonalScore,urgency:row.urgency,confidence:row.confidence,
      sourceReliability:row.sourceReliability,horizon:row.horizon,forecast:row.forecast,forecastProbability:row.forecastProbability,outcome:row.outcome,
      actionState:row.actionState||'',nextAction:row.nextAction||'',dependency:row.dependency||'',causal:Object.freeze(row.causal||[]),
      timeline:Object.freeze((storyline?.items||[row]).slice(-8).map(x=>Object.freeze({subject:x.subject,start:x.start,score:x.adjustedPersonalScore,outcome:x.outcome,forecast:x.forecast})))
    });
  }

  function snapshot(){
    const base=CT.personalIntelligence.snapshot();
    const rows=Object.freeze((base.rows||[]).map(enrich));
    const storylines=buildStorylines(rows),storyMap=new Map(storylines.map(s=>[s.id,s]));
    const packs=Object.freeze(rows.filter(x=>x.packCandidate).sort((a,b)=>b.adjustedPersonalScore-a.adjustedPersonalScore).slice(0,8).map(x=>evidencePack(x,storyMap.get(x.thread))));
    const priorities=Object.freeze(rows.filter(x=>x.horizon!=='PAST'&&x.adjustedPersonalScore>=45).sort((a,b)=>b.adjustedPersonalScore-a.adjustedPersonalScore||b.attention-a.attention).slice(0,12));
    return Object.freeze({
      at:new Date().toISOString(),base,rows,storylines,calibration:calibration(rows),sourceLedger:sourceLedger(rows),attention:attentionBudget(rows),causal:causalGraph(rows),patterns:historicalPatterns(storylines),horizons:horizonBuckets(rows),evidencePacks:packs,priorities
    });
  }

  CT.nextGenIntelligence=Object.freeze({HORIZON_ORDER,parseNextGen,recordFeedback,enrich,buildStorylines,calibration,sourceLedger,attentionBudget,causalGraph,historicalPatterns,horizonBuckets,evidencePack,snapshot});
})(window);
