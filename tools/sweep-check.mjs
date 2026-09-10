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
let subjects=0,resources=0,references=0,discoveryCount=0,externalCandidates=0,reviewed=0,subjectsWithoutStudyBrief=0;
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
    if(!subject.studyBrief?.outcomes?.length||!subject.studyBrief?.lab?.length)subjectsWithoutStudyBrief++;
  }
}
const defaultUnavailable=(sandbox.CERT_TRACKER_FOCUSED_ROUTE?.ids||[]).filter(id=>unavailable.has(id)).map(id=>({id,status:unavailable.get(id)}));
console.log(JSON.stringify({certifications:certs.length,roles:CT.careerOptions.ROLES.length,unavailable:Object.fromEntries(unavailable),routeUnavailable,defaultUnavailable,subjects,resources,references,discovery:discoveryCount,externalCandidates,reviewed,subjectsWithoutStudyBrief},null,2));
assert.equal(new Set(certs.map(cert=>cert.id)).size,certs.length,'Certification IDs must be unique');
assert.equal(CT.careerOptions.ROLES.length,70,'The career catalogue must retain all 70 roles');
assert.equal(routeUnavailable.length,0,'Unavailable credentials must not appear in active career pathways');
assert.equal(defaultUnavailable.length,0,'Unavailable credentials must not appear in the focused My Path route');
assert.equal(subjectsWithoutStudyBrief,0,'Every mapped subject needs an executable local study brief; links alone are not learning coverage');
