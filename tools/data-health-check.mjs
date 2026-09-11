import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Fixed clock makes provenance regressions deterministic; runtime still ages normally.
class AuditDate extends Date { static now(){return Date.parse('2026-09-02T16:00:00Z');} }
const s={console,Date:AuditDate};s.window=s;vm.createContext(s);
for(const file of ['certs.js','src/cert-extensions.js','src/catalogue-currentness.js','src/catalogue-policy-normalize.js','src/config.js','src/source-registry.js','src/source-registry-current.js','src/data-health.js'])vm.runInContext(fs.readFileSync(file,'utf8'),s,{filename:file});
const CT=s.CertTrackerV3,health=CT.dataHealth,certs=vm.runInContext('CERTS',s),summary=health.summary();
assert.equal(summary.total,200);
assert.equal(summary.missingSources,0);
assert.equal(summary.sourceCoverage,100);
assert.equal(summary.exactSources,130);
assert.equal(summary.vendorSources,70);
assert.equal(summary.averageConfidence,Math.round(summary.verifiedFacts/summary.totalFacts*100));
assert.equal(summary.priceVerified,0);
assert.equal(Object.keys(summary.fieldTotals).length,6);
assert.equal(Object.values(summary.fieldTotals).reduce((n,v)=>n+v,0),summary.verifiedFacts);
assert.equal(summary.fieldTotals.price,summary.priceVerified);
assert.ok(summary.averageConfidence<10,'Unverified facts cannot inherit linked-source confidence');
for(const cert of certs){
  assert.ok(CT.sourceRegistry[cert.id],`${cert.id}: explicit mapping required`);
  assert.equal(new URL(health.record(cert).sourceUrl).protocol,'https:');
}
assert.equal(Object.keys(CT.sourceRegistry).length,certs.length,'No orphan registry IDs');
for(const[id,host]of Object.entries({'bscp':'portswigger.net','hashicorp-vault':'developer.hashicorp.com','aigp':'iapp.org','htb-cdsa':'help.hackthebox.com','arcgis-foundation':'www.esri.com','esri-dev-found':'www.esri.com','meddic-found':'meddic.academy','wiz-cse':'www.wiz.io','gcp-pca':'cloud.google.com','lcp':'www.lenels2.com'}))assert.equal(new URL(CT.sourceRegistry[id].url).hostname,host,id);
assert.equal(health.record({name:'AWS architect',coverage:'Microsoft Axis Milestone Google'}).sourceLevel,'NONE');
assert.equal(health.record({vendor:'Microsoft'}).sourceLevel,'VENDOR');
for(const value of ['bad','2026-02-30','2026-13-01','2026-09-03','2027-01'])assert.equal(health.normaliseVerifiedDate(value),null,value);
assert.ok(health.normaliseVerifiedDate('2026-09'));
assert.equal(health.record({verifiedAt:'2026-02-30'}).freshness,'UNKNOWN');
const old={id:'bscp',name:'Old data',verifiedAt:'2020-01-01',priceCheckedAt:'2020-01-01',costNum:100};
assert.equal(health.record(old).freshness,'STALE','Source check cannot refresh catalogue detail age');
assert.ok(health.record(old).issues.includes('Price may be stale'));
assert.equal(health.record(old).verifiedAt,'2020-01-01');
assert.equal(health.record(old).sourceCheckedAt,'2026-09-02');
assert.equal(health.record({id:'claroty-cert-eng',verifiedAt:'2026-09-01'}).confidence,0,'Vendor source cannot score as audited exact credential');
assert.equal(health.record({id:'acp',verifiedAt:'2026-09-01'}).provenance,'EXPLICIT_MAPPING');
assert.equal(health.record({id:'acp',verifiedAt:'2026-09-01'}).sourceCheckedAt,null,'Do not invent audit dates when inspection is unavailable');
for(const id of ['jsnad','jsnsd'])assert.equal(CT.sourceRegistry[id].credentialStatus,'RETIRED');
assert.equal(CT.sourceRegistry.pcpp2.credentialStatus,'IN_DEVELOPMENT');
assert.equal(summary.availabilityWarnings,8);
assert.ok(health.reviewQueue().slice(0,7).every(row=>row.credentialStatus));
const ux=fs.readFileSync('src/ux.js','utf8');
assert.ok(ux.includes('not that every detail is verified'));
assert.ok(ux.includes('Source checks do not refresh price-verification dates'));
assert.ok(!ux.slice(ux.indexOf('function showDataHealth()'),ux.indexOf('function showDiagnostics()')).includes('queue.slice'),'All review entries must remain accessible');
console.log(`Data health passed: ${summary.total}/${summary.total} sources, ${summary.exactSources} cert-level, ${summary.vendorSources} vendor-level, ${summary.averageConfidence}% confidence, ${summary.availabilityWarnings} availability warnings.`);
