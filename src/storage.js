// Cert Tracker — validated persistence, backup, recovery and undo.
(function initStorage(global) {
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.store)throw new Error('state-core.js must load before storage.js');
  const C=CT.config;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const safeParse=(raw,fallback)=>{try{return raw==null?fallback:JSON.parse(raw);}catch{return fallback;}};
  const validIds=new Set(CERTS.map(cert=>cert.id));

  function migrate(){
    SK.myPath=C.myPathKey;
    if(!localStorage.getItem(C.myPathKey))for(const key of C.legacyMyPathKeys){const raw=localStorage.getItem(key);if(raw){localStorage.setItem(C.myPathKey,raw);break;}}
    localStorage.setItem(C.storageSchemaKey,String(CT.version.storage));
  }

  function serializableState(){
    return {
      version:CT.version.backup,appVersion:CT.version.app,dataVersion:CT.version.data,storageVersion:CT.version.storage,
      exportedAt:new Date().toISOString(),changedAt:localStorage.getItem(C.lastChangeKey)||new Date().toISOString(),
      passes:clone(state.passes||{}),exams:clone(state.exams||{}),notes:clone(state.notes||{}),studyLog:clone(state.studyLog||[]),skipped:clone(state.skipped||{}),
      myPath:clone(state.myPath||{}),filter:state.filter||'my-path',currentSalary:Number(state.currentSalary||0),pace2:Number(state.pace2||0),
      expLog:clone(state.expLog||[]),eventsDismissed:clone(state.eventsDismissed||[]),artifacts:clone(state.artifacts||{}),partners:clone(state.partners||{}),
      certOrder:clone(state.certOrder||{}),phaseOverrides:clone(state.phaseOverrides||{}),activities:clone(state.activities||[]),gates:clone(state.gates||{}),
      objectiveProgress:clone(state.objectiveProgress||{}),competencyEvidence:clone(state.competencyEvidence||{}),capabilityEvidence:clone(state.capabilityEvidence||{}),customization:clone(state.customization||{}),plannerSettings:clone(state.plannerSettings||{}),
      goalProfile:localStorage.getItem(C.goalKey)||'convergence'
      ,careerContext:{current:localStorage.getItem('ct4-career-current-role')||'generalIT',next:localStorage.getItem('ct4-career-next-role')||'cyber',target:localStorage.getItem('ct4-career-target-role')||'convergence'}
    };
  }

  const persistedFields={passes:SK.passes,exams:SK.exams,notes:SK.notes,studyLog:SK.study,skipped:SK.skipped,myPath:C.myPathKey,activities:SK.cpe,gates:SK.gates,objectiveProgress:C.objectiveKey,competencyEvidence:C.evidenceKey,capabilityEvidence:C.capabilityEvidenceKey,customization:C.personalizationKey,plannerSettings:C.plannerKey,artifacts:'ct2-artifacts',partners:'ct2-partners',certOrder:'ct2-order',phaseOverrides:'ct2-phase-ovr',expLog:SK.explog,eventsDismissed:SK.eventsDis};
  function readPersistedSnapshot(){const snapshot=serializableState();for(const [field,key] of Object.entries(persistedFields))snapshot[field]=safeParse(localStorage.getItem(key),Array.isArray(snapshot[field])?[]:{});snapshot.currentSalary=Number(localStorage.getItem(SK.salary)||0);snapshot.pace2=Number(localStorage.getItem(SK.pace2)||6);snapshot.filter=localStorage.getItem(SK.filter)||'my-path';return snapshot;}
  function isObj(value){return CT.util.isPlainObject(value);}
  function validateCertKeyObject(obj,field,{dateValues=false,boolValues=false,numberRange=null}={}){
    const errors=[];if(obj==null)return errors;if(!isObj(obj))return [`${field} must be an object.`];
    for(const [id,value] of Object.entries(obj)){
      if(!validIds.has(id))errors.push(`${field}.${id} references an unknown certification.`);
      if(dateValues&&value&&!CT.util.validIsoDate(value))errors.push(`${field}.${id} must be YYYY-MM-DD.`);
      if(boolValues&&typeof value!=='boolean')errors.push(`${field}.${id} must be boolean.`);
      if(numberRange){const values=isObj(value)?Object.entries(value):[[null,value]];for(const [domain,raw] of values){const n=Number(raw);if(!Number.isFinite(n)||n<numberRange[0]||n>numberRange[1])errors.push(`${field}.${id}${domain?`.${domain}`:''} must be ${numberRange[0]}-${numberRange[1]}.`);}}
    }
    return errors;
  }
  function validateArrayRecords(value,field,validator,{allowPrimitives=false}={}){if(value==null)return[];if(!Array.isArray(value))return [`${field} must be an array.`];const errors=[];value.forEach((row,i)=>{if(!isObj(row)){if(!allowPrimitives)errors.push(`${field}[${i}] must be an object.`);return;}validator?.(row,i,errors);});return errors;}
  function validateCapabilityEvidence(value){
    const errors=[];if(value==null)return errors;if(!isObj(value))return ['capabilityEvidence must be an object.'];
    const levels=new Set(['NONE','LAB','USED','DESIGNED','OWNED']);
    for(const [id,row] of Object.entries(value)){
      const known=CT.capabilityGates?.EVIDENCE?.some(x=>x.id===id)||CT.careerOptions?.ROLES?.some(r=>CT.careerOptions.requirements(r).some(x=>x.id===id));
      if(CT.capabilityGates&&!known)errors.push(`Unknown capability evidence: ${id}`);
      if(!isObj(row)){errors.push(`capabilityEvidence.${id} must be an object.`);continue;}
      if(!levels.has(row.level))errors.push(`capabilityEvidence.${id}.level is invalid.`);
      if(row.note!=null&&typeof row.note!=='string')errors.push(`capabilityEvidence.${id}.note must be text.`);
      if(row.updatedAt!=null&&typeof row.updatedAt!=='string')errors.push(`capabilityEvidence.${id}.updatedAt must be text.`);
    }
    return errors;
  }
  function validateCustomization(value){
    const errors=[];if(value==null)return errors;if(!isObj(value))return ['customization must be an object.'];
    for(const field of ['colors','phaseColors','visibility','tabLabels'])if(value[field]!=null&&!isObj(value[field]))errors.push(`customization.${field} must be an object.`);
    if(value.marketProfile!=null){
      if(!isObj(value.marketProfile))errors.push('customization.marketProfile must be an object.');
      else if(value.marketProfile.roleTitle!=null&&(typeof value.marketProfile.roleTitle!=='string'||value.marketProfile.roleTitle.length>120))errors.push('Market role title must be text of at most 120 characters.');
    }
    if(value.tabOrder!=null&&(!Array.isArray(value.tabOrder)||value.tabOrder.some(x=>typeof x!=='string')) )errors.push('customization.tabOrder must be an array of strings.');
    for(const field of ['fontScale','density','radius','cardRadius','controlRadius','contentWidth','panelOpacity','shadowStrength','glowStrength','borderWidth'])if(value[field]!=null&&!Number.isFinite(Number(value[field])))errors.push(`customization.${field} must be numeric.`);
    if(value.tabLabels)for(const label of Object.values(value.tabLabels))if(typeof label!=='string'||label.length>80)errors.push('Tab labels must be text of at most 80 characters.');

    if(value.credentials!=null){if(!isObj(value.credentials))errors.push('credentials must be an object.');else for(const [id,row]of Object.entries(value.credentials)){
      if(!validIds.has(id)||!isObj(row)){errors.push('Invalid credential record: '+id);continue;}
      if(row.eligibilityConfirmed!=null&&typeof row.eligibilityConfirmed!=='boolean')errors.push('Invalid prerequisite confirmation: '+id);
      if(row.status!=null&&!['PENDING','ASSOCIATE','ACTIVE','EXPIRED'].includes(row.status))errors.push('Invalid award status: '+id);
      if(row.funding!=null&&!['self','employer'].includes(row.funding))errors.push('Invalid funding: '+id);
      if(row.cost!=null&&(typeof row.cost!=='number'||!Number.isFinite(row.cost)||row.cost<0))errors.push('Invalid quoted cost: '+id);
      for(const field of ['expiry','renewedAt'])if(row[field]&&!CT.util.validIsoDate(row[field]))errors.push('Invalid credential date: '+id);
    }}
    const p=value.careerOptions;
    if(p!=null){
      if(!isObj(p))errors.push('careerOptions must be an object.');
      else{
        const roles=CT.careerOptions?.ROLES,roleIds=roles?new Set(roles.map(r=>r.id)):null,families=CT.careerOptions?.FAMILIES;
        if(p.location!=null&&(typeof p.location!=='string'||p.location.length>120))errors.push('Invalid location preference.');
        if(p.workMode!=null&&!['any','remote','hybrid','onsite'].includes(p.workMode))errors.push('Invalid work mode.');
        if(p.background!=null&&(typeof p.background!=='string'||(p.background&&roleIds&&!roleIds.has(p.background))))errors.push('Invalid career background.');
        for(const field of ['evidence','interests','families','shortlist','eligibility'])if(p[field]!=null){if(!isObj(p[field])){errors.push(`careerOptions.${field} must be an object.`);continue;}for(const [id,v]of Object.entries(p[field])){
          if(field==='evidence'&&roles&&!roles.some(r=>CT.careerOptions.requirements(r).some(q=>q.id===id))&&!CT.capabilityGates?.EVIDENCE.some(q=>q.id===id))errors.push('Unknown career evidence: '+id);
          if(field==='evidence'&&!['UNKNOWN','NONE','LAB','USED','DESIGNED','OWNED'].includes(v))errors.push(`Invalid career evidence: ${id}`);
          if(['interests','families'].includes(field)&&![0,50,100].includes(v))errors.push(`Invalid interest: ${id}`);
          if(field==='eligibility'&&!['unknown','eligible','ineligible'].includes(v))errors.push('Invalid eligibility state: '+id);
          if(field==='shortlist'&&typeof v!=='boolean')errors.push(`Invalid shortlist: ${id}`);
          if(['interests','shortlist','eligibility'].includes(field)&&roleIds&&!roleIds.has(id))errors.push(`Unknown career role: ${id}`);
          if(field==='families'&&families&&!families[id])errors.push(`Unknown career family: ${id}`);
        }}
      }
    }
    const advisor=value.careerAdvisor;
    if(advisor!=null){
      if(!isObj(advisor))errors.push('careerAdvisor must be an object.');
      else{
        const roleIds=CT.careerOptions?.ROLES?new Set(CT.careerOptions.ROLES.map(r=>r.id)):null;
        if(advisor.targetRole!=null&&(typeof advisor.targetRole!=='string'||(advisor.targetRole&&roleIds&&!roleIds.has(advisor.targetRole))))errors.push('Invalid career-advisor target role.');
        if(advisor.comparisonRoles!=null&&(!Array.isArray(advisor.comparisonRoles)||advisor.comparisonRoles.length>5||advisor.comparisonRoles.some(id=>typeof id!=='string'||roleIds&&!roleIds.has(id))))errors.push('Invalid career-advisor comparison roles.');
        if(advisor.horizonWeeks!=null&&![4,6,8].includes(Number(advisor.horizonWeeks)))errors.push('Career-advisor horizon must be 4, 6 or 8 weeks.');
        if(advisor.reviewCadenceDays!=null&&![7,14,30].includes(Number(advisor.reviewCadenceDays)))errors.push('Career-advisor review cycle must be 7, 14 or 30 days.');
        if(advisor.nextReviewAt&&!CT.util.validIsoDate(advisor.nextReviewAt))errors.push('Invalid career-advisor review date.');
        if(advisor.history!=null){
          if(!Array.isArray(advisor.history)||advisor.history.length>50)errors.push('Career-advisor history must contain at most 50 reviews.');
          else for(const row of advisor.history){if(!isObj(row)||typeof row.id!=='string'||typeof row.at!=='string'||typeof row.signature!=='string'||!isObj(row.snapshot)||row.id.length>100||row.signature.length>25000)errors.push('Invalid career-advisor review record.');}
        }
      }
    }
    const mentor=value.careerMentor;
    if(mentor!=null){
      if(!isObj(mentor))errors.push('careerMentor must be an object.');
      else{
        const roleIds=CT.careerOptions?.ROLES?new Set(CT.careerOptions.ROLES.map(r=>r.id)):null;
        for(const field of ['assessments','questionAttempts','projects','circumstances','resourceFeedback'])if(mentor[field]!=null&&!isObj(mentor[field]))errors.push(`careerMentor.${field} must be an object.`);
        if(isObj(mentor.assessments)){const rows=Object.entries(mentor.assessments);if(rows.length>1000)errors.push('Too many career assessment records.');for(const [key,row]of rows){if(key.length>180||!validIds.has(key.split(':')[0])||!isObj(row)||!Array.isArray(row.attempts)||row.attempts.length>20)errors.push(`Invalid career assessment: ${key}`);else for(const attempt of row.attempts)if(!isObj(attempt)||typeof attempt.id!=='string'||!Number.isFinite(Date.parse(attempt.at))||!Number.isFinite(Number(attempt.score))||Number(attempt.score)<0||Number(attempt.score)>100||!Number.isFinite(Number(attempt.confidence))||Number(attempt.confidence)<1||Number(attempt.confidence)>5||String(attempt.notes||'').length>2000)errors.push(`Invalid career assessment attempt: ${key}`);if(row.nextDue&&!CT.util.validIsoDate(row.nextDue))errors.push(`Invalid assessment review date: ${key}`);}}
        if(isObj(mentor.questionAttempts)){const rows=Object.entries(mentor.questionAttempts);if(rows.length>500)errors.push('Too many knowledge-check records.');for(const [recordId,row]of rows){if(recordId.length>380||!isObj(row)||!CT.assessmentBank?.get(row.questionId)||typeof row.subjectKey!=='string'||row.subjectKey.length>180||!validIds.has(row.subjectKey.split(':')[0])||!Array.isArray(row.attempts)||row.attempts.length>10)errors.push(`Invalid knowledge-check record: ${recordId}`);else for(const attempt of row.attempts)if(!isObj(attempt)||typeof attempt.id!=='string'||!Number.isFinite(Date.parse(attempt.at))||!Number.isInteger(Number(attempt.selected))||Number(attempt.selected)<0||Number(attempt.selected)>3||typeof attempt.correct!=='boolean'||![0,100].includes(Number(attempt.score))||!Number.isFinite(Number(attempt.confidence))||Number(attempt.confidence)<1||Number(attempt.confidence)>5)errors.push(`Invalid knowledge-check attempt: ${recordId}`);if(row.nextDue&&!CT.util.validIsoDate(row.nextDue))errors.push(`Invalid knowledge-check review date: ${recordId}`);}}
        if(isObj(mentor.projects))for(const [roleId,row]of Object.entries(mentor.projects)){if(roleIds&&!roleIds.has(roleId)||!isObj(row)||!isObj(row.criteria)||Object.values(row.criteria||{}).some(v=>typeof v!=='boolean')||String(row.evidence||'').length>4000||String(row.artifactUrl||'').length>500||(row.artifactUrl&&!/^https:\/\//i.test(row.artifactUrl)))errors.push(`Invalid project evidence: ${roleId}`);}
        if(mentor.vacancies!=null){if(!Array.isArray(mentor.vacancies)||mentor.vacancies.length>200)errors.push('Career vacancies must contain at most 200 records.');else for(const row of mentor.vacancies){const lo=Number(row?.salaryMin||0),hi=Number(row?.salaryMax||0);if(!isObj(row)||typeof row.id!=='string'||typeof row.title!=='string'||!row.title||row.title.length>160||String(row.employer||'').length>160||String(row.location||'').length>160||String(row.notes||'').length>2000||String(row.url||'').length>500||!/^https:\/\//i.test(String(row.url||''))||roleIds&&!roleIds.has(row.roleId)||!CT.util.validIsoDate(row.observedAt)||!['saved','applied','interview','offer','rejected','withdrawn'].includes(row.outcome)||lo<0||lo>250000||hi<0||hi>250000||(lo&&hi&&hi<lo))errors.push('Invalid career vacancy record.');}}
        if(isObj(mentor.circumstances)){const c=mentor.circumstances;if(c.urgency!=null&&!['steady','soon','urgent'].includes(c.urgency))errors.push('Invalid career urgency.');if(c.budgetPressure!=null&&!['low','normal','high'].includes(c.budgetPressure))errors.push('Invalid career budget pressure.');if(String(c.workOpportunity||'').length>1000||String(c.constraintNote||'').length>1000)errors.push('Career circumstance notes are too long.');}
        if(isObj(mentor.resourceFeedback)){const rows=Object.entries(mentor.resourceFeedback);if(rows.length>1000)errors.push('Too many resource feedback records.');for(const [url,row]of rows)if(!/^https:\/\//i.test(url)||!isObj(row)||!['useful','weak','outdated'].includes(row.status)||String(row.note||'').length>500)errors.push('Invalid resource feedback record.');}
      }
    }
    const coach=value.weeklyCoach;
    if(coach!=null){
      if(!isObj(coach))errors.push('weeklyCoach must be an object.');
      else{
        const roleIds=CT.careerOptions?.ROLES?new Set(CT.careerOptions.ROLES.map(r=>r.id)):null,outcomes=new Set(['complete','partial','blocked','deferred']),blockers=new Set(['','time','prerequisite','material','assessment','access','health','other']);
        const validateCommitment=(row,label)=>{
          if(!isObj(row)){errors.push(`${label} must be an object.`);return;}
          if(typeof row.id!=='string'||row.id.length<5||row.id.length>120)errors.push(`${label}.id is invalid.`);
          if(roleIds&&!roleIds.has(row.roleId))errors.push(`${label}.roleId is invalid.`);
          if(typeof row.primaryId!=='string'||!row.primaryId||row.primaryId.length>120)errors.push(`${label}.primaryId is invalid.`);
          if(!['primary','runner-up'].includes(row.selection))errors.push(`${label}.selection is invalid.`);
          for(const field of ['primaryTitle','outcome','definitionOfDone','createdReason'])if(typeof row[field]!=='string'||!row[field]||row[field].length>1000)errors.push(`${label}.${field} is invalid.`);
          if(!CT.util.validIsoDate(row.weekStart))errors.push(`${label}.weekStart is invalid.`);
          if(!Number.isFinite(Date.parse(row.createdAt))||!Number.isFinite(Date.parse(row.updatedAt)))errors.push(`${label} timestamps are invalid.`);
          if(!Number.isFinite(Number(row.plannedHours))||Number(row.plannedHours)<.5||Number(row.plannedHours)>168)errors.push(`${label}.plannedHours is invalid.`);
          if(!Number.isFinite(Number(row.primaryHours))||Number(row.primaryHours)<.5||Number(row.primaryHours)>Number(row.plannedHours))errors.push(`${label}.primaryHours is invalid.`);
          if(!Number.isInteger(Number(row.scheduleIndex))||Number(row.scheduleIndex)<0||Number(row.scheduleIndex)>200)errors.push(`${label}.scheduleIndex is invalid.`);
          if(!Number.isInteger(Number(row.carryCount))||Number(row.carryCount)<0||Number(row.carryCount)>52)errors.push(`${label}.carryCount is invalid.`);
          if(row.status!=='active'||typeof row.adviceSignature!=='string'||row.adviceSignature.length>25000)errors.push(`${label} status or signature is invalid.`);
          if(!isObj(row.source)||!['study-deliverable','project-criterion','move-gate','advisor-move'].includes(row.source.kind)||typeof row.source.id!=='string'||typeof row.source.label!=='string')errors.push(`${label}.source is invalid.`);
          if(row.resource!=null&&(!isObj(row.resource)||typeof row.resource.title!=='string'||!/^https:\/\//i.test(String(row.resource.url||''))||row.resource.url.length>500))errors.push(`${label}.resource is invalid.`);
          if(row.parallelTask!=null&&(!isObj(row.parallelTask)||typeof row.parallelTask.title!=='string'||typeof row.parallelTask.outcome!=='string'||!Number.isFinite(Number(row.parallelTask.hours))||Number(row.parallelTask.hours)<0||Number(row.parallelTask.hours)>168||Number(row.primaryHours)+Number(row.parallelTask.hours)>Number(row.plannedHours)))errors.push(`${label}.parallelTask is invalid.`);
        };
        if(coach.active!=null)validateCommitment(coach.active,'weeklyCoach.active');
        if(coach.reviews!=null){
          if(!Array.isArray(coach.reviews)||coach.reviews.length>52)errors.push('weeklyCoach.reviews must contain at most 52 records.');
          else for(const [index,row]of coach.reviews.entries()){
            const label=`weeklyCoach.reviews[${index}]`;
            if(!isObj(row)||typeof row.id!=='string'||typeof row.commitmentId!=='string'||!Number.isFinite(Date.parse(row.reviewedAt))||!CT.util.validIsoDate(row.weekStart)||roleIds&&!roleIds.has(row.roleId)||typeof row.primaryId!=='string'||typeof row.primaryTitle!=='string'||!outcomes.has(row.outcome)||!Number.isFinite(Number(row.completionPercent))||Number(row.completionPercent)<0||Number(row.completionPercent)>100||row.outcome==='complete'&&Number(row.completionPercent)!==100||row.outcome==='partial'&&(Number(row.completionPercent)<=0||Number(row.completionPercent)>=100)||['blocked','deferred'].includes(row.outcome)&&Number(row.completionPercent)>=100||!Number.isFinite(Number(row.plannedHours))||Number(row.plannedHours)<.5||Number(row.plannedHours)>168||!Number.isFinite(Number(row.actualHours))||Number(row.actualHours)<0||Number(row.actualHours)>168||!blockers.has(String(row.blocker||''))||row.outcome==='blocked'&&!row.blocker||row.outcome!=='blocked'&&row.blocker||Number(row.completionPercent)>0&&String(row.evidenceNote||'').trim().length<10||String(row.evidenceNote||'').length>2000||(row.evidenceUrl&&!/^https:\/\//i.test(row.evidenceUrl))||String(row.evidenceUrl||'').length>500||!Number.isFinite(Number(row.confidence))||Number(row.confidence)<1||Number(row.confidence)>5||typeof row.adviceSignature!=='string'||row.adviceSignature.length>25000)errors.push(`${label} is invalid.`);
          }
        }
        if(coach.blockedResources!=null){if(!isObj(coach.blockedResources)||Object.keys(coach.blockedResources).length>1000)errors.push('weeklyCoach.blockedResources is invalid.');else for(const [url,row]of Object.entries(coach.blockedResources))if(!/^https:\/\//i.test(url)||!isObj(row)||!Number.isFinite(Date.parse(row.at))||String(row.reason||'').length>2000)errors.push('Invalid weeklyCoach blocked resource.');}
      }
    }
    return errors;
  }

  function validateBackup(data){
    const errors=[];if(!isObj(data))return {ok:false,errors:['Backup root must be an object.']};
    try{if(JSON.stringify(data).length>8_000_000)errors.push('Backup exceeds the supported 8 MB validation limit.');}catch{errors.push('Backup cannot be serialized safely.');}
    const version=Number(data.version);if(!Number.isInteger(version)||version<1)errors.push('Missing or invalid backup version.');else if(version>CT.version.backup)errors.push(`Backup version ${version} is newer than this app supports (${CT.version.backup}).`);
    errors.push(...validateCertKeyObject(data.passes,'passes',{dateValues:true}),...validateCertKeyObject(data.exams,'exams',{dateValues:true}),...validateCertKeyObject(data.skipped,'skipped',{dateValues:true}),...validateCertKeyObject(data.myPath,'myPath',{boolValues:true}),...validateCertKeyObject(data.objectiveProgress,'objectiveProgress',{numberRange:[0,100]}));
    for(const field of ['notes','artifacts','partners','certOrder','phaseOverrides','gates','competencyEvidence','plannerSettings'])if(data[field]!=null&&!isObj(data[field]))errors.push(`${field} must be an object.`);
    errors.push(...validateCapabilityEvidence(data.capabilityEvidence),...validateCustomization(data.customization));
    if(data.careerContext!=null){if(!isObj(data.careerContext))errors.push('careerContext must be an object.');else for(const [key,value]of Object.entries(data.careerContext))if(!['current','next','target'].includes(key)||typeof value!=='string'||(CT.careerFramework&&!CT.careerFramework.ROLE_PROFILES[value]))errors.push(`Invalid career context: ${key}`);}
    if(isObj(data.phaseOverrides))for(const [id,value] of Object.entries(data.phaseOverrides)){if(!validIds.has(id))errors.push(`phaseOverrides.${id} references an unknown certification.`);const n=Number(value);if(!Number.isInteger(n)||n<1||n>6)errors.push(`phaseOverrides.${id} must be an integer from 1 to 6.`);}
    if(isObj(data.notes))for(const [id,note] of Object.entries(data.notes)){if(!validIds.has(id))errors.push(`notes.${id} references an unknown certification.`);if(!isObj(note))errors.push(`notes.${id} must be an object.`);else{for(const key of ['text','link','imageData'])if(note[key]!=null&&typeof note[key]!=='string')errors.push(`notes.${id}.${key} must be text.`);}}
    errors.push(...validateArrayRecords(data.studyLog,'studyLog',(row,i,out)=>{if(row.date&&!CT.util.validIsoDate(row.date))out.push(`studyLog[${i}].date is invalid.`);const h=Number(row.hours);if(!Number.isFinite(h)||h<0||h>24)out.push(`studyLog[${i}].hours must be 0-24.`);if(row.certId&&!validIds.has(row.certId))out.push(`studyLog[${i}].certId is unknown.`);}),...validateArrayRecords(data.expLog,'expLog'),...validateArrayRecords(data.eventsDismissed,'eventsDismissed',null,{allowPrimitives:true}),...validateArrayRecords(data.activities,'activities'));
    const salary=Number(data.currentSalary??0);if(!Number.isFinite(salary)||salary<0||salary>10000000)errors.push('currentSalary is outside the supported range.');
    const pace=Number(data.pace2??0);if(!Number.isFinite(pace)||pace<0||pace>168)errors.push('pace2 must be between 0 and 168 hours/week.');
    if(data.goalProfile!=null&&!CT.competency?.GOALS?.[data.goalProfile])errors.push('goalProfile is not recognised.');
    if(isObj(data.plannerSettings)){const p=data.plannerSettings;if(p.weeklyHours!=null&&(!Number.isFinite(Number(p.weeklyHours))||Number(p.weeklyHours)<=0||Number(p.weeklyHours)>168))errors.push('plannerSettings.weeklyHours must be 0-168.');if(p.budget!=null&&p.budget!==''&&(!Number.isFinite(Number(p.budget))||Number(p.budget)<0))errors.push('plannerSettings.budget must be non-negative.');if(p.targetDate&&!CT.util.validIsoDate(p.targetDate))errors.push('plannerSettings.targetDate is invalid.');}
    return {ok:errors.length===0,errors};
  }

  function persistAll(options={}){
    restoring=true;
    try{
    save.passes();save.exams();save.notes();save.study();save.skipped();save.myPath();save.cpe();save.gates();save.objectives();save.evidence();save.capabilityEvidence();save.customization?.();save.planner();
    localStorage.setItem(SK.filter,state.filter||'my-path');localStorage.setItem(SK.salary,String(Number(state.currentSalary||0)));localStorage.setItem(SK.pace2,String(Number(state.pace2||0)));localStorage.setItem(SK.explog,JSON.stringify(state.expLog||[]));localStorage.setItem(SK.eventsDis,JSON.stringify(state.eventsDismissed||[]));
    localStorage.setItem('ct2-artifacts',JSON.stringify(state.artifacts||{}));localStorage.setItem('ct2-partners',JSON.stringify(state.partners||{}));localStorage.setItem('ct2-order',JSON.stringify(state.certOrder||{}));localStorage.setItem('ct2-phase-ovr',JSON.stringify(state.phaseOverrides||{}));localStorage.setItem(C.storageSchemaKey,String(CT.version.storage));
    if(options.changedAt!==false)localStorage.setItem(C.lastChangeKey,options.changedAt||new Date().toISOString());
    }finally{restoring=false;}
  }

  function assignBackup(data){
    if(data.careerContext)for(const key of ['current','next','target'])if(data.careerContext[key])localStorage.setItem(`ct4-career-${key}-role`,data.careerContext[key]);
    state.passes=clone(data.passes||{});state.exams=clone(data.exams||{});state.notes=clone(data.notes||{});state.studyLog=clone(data.studyLog||[]);state.skipped=clone(data.skipped||{});if(data.myPath)state.myPath=clone(data.myPath);
    if(typeof data.filter==='string')state.filter=data.filter;if(data.currentSalary!=null)state.currentSalary=Number(data.currentSalary);if(data.pace2!=null)state.pace2=Number(data.pace2);
    state.expLog=clone(data.expLog||[]);state.eventsDismissed=clone(data.eventsDismissed||[]);state.artifacts=clone(data.artifacts||{});state.partners=clone(data.partners||{});state.certOrder=clone(data.certOrder||{});state.phaseOverrides=clone(data.phaseOverrides||{});state.activities=clone(data.activities||[]);state.gates=clone(data.gates||{});
    state.objectiveProgress=clone(data.objectiveProgress||{});state.competencyEvidence=clone(data.competencyEvidence||{});state.capabilityEvidence=clone(data.capabilityEvidence||{});state.customization=clone(data.customization||{});state.plannerSettings={...state.plannerSettings,...clone(data.plannerSettings||{})};if(typeof data.goalProfile==='string')localStorage.setItem(C.goalKey,data.goalProfile);
  }

  function applyBackup(data,options={}){
    const validation=validateBackup(data);if(!validation.ok)throw new Error(validation.errors.join(' '));const rollback=serializableState();
    try{assignBackup(data);persistAll({changedAt:data.changedAt||data.exportedAt||new Date().toISOString()});CT.personalization?.apply?.();if(!options.silent){CT.events.emit('state-restored',{source:options.source||'backup'});if(typeof renderApp==='function')renderApp();}return true;}
    catch(error){try{assignBackup(rollback);persistAll({changedAt:rollback.changedAt||rollback.exportedAt});}catch{}throw error;}
  }

  function downloadJson(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportBackup(){const data=serializableState();downloadJson(data,`cert-tracker-backup-${new Date().toISOString().slice(0,10)}.json`);localStorage.setItem(C.lastBackupKey,new Date().toISOString());localStorage.setItem(C.recoveryKey,JSON.stringify(data));CT.events.emit('backup-exported',data);if(typeof showToast==='function')showToast('Backup exported');return data;}
  function importBackupFile(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{try{applyBackup(JSON.parse(e.target.result),{source:'file'});if(typeof showToast==='function')showToast('Backup restored');}catch(error){console.error('[CertTracker] backup restore rejected',error);if(typeof showToast==='function')showToast('Error: invalid or incompatible backup');}};reader.readAsText(file);};input.click();}

  let restoring=false,lastRecoveryWrite=0;
  function captureUndoPoint(reason='change',prior=null){if(restoring)return;const snapshot=prior||serializableState();snapshot.undoReason=reason;snapshot.undoCapturedAt=new Date().toISOString();localStorage.setItem(C.undoKey,JSON.stringify(snapshot));}
  function undoLastChange(){const data=safeParse(localStorage.getItem(C.undoKey),null);if(!data){if(typeof showToast==='function')showToast('Nothing to undo');return false;}applyBackup(data,{source:'undo'});localStorage.removeItem(C.undoKey);if(typeof showToast==='function')showToast(`Undid ${data.undoReason||'last change'}`);return true;}
  function recordRecoveryPoint(){if(Date.now()-lastRecoveryWrite<30000)return;lastRecoveryWrite=Date.now();try{localStorage.setItem(C.recoveryKey,JSON.stringify(serializableState()));}catch{}}
  function wrapSaves(){Object.keys(save).forEach(key=>{if(typeof save[key]!=='function'||save[key].__ctWrapped)return;const original=save[key];const wrapped=function(...args){if(!restoring)captureUndoPoint(key,readPersistedSnapshot());const result=original.apply(this,args);if(restoring)return result;const changedAt=new Date().toISOString();localStorage.setItem(C.lastChangeKey,changedAt);recordRecoveryPoint();CT.events.emit('state-saved',{key,at:changedAt});return result;};wrapped.__ctWrapped=true;save[key]=wrapped;});}

  migrate();wrapSaves();recordRecoveryPoint();exportJSON=exportBackup;importJSON=importBackupFile;
  CT.storage=Object.freeze({migrate,serializableState,readPersistedSnapshot,validateBackup,applyBackup,persistAll,exportBackup,importBackupFile,captureUndoPoint,undoLastChange,recordRecoveryPoint,lastBackupAt:()=>localStorage.getItem(C.lastBackupKey),lastChangedAt:()=>localStorage.getItem(C.lastChangeKey)});
})(window);
