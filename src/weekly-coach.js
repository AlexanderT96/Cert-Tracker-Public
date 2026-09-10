// Cert Tracker — deterministic weekly commitment and execution-review loop.
(function initWeeklyCoach(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.careerAdvisor||!CT?.careerMentor||!CT?.storage)throw new Error('Career advisor, mentor and storage must load before weekly-coach.js');

  const DEFAULTS=Object.freeze({active:null,reviews:Object.freeze([]),blockedResources:Object.freeze({})});
  const OUTCOMES=Object.freeze(['complete','partial','blocked','deferred']);
  const BLOCKERS=Object.freeze(['time','prerequisite','material','assessment','access','health','other']);
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
  const now=()=>new Date().toISOString();
  const localToday=()=>CT.util.localDateStamp();
  const uniqueId=prefix=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  function weekStart(value=new Date()){
    const d=value instanceof Date?new Date(value):new Date(value);
    if(!Number.isFinite(d.getTime()))return localToday();
    const day=d.getDay(),distance=day===0?-6:1-day;d.setDate(d.getDate()+distance);
    return CT.util.localDateStamp(d);
  }
  function prefs(){const raw=state.customization?.weeklyCoach;return raw&&typeof raw==='object'?{...DEFAULTS,...raw,reviews:Array.isArray(raw.reviews)?raw.reviews:[],blockedResources:raw.blockedResources&&typeof raw.blockedResources==='object'?raw.blockedResources:{}}:{...DEFAULTS,reviews:[],blockedResources:{}};}
  function update(patch,label='weekly coach'){
    const next={...prefs(),...patch};
    const validation=CT.storage.validateBackup({version:CT.version.backup,customization:{weeklyCoach:next}});
    if(!validation.ok)throw new Error(validation.errors.join(' '));
    CT.storage.captureUndoPoint(label);state.customization={...state.customization,weeklyCoach:next};save.customization();CT.events?.emit('weekly-coach-changed',{});return next;
  }
  function sourceFor(advice,scheduleIndex=0){
    const row=advice.study.schedule[scheduleIndex];
    if(advice.primary.cert&&row)return Object.freeze({kind:'study-deliverable',id:`${advice.primary.cert.id}:week-${row.week}`,label:row.deliverable});
    const project=CT.careerMentor.projectAssessment(advice),criterion=project.criteria.find(item=>!item.met);if(criterion)return Object.freeze({kind:'project-criterion',id:`${advice.role.id}:criterion-${criterion.index}`,label:criterion.label});
    const gate=advice.gate.conditions.find(item=>!item.met);if(gate)return Object.freeze({kind:'move-gate',id:`${advice.role.id}:gate-${advice.gate.conditions.indexOf(gate)}`,label:gate.label});
    return Object.freeze({kind:'advisor-move',id:advice.primary.cert?.id||advice.primary.type||'career',label:advice.primary.summary});
  }
  function selectedAdvice(advice,selection='primary'){
    if(selection!=='runner-up')return advice;
    const primary=advice.alternative;if(!primary)return null;
    const parallel=CT.careerAdvisor.parallelMove(primary),study=CT.careerAdvisor.studyPlan(primary,advice.study.weeks),project=CT.careerAdvisor.projectBrief(advice.role,primary,parallel),draft={...advice,primary,parallel,study,project};
    draft.gate=CT.careerAdvisor.moveGate(advice.role,primary,project);draft.snapshot=CT.careerAdvisor.snapshot(draft);draft.signature=JSON.stringify(draft.snapshot);return Object.freeze(draft);
  }
  function completedCycles(advice,p=prefs()){const primaryId=advice.primary.cert?.id||advice.primary.type;return p.reviews.filter(row=>row.roleId===advice.role.id&&row.primaryId===primaryId&&row.outcome==='complete').length;}
  function preview(advice=CT.careerAdvisor.advise(),options={}){
    const p=options.prefs||prefs(),selection=options.selection==='runner-up'?'runner-up':'primary',chosen=selectedAdvice(advice,selection);if(!chosen)throw new Error('No viable runner-up exists in the current route stage.');
    const primaryId=chosen.primary.cert?.id||chosen.primary.type||'career',index=options.scheduleIndex??completedCycles(chosen,p),source=sourceFor(chosen,index),capacity=clamp(options.plannedHours??chosen.study.weeklyHours,.5,168),parallelHours=capacity>=4&&chosen.parallel?.title?Math.min(2,Math.max(.5,Math.round(capacity*.2*2)/2)):0,primaryHours=Math.max(.5,capacity-parallelHours),blocked=new Set(Object.keys(p.blockedResources||{})),resource=chosen.study.materials.find(row=>!blocked.has(row.url))||null;
    return Object.freeze({selection,roleId:chosen.role.id,roleTitle:chosen.role.title,primaryId,primaryTitle:chosen.primary.title,outcome:source.label,definitionOfDone:source.label,source,plannedHours:capacity,primaryHours,parallelTask:parallelHours?{title:chosen.parallel.title,outcome:chosen.parallel.actions?.[0]||chosen.parallel.summary,hours:parallelHours}:null,resource:resource?{title:resource.title||resource.label,url:resource.url}:null,adviceSignature:chosen.signature,weekStart:options.weekStart||weekStart(),scheduleIndex:index,carryCount:Number(options.carryCount||0),createdReason:options.createdReason||'Current decisive recommendation'});
  }
  function start(advice=CT.careerAdvisor.advise(),options={}){const p=prefs();if(p.active)return p.active;const candidate=preview(advice,options),at=now(),active=Object.freeze({...candidate,id:uniqueId('commitment'),createdAt:at,updatedAt:at,status:'active'});update({active},'start weekly commitment');return active;}
  function startAlternative(advice=CT.careerAdvisor.advise(),options={}){return start(advice,{...options,selection:'runner-up'});}
  function activeState(advice=CT.careerAdvisor.advise(),p=prefs()){
    const active=p.active;if(!active)return Object.freeze({active:null,state:'none',reasons:Object.freeze([])});
    const expected=selectedAdvice(advice,active.selection),reasons=[],currentPrimary=expected?.primary.cert?.id||expected?.primary.type||'career';if(active.roleId!==advice.role.id)reasons.push('Target role changed.');if(!expected)reasons.push('The selected runner-up is no longer viable.');else if(active.primaryId!==currentPrimary)reasons.push('The decisive next move changed.');if(expected&&active.adviceSignature!==expected.signature&&!reasons.length)reasons.push('Recommendation evidence or constraints changed.');
    const currentWeek=weekStart(),overdue=active.weekStart<currentWeek,upcoming=active.weekStart>currentWeek;return Object.freeze({active,state:reasons.length?'changed':overdue?'overdue':upcoming?'upcoming':'current',reasons:Object.freeze(reasons)});
  }
  function cleanReview(input,active){
    const outcome=String(input.outcome||'');if(!OUTCOMES.includes(outcome))throw new Error('Choose a valid weekly outcome.');
    let completion=Math.round(clamp(input.completionPercent,0,100));if(outcome==='complete')completion=100;if(outcome==='partial'&&(completion<=0||completion>=100))throw new Error('Partial work must record progress between 1% and 99%.');if(['blocked','deferred'].includes(outcome)&&completion>=100)throw new Error('Blocked or deferred work cannot be recorded as complete.');
    const actualHours=clamp(input.actualHours,0,168),blocker=outcome==='blocked'?String(input.blocker||''):'';if(outcome==='blocked'&&!BLOCKERS.includes(blocker))throw new Error('Choose the blocker that prevented progress.');
    const evidenceNote=String(input.evidenceNote||'').trim().slice(0,2000),evidenceUrl=/^https:\/\//i.test(String(input.evidenceUrl||''))?String(input.evidenceUrl).slice(0,500):'';if(completion>0&&evidenceNote.length<10)throw new Error('Record one concrete result, observation or correction before claiming progress.');
    return Object.freeze({id:uniqueId('weekly-review'),commitmentId:active.id,reviewedAt:now(),weekStart:active.weekStart,roleId:active.roleId,primaryId:active.primaryId,primaryTitle:active.primaryTitle,outcome,completionPercent:completion,plannedHours:active.plannedHours,actualHours,blocker,evidenceNote,evidenceUrl,confidence:Math.round(clamp(input.confidence,1,5)),adviceSignature:active.adviceSignature});
  }
  function redefine(draft,definition,suffix){return {...draft,outcome:definition,definitionOfDone:definition,source:Object.freeze({kind:'advisor-move',id:`${draft.primaryId}:${suffix}`,label:definition})};}
  function nextFrom(review,active,advice,p){
    const nextWeek=CT.util.addCalendarDays(active.weekStart,7),chosen=selectedAdvice(advice,active.selection)||advice;
    if(review.outcome==='complete')return preview(advice,{prefs:p,selection:active.selection,weekStart:nextWeek,scheduleIndex:active.scheduleIndex+1,createdReason:'Previous weekly outcome completed'});
    if(review.outcome==='partial'){
      const hours=Math.max(.5,Math.min(active.plannedHours,review.actualHours||active.plannedHours*.75));
      if(active.carryCount<1)return preview(advice,{prefs:p,selection:active.selection,weekStart:nextWeek,scheduleIndex:active.scheduleIndex,plannedHours:hours,carryCount:1,createdReason:'Unfinished valid outcome carried forward once'});
      const draft=preview(advice,{prefs:p,selection:active.selection,weekStart:nextWeek,scheduleIndex:active.scheduleIndex,plannedHours:hours,carryCount:2,createdReason:'Repeated partial progress triggered a smaller diagnostic checkpoint'}),definition=`Complete one bounded checkpoint for ${active.primaryTitle}: record the smallest finished component, the blocking boundary and the next verifiable step`;
      return redefine(draft,definition,'diagnostic');
    }
    if(review.outcome==='blocked'){
      let hours=active.plannedHours,reason=`Blocked by ${review.blocker}; plan narrowed for recovery`,definition=active.definitionOfDone;
      if(review.blocker==='time')hours=Math.max(.5,Math.min(active.plannedHours,review.actualHours||active.plannedHours*.5));
      if(review.blocker==='prerequisite'){const missing=chosen.primary.cert?.deps?.filter(id=>!state.passes?.[id]).map(id=>CERTS.find(c=>c.id===id)?.name).filter(Boolean);definition=missing?.length?`Resolve prerequisite: ${missing.join(', ')}`:`Identify and resolve the dependency blocking ${active.primaryTitle}`;}
      if(review.blocker==='assessment')definition=`Revisit the weakest due subject and complete one marked check plus one applied correction before continuing ${active.primaryTitle}`;
      if(review.blocker==='material')definition=`Replace the blocked resource and complete the same evidence outcome: ${active.outcome}`;
      const draft=preview(advice,{prefs:p,selection:active.selection,weekStart:nextWeek,scheduleIndex:active.scheduleIndex,plannedHours:hours,carryCount:active.carryCount+1,createdReason:reason});return redefine(draft,definition,`blocked-${review.blocker}`);
    }
    return preview(advice,{prefs:p,selection:active.selection,weekStart:nextWeek,scheduleIndex:active.scheduleIndex,plannedHours:Math.max(.5,Math.min(active.plannedHours,review.actualHours||active.plannedHours)),carryCount:active.carryCount,createdReason:'Explicitly deferred; no progress was inferred'});
  }
  function review(input,advice=CT.careerAdvisor.advise()){
    const p=prefs(),active=p.active;if(!active)throw new Error('There is no active weekly commitment to review.');const row=cleanReview(input,active),reviews=[row,...p.reviews].slice(0,52),blockedResources={...p.blockedResources};if(row.blocker==='material'&&active.resource?.url)blockedResources[active.resource.url]={at:row.reviewedAt,reason:row.evidenceNote||'Blocked progress'};
    const draft=nextFrom(row,active,advice,{...p,reviews,blockedResources}),next=Object.freeze({...draft,id:uniqueId('commitment'),createdAt:row.reviewedAt,updatedAt:row.reviewedAt,status:'active'});update({active:next,reviews,blockedResources},'weekly execution review');return Object.freeze({review:row,next});
  }
  function replace(advice=CT.careerAdvisor.advise(),reason='Recommendation changed'){const p=prefs(),active=p.active;if(!active)return start(advice);const row=cleanReview({outcome:'deferred',completionPercent:0,actualHours:0,evidenceNote:String(reason).slice(0,2000),confidence:3},active),replacement=preview(advice,{weekStart:weekStart(),createdReason:reason}),next=Object.freeze({...replacement,id:uniqueId('commitment'),createdAt:row.reviewedAt,updatedAt:row.reviewedAt,status:'active'});update({active:next,reviews:[row,...p.reviews].slice(0,52)},'replace changed commitment');return next;}
  function calendar(active=prefs().active){if(!active)throw new Error('Start a weekly commitment before exporting a reminder.');const start=active.weekStart.replaceAll('-',''),end=CT.util.addCalendarDays(active.weekStart,7).replaceAll('-',''),escapeIcs=value=>String(value).replace(/\\/g,'\\\\').replace(/([,;])/g,'\\$1').replace(/[\r\n]+/g,'\\n'),description=escapeIcs(`Definition of done: ${active.definitionOfDone}. Planned effort: ${active.plannedHours} hours. Review honestly as complete, partial, blocked or deferred.`);return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CertTracker//Weekly Coach//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${active.id}@certtracker.local`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end}`,'RRULE:FREQ=WEEKLY;INTERVAL=1','SUMMARY:Cert Tracker weekly commitment',`DESCRIPTION:${description}`,'BEGIN:VALARM','TRIGGER:-PT9H','ACTION:DISPLAY','DESCRIPTION:Review the Cert Tracker commitment','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');}
  function summary(advice=CT.careerAdvisor.advise()){const p=prefs(),status=activeState(advice,p),recent=p.reviews.slice(0,8),completed=recent.filter(r=>r.outcome==='complete').length,planned=recent.reduce((n,r)=>n+Number(r.plannedHours||0),0),actual=recent.reduce((n,r)=>n+Number(r.actualHours||0),0);return Object.freeze({...status,reviews:Object.freeze(recent),completionRate:recent.length?Math.round(completed/recent.length*100):null,hourAccuracy:planned?Math.round(actual/planned*100):null});}

  CT.weeklyCoach=Object.freeze({DEFAULTS,OUTCOMES,BLOCKERS,prefs,weekStart,preview,start,startAlternative,activeState,review,replace,calendar,summary});
})(window);
