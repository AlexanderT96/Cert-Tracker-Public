import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const routeSandbox={window:{}};
vm.createContext(routeSandbox);
vm.runInContext(fs.readFileSync('src/path-defaults.js','utf8'),routeSandbox,{filename:'src/path-defaults.js'});
vm.runInContext(fs.readFileSync('src/career-path-v14.js','utf8'),routeSandbox,{filename:'src/career-path-v14.js'});
const route=routeSandbox.window.CERT_TRACKER_FOCUSED_ROUTE;
assert.equal(route?.id,'security-convergence-v14');
assert.equal(route?.title,'Security Convergence Engineering & Architecture');
assert.equal(route?.executionPolicy?.mode,'CONVERGENCE_FOREGROUND_WITH_EVIDENCE_GATES');
assert.equal(route?.executionPolicy?.primary,'ccna');
assert.deepEqual(Array.from(route?.executionPolicy?.supporting||[]),['acp','mcie']);
assert.match(route?.executionPolicy?.rule||'',/convergence leverage/i);
assert.ok(Array.from(route?.ids||[]).includes('ccna'),'CCNA must remain on the convergence route');
assert.ok(Array.from(route?.ids||[]).includes('acp'),'Axis ACP must remain on the convergence route');
assert.ok(Array.from(route?.ids||[]).includes('mcie'),'Milestone MCIE must remain on the convergence route');
assert.ok(Array.from(route?.ids||[]).includes('az-700'),'Azure network architecture must remain visible');
assert.ok(Array.from(route?.ids||[]).includes('sc-100'),'Security architecture must remain visible');
assert.ok(Array.from(route?.focusTracks||[]).some(track=>track.id==='ot-convergence'),'OT convergence must remain available as an optional focus track');
assert.ok(Array.from(route?.focusTracks||[]).some(track=>track.id==='lenels2-access-control'),'LenelS2 access-control depth must remain available behind its existing access gate');

const thinkTankSandbox={window:{CertTrackerV3:{}}};
vm.createContext(thinkTankSandbox);
vm.runInContext(fs.readFileSync('src/career-think-tank.js','utf8'),thinkTankSandbox,{filename:'src/career-think-tank.js'});
const model=thinkTankSandbox.window.CertTrackerV3.careerThinkTank;
assert.equal(model?.version,'14.0');
assert.equal(model?.MY_PATH_POLICY?.target,'Security Convergence Architect');
assert.equal(model?.MY_PATH_POLICY?.minimumConsensus,85);
assert.equal(model?.MY_PATH_POLICY?.retainCatalogue,true);
assert.equal(model?.MY_PATH_POLICY?.noProgressDeletion,true);
assert.deepEqual(Array.from(model?.MY_PATH_POLICY?.foreground||[]),['ccna','acp','mcie']);
assert.equal(Object.values(model?.WEIGHTS||{}).reduce((sum,value)=>sum+value,0),100,'career scoring weights must total 100');
assert.equal(Array.from(model?.BRIDGE_LADDER||[]).at(-1)?.label,'Security Convergence Architect');
assert.ok(Array.from(model?.SEARCH_QUERIES||[]).some(q=>/physical security technical consultant/i.test(q)));
assert.ok(Array.from(model?.SEARCH_QUERIES||[]).some(q=>/security convergence architect/i.test(q)));

const highFit=model.classify({currentCapability:80,gapCloseability:80,endgameLeverage:90,marketDemand:80,compensation:70,remoteFit:90,travelFit:90,workStyleFit:90,technicalDepth:80,evidenceOpportunity:70});
assert.equal(highFit,'HIGH_FIT');
const stretch=model.classify({currentCapability:55,gapCloseability:70,endgameLeverage:85,marketDemand:75,compensation:70,remoteFit:70,travelFit:70,workStyleFit:70,technicalDepth:80,evidenceOpportunity:70});
assert.equal(stretch,'STRETCH');
const future=model.classify({currentCapability:30,gapCloseability:50,endgameLeverage:95,marketDemand:80,compensation:80,remoteFit:80,travelFit:80,workStyleFit:80,technicalDepth:90,evidenceOpportunity:70});
assert.equal(future,'FUTURE_SIGNAL');
const constrained=model.classify({hardConstraint:true,currentCapability:95,endgameLeverage:95});
assert.equal(constrained,'SKIP_CONSTRAINT');

console.log(`Career think tank OK: ${model.BRIDGE_LADDER.length} bridge stages, ${model.SEARCH_QUERIES.length} role queries, target ${model.MY_PATH_POLICY.target}`);
