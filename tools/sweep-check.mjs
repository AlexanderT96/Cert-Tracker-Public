import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files=[
  'certs.js','src/cert-extensions.js','src/catalogue-currentness.js','src/catalogue-policy-normalize.js',
  'src/path-defaults.js','src/config.js','src/learning-resources.js','src/learning-resources-normalize.js',
  'src/source-registry.js','src/source-registry-current.js','src/data-health.js'
];
const sandbox={console,URL,TextEncoder,TextDecoder,crypto,structuredClone};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.localStorage={getItem(){return null;},setItem(){},removeItem(){}};
vm.createContext(sandbox);
vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n'),sandbox,{filename:'sweep-data-bundle.js',timeout:10000});

const CT=sandbox.CertTrackerV3;
CT.careerFramework={context:()=>({current:'generalIT'}),ROLE_PROFILES:{generalIT:{label:'General IT',weights:{networking:1}}}};
CT.events={emit(){}};
sandbox.state={passes:{},customization:{},capabilityEvidence:{}};
sandbox.save={customization(){}};
vm.runInContext(fs.readFileSync('src/career-options.js','utf8'),sandbox,{filename:'career-options.js',timeout:10000});

const certs=sandbox.CERTS;
const unavailable=new Map(certs.filter(cert=>!CT.credentials.availability(cert).eligible).map(cert=>[cert.id,CT.credentials.availability(cert).status]));
const routeUnavailable=[];
for(const role of CT.careerOptions.ROLES){
  for(const cert of CT.careerOptions.pathway(role).certifications){
    if(unavailable.has(cert.id))routeUnavailable.push({role:role.id,cert:cert.id,status:unavailable.get(cert.id)});
  }
}
let subjects=0,resources=0,references=0,discoveryCount=0,externalCandidates=0,reviewed=0,platforms=0,subjectsWithoutStudyBrief=0,subjectsWithoutTutorDecision=0,tutorCheckpoints=0,nonSubjects=0;
for(const cert of certs){
  const profile=CT.learningResources.profile(cert);
  for(const subject of profile.subjects){
    subjects++;
    const rows=subject.resources||[];
    resources+=rows.length;
    references+=rows.filter(row=>row.coverage==='REFERENCE').length;
    discoveryCount+=rows.filter(row=>row.coverage==='DISCOVERY').length;
    externalCandidates+=rows.filter(row=>row.coverage==='CANDIDATE').length;
    reviewed+=rows.filter(row=>row.coverage==='REVIEWED').length;
    platforms+=rows.filter(row=>row.coverage==='PLATFORM').length;
    if(!subject.studyBrief?.outcomes?.length||!subject.studyBrief?.lab?.length)subjectsWithoutStudyBrief++;
    if(!subject.tutor?.stage||!subject.tutor?.trigger||!subject.tutor?.sessionGoal||!subject.tutor?.exit)subjectsWithoutTutorDecision++;
    if(['RECOMMENDED','CHECKPOINT'].includes(subject.tutor?.recommendation))tutorCheckpoints++;
    if(/^no .+ required$/i.test(subject.topic||''))nonSubjects++;
  }
}
const defaultUnavailable=(sandbox.CERT_TRACKER_FOCUSED_ROUTE?.ids||[]).filter(id=>unavailable.has(id)).map(id=>({id,status:unavailable.get(id)}));
const platformIds=certId=>new Set(CT.learningResources.profile(certs.find(cert=>cert.id===certId)).subjects.flatMap(subject=>subject.resources).map(row=>row.platformId).filter(Boolean));
console.log(JSON.stringify({certifications:certs.length,roles:CT.careerOptions.ROLES.length,unavailable:Object.fromEntries(unavailable),routeUnavailable,defaultUnavailable,subjects,resources,references,discovery:discoveryCount,externalCandidates,reviewed,platforms,tutorCheckpoints,subjectsWithoutStudyBrief,subjectsWithoutTutorDecision,nonSubjects},null,2));
assert.equal(new Set(certs.map(cert=>cert.id)).size,certs.length,'Certification IDs must be unique');
assert.equal(CT.careerOptions.ROLES.length,70,'The career catalogue must retain all 70 roles');
assert.equal(routeUnavailable.length,0,'Unavailable credentials must not appear in active career pathways');
assert.equal(defaultUnavailable.length,0,'Unavailable credentials must not appear in the focused My Path route');
assert.equal(subjectsWithoutStudyBrief,0,'Every mapped subject needs an executable local study brief; links alone are not learning coverage');
assert.equal(subjectsWithoutTutorDecision,0,'Every mapped subject needs a concrete tutor escalation decision');
assert.equal(nonSubjects,0,'Negative requirement labels must not be presented as subjects');
assert.ok(platforms>0,'Dedicated platform mappings must survive resource normalization');
assert.ok(['mimo','sololearn'].every(id=>platformIds('pcep').has(id)),'Python subjects must expose both mobile-first coding platforms');
assert.ok(platformIds('security-plus').has('tryhackme'),'Cyber foundations must expose a guided cyber range');
assert.ok(['portswigger','htb'].every(id=>platformIds('bscp').has(id)),'Advanced web-security subjects must expose dedicated web and depth labs');
assert.ok(platformIds('cka').has('kodekloud'),'Kubernetes subjects must expose a dedicated platform lab route');
assert.ok(platformIds('az-104').has('microsoftLearn'),'Microsoft subjects must expose Microsoft Learn');
assert.ok(platformIds('ccna').has('ciscoNetAcad'),'Cisco networking subjects must expose Cisco learning labs');
assert.ok(CT.learningResources.PLATFORMS.mimo.modes.some(mode=>/iOS/.test(mode))&&CT.learningResources.PLATFORMS.sololearn.modes.some(mode=>/iOS/.test(mode)),'The platform registry must include explicit mobile study routes');
assert.ok(CT.learningResources.PLATFORMS.htb.modes.some(mode=>/Desktop/.test(mode))&&CT.learningResources.PLATFORMS.kodekloud.modes.some(mode=>/Desktop/.test(mode)),'The platform registry must include explicit desktop lab routes');
