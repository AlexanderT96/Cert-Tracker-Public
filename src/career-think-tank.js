// Nexus V14 — transparent career think-tank model shared with the external five-pillar council.
(function initCareerThinkTank(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT)return;
  const BRIDGE_LADDER=Object.freeze([
    Object.freeze({stage:'NOW',label:'Physical Security Systems Support / Platform',purpose:'Deepen backend ownership, troubleshooting and enterprise platform evidence.'}),
    Object.freeze({stage:'BRIDGE_1',label:'Security Systems Analyst / Integration Engineer',purpose:'Own incidents and integrations end to end across VMS, PACS, servers and networks.'}),
    Object.freeze({stage:'BRIDGE_2',label:'Physical Security Technical Consultant / Solutions Engineer',purpose:'Move into requirements, design, assurance, integrations and customer-facing technical ownership.'}),
    Object.freeze({stage:'BRIDGE_3',label:'Converged Security / Infrastructure Solutions Architect',purpose:'Combine networking, infrastructure/cloud, identity, physical security and building-system dependencies.'}),
    Object.freeze({stage:'ENDGAME',label:'Security Convergence Architect',purpose:'Own cross-domain architecture choices spanning physical, cyber, cloud, network and adjacent OT/building systems.'})
  ]);
  const SEARCH_QUERIES=Object.freeze([
    'security systems analyst','physical security systems analyst','physical security platform engineer','enterprise security systems engineer','security systems integration engineer','physical security technical consultant','physical security solutions engineer','security systems design engineer','security technology consultant','VMS PACS engineer','security solutions engineer','physical security solutions architect','security systems technical architect','security convergence architect','physical cyber convergence architect','smart building security architect','OT security architect','security architect','solutions architect physical security networking building'
  ]);
  const WEIGHTS=Object.freeze({currentCapability:20,gapCloseability:10,endgameLeverage:20,marketDemand:10,compensation:10,remoteFit:10,travelFit:8,workStyleFit:5,technicalDepth:5,evidenceOpportunity:2});
  const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));
  function scoreOpening(dimensions={}){
    const weighted=Object.entries(WEIGHTS).reduce((sum,[key,weight])=>sum+clamp(dimensions[key])*weight,0);
    return Math.round(weighted/100);
  }
  function classify(dimensions={}){
    if(dimensions.hardConstraint===true)return 'SKIP_CONSTRAINT';
    const immediate=clamp(dimensions.currentCapability);
    const strategic=clamp(dimensions.endgameLeverage);
    const score=scoreOpening(dimensions);
    if(immediate>=70&&score>=72)return 'HIGH_FIT';
    if(immediate>=50&&score>=62)return 'STRETCH';
    if(strategic>=75)return 'FUTURE_SIGNAL';
    return 'TRACKING';
  }
  function explain(dimensions={}){
    return Object.freeze({score:scoreOpening(dimensions),classification:classify(dimensions),dimensions:Object.freeze({...dimensions}),weights:WEIGHTS});
  }
  const MY_PATH_POLICY=Object.freeze({
    target:'Security Convergence Architect',
    foreground:Object.freeze(['ccna','acp','mcie']),
    minimumConsensus:85,
    requires:Object.freeze(['current market evidence','CERT support','WORK support','no blocking VENDOR/TRAINING objection','reversible diff','change receipt','tests pass']),
    retainCatalogue:true,
    noProgressDeletion:true,
    reviewDays:30
  });
  CT.careerThinkTank=Object.freeze({version:'14.0',BRIDGE_LADDER,SEARCH_QUERIES,WEIGHTS,MY_PATH_POLICY,scoreOpening,classify,explain});
})(window);
