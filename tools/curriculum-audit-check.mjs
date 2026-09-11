import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files=['certs.js','src/cert-extensions.js','src/catalogue-currentness.js','src/catalogue-policy-normalize.js','src/path-defaults.js','src/config.js','src/curriculum-audit.js','src/learning-resources.js','src/learning-resources-normalize.js'];
const s={console,URL};s.window=s;s.globalThis=s;vm.createContext(s);
vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n'),s,{filename:'curriculum-audit-bundle.js',timeout:10000});
const CT=s.CertTrackerV3,certs=s.CERTS,route=s.CERT_TRACKER_FOCUSED_ROUTE,summary=CT.curriculumAudit.summary();
assert.equal(route.ids.length,25,'Focused route milestone count changed without an audit migration');
assert.deepEqual(new Set(Object.keys(CT.curriculumAudit.records)),new Set(route.ids),'Every focused-route certification must have an explicit audit record');
assert.equal(summary.scope,25);assert.equal(summary.verified,9);assert.equal(summary.restricted,5);assert.equal(summary.validatedResources,4);
for(const id of route.ids){
  const cert=certs.find(row=>row.id===id),audit=CT.curriculumAudit.record(id),profile=CT.learningResources.profile(cert);
  assert.ok(cert,`${id}: focused-route certification missing`);assert.ok(audit,`${id}: audit record missing`);
  assert.ok(CT.curriculumAudit.STATUSES.includes(audit.status),`${id}: invalid audit status`);
  assert.match(audit.url,/^https:\/\//,`${id}: official audit source must be HTTPS`);
  assert.equal(profile.audit?.status,audit.status,`${id}: audit state must reach the learner UI model`);
  if(audit.status==='VERIFIED'){
    assert.equal(audit.checkedAt,'2026-09-11',`${id}: verified cross-walk needs an inspection date`);
    assert.ok(audit.version,`${id}: verified cross-walk needs a version or effective date`);
    assert.deepEqual(audit.domains.map(row=>row.subject),profile.subjects.map(row=>row.topic),`${id}: tracker subjects must exactly match the audited cross-walk`);
    for(const domain of audit.domains)if(domain.weight){assert.ok(domain.weight[0]>0&&domain.weight[1]>=domain.weight[0]&&domain.weight[1]<=100,`${id}: invalid domain weight`);}
  }else assert.equal(audit.domains.length,0,`${id}: unaudited domains must not masquerade as a cross-walk`);
  for(const resource of audit.resources){assert.match(resource.url,/^https:\/\//);assert.ok(CT.curriculumAudit.RESOURCE_STATUSES.includes(resource.status));assert.equal(resource.checkedAt,'2026-09-11');}
}
const queue=CT.curriculumAudit.queue();
assert.equal(queue.slice(0,3).map(row=>row.certId).join(','),'network-plus,security-plus,a-plus','Shared-route impact must drive the next public-blueprint audit cohort');
for(let i=1;i<queue.length;i++)assert.ok(queue[i-1].routeImpact>=queue[i].routeImpact,'Audit queue must be route-impact ordered');
for(const id of ['pcep','pcap'])assert.ok(CT.learningResources.profile(certs.find(row=>row.id===id)).stack.some(row=>row.coverage==='REVIEWED'&&row.auditStatus==='BLUEPRINT_ALIGNED'),`${id}: issuer-aligned course must be surfaced as reviewed`);
assert.equal(CT.learningResources.profile(certs.find(row=>row.id==='sc-500')).subjects.some(row=>row.topic==='AI workload and data security'),false,'SC-500 must not retain a fifth domain that the current blueprint folds into Secure compute');
console.log(`Curriculum audit passed: ${summary.verified}/${summary.scope} My Path blueprints cross-walked, ${summary.validatedResources} exact-version resources, ${summary.restricted} access-restricted.`);
