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
assert.equal(model?.version,'14.2');
assert.equal(model?.MY_PATH_POLICY?.target,'Security Convergence Architect');
assert.equal(model?.MY_PATH_POLICY?.minimumConsensus,85);
assert.equal(model?.MY_PATH_POLICY?.retainCatalogue,true);
assert.equal(model?.MY_PATH_POLICY?.noProgressDeletion,true);
assert.deepEqual(Array.from(model?.MY_PATH_POLICY?.foreground||[]),['ccna','acp','mcie']);
assert.equal(Object.values(model?.WEIGHTS||{}).reduce((sum,value)=>sum+value,0),100,'career scoring weights must total 100');
assert.equal(Array.from(model?.BRIDGE_LADDER||[]).at(-1)?.label,'Security Convergence Architect');
assert.ok(Array.from(model?.SEARCH_QUERIES||[]).some(q=>/physical security technical consultant/i.test(q)));
assert.ok(Array.from(model?.SEARCH_QUERIES||[]).some(q=>/security convergence architect/i.test(q)));
assert.equal(model?.CAREER_SEATS?.WORK?.chair,true);
assert.equal(model?.CAREER_SEATS?.CERT?.chair,true);
assert.equal(model?.CAREER_SEATS?.ENTERTAINMENT?.conditional,true);
assert.deepEqual(Array.from(model?.FRONTIER_DIMENSIONS||[]),['currentCapability','endgameLeverage','marketDemand','compensation','remoteFit','travelFit']);

const refreshSource=fs.readFileSync('tools/refresh-job-market.mjs','utf8');
assert.match(refreshSource,/career-think-tank\.js/,'market refresher must consume the V14 think-tank query vocabulary');
assert.match(refreshSource,/PRIORITY_QUERIES/,'market refresher must preserve a personalised priority pool');
assert.match(refreshSource,/2 priority : 1 general/,'market refresher must allocate most provider budget to convergence roles while retaining discovery');

const highFit=model.classify({currentCapability:80,gapCloseability:80,endgameLeverage:90,marketDemand:80,compensation:70,remoteFit:90,travelFit:90,workStyleFit:90,technicalDepth:80,evidenceOpportunity:70});
assert.equal(highFit,'HIGH_FIT');
const stretch=model.classify({currentCapability:55,gapCloseability:70,endgameLeverage:85,marketDemand:75,compensation:70,remoteFit:70,travelFit:70,workStyleFit:70,technicalDepth:80,evidenceOpportunity:70});
assert.equal(stretch,'STRETCH');
const future=model.classify({currentCapability:30,gapCloseability:50,endgameLeverage:95,marketDemand:80,compensation:80,remoteFit:80,travelFit:80,workStyleFit:80,technicalDepth:90,evidenceOpportunity:70});
assert.equal(future,'FUTURE_SIGNAL');
const constrained=model.classify({hardConstraint:true,currentCapability:95,endgameLeverage:95});
assert.equal(constrained,'SKIP_CONSTRAINT');

const frontier=model.opportunityFrontier([
  {id:'remote-bridge',immediateFit:72,endgameLeverage:88,marketSignal:80,compensationFit:70,remoteFit:95,travelFit:90},
  {id:'onsite-higher-pay',immediateFit:80,endgameLeverage:88,marketSignal:82,compensationFit:95,remoteFit:30,travelFit:45},
  {id:'dominated-role',immediateFit:60,endgameLeverage:75,marketSignal:70,compensationFit:60,remoteFit:70,travelFit:70}
]);
assert.deepEqual(Array.from(frontier.frontier,row=>row.id).sort(),['onsite-higher-pay','remote-bridge']);
assert.deepEqual(Array.from(frontier.dominated,row=>row.id),['dominated-role']);
assert.ok(frontier.dominated[0].dominatedBy.includes('remote-bridge'),'Inferior all-round role should be dominated by the stronger remote bridge');

const approved=model.synthesiseCouncil({positions:[
  {pillar:'WORK',stance:'SUPPORT',confidence:95,rationale:'Fits constraints and timing.'},
  {pillar:'CERT',stance:'SUPPORT',confidence:95,rationale:'Strong market and roadmap evidence.'},
  {pillar:'VENDOR',stance:'SUPPORT',confidence:90,rationale:'Technically valid convergence bridge.'},
  {pillar:'TRAINING',stance:'SUPPORT',confidence:90,rationale:'Gaps are closeable without derailing foreground study.'},
  {pillar:'ENTERTAINMENT',stance:'OPPOSE',confidence:99,material:false,rationale:'Non-material hobby preference.'}
]});
assert.equal(approved.status,'APPROVED');
assert.ok(approved.consensus>=85);
assert.ok(!approved.participants.includes('ENTERTAINMENT'),'conditional seat must abstain when not material');

const blocked=model.synthesiseCouncil({positions:[
  {pillar:'WORK',stance:'SUPPORT',confidence:95},
  {pillar:'CERT',stance:'SUPPORT',confidence:95},
  {pillar:'VENDOR',stance:'OPPOSE',confidence:90,rationale:'Role is installation-heavy and does not build architecture evidence.'},
  {pillar:'TRAINING',stance:'SUPPORT',confidence:90}
]});
assert.equal(blocked.status,'BLOCKED');
assert.ok(blocked.blockers.includes('VENDOR'));
assert.ok(blocked.dissent.some(row=>row.pillar==='VENDOR'&&row.stance==='OPPOSE'));

const missingChair=model.synthesiseCouncil({positions:[
  {pillar:'CERT',stance:'SUPPORT',confidence:95},
  {pillar:'VENDOR',stance:'SUPPORT',confidence:90},
  {pillar:'TRAINING',stance:'SUPPORT',confidence:90}
]});
assert.equal(missingChair.status,'NEEDS_EVIDENCE');
assert.ok(missingChair.missingChairs.includes('WORK'));

const eligible=model.autoApplyEligibility({council:approved,guardrails:{currentMarketEvidence:true,reversibleDiff:true,changeReceipt:true,testsPassed:true,scopeAllowed:true,preservesProgress:true,preservesCatalogue:true}});
assert.equal(eligible.eligible,true);
const unsafe=model.autoApplyEligibility({council:approved,guardrails:{currentMarketEvidence:true,reversibleDiff:true,changeReceipt:true,testsPassed:false,scopeAllowed:true,preservesProgress:true,preservesCatalogue:true}});
assert.equal(unsafe.eligible,false);
assert.ok(unsafe.failed.includes('testsPassed'));

console.log(`Career think tank OK: ${model.BRIDGE_LADDER.length} bridge stages, ${model.SEARCH_QUERIES.length} role queries, target ${model.MY_PATH_POLICY.target}, frontier ${frontier.frontier.length}, council ${approved.consensus}%`);
