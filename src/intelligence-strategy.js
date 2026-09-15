// Cert Tracker — strategic decision intelligence over the five-pillar timeline.
// Privacy-safe: persistent learning remains browser-local; public code contains only generic logic.
(function initStrategyIntelligence(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.nextGenIntelligence)return;

  const text=v=>String(v??'').trim();
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const DAY=86400000;
  const STORE='certtracker.strategy-intelligence.v1';
  const OPPORTUNITY_STAGES=Object.freeze(['NONE','DISCOVERED','QUALIFIED','CONSIDERING','WAITING','ACTIONABLE','COMMITTED','COMPLETED','REJECTED']);

  function safeParse(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
  function loadState(){
    try{
      const parsed=safeParse(global.localStorage?.getItem(STORE)||'',{});
      return parsed&&typeof parsed==='object'?parsed:{};
    }catch{return {};}
  }
  function saveState(state){try{global.localStorage?.setItem(STORE,JSON.stringify(state||{}));}catch{}}
  function isoDay(value){
    if(!value||String(value).toUpperCase()==='NONE')return '';
    const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10);
  }
  function eventDate(row){
    const raw=row?.start?.dateTime||row?.start||'';const d=new Date(raw);
    return Number.isNaN(d.getTime())?null:d;
  }
  function eventAgeDays(row){
    const raw=row?.lastModifiedDateTime||row?.createdDateTime||row?.start?.dateTime||row?.start||'';
    const d=new Date(raw);if(Number.isNaN(d.getTime()))return 0;
    return Math.max(0,Math.floor((Date.now()-d.getTime())/DAY));
  }
  function splitList(value){return Object.freeze(text(value).split(/[;,]/).map(x=>x.trim().toLowerCase()).filter(Boolean));}
  function normId(value){return text(value).toLowerCase().replace(/[^a-z0-9._:-]+/g,'-').replace(/^-|-$/g,'').slice(0,140);}
  function parseNumber(value){const v=text(value).toUpperCase();if(!v||v==='UNKNOWN'||v==='NONE')return null;const n=Number(v.replace(/[£,]/g,''));return Number.isFinite(n)?Math.max(0,n):null;}

  // Strategy: Entity: axis-os | Risk: 70 | Opportunity: NONE | Decision: axis-os-13-deploy | Expiry: 2026-10-01 | Review: 2026-09-22 | Money: UNKNOWN | Hours: 2 | Proof: REQUIRED | Contradiction: OPEN | Trigger: lab-verify;cert-impact
  function parseStrategy(row){
    const source=`${text(row?.bodyPreview)}\n${text(row?.subject)}`;
    const m=source.match(/Strategy:\s*Entity:\s*([^|\r\n]+)\s*\|\s*Risk:\s*(\d{1,3})\s*\|\s*Opportunity:\s*([^|\r\n]+)\s*\|\s*Decision:\s*([^|\r\n]+)\s*\|\s*Expiry:\s*([^|\r\n]+)\s*\|\s*Review:\s*([^|\r\n]+)\s*\|\s*Money:\s*([^|\r\n]+)\s*\|\s*Hours:\s*([^|\r\n]+)\s*\|\s*Proof:\s*([^|\r\n]+)\s*\|\s*Contradiction:\s*([^|\r\n]+)\s*\|\s*Trigger:\s*([^\r\n|]*)/i);
    if(!m)return Object.freeze({explicit:false,entity:'',risk:0,opportunity:'NONE',decision:'',expiry:'',review:'',money:null,hours:null,proof:'NONE',contradiction:'NONE',triggers:Object.freeze([])});
    const opportunity=text(m[3]).toUpperCase().replace(/\s+/g,'_');
    return Object.freeze({
      explicit:true,
      entity:normId(m[1]),
      risk:clamp(m[2]),
      opportunity:OPPORTUNITY_STAGES.includes(opportunity)?opportunity:'NONE',
      decision:text(m[4]).toUpperCase()==='NONE'?'':normId(m[4]),
      expiry:isoDay(m[5]),review:isoDay(m[6]),
      money:parseNumber(m[7]),hours:parseNumber(m[8]),
      proof:text(m[9]).toUpperCase().replace(/\s+/g,'_'),
      contradiction:text(m[10]).toUpperCase().replace(/\s+/g,'_'),
      triggers:splitList(m[11])
    });
  }

  function inferredEntity(row){
    const thread=normId(row?.thread);if(thread)return thread.split(':')[0]||thread;
    return normId(text(row?.subject).replace(/^\[[^\]]+\]\s*/,''));
  }
  function inferredOpportunity(row){
    if(['DONE','CANCELLED','EXPIRED','SUPERSEDED'].includes(text(row?.actionState).toUpperCase()))return 'NONE';
    const score=Number(row?.adjustedPersonalScore||0),action=Number(row?.actionScore||0);
    if(['CAREER','LEARNING','INTERESTS'].includes(row?.pillar)&&score>=78&&action>=60)return 'QUALIFIED';
    return 'NONE';
  }
  function confidenceHalfLife(pillar){return ({OPERATIONS:14,SECURITY:45,CAREER:90,LEARNING:60,INTERESTS:90})[pillar]||60;}
  function effectiveConfidence(row,strategy){
    const base=clamp(row?.confidence||row?.sourceReliability||70);
    const activeAction=['OPEN','WAITING','NEEDS REVIEW'].includes(text(row?.actionState).toUpperCase());
    if(row?.outcome==='CONFIRMED'&&!activeAction)return Object.freeze({base,effective:base,decay:0,stale:false,reason:'confirmed'});
    if(row?.horizon==='PAST'&&!activeAction&&strategy.contradiction!=='OPEN')return Object.freeze({base,effective:base,decay:0,stale:false,reason:'historical fact'});
    const today=new Date().toISOString().slice(0,10);
    let overdue=0,reason='freshness';
    if(strategy.review){
      const review=new Date(`${strategy.review}T12:00:00Z`);overdue=Math.max(0,Math.floor((Date.now()-review.getTime())/DAY));reason='review date';
    }else overdue=eventAgeDays(row);
    const half=confidenceHalfLife(row?.pillar),decay=overdue<=0?0:Math.min(55,Math.round((overdue/half)*18));
    const effective=clamp(base-decay,20,100);
    return Object.freeze({base,effective,decay,stale:decay>=12,reason});
  }
  function decisionStatus(strategy){
    const today=new Date().toISOString().slice(0,10);
    const deadline=strategy.expiry||strategy.review;if(!deadline)return 'CURRENT';
    const days=Math.ceil((new Date(`${deadline}T12:00:00Z`)-Date.now())/DAY);
    if(days<0)return 'EXPIRED';if(days<=7)return 'DUE_SOON';return 'CURRENT';
  }
  function proofStatus(row,strategy){
    if(strategy.proof!=='REQUIRED')return strategy.proof||'NONE';
    if(strategy.proof==='EVIDENCED')return 'EVIDENCED';
    const done=['DONE','COMPLETED','RESOLVED'].includes(text(row?.actionState).toUpperCase())||strategy.opportunity==='COMPLETED';
    return done?'UNVERIFIED_COMPLETE':'REQUIRED';
  }
  function enrich(row){
    const strategy=parseStrategy(row),entity=strategy.entity||inferredEntity(row),opportunity=strategy.opportunity!=='NONE'?strategy.opportunity:inferredOpportunity(row);
    const freshness=effectiveConfidence(row,strategy),decisionState=decisionStatus(strategy),proof=proofStatus(row,strategy);
    const risk=strategy.risk||0;
    return Object.freeze({...row,strategy,entity,risk,opportunity,decisionId:strategy.decision,decisionState,effectiveConfidence:freshness.effective,confidenceDecay:freshness.decay,confidenceStale:freshness.stale,proofState:proof,contradictionState:strategy.contradiction,triggers:strategy.triggers,money:strategy.money,hours:strategy.hours});
  }

  function riskRegister(rows){
    return Object.freeze(rows.filter(x=>x.risk>=35||x.contradictionState==='OPEN').map(row=>{
      const a=text(row.actionState).toUpperCase();
      const state=['DONE','RESOLVED','CANCELLED','SUPERSEDED'].includes(a)?'RESOLVED':a==='WAITING'?'MONITORING':a==='OPEN'?'MITIGATING':'OPEN';
      return Object.freeze({id:`risk:${row.thread}`,entity:row.entity,thread:row.thread,pillar:row.pillar,subject:row.subject,score:Math.max(row.risk,row.contradictionState==='OPEN'?55:0),state,confidence:row.effectiveConfidence,nextReview:row.strategy.review||'',mitigation:row.nextAction||'',dependency:row.dependency||''});
    }).sort((a,b)=>b.score-a.score||a.confidence-b.confidence));
  }
  function opportunityPipeline(rows){
    const items=rows.filter(x=>x.opportunity&&x.opportunity!=='NONE').map(x=>Object.freeze({id:`opp:${x.thread}`,entity:x.entity,thread:x.thread,pillar:x.pillar,subject:x.subject,stage:x.opportunity,relevance:x.adjustedPersonalScore,attention:x.attention,money:x.money,hours:x.hours,expiry:x.strategy.expiry||'',nextAction:x.nextAction||'',confidence:x.effectiveConfidence}));
    const counts=Object.fromEntries(OPPORTUNITY_STAGES.filter(x=>x!=='NONE').map(stage=>[stage,items.filter(x=>x.stage===stage).length]));
    return Object.freeze({items:Object.freeze(items.sort((a,b)=>b.relevance-a.relevance||a.attention-b.attention)),counts:Object.freeze(counts)});
  }

  function syncDecisionAudit(rows){
    const state=loadState(),audit=Array.isArray(state.decisionAudit)?state.decisionAudit:[],known=state.decisionSignatures||{};
    let changed=false;
    for(const row of rows){
      if(!row.decisionId)continue;
      const signature=[row.opportunity,row.decisionState,row.actionState||'',row.nextAction||'',row.risk,row.adjustedPersonalScore,row.effectiveConfidence,row.contradictionState].join('|');
      const prev=known[row.decisionId];
      if(prev&&prev.signature!==signature){
        audit.push({at:new Date().toISOString(),decision:row.decisionId,thread:row.thread,subject:row.subject,previous:prev.signature,current:signature,evidence:`managed event state changed; effective confidence ${row.effectiveConfidence}`});
        changed=true;
      }
      if(!prev||prev.signature!==signature){known[row.decisionId]={signature,at:new Date().toISOString()};changed=true;}
    }
    if(audit.length>120)audit.splice(0,audit.length-120);
    if(changed){state.decisionAudit=audit;state.decisionSignatures=known;saveState(state);}
    return Object.freeze(audit.slice().reverse());
  }

  function baselineSnapshot(rows,next){
    const state=loadState(),history=Array.isArray(state.baselines)?state.baselines:[],day=new Date().toISOString().slice(0,10);
    const snapshot={day,attention:next.attention?.score||0,openActions:rows.filter(x=>['OPEN','WAITING','NEEDS REVIEW'].includes(text(x.actionState).toUpperCase())).length,activeRisks:rows.filter(x=>x.risk>=35&&x.decisionState!=='EXPIRED').length,actionableOpportunities:rows.filter(x=>x.opportunity==='ACTIONABLE'||x.opportunity==='COMMITTED').length,contradictions:rows.filter(x=>x.contradictionState==='OPEN').length,staleConfidence:rows.filter(x=>x.confidenceStale).length,decisionsDue:rows.filter(x=>['DUE_SOON','EXPIRED'].includes(x.decisionState)&&x.decisionId).length};
    const idx=history.findIndex(x=>x.day===day);if(idx>=0)history[idx]=snapshot;else history.push(snapshot);
    while(history.length>120)history.shift();state.baselines=history;saveState(state);
    const nearest=days=>{const target=Date.now()-days*DAY;return history.slice().reverse().find(x=>new Date(`${x.day}T12:00:00Z`).getTime()<=target)||null;};
    const compare=prior=>prior?Object.freeze({attention:snapshot.attention-prior.attention,openActions:snapshot.openActions-prior.openActions,activeRisks:snapshot.activeRisks-prior.activeRisks,actionableOpportunities:snapshot.actionableOpportunities-prior.actionableOpportunities,contradictions:snapshot.contradictions-prior.contradictions,staleConfidence:snapshot.staleConfidence-prior.staleConfidence,decisionsDue:snapshot.decisionsDue-prior.decisionsDue}):null;
    return Object.freeze({current:Object.freeze(snapshot),vs7d:compare(nearest(7)),vs30d:compare(nearest(30)),history:Object.freeze(history.slice())});
  }

  function entityDossiers(rows){
    const map=new Map();
    for(const row of rows){const id=row.entity||row.thread;if(!id)continue;const arr=map.get(id)||[];arr.push(row);map.set(id,arr);}
    return Object.freeze([...map.entries()].map(([id,items])=>{
      const sorted=items.slice().sort((a,b)=>(eventDate(b)?.getTime()||0)-(eventDate(a)?.getTime()||0)),current=sorted[0];
      const risks=items.filter(x=>x.risk>=35),opps=items.filter(x=>x.opportunity!=='NONE'&&!['COMPLETED','REJECTED'].includes(x.opportunity)),decisions=items.filter(x=>x.decisionId&&x.decisionState!=='EXPIRED');
      const confidence=items.length?Math.round(items.reduce((s,x)=>s+x.effectiveConfidence,0)/items.length):0;
      const neighbours=[...new Set(items.flatMap(x=>x.causal||[]))];
      return Object.freeze({id,pillar:current?.pillar||'',current,count:items.length,risks:risks.length,opportunities:opps.length,decisions:decisions.length,confidence,neighbours:Object.freeze(neighbours),items:Object.freeze(sorted)});
    }).sort((a,b)=>(b.risks*20+b.opportunities*12+(b.current?.adjustedPersonalScore||0))-(a.risks*20+a.opportunities*12+(a.current?.adjustedPersonalScore||0))));
  }

  function contradictionQueue(rows){return Object.freeze(rows.filter(x=>x.contradictionState==='OPEN').map(x=>Object.freeze({thread:x.thread,entity:x.entity,pillar:x.pillar,subject:x.subject,confidence:x.effectiveConfidence,risk:x.risk,review:x.strategy.review||'',decision:x.decisionId||''})).sort((a,b)=>b.risk-a.risk));}
  function weakSignals(rows){
    const recent=rows.filter(x=>{const d=eventDate(x);return d&&Date.now()-d.getTime()<=180*DAY&&Date.now()-d.getTime()>=0;});
    const map=new Map();for(const row of recent){if(!row.entity)continue;const arr=map.get(row.entity)||[];arr.push(row);map.set(row.entity,arr);}
    const out=[];for(const [entity,items] of map){const subjects=new Set(items.map(x=>x.subject));const threads=new Set(items.map(x=>x.thread));if(items.length<3||subjects.size<2)continue;const avg=Math.round(items.reduce((s,x)=>s+x.effectiveConfidence,0)/items.length),score=clamp(Math.round(items.reduce((s,x)=>s+x.adjustedPersonalScore,0)/items.length*.65+Math.min(30,items.length*5)));if(avg>=98)continue;out.push(Object.freeze({entity,count:items.length,threads:threads.size,confidence:avg,score,label:'WEAK SIGNAL',latest:items.slice().sort((a,b)=>(eventDate(b)?.getTime()||0)-(eventDate(a)?.getTime()||0))[0]}));}
    return Object.freeze(out.sort((a,b)=>b.score-a.score).slice(0,12));
  }
  function triggerChains(rows){return Object.freeze(rows.filter(x=>x.triggers?.length).flatMap(row=>row.triggers.map(trigger=>Object.freeze({from:row.thread,entity:row.entity,pillar:row.pillar,trigger,status:['DONE','CANCELLED','SUPERSEDED'].includes(text(row.actionState).toUpperCase())?'CLOSED':'OPEN'}))).slice(0,40));}
  function decisionQueue(rows){return Object.freeze(rows.filter(x=>x.decisionId).map(x=>Object.freeze({decision:x.decisionId,thread:x.thread,subject:x.subject,state:x.decisionState,expiry:x.strategy.expiry||'',review:x.strategy.review||'',risk:x.risk,relevance:x.adjustedPersonalScore,confidence:x.effectiveConfidence,contradiction:x.contradictionState,proof:x.proofState})).sort((a,b)=>{const rank={EXPIRED:0,DUE_SOON:1,CURRENT:2};return (rank[a.state]??3)-(rank[b.state]??3)||b.risk-a.risk;}));}
  function proofQueue(rows){return Object.freeze(rows.filter(x=>['REQUIRED','UNVERIFIED_COMPLETE'].includes(x.proofState)).map(x=>Object.freeze({thread:x.thread,subject:x.subject,pillar:x.pillar,state:x.proofState,actionState:x.actionState||'',nextAction:x.nextAction||''})).sort((a,b)=>a.state==='UNVERIFIED_COMPLETE'?-1:1));}

  function economics(rows){
    const active=rows.filter(x=>['QUALIFIED','CONSIDERING','WAITING','ACTIONABLE','COMMITTED'].includes(x.opportunity));
    const knownMoney=active.filter(x=>x.money!=null),knownHours=active.filter(x=>x.hours!=null);
    const gbp=knownMoney.reduce((s,x)=>s+x.money,0),hours=knownHours.reduce((s,x)=>s+x.hours,0);
    const items=active.map(x=>Object.freeze({thread:x.thread,subject:x.subject,stage:x.opportunity,money:x.money,hours:x.hours,relevance:x.adjustedPersonalScore,attention:x.attention,valueSignal:clamp(Math.round(x.adjustedPersonalScore-(x.attention*.25)-((x.hours||0)*.3)-Math.min(20,(x.money||0)/100)))})).sort((a,b)=>b.valueSignal-a.valueSignal);
    return Object.freeze({active:active.length,knownMoney:knownMoney.length,knownHours:knownHours.length,gbp:Number(gbp.toFixed(2)),hours:Number(hours.toFixed(1)),items:Object.freeze(items)});
  }

  function changeImpact(row,allRows,next){
    const linked=allRows.filter(x=>x.thread!==row.thread&&((row.causal||[]).includes(x.thread)||(x.causal||[]).includes(row.thread)));
    const attentionAfter=clamp((next.attention?.score||0)+Math.round((row.attention||0)/8));
    const displacement=next.attention?.state==='OVERLOADED'||attentionAfter>=85?'HIGH':attentionAfter>=65?'MEDIUM':'LOW';
    const risks=linked.filter(x=>x.risk>=35).length,opps=linked.filter(x=>x.opportunity!=='NONE').length;
    const sensitivity=row.strategy.review?'review/freshness evidence':row.contradictionState==='OPEN'?'contradiction resolution':row.hours==null||row.money==null?'unknown time/cost':'dependency outcome';
    return Object.freeze({thread:row.thread,subject:row.subject,doNow:Object.freeze({attentionAfter,displacement,linkedRisks:risks,linkedOpportunities:opps,money:row.money,hours:row.hours}),defer:Object.freeze({attentionAfter:next.attention?.score||0,displacement:'NONE',riskOfDelay:row.urgency>=70?'HIGH':row.opportunity==='ACTIONABLE'?'MEDIUM':'LOW'}),sensitivity});
  }
  function counterfactuals(rows,next){
    const candidates=rows.filter(x=>x.decisionId||['QUALIFIED','CONSIDERING','ACTIONABLE','COMMITTED'].includes(x.opportunity)||x.risk>=65).sort((a,b)=>b.adjustedPersonalScore-a.adjustedPersonalScore).slice(0,8);
    return Object.freeze(candidates.map(row=>changeImpact(row,rows,next)));
  }

  function scenarios(rows,next,risks,opportunities){
    const avg=(pillar,field='adjustedPersonalScore')=>{const vals=rows.filter(x=>x.pillar===pillar&&x.horizon!=='PAST').map(x=>Number(x[field]||0));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;};
    const riskPressure=risks.slice(0,8).reduce((s,x)=>s+x.score,0)/Math.max(1,Math.min(8,risks.length));
    const career=avg('CAREER'),learning=avg('LEARNING'),security=avg('SECURITY'),operations=avg('OPERATIONS'),interest=avg('INTERESTS');
    const overload=next.attention?.score||0,oppQuality=opportunities.items.slice(0,8).reduce((s,x)=>s+x.relevance,0)/Math.max(1,Math.min(8,opportunities.items.length));
    const list=[
      {id:'OPERATIONAL_STABILITY',label:'Operational stability',score:clamp(Math.round(35+operations*.20+security*.15+riskPressure*.25+overload*.20)),reason:'Prioritises current commitments, compatibility and risk reduction.'},
      {id:'CORE_PATH_ACCELERATION',label:'Core-path acceleration',score:clamp(Math.round(30+career*.28+learning*.18+security*.12+oppQuality*.18-Math.max(0,overload-65)*.35)),reason:'Prioritises the highest-leverage capability and career path while penalising overload.'},
      {id:'STRATEGIC_OPTIONALITY',label:'Strategic optionality',score:clamp(Math.round(30+career*.16+learning*.20+interest*.10+oppQuality*.24-Math.max(0,riskPressure-55)*.20)),reason:'Keeps credible adjacent opportunities alive without automatically displacing the core.'}
    ];
    return Object.freeze(list.sort((a,b)=>b.score-a.score).map(Object.freeze));
  }

  function monthlyReview(rows,next,risks,opps,audit,baseline,econ,scenariosList){
    const cutoff=Date.now()-30*DAY,recent=rows.filter(x=>{const d=eventDate(x);return d&&d.getTime()>=cutoff&&d.getTime()<=Date.now();});
    const openedRisks=risks.filter(x=>recent.some(r=>r.thread===x.thread)).length;
    const changedDecisions=audit.filter(x=>new Date(x.at).getTime()>=cutoff).length;
    const resolvedForecasts=recent.filter(x=>x.forecast&&x.forecast!=='NONE'&&['CONFIRMED','PARTIAL','MISSED'].includes(x.outcome));
    const top=recent.slice().sort((a,b)=>b.adjustedPersonalScore-a.adjustedPersonalScore).slice(0,5);
    const focus=next.priorities?.[0]?.subject||opps.items?.[0]?.subject||'Maintain current priorities';
    return Object.freeze({periodDays:30,materialEvents:recent.filter(x=>x.adjustedPersonalScore>=55).length,openedRisks,activeRisks:risks.filter(x=>x.state!=='RESOLVED').length,activeOpportunities:opps.items.filter(x=>!['COMPLETED','REJECTED'].includes(x.stage)).length,changedDecisions,resolvedForecasts:resolvedForecasts.length,attention:next.attention?.state||'LIGHT',economics:Object.freeze({gbp:econ.gbp,hours:econ.hours,knownMoney:econ.knownMoney,knownHours:econ.knownHours}),baseline30d:baseline.vs30d,scenarioLeader:scenariosList[0]||null,focus,top:Object.freeze(top)});
  }

  function snapshot(){
    const next=CT.nextGenIntelligence.snapshot(),rows=Object.freeze((next.rows||[]).map(enrich));
    const risks=riskRegister(rows),opportunities=opportunityPipeline(rows),audit=syncDecisionAudit(rows),baseline=baselineSnapshot(rows,next),dossiers=entityDossiers(rows),contradictions=contradictionQueue(rows),weak=weakSignals(rows),triggers=triggerChains(rows),decisions=decisionQueue(rows),proof=proofQueue(rows),econ=economics(rows),counter=counterfactuals(rows,next),scenarioList=scenarios(rows,next,risks,opportunities),review=monthlyReview(rows,next,risks,opportunities,audit,baseline,econ,scenarioList);
    return Object.freeze({at:new Date().toISOString(),next,rows,risks,opportunities,decisionAudit:audit,baseline,dossiers,contradictions,weakSignals:weak,triggers,decisions,proof,economics:econ,counterfactuals:counter,scenarios:scenarioList,monthlyReview:review,stale:Object.freeze(rows.filter(x=>x.confidenceStale).sort((a,b)=>b.confidenceDecay-a.confidenceDecay))});
  }

  CT.strategyIntelligence=Object.freeze({OPPORTUNITY_STAGES,parseStrategy,effectiveConfidence,enrich,riskRegister,opportunityPipeline,entityDossiers,contradictionQueue,weakSignals,triggerChains,decisionQueue,proofQueue,economics,changeImpact,counterfactuals,scenarios,monthlyReview,snapshot});
})(window);
