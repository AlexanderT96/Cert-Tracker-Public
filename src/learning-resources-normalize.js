// Cert Tracker — completeness normalizer for learning resources.
// Completes navigation without pretending that a search page or credential page
// is reviewed teaching material. Every subject also receives a local, explicit
// study brief so sparse external coverage remains useful and honestly labelled.
(function normalizeLearningResources(global){
  'use strict';
  const CT=global.CertTrackerV3,base=CT?.learningResources;if(!base)return;
  function yt(q){return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;}
  function udemy(q){return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`;}
  function row(label,url,purpose,kind='resource',free=null){return Object.freeze({label,url,purpose,kind,free});}
  function dedupe(rows){const seen=new Set();return rows.filter(x=>x?.url&&/^https:\/\//.test(x.url)&&!seen.has(x.url)&&(seen.add(x.url),true));}
  const discoveryUrl=url=>/youtube\.com\/results|udemy\.com\/courses\/search|[?&](q|query|search_query|search|terms)=/i.test(url||'');
  const reviewedByCert=new Map(Object.entries(base.STACK_OVERRIDES||{}).map(([id,rows])=>{const audit=CT.curriculumAudit?.record(id),urls=audit?CT.curriculumAudit.validatedResources(id).map(r=>r.url):rows.map(r=>r.url);return[id,new Set(urls.filter(Boolean))];}));
  const BOTTLENECKS=Object.freeze([
    Object.freeze({id:'troubleshooting',pattern:/troubleshoot|diagnos|incident|forensic|packet|root cause|debug/i,label:'Fault diagnosis'}),
    Object.freeze({id:'architecture',pattern:/architecture|design|integration|resilience|trade-off|governance/i,label:'Design judgement'}),
    Object.freeze({id:'networking',pattern:/subnet|routing|switch|vlan|bgp|ospf|segmentation|protocol|dns|pki|certificate/i,label:'Dependency reasoning'}),
    Object.freeze({id:'automation',pattern:/python|program|object-oriented|api|automation|powershell|bash|yaml|terraform|code/i,label:'Applied automation'}),
    Object.freeze({id:'security',pattern:/threat|risk|identity|access|attack|vulnerab|security|kql|siem/i,label:'Security judgement'}),
    Object.freeze({id:'ot',pattern:/plc|scada|iacs|industrial|control logic|sis|sil|instrument/i,label:'Cyber-physical consequence'})
  ]);
  function classify(r,cert){if(discoveryUrl(r?.url))return{...r,label:'Unreviewed search — '+r.label.replace(/search/i,'').trim(),purpose:'Discovery only. Check the creator, date and active exam code before relying on this material.',verified:false,coverage:'DISCOVERY'};if(r?.coverage==='PLATFORM')return{...r,verified:false,coverage:'PLATFORM'};if(['BLUEPRINT_ALIGNED','VERSION_MATCH'].includes(r?.auditStatus))return{...r,verified:true,coverage:'REVIEWED'};if(r?.kind==='official')return{...r,verified:true,coverage:'REFERENCE'};const reviewed=reviewedByCert.get(cert?.id)?.has(r?.url)||false;return{...r,verified:reviewed,reviewedAt:reviewed?'2026-09-10':null,coverage:reviewed?'REVIEWED':'CANDIDATE'};}
  function official(cert){const url=CT.sourceRegistry?.[cert.id]?.url||cert.sourceUrl;return url?row('Official credential and current requirements',url,'Reference only: confirm identity, active version, requirements and issuer-provided preparation links','official',true):null;}
  function studyBrief(topic,depth){const action=depth>=4?'design, troubleshoot and defend':depth===3?'configure, validate and troubleshoot':'explain, compare and recognise';return Object.freeze({status:'LOCALLY_AUTHORED',outcomes:Object.freeze([`${action[0].toUpperCase()+action.slice(1)} ${topic} without relying on product slogans.`,`Identify dependencies, failure boundaries and one meaningful trade-off for ${topic}.`,`Produce observable evidence that the expected behaviour occurred.`]),lab:Object.freeze([`Define a safe, reversible ${topic} scenario and its expected result.`,`Build or simulate the smallest representative implementation; record assumptions and configuration.`,`Introduce one controlled failure, diagnose from evidence, restore service and document rollback.`]),checks:Object.freeze([`Can you predict the result before running the test?`,`Can you distinguish a configuration fault from an upstream dependency failure?`,`Could another engineer reproduce and challenge your conclusion from the evidence?`])});}
  function tutorPlan(cert,subject){const depth=Number(subject.depth||2),topic=String(subject.topic||''),kind=BOTTLENECKS.find(row=>row.pattern.test(topic)),veryHigh=/very high/i.test(subject.emphasis||''),policy=String(cert.tutorFlag||'').trim(),lowPolicy=/low tutoring case/i.test(policy),positivePolicy=/moderate|high tutoring case/i.test(policy);let recommendation='SELF_STUDY',stage='AFTER_TWO_FAILED_CYCLES';if(depth>=5){recommendation='CHECKPOINT';stage='BEFORE_CAPSTONE';}else if(depth>=4&&kind&&!lowPolicy&&(veryHigh||positivePolicy)){recommendation='RECOMMENDED';stage='AFTER_FIRST_LAB';}else if(depth>=4||depth>=3&&kind){recommendation='CONDITIONAL';stage='AFTER_DIAGNOSTIC';}const trigger=recommendation==='CHECKPOINT'?`Before claiming D${depth} capability, complete one independent scenario and book a challenge review if you cannot defend assumptions, failure modes and trade-offs.`:recommendation==='RECOMMENDED'?`Escalate after one complete study-and-lab cycle if you cannot reproduce the result unaided or diagnose the controlled failure from evidence.`:recommendation==='CONDITIONAL'?`Escalate only after two attempts expose the same misconception, configuration error or explanation gap.`:`Continue independently; escalate only after two failed learn → practise → retrieve cycles.`;return Object.freeze({recommendation,stage,bottleneck:kind?.label||'No predictable bottleneck',trigger,sessionGoal:`Explain, apply and troubleshoot ${topic}; the tutor should challenge reasoning rather than re-teach the whole course.`,bring:Object.freeze([`Your attempted ${topic} lab or scenario`,`The exact question, output or failure point`,`Your current explanation and the evidence that contradicts it`]),exit:`Repeat a changed ${topic} scenario without prompts and explain why the fix works.`,credentialPolicy:policy||'No separate credential-level tutoring note.'});}
  function providerCourse(cert,topic){
    const id=String(cert?.id||''),name=String(cert?.name||'').toLowerCase();
    let url=null,label='Official/provider learning route';
    if(['server-plus','cysa-plus','secai-plus','autoops-plus'].includes(id))url='https://www.comptia.org/training';
    else if(['cissp','issap'].includes(id))url='https://www.isc2.org/training/online-self-paced';
    else if(id==='btl1')url='https://www.securityblue.team/academy';
    else if(['cismp','bcs-esa'].includes(id))url='https://www.bcs.org/qualifications-and-certifications/';
    else if(id==='iso-27001-li')url='https://pecb.com/en/education-and-certification-for-individuals';
    else if(['crisc','cisa','cdpse','cism'].includes(id))url='https://www.isaca.org/education';
    else if(id==='csyp')url='https://www.ukcybersecuritycouncil.org.uk/certifications/';
    else if(id==='caisp')url='https://www.isc2.org/training/online-self-paced';
    else if(['lcp','lce','lcda'].includes(id))url='https://www.lenels2.com/en/training/';
    else if(id==='asis-psp')url='https://www.asisonline.org/education/';
    else if(id==='thm-pt1')url='https://tryhackme.com/paths';
    else if(id==='pnpt')url='https://academy.tcm-sec.com/';
    else if(id==='htb-cpts')url='https://academy.hackthebox.com/';
    else if(['oscp','osed','osep','oswe','osee','crto'].includes(id))url='https://www.offsec.com/courses/';
    else if(id.startsWith('arcgis-')||id.startsWith('esri-'))url='https://www.esri.com/training/';
    else if(['meddic-found','meddpicc-master'].includes(id))url='https://meddicc.com/';
    else if(id.startsWith('itil-')||id==='prince2-prac')url='https://www.peoplecert.org/ways-to-get-certified';
    else if(id.startsWith('aws-'))url='https://skillbuilder.aws/';
    else if(id==='splunk-core-user')url='https://www.splunk.com/en_us/training.html';
    else if(['aigp','cipp-e','cipm'].includes(id))url='https://iapp.org/train/';
    else if(id.startsWith('genetec-'))url='https://www.genetec.com/support/training';
    else if(id.startsWith('pragmatic-'))url='https://www.pragmaticinstitute.com/';
    else if(id==='sabsa-found')url='https://sabsa.org/training/';
    if(!url)return null;
    url += '#cert-tracker-'+id+'-'+String(topic).toLowerCase().replace(/[^a-z0-9]+/g,'-');
    return row(label,url,'Use the issuer/provider learning route as the structured spine for '+topic+'. Confirm the live syllabus, version and access terms before relying on it.','course',null);
  }
  function completeResources(cert,topic,resources){const q=[cert.code,cert.name,topic].filter(Boolean).join(' '),rows=[official(cert),providerCourse(cert,topic),...(resources||[]),row('Video deep-dive search',yt(`${q} tutorial`),'','video',true),row('Structured course search',udemy(`${cert.code||cert.name} ${topic}`),'','course',false),row('Hands-on walkthrough search',yt(`${q} hands-on lab`),'','lab',true)].filter(Boolean).map(r=>classify(r,cert));return Object.freeze(dedupe(rows));}
  function completeStack(cert,stack){const q=[cert.code,cert.name].filter(Boolean).join(' '),rows=[official(cert),...(stack||[]),row('Current full-course search',yt(`${q} full course`),'','video',true),row('Structured course search',udemy(q),'','course',false),row('Hands-on lab search',yt(`${q} hands-on lab`),'','lab',true),row('Practice-question search',yt(`${q} practice questions`),'','practice',true)].filter(Boolean).map(r=>classify(r,cert));return Object.freeze(dedupe(rows));}
  function profile(cert){const p=base.profile(cert),audit=CT.curriculumAudit?.record(cert.id)||null;const meaningful=p.subjects.filter(s=>!/^no .+ required$/i.test(String(s.topic||'').trim()));const subjects=Object.freeze(meaningful.map((s,index)=>{const resources=completeResources(cert,s.topic,s.resources),substantive=resources.filter(r=>!['DISCOVERY','REFERENCE'].includes(r.coverage)),subject={...s,order:index+1,resources,studyBrief:studyBrief(s.topic,s.depth),resourceIntegrity:Object.freeze({substantive:substantive.length,reviewed:substantive.filter(r=>r.coverage==='REVIEWED').length,status:substantive.length?'CANDIDATE':'LOCAL-BRIEF-ONLY'})};return Object.freeze({...subject,tutor:tutorPlan(cert,subject)});}));const substantive=subjects.reduce((n,s)=>n+s.resourceIntegrity.substantive,0),reviewed=subjects.reduce((n,s)=>n+s.resourceIntegrity.reviewed,0),tutorCheckpoints=subjects.filter(s=>['RECOMMENDED','CHECKPOINT'].includes(s.tutor.recommendation)).length;return Object.freeze({...p,audit,subjects,stack:completeStack(cert,p.stack),integrity:Object.freeze({subjects:subjects.length,subjectsWithExternal:subjects.filter(s=>s.resourceIntegrity.substantive).length,substantive,reviewed,tutorCheckpoints,status:subjects.every(s=>s.resourceIntegrity.reviewed)?'REVIEWED':subjects.some(s=>s.resourceIntegrity.substantive)?'PARTIAL':'LOCAL-BRIEFS'})});}
  function subjectCoverage(cert){return profile(cert).subjects;}
  function overallStack(cert){return profile(cert).stack;}
  function topicResources(cert,topic){const p=profile(cert),hit=p.subjects.find(s=>s.topic===topic);return hit?hit.resources:completeResources(cert,topic,base.topicResources(cert,topic));}
  function validate(){return CERTS.every(cert=>{const p=profile(cert);return p.stack.length>0&&p.subjects.length>0&&p.subjects.every(s=>s.depth>=1&&s.depth<=5&&s.studyBrief?.outcomes.length>=3&&s.studyBrief?.lab.length>=3&&s.tutor?.stage&&s.tutor?.trigger&&s.tutor?.sessionGoal&&s.tutor?.bring.length>=3&&s.tutor?.exit&&s.resources.every(r=>/^https:\/\//.test(r.url)&&['DISCOVERY','REFERENCE','CANDIDATE','REVIEWED','PLATFORM'].includes(r.coverage)));});}
  CT.learningResources=Object.freeze({...base,BOTTLENECKS,profile,subjectCoverage,overallStack,topicResources,tutorPlan,validate});
})(window);
