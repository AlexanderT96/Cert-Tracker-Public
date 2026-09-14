import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files=['certs.js','src/cert-extensions.js','src/catalogue-currentness.js','src/catalogue-policy-normalize.js','src/path-defaults.js','src/config.js','src/curriculum-audit.js','src/learning-resources.js','src/learning-resources-normalize.js'];
const s={console,URL};s.window=s;s.globalThis=s;vm.createContext(s);
vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n'),s,{filename:'curriculum-audit-bundle.js',timeout:10000});
const CT=s.CertTrackerV3,certs=s.CERTS,route=s.CERT_TRACKER_FOCUSED_ROUTE,summary=CT.curriculumAudit.summary();
assert.equal(route.ids.length,34,'Focused route must contain the complete visible architecture, security and wireless progression');
assert.deepEqual(new Set(Object.keys(CT.curriculumAudit.records)),new Set(route.auditIds),'Every core or CWNP-focus certification must have an explicit audit record');
assert.equal(summary.scope,34);assert.equal(summary.verified,29);assert.equal(summary.queued,0);assert.equal(summary.restricted,5);assert.equal(summary.validatedResources,11);
assert.equal(summary.coreScope,34);assert.equal(summary.coreStructured,34);assert.equal(summary.coreVerified,29);assert.equal(summary.coreRestricted,5);assert.equal(summary.focusScope,0);assert.equal(summary.focusVerified,0);
for(const id of route.auditIds){
  const cert=certs.find(row=>row.id===id),audit=CT.curriculumAudit.record(id),profile=CT.learningResources.profile(cert);
  assert.ok(cert,`${id}: focused-route certification missing`);assert.ok(audit,`${id}: audit record missing`);
  assert.ok(CT.curriculumAudit.STATUSES.includes(audit.status),`${id}: invalid audit status`);
  assert.match(audit.url,/^https:\/\//,`${id}: official audit source must be HTTPS`);
  assert.equal(profile.audit?.status,audit.status,`${id}: audit state must reach the learner UI model`);
  assert.ok(profile.curated,`${id}: My Path coverage must never fall back to inferred catalogue prose`);
  assert.ok(audit.domains.length>=2,`${id}: every My Path record needs an explicit structured coverage map`);
  assert.deepEqual(audit.domains.map(row=>row.subject),profile.subjects.map(row=>row.topic),`${id}: tracker subjects must exactly match the audited coverage map`);
  if(audit.status==='VERIFIED'){
    assert.equal(audit.checkedAt,'2026-09-11',`${id}: verified cross-walk needs an inspection date`);
    assert.ok(audit.version,`${id}: verified cross-walk needs a version or effective date`);
    for(const domain of audit.domains)if(domain.weight){assert.ok(domain.weight[0]>0&&domain.weight[1]>=domain.weight[0]&&domain.weight[1]<=100,`${id}: invalid domain weight`);}
  }else{
    assert.equal(audit.status,'ACCESS_RESTRICTED',`${id}: non-public blueprint must be explicitly access restricted`);
    assert.equal(audit.checkedAt,'2026-09-14',`${id}: restricted coverage floor needs its own inspection date`);
    assert.equal(audit.coverageBasis,'PUBLIC_PRODUCT_AND_ROLE_SCOPE',`${id}: restricted coverage needs an honest evidence basis`);
    assert.equal(audit.portalValidationRequired,true,`${id}: restricted coverage must remain gated on issuer-portal validation`);
    assert.ok(audit.version,`${id}: restricted record needs a named current curriculum context`);
    assert.equal(cert.coverageModel,'ACCESS_RESTRICTED_EXPLICIT_FLOOR',`${id}: canonical record must disclose that coverage is a minimum floor`);
    assert.equal(cert.tutorBottlenecks?.length,profile.subjects.length,`${id}: every restricted subject needs an explicit tutor bottleneck`);
  }
  for(const resource of audit.resources){assert.match(resource.url,/^https:\/\//);assert.ok(CT.curriculumAudit.RESOURCE_STATUSES.includes(resource.status));assert.equal(resource.checkedAt,audit.status==='VERIFIED'?'2026-09-11':'2026-09-14');}
}
const queue=CT.curriculumAudit.queue();
assert.ok(queue.every(row=>row.status==='ACCESS_RESTRICTED'),'Public My Path blueprints must not remain queued');
for(let i=1;i<queue.length;i++)assert.ok(queue[i-1].routeImpact>=queue[i].routeImpact,'Audit queue must be route-impact ordered');
for(const id of ['pcep','pcap'])assert.ok(CT.learningResources.profile(certs.find(row=>row.id===id)).stack.some(row=>row.coverage==='REVIEWED'&&row.auditStatus==='BLUEPRINT_ALIGNED'),`${id}: issuer-aligned course must be surfaced as reviewed`);
assert.equal(CT.curriculumAudit.record('az-802').domains.length,7,'AZ-802 must expose all seven weighted issuer domains');
assert.equal(CT.curriculumAudit.record('sc-100').domains.length,4,'SC-100 must expose the current four-domain Microsoft blueprint');
assert.equal(CT.curriculumAudit.record('cissp').domains.length,8,'CISSP must expose all eight ISC2 domains');
assert.ok(CT.curriculumAudit.record('mcie').domains.some(row=>row.subject==='Milestone Federated Architecture'),'XCIE must explicitly cover Federated Architecture');
assert.ok(CT.curriculumAudit.record('mcie').domains.some(row=>row.subject==='XProtect Interconnect'),'XCIE must explicitly cover Interconnect');
assert.equal(route.focusTracks.find(x=>x.id==='cwnp-wifi').certs.join(','),'cwna,cwisa,cwap,cwdp,cwsp,cwne','Complete CWNP progression must remain visible');
assert.ok(route.focusTracks.find(x=>x.id==='cellular-wan').topics.length>=5,'Cellular focus must progress through an expert-level capability ladder');
for(const id of route.focusTracks.find(track=>track.id==='cwnp-wifi').certs)assert.equal(route.ids.includes(id),true,`${id}: CWNP progression must remain visible in core My Path`);
assert.equal(CT.learningResources.profile(certs.find(row=>row.id==='sc-500')).subjects.some(row=>row.topic==='AI workload and data security'),false,'SC-500 must not retain a fifth domain that the current blueprint folds into Secure compute');
console.log(`Curriculum audit passed: ${summary.coreVerified}/${summary.coreScope} core blueprints verified; ${summary.validatedResources} exact-version resources, ${summary.coreRestricted} access-restricted.`);
