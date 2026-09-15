// Cert Tracker — privacy-safe five-pillar personal intelligence engine.
// Combines ChatGPT-managed Outlook milestones with browser-local tracker context.
// No conversation-derived private profile is stored in the public repository.
(function initPersonalIntelligence(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.accountConnections||!CT?.recommendations)return;

  const PILLARS=Object.freeze({
    OPERATIONS:Object.freeze({id:'OPERATIONS',label:'Work & Life Operations',types:Object.freeze(['WORK'])}),
    SECURITY:Object.freeze({id:'SECURITY',label:'Physical Security & Infrastructure',types:Object.freeze(['VENDOR'])}),
    CAREER:Object.freeze({id:'CAREER',label:'Career, Certification & Market',types:Object.freeze(['CERT'])}),
    LEARNING:Object.freeze({id:'LEARNING',label:'Learning, AI & Capability',types:Object.freeze(['TRAINING'])}),
    INTERESTS:Object.freeze({id:'INTERESTS',label:'Personal Interests & Technology',types:Object.freeze(['GAME'])})
  });
  const TYPE_TO_PILLAR=Object.freeze({WORK:'OPERATIONS',VENDOR:'SECURITY',CERT:'CAREER',TRAINING:'LEARNING',GAME:'INTERESTS'});
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const text=v=>String(v??'').trim();

  function eventDate(row){
    const raw=row?.start?.dateTime||row?.start||'';
    const d=new Date(raw);
    return Number.isNaN(d.getTime())?null:d;
  }
  function daysUntil(row){
    const d=eventDate(row);if(!d)return Infinity;
    return Math.ceil((d.getTime()-Date.now())/86400000);
  }
  function normalisePillar(value,fallbackType=''){
    const raw=text(value).toUpperCase().replace(/[^A-Z]/g,'');
    if(PILLARS[raw])return raw;
    const aliases={WORK:'OPERATIONS',LIFE:'OPERATIONS',WORKLIFE:'OPERATIONS',PHYSICALSECURITY:'SECURITY',INFRASTRUCTURE:'SECURITY',VENDOR:'SECURITY',CERT:'CAREER',CERTIFICATION:'CAREER',MARKET:'CAREER',AI:'LEARNING',TRAINING:'LEARNING',CAPABILITY:'LEARNING',GAME:'INTERESTS',GAMING:'INTERESTS',TECH:'INTERESTS',PERSONALTECH:'INTERESTS'};
    return aliases[raw]||TYPE_TO_PILLAR[text(fallbackType).toUpperCase()]||'OPERATIONS';
  }

  // Watches put this compact metadata line at the start of managed event bodies:
  // Intel: Pillar: SECURITY | Relevance: 86 | Urgency: 25 | Confidence: 92 | Goal links: current-role;convergence | Knowledge: LAB
  function parseIntel(row){
    const source=`${text(row?.bodyPreview)}\n${text(row?.subject)}`;
    const line=source.match(/Intel:\s*Pillar:\s*([^|\r\n]+)\s*\|\s*Relevance:\s*(\d{1,3})\s*\|\s*Urgency:\s*(\d{1,3})\s*\|\s*Confidence:\s*(\d{1,3})\s*\|\s*Goal links:\s*([^|\r\n]*)\s*\|\s*Knowledge:\s*([^\r\n|]+)/i);
    if(!line)return Object.freeze({pillar:normalisePillar('',row?.type),relevance:null,urgency:null,confidence:null,goalLinks:Object.freeze([]),knowledge:'NONE',explicit:false});
    return Object.freeze({
      pillar:normalisePillar(line[1],row?.type),
      relevance:clamp(line[2]),urgency:clamp(line[3]),confidence:clamp(line[4]),
      goalLinks:Object.freeze(text(line[5]).split(/[;,]/).map(x=>x.trim().toLowerCase()).filter(Boolean)),
      knowledge:text(line[6]).toUpperCase().replace(/\s+/g,'_')||'NONE',explicit:true
    });
  }

  function trackerContext(){
    const goalKey=CT.recommendations.currentGoal();
    const goal=CT.recommendations.GOALS?.[goalKey]||null;
    let coverage=null,path=null,recommendations=[],gate=null;
    try{coverage=CT.competency?.goalCoverage?.(goalKey)||null;}catch{}
    try{path=CT.phases?.pathStatus?.()||null;}catch{}
    try{recommendations=CT.recommendations.recommend({limit:4,horizon:'now'})||[];}catch{}
    try{
      const next=CT.careerFramework?.context?.()?.next;
      const map={physicalSystemsEngineer:'physicalSystemsEngineer',networkSecurity:'networkSecurityEngineer',otSecurity:'otSecurityEngineer',convergenceEngineer:'convergenceEngineer',solutionsArchitect:'solutionsArchitect',securityArchitect:'solutionsArchitect',convergence:'principalConvergenceArchitect',principalConvergence:'principalConvergenceArchitect'};
      gate=next&&map[next]?CT.capabilityGates?.roleGateStatus?.(map[next])||null:null;
    }catch{}
    return Object.freeze({
      goalKey,goalLabel:goal?.label||goalKey,
      coverage:coverage?Object.freeze({score:Number(coverage.score||0),gaps:Object.freeze((coverage.gaps||[]).slice(0,8))}):null,
      path:path?Object.freeze({complete:!!path.complete,currentPhase:Number(path.currentPhase||0)}):null,
      recommendations:Object.freeze(recommendations.map(item=>Object.freeze({id:item.id,name:item.name,score:item.score,readiness:Number(item.readiness?.score||0),portfolioClass:item.portfolioClass||''}))),
      gate:gate?Object.freeze({label:gate.label||'',score:Number(gate.score||0),ready:!!gate.ready}):null
    });
  }

  function localGoalFit(row,intel,context){
    const hay=`${text(row?.subject)} ${text(row?.bodyPreview)}`.toLowerCase();
    let fit=35;
    const goal=text(context?.goalKey).toLowerCase();
    const links=intel.goalLinks||[];
    if(links.some(x=>x===goal||x.includes(goal)||goal.includes(x)))fit=95;
    if(links.some(x=>['current-role','currentrole','work'].includes(x)))fit=Math.max(fit,80);
    if(links.some(x=>['next-role','nextrole','career'].includes(x)))fit=Math.max(fit,82);
    if(links.some(x=>['convergence','security-convergence'].includes(x)))fit=Math.max(fit,90);

    const type=text(row?.type).toUpperCase();
    if(type==='VENDOR')fit=Math.max(fit,['convergence','physical','network'].includes(goal)?88:72);
    if(type==='CERT')fit=Math.max(fit,82);
    if(type==='TRAINING')fit=Math.max(fit,68);
    if(type==='WORK')fit=Math.max(fit,92);
    if(type==='GAME')fit=Math.max(fit,45);

    for(const rec of context?.recommendations||[]){
      const name=text(rec.name).toLowerCase();
      if(name&&hay.includes(name))fit=Math.max(fit,96);
      const id=text(rec.id).toLowerCase();
      if(id&&id.length>3&&hay.includes(id.replace(/-/g,' ')))fit=Math.max(fit,90);
    }
    return clamp(fit);
  }

  function actionScore(row){
    const state=text(row?.actionState).toUpperCase();
    if(state==='OPEN')return 92;if(state==='NEEDS REVIEW')return 88;if(state==='WAITING')return 68;
    if(['EXPIRED','CANCELLED','DONE','SUPERSEDED'].includes(state))return 10;
    const next=text(row?.nextAction).toLowerCase();return next&&next!=='none'?65:25;
  }
  function timeScore(row){
    const d=daysUntil(row);if(!Number.isFinite(d))return 20;
    if(d<0)return 8;if(d<=1)return 100;if(d<=3)return 92;if(d<=7)return 80;if(d<=30)return 60;if(d<=90)return 42;return 24;
  }
  function inferredUrgency(row){
    const d=daysUntil(row),state=text(row?.actionState).toUpperCase();
    if(state==='NEEDS REVIEW'&&d<=3)return 88;if(state==='OPEN'&&d<=1)return 92;if(d<=1)return 75;if(d<=3)return 62;return 25;
  }

  function enrich(row,context=trackerContext()){
    const intel=parseIntel(row),localFit=localGoalFit(row,intel,context);
    const sourceRelevance=intel.relevance??(row?.impact==null?45:clamp(row.impact));
    const urgency=intel.urgency??inferredUrgency(row),confidence=intel.confidence??70;
    const action=actionScore(row),timing=timeScore(row);
    const personalScore=clamp(Math.round(sourceRelevance*.45+localFit*.20+action*.10+timing*.10+confidence*.10+urgency*.05));
    const interrupt=personalScore>=85&&urgency>=75&&confidence>=60;
    const mode=interrupt?'URGENT':personalScore>=70&&action>=60?'ACTIONABLE':personalScore>=45?'CALENDAR':'BACKGROUND';
    return Object.freeze({...row,intel,localGoalFit:localFit,personalScore,urgency,confidence,actionScore:action,timeScore:timing,daysUntil:daysUntil(row),mode,pillar:intel.pillar,interrupt});
  }

  function pillarSummary(id,rows,context){
    const spec=PILLARS[id],items=rows.filter(row=>row.pillar===id).sort((a,b)=>b.personalScore-a.personalScore||a.daysUntil-b.daysUntil);
    const top=items.slice(0,3),score=top.length?Math.round(top.reduce((s,x,i)=>s+x.personalScore*(i===0?.55:i===1?.30:.15),0)/(top.length===1?.55:top.length===2?.85:1)):0;
    const open=items.filter(x=>['OPEN','WAITING','NEEDS REVIEW'].includes(text(x.actionState).toUpperCase())).length;
    const urgent=items.filter(x=>x.interrupt).length;
    const next=items.filter(x=>x.daysUntil>=0).sort((a,b)=>a.daysUntil-b.daysUntil)[0]||null;
    const status=urgent?'URGENT':open?'ACTIVE':items.length?'TRACKING':'QUIET';
    return Object.freeze({id,label:spec.label,score:clamp(score),status,count:items.length,open,urgent,next,top:Object.freeze(top)});
  }

  function snapshot(){
    const outlook=CT.accountConnections.snapshot();
    const context=trackerContext();
    const raw=Array.isArray(outlook?.managed)?outlook.managed:[];
    const rows=raw.map(row=>enrich(row,context));
    const pillars=Object.freeze(Object.fromEntries(Object.keys(PILLARS).map(id=>[id,pillarSummary(id,rows,context)])));
    const priorities=Object.freeze(rows.filter(row=>row.daysUntil>=-1&&row.daysUntil<=90&&row.personalScore>=45).sort((a,b)=>{
      if(a.interrupt!==b.interrupt)return a.interrupt?-1:1;
      if(a.personalScore!==b.personalScore)return b.personalScore-a.personalScore;
      if(a.actionScore!==b.actionScore)return b.actionScore-a.actionScore;
      return a.daysUntil-b.daysUntil;
    }).slice(0,10));
    const knowledge=Object.freeze(rows.filter(row=>row.intel.knowledge&&row.intel.knowledge!=='NONE').sort((a,b)=>b.personalScore-a.personalScore));
    return Object.freeze({at:new Date().toISOString(),outlookAt:outlook?.at||'',context,pillars,rows:Object.freeze(rows),priorities,knowledge,urgent:Object.freeze(rows.filter(x=>x.interrupt))});
  }

  CT.personalIntelligence=Object.freeze({PILLARS,TYPE_TO_PILLAR,parseIntel,trackerContext,enrich,pillarSummary,snapshot});
})(window);
