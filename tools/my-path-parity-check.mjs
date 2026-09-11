import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('certs.js', 'utf8'), sandbox, { filename: 'certs.js' });
vm.runInContext(fs.readFileSync('src/path-defaults.js', 'utf8'), sandbox, { filename: 'src/path-defaults.js' });

const route = sandbox.window.CERT_TRACKER_FOCUSED_ROUTE;
const routeIds = Array.from(route.ids || []);
const certs = Array.from(sandbox.window.CERTS || []);
const byId = new Map(certs.map(cert => [cert.id, cert]));
assert.ok(route && routeIds.length, 'focused My Path route must be present');
assert.equal(new Set(routeIds).size, routeIds.length, 'My Path must not contain duplicate route IDs');

const unknown = routeIds.filter(id => !byId.has(id));
assert.deepEqual(unknown, [], 'My Path references unknown canonical certification IDs');

for (const id of routeIds) {
  const cert = byId.get(id);
  assert.ok(cert.officialUrl && /^https:\/\//.test(cert.officialUrl), `${id} needs an official source URL`);
  assert.ok(cert.sourceUrl === cert.officialUrl, `${id} sourceUrl must match officialUrl`);
  assert.ok(cert.code, `${id} needs an exam or credential code/version`);
  assert.ok(cert.provider, `${id} needs a provider`);
  assert.ok(Number.isFinite(cert.validity), `${id} needs an explicit validity value in months`);
  assert.ok(cert.renewalRule, `${id} needs a renewal rule`);
  assert.ok(cert.costStatus, `${id} needs a cost status`);
  assert.ok(/^\\d{4}-\\d{2}(?:-\\d{2})?$/.test(cert.verifiedAt || ''), `${id} needs a dated verifiedAt value`);
  assert.ok(Array.isArray(cert.tutorBottlenecks) && cert.tutorBottlenecks.length > 0, `${id} needs subject-level tutor bottlenecks`);
}

const az802 = byId.get('az-802');
assert.equal(az802.catalogueStatus, 'PENDING_BLUEPRINT');
assert.equal(az802.active, false);
assert.ok(Array.isArray(byId.get('cwne').experienceGate?.enterpriseProjects) && byId.get('cwne').experienceGate.enterpriseProjects >= 3);
assert.deepEqual(byId.get('cwap').deps, ['cwna']);
assert.deepEqual(byId.get('cwdp').deps, ['cwna']);
assert.deepEqual(byId.get('cwsp').deps, ['cwna']);
assert.equal(byId.get('ai-901').code, 'AI-901');
assert.match(byId.get('pcep').marketNote, /five years/i);
assert.match(byId.get('pcap').marketNote, /five years/i);

console.log(`My Path parity OK: ${routeIds.length} route IDs, ${certs.length} total catalogue records`);
