// Cert Tracker — deterministic, explainable and adaptive career-advice engine.
(function initCareerAdvisor(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.careerOptions||!CT?.recommendations||!CT?.learningResources||!CT?.topicEngine)throw new Error('Career, recommendation, learning and topic engines must load before career-advisor.js');

  const DEFAULTS=Object.freeze({targetRole:'',comparisonRoles:Object.freeze([]),horizonWeeks:6,reviewCadenceDays:14,nextReviewAt:'',history:Object.freeze([])});
  const FAMILY_PROJECTS=Object.freeze({
    infrastructure:{noun:'resilient segmented service platform',build:'Build addressing, switching, routing, name resolution and service dependencies across at least three zones.',faults:'Introduce a VLAN, route, DNS and service fault; diagnose each from symptoms, logs and packet evidence.'},
    physical:{noun:'converged physical-security deployment',build:'Build a VMS or access-control design with devices, servers, identity, storage, segmentation and documented data flows.',faults:'Introduce a stream, time, certificate and network fault; isolate the failing layer and prove the fix.'},
    cloud:{noun:'secure hybrid cloud landing zone',build:'Build identity, network, logging and least-privilege controls with a documented on-premises integration path.',faults:'Introduce policy, route, DNS and identity failures; show detection, diagnosis and recovery.'},
    cyber:{noun:'defensible security-control implementation',build:'Build a segmented environment with preventive controls, telemetry and an incident-handling workflow.',faults:'Create a denied legitimate flow and a permitted risky flow; use evidence to correct both safely.'},
    ot:{noun:'OT-convergence segmentation design',build:'Model enterprise, IDMZ and control zones with an asset inventory, permitted-flow matrix and secure remote-access pattern.',faults:'Simulate loss of visibility, unsafe rule scope and a protocol dependency failure; document safe diagnosis without disrupting control.'},
    architecture:{noun:'decision-ready solution architecture',build:'Produce current and target architectures, requirements, constraints, options and traceable security decisions.',faults:'Run failure, scale and dependency scenarios; revise the design and record the trade-offs.'},
    software:{noun:'supported automation service',build:'Build a versioned tool or integration with authentication, validation, tests, logging and operator documentation.',faults:'Inject API, credential, malformed-data and dependency failures; prove safe handling and recovery.'}
  });
  const PROJECT_KIND=Object.freeze({infrastructure:'infrastructure',network:'infrastructure',cloud:'cloud',defence:'cyber',identity:'cyber',appsec:'software',governance:'architecture',physical:'physical',industrial:'ot',offensive:'cyber',software:'software',data:'software',customer:'architecture',leadership:'architecture'});
  const escText=value=>String(value??'').replace(/\s+/g,' ').trim();
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
  const unique=rows=>[...new Set(rows.filter(Boolean))];
  function prefs(){const raw=state.customization?.careerAdvisor;return raw&&typeof raw==='object'?{...DEFAULTS,...raw}:{...DEFAULTS};}
  function roleFromFilter(){return CT.careerOptions.byId(state.filter)||null;}
  function targetRole(options={}){
    const p=options.prefs||prefs(),explicit=CT.careerOptions.byId(options.targetRole||p.targetRole),filtered=roleFromFilter();
    if(explicit)return explicit;if(filtered)return filtered;
    const shortlisted=CT.careerOptions.options({shortlist:true})[0];
    return (shortlisted||CT.careerOptions.options({})[0])?.role||CT.careerOptions.ROLES[0];
  }
  function activeStage(path){return path.stages.find(stage=>stage.certIds.some(id=>!state.passes?.[id]))||path.stages[path.stages.length-1];}
  function eligible(cert){return !!cert&&!state.passes?.[cert.id]&&!state.skipped?.[cert.id]&&(!CT.credentials||CT.credentials.availability(cert).eligible)&&(cert.deps||[]).every(id=>state.passes?.[id]);}
  function primaryMoves(role){
    const path=CT.careerOptions.pathway(role),stage=activeStage(path),stageCerts=stage.certIds.map(id=>CERTS.find(c=>c.id===id)).filter(Boolean),available=stageCerts.filter(eligible);
    const ranked=(available.length?available:stageCerts.filter(c=>!state.passes?.[c.id])).map(cert=>CT.recommendations.score(cert,{horizon:'now'})).sort((a,b)=>b.score-a.score);
    const fallback=ranked.length?[]:CT.recommendations.recommend({limit:1,horizon:'now'}),items=ranked.length?ranked:fallback;
    if(!items.length)return Object.freeze([Object.freeze({type:'career',title:`Prepare the ${role.title} transition`,summary:path.transition,reason:'All certification milestones in this route are recorded; practical evidence and vacancy comparison now determine the move.',stage})]);
    return Object.freeze(items.map(item=>{const cert=item.cert,blocked=!eligible(cert),hours=Math.max(1,Number(item.estimatedHours||CT.util.averageHours(cert)||1));return Object.freeze({type:'certification',cert,title:`${blocked?'Unblock':'Complete'} ${cert.name}`,summary:blocked?`Resolve ${unique((cert.deps||[]).filter(id=>!state.passes?.[id]).map(id=>CERTS.find(c=>c.id===id)?.name)).join(', ')||'the current eligibility constraint'} before starting this credential.`:`Make ${cert.name} the only primary credential until its study and evidence gate is met.`,reason:item.reasons?.slice(0,3).join(' · ')||stage.relevance,stage,hours,blocked,score:item.score})}));
  }
  function primaryMove(role){return primaryMoves(role)[0];}
  function parallelMove(primary){
    const opportunity=String(CT.careerMentor?.prefs?.().circumstances?.workOpportunity||'').trim();
    if(opportunity)return Object.freeze({title:'Convert the workplace opportunity into evidence',summary:opportunity,actions:Object.freeze(['Agree a safe, bounded outcome and success criteria before starting','Capture redacted before/after evidence, validation and rollback','Record what you owned, what was supervised and what changed because of your work']),evidenceId:'',evidenceLevel:'NONE',mastery:0});
    const topic=CT.topicEngine.next({cert:primary.cert||null})||CT.topicEngine.next({});
    const evidence=topic?.topic?.evidence?CT.capabilityGates?.evidenceRecord(topic.topic.evidence):null;
    if(!topic)return Object.freeze({title:'Build practical evidence',summary:'Apply the current-stage knowledge in a documented lab or workplace-safe simulation.',actions:Object.freeze([])});
    return Object.freeze({title:topic.topic.title,summary:topic.topic.why,actions:Object.freeze(topic.topic.actions||[]),evidenceId:topic.topic.evidence||'',evidenceLevel:evidence?.level||'NONE',mastery:topic.mastery});
  }
  function deferMoves(role,primary){
    const path=CT.careerOptions.pathway(role),primaryStage=path.stages.findIndex(s=>s.certIds.includes(primary.cert?.id));
    return Object.freeze(path.stages.flatMap((stage,index)=>stage.certifications.map(c=>({stage,index,cert:CERTS.find(x=>x.id===c.id)}))).filter(x=>x.cert&&!state.passes?.[x.cert.id]&&x.cert.id!==primary.cert?.id&&(x.index>Math.max(0,primaryStage)||(x.cert.deps||[]).some(id=>!state.passes?.[id]))).slice(0,3).map(x=>Object.freeze({id:x.cert.id,name:x.cert.name,reason:(x.cert.deps||[]).some(id=>!state.passes?.[id])?'Prerequisite or sequence is not yet complete.':`${x.stage.label} work comes after the current ${primary.stage?.label||'stage'} evidence gate.`})));
  }
  function studyPlan(primary,weeks=prefs().horizonWeeks){
    const count=clamp(Math.round(weeks),4,8),weeklyHours=Math.max(.5,Number(state.plannerSettings?.weeklyHours||state.pace2||6)),cert=primary.cert;
    if(!cert)return Object.freeze({weeks:count,weeklyHours,subjects:Object.freeze([]),materials:Object.freeze([]),schedule:Object.freeze([]),practices:Object.freeze([])});
    const profile=CT.learningResources.profile(cert),mentor=CT.careerMentor,subjects=profile.subjects.slice().sort((a,b)=>{if(!mentor)return 0;const ak=mentor.subjectKey(cert.id,a.topic),bk=mentor.subjectKey(cert.id,b.topic);return Number(mentor.due(bk))-Number(mentor.due(ak))||mentor.mastery(ak)-mentor.mastery(bk);}).slice(0,Math.min(6,profile.subjects.length));
    const schedule=Array.from({length:count},(_,i)=>{
      const pct=i/(count-1),phase=pct<.18?'Baseline & map':pct<.52?'Learn & retrieve':pct<.78?'Configure & break':pct<.94?'Integrate & assess':'Close gaps & decide';
      const subject=subjects[Math.min(subjects.length-1,Math.floor(i*subjects.length/count))];
      const deliverable=pct<.18?'Blueprint gap check and baseline quiz':pct<.52?`Recall notes plus a small ${subject?.topic||'topic'} lab`:pct<.78?'Configuration, deliberate fault and troubleshooting log':pct<.94?'Integrated scenario and draft project evidence':'Timed assessment, weak-area retest and exam/no-exam decision';
      return Object.freeze({week:i+1,phase,focus:subject?.topic||cert.name,hours:weeklyHours,deliverable});
    });
    const materials=profile.stack.slice().sort((a,b)=>{const rank=row=>{const status=mentor?.resourceRecord?.(row.url)?.status;return status==='useful'?-2:status==='outdated'?2:status==='weak'?1:0;};return rank(a)-rank(b);}).slice(0,5);
    return Object.freeze({weeks:count,weeklyHours,subjects:Object.freeze(subjects),materials:Object.freeze(materials),schedule:Object.freeze(schedule),practices:Object.freeze(['Start from the current official blueprint; verify it again before booking.','Use active recall and spaced review; keep a short error log instead of rereading passively.','Pair every major concept with configuration, inspection and deliberate break/fix practice.','Run one timed checkpoint weekly; study the explanation for every wrong and guessed answer.','Book only when practice performance is repeatable and the practical project is complete.'])});
  }
  function projectBrief(role,primary,parallel){
    const family=CT.careerOptions.FAMILIES[role.family],template=FAMILY_PROJECTS[PROJECT_KIND[role.family]]||FAMILY_PROJECTS.architecture,stage=primary.stage||activeStage(CT.careerOptions.pathway(role)),requirements=CT.careerOptions.requirements(role).slice(0,3),requirementLabels=requirements.map(row=>row.label);
    const title=`${role.title}: ${template.noun}`;
    return Object.freeze({title,scenario:`Act as the engineer accountable for a small but production-plausible ${template.noun}. The result must support ${escText(role.mission).toLowerCase()}.`,build:`${template.build} Include the current study focus: ${parallel.title}.`,faults:template.faults,requirements:Object.freeze(requirements),deliverables:Object.freeze(['Architecture and data-flow diagram','Configuration/build record with redacted evidence','Fault matrix, observations and root-cause log','Validation results mapped to requirements','Operations runbook, rollback and lessons learned','One-page decision record explaining trade-offs',`Role-evidence matrix for ${requirementLabels.join(', ')||role.title}`]),criteria:Object.freeze([`Meets the ${stage.label} objective: ${stage.objective}`,`Demonstrates: ${stage.evidence}`,`Produces traceable evidence for: ${requirementLabels.join(', ')||role.title}`,'A third party can reproduce the normal build from the documentation','At least three faults are diagnosed from evidence, not guesswork','Security, availability and operational trade-offs are stated','No secrets, employer data or unsafe production changes are included']),target:stage.exit});
  }
  function routeProgress(role){const path=CT.careerOptions.pathway(role),passed=path.certIds.filter(id=>state.passes?.[id]).length,assessment=CT.careerOptions.assess(role);return {role,path,assessment,passed,total:path.certIds.length,progress:path.certIds.length?Math.round(passed/path.certIds.length*100):0};}
  function alternatives(role,p=prefs()){
    const chosen=unique([...(p.comparisonRoles||[])]).map(CT.careerOptions.byId).filter(Boolean).filter(r=>r.id!==role.id);
    const sameFamily=CT.careerOptions.options({}).filter(x=>x.role.id!==role.id&&(x.role.family===role.family||x.shortlisted)).map(x=>x.role);
    return unique([...chosen,...sameFamily, ...CT.careerOptions.options({}).map(x=>x.role)].map(r=>r.id)).slice(0,2).map(CT.careerOptions.byId).filter(Boolean);
  }
  function compareRoutes(role,feed,p=prefs()){
    const chosenPath=CT.careerOptions.pathway(role),chosenIds=new Set(chosenPath.certIds),chosenAssessment=CT.careerOptions.assess(role);
    const rows=[role,...alternatives(role,p)].map(r=>{const x=routeProgress(r),market=CT.careerOptions.market(r,feed),remaining=x.path.certIds.filter(id=>!state.passes?.[id]),distance=remaining.length,switchingCost=r.id===role.id?0:remaining.filter(id=>!chosenIds.has(id)).length,shared=x.path.certIds.filter(id=>chosenIds.has(id)).length,evidenceGaps=x.assessment.gaps.length,isChosen=r.id===role.id,advantage=isChosen?'Chosen route':x.assessment.compatibility>chosenAssessment.compatibility?'Higher profile compatibility':'Useful adjacent option',risk=x.assessment.readiness==null?'Practical evidence is not assessed.':distance>6?'Long remaining credential route.':'Readiness still depends on role evidence.',decisionPoint=isChosen?(market.usable?'Stay unless another route materially improves fit with no more than two extra credentials.':'Add current vacancy evidence before treating this route as the market winner.'):(x.assessment.compatibility>=chosenAssessment.compatibility+10&&switchingCost<=2?`Switch only if current vacancies confirm the ${x.assessment.compatibility-chosenAssessment.compatibility}-point fit advantage.`:`Do not switch yet: prove ${x.assessment.gaps[0]?.label||'the first evidence gap'} or reduce the ${switchingCost}-credential switching cost.`);return Object.freeze({role:r,compatibility:x.assessment.compatibility,readiness:x.assessment.readiness,progress:x.progress,distance,switchingCost,shared,evidenceGaps,status:x.assessment.status,firstGap:x.assessment.gaps[0]?.label||'Compare against a real vacancy',market,advantage,risk,decisionPoint});});
    return Object.freeze(rows);
  }
  function moveGate(role,primary,project){
    const a=CT.careerOptions.assess(role),projectStatus=CT.careerMentor?.projectAssessment?.({role,project}),market=CT.careerMentor?.marketSummary?.(role.id),learning=primary.cert?CT.careerMentor?.certificationMastery?.(primary.cert):null,conditions=[
      {label:primary.cert?`${primary.cert.name} passed and active`:'Current credential stage checked',met:primary.cert?!!state.passes?.[primary.cert.id]:true},
      {label:primary.cert?'Knowledge and applied evidence are supported across subjects':'No active learning gate',met:primary.cert?!!learning?.reliable:true},
      {label:`Portfolio project meets: ${project.target}`,met:!!projectStatus?.ready},
      {label:'Required practical evidence reaches the role target',met:a.readiness!=null&&a.gaps.length===0},
      {label:'Two or more current vacancies match your demonstrated evidence and constraints',met:Number(market?.count||0)>=2},
      {label:'Salary, responsibilities, eligibility and development upside beat the current role',met:false}
    ];
    return Object.freeze({conditions:Object.freeze(conditions),met:conditions.filter(x=>x.met).length,total:conditions.length,decision:'Move only when the evidence gate and a real-vacancy comparison are satisfied; a certificate alone is not the trigger.'});
  }
  function snapshot(advice){const mentor=CT.careerMentor,mentorPrefs=mentor?.prefs?.(),market=mentor?.marketSummary?.(advice.role.id),learning=advice.primary.cert?mentor?.certificationMastery?.(advice.primary.cert):null,project=mentor?.projectAssessment?.(advice);return Object.freeze({targetRole:advice.role.id,primaryId:advice.primary.cert?.id||advice.primary.type,passes:Object.keys(state.passes||{}).filter(id=>state.passes[id]).sort(),evidence:Object.fromEntries(Object.entries(state.capabilityEvidence||{}).map(([id,row])=>[id,row?.level||'NONE'])),weeklyHours:Number(state.plannerSettings?.weeklyHours||state.pace2||6),roleTitle:String(state.customization?.marketProfile?.roleTitle||''),salary:Number(state.currentSalary||0),marketStatus:advice.market.status,circumstances:mentorPrefs?.circumstances||null,assessmentScore:learning?.score||0,projectScore:project?.score||0,vacancyCount:market?.count||0});}
  function signature(s){return JSON.stringify(s);}
  function changes(current,prior){
    if(!prior)return Object.freeze(['No previous recorded review; this is the baseline recommendation.']);const rows=[];
    if(current.targetRole!==prior.targetRole)rows.push('Target role changed.');if(current.primaryId!==prior.primaryId)rows.push('The decisive next move changed.');
    const added=current.passes.filter(id=>!(prior.passes||[]).includes(id));if(added.length)rows.push(`${added.length} certification completion${added.length===1?'':'s'} added.`);
    const evidence=Object.keys(current.evidence).filter(id=>current.evidence[id]!==prior.evidence?.[id]);if(evidence.length)rows.push(`${evidence.length} practical-evidence record${evidence.length===1?'':'s'} changed.`);
    if(current.weeklyHours!==prior.weeklyHours)rows.push(`Weekly study capacity changed from ${prior.weeklyHours} to ${current.weeklyHours} hours.`);if(current.roleTitle!==prior.roleTitle)rows.push('Current role title changed.');if(current.salary!==prior.salary)rows.push('Current salary baseline changed.');if(current.marketStatus!==prior.marketStatus)rows.push('Market-feed reliability changed.');
    if(JSON.stringify(current.circumstances)!==JSON.stringify(prior.circumstances))rows.push('Career timing, budget or personal constraints changed.');if(current.assessmentScore!==prior.assessmentScore)rows.push(`Combined learning evidence changed to ${current.assessmentScore}%.`);if(current.projectScore!==prior.projectScore)rows.push(`Project evidence changed to ${current.projectScore}%.`);if(current.vacancyCount!==prior.vacancyCount)rows.push(`Current vacancy evidence changed to ${current.vacancyCount} records.`);
    return Object.freeze(rows.length?rows:['No material driver changed since the recorded review.']);
  }
  function advise(options={}){
    const p=options.prefs||prefs(),role=targetRole({prefs:p,targetRole:options.targetRole}),moves=primaryMoves(role),primary=moves[0],alternative=moves[1]||null,parallel=parallelMove(primary),study=studyPlan(primary,options.horizonWeeks||p.horizonWeeks),project=projectBrief(role,primary,parallel),feed=options.feed||null,comparison=compareRoutes(role,feed,p),marketRow=comparison[0]?.market||{usable:false,label:'Market evidence unavailable'};
    const market=Object.freeze({status:marketRow.usable?'observed':'unavailable',label:marketRow.label,count:marketRow.count,salary:marketRow.salary,samples:marketRow.salarySamples||0,checkedAt:marketRow.checkedAt||null,note:marketRow.usable?'Use this only as a current feed sample, not proof of demand or salary.':'No dependable live sample is available. Treat model salary ranges as illustrative and compare current vacancies manually.'});
    const advice={role,path:CT.careerOptions.pathway(role),assessment:CT.careerOptions.assess(role),primary,alternative,parallel,defer:deferMoves(role,primary),study,project,comparison,market,gate:null,change:null};advice.gate=moveGate(role,primary,project);
    const snap=snapshot(advice),last=(p.history||[])[0];advice.snapshot=snap;advice.signature=signature(snap);advice.change=Object.freeze({changed:!!last&&last.signature!==advice.signature,reasons:changes(snap,last?.snapshot),previous: last?{at:last.at,primaryTitle:last.primaryTitle,roleTitle:last.roleTitle}:null});return Object.freeze(advice);
  }
  function update(patch){const current=prefs(),next={...current,...patch};state.customization={...state.customization,careerAdvisor:next};save.customization();CT.events?.emit('career-advisor-changed',{});CT.events?.emit('state-saved',{key:'careerAdvisor',at:new Date().toISOString()});return next;}
  function recordReview(advice=advise()){
    const p=prefs(),at=new Date().toISOString(),entry=Object.freeze({id:`review-${Date.now()}`,at,roleId:advice.role.id,roleTitle:advice.role.title,primaryId:advice.primary.cert?.id||advice.primary.type,primaryTitle:advice.primary.title,signature:advice.signature,snapshot:advice.snapshot});
    const nextReviewAt=CT.util.addCalendarDays(new Date(),clamp(p.reviewCadenceDays,7,90));CT.storage?.captureUndoPoint('career-advisor review');update({history:[entry,...(p.history||[])].slice(0,50),nextReviewAt});return entry;
  }
  CT.careerAdvisor=Object.freeze({DEFAULTS,prefs,targetRole,activeStage,primaryMoves,primaryMove,parallelMove,deferMoves,studyPlan,projectBrief,compareRoutes,moveGate,snapshot,changes,advise,update,recordReview});
})(window);
