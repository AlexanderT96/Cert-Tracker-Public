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
  const FRONTIER_DIMENSIONS=Object.freeze(['currentCapability','endgameLeverage','marketDemand','compensation','remoteFit','travelFit']);
  const DIMENSION_ALIASES=Object.freeze({currentCapability:Object.freeze(['currentCapability','immediateFit','immediate_fit']),endgameLeverage:Object.freeze(['endgameLeverage','endgame_leverage']),marketDemand:Object.freeze(['marketDemand','marketSignal','market_signal']),compensation:Object.freeze(['compensation','compensationFit','compensation_fit']),remoteFit:Object.freeze(['remoteFit','remote_fit']),travelFit:Object.freeze(['travelFit','travel_fit'])});
  const CAREER_SEATS=Object.freeze({
    WORK:Object.freeze({authority:1.25,chair:true,focus:'constraints, workload, reversibility, timing and opportunity cost'}),
    CERT:Object.freeze({authority:1.25,chair:true,focus:'market evidence, roadmap, credentials and role progression'}),
    VENDOR:Object.freeze({authority:1,chair:false,focus:'physical-security, infrastructure and technical role realism'}),
    TRAINING:Object.freeze({authority:1,chair:false,focus:'gap closeability, prerequisites, projects and time-to-capability'}),
    ENTERTAINMENT:Object.freeze({authority:.5,chair:false,conditional:true,focus:'material quality-of-life, attention or personal-technology impact only'})
  });
  const STANCE_VALUE=Object.freeze({SUPPORT:1,ALTERNATIVE:.55,UNCERTAIN:0,NEEDS_EVIDENCE:-.35,OPPOSE:-1,ABSTAIN:null});
  const VALID_STANCES=Object.freeze(Object.keys(STANCE_VALUE));
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

  function dimensionValue(row,key){
    for(const alias of DIMENSION_ALIASES[key]||[key]){
      const value=Number(row?.[alias]);
      if(Number.isFinite(value))return clamp(value);
    }
    return null;
  }

  function openingId(row,index=0){return String(row?.openingId||row?.opening_id||row?.id||row?.title||`opening-${index}`);}

  function dominates(a,b){
    if(a?.hardConstraint===true&&b?.hardConstraint!==true)return false;
    if(a?.hardConstraint!==true&&b?.hardConstraint===true)return true;
    let comparable=0,strictlyBetter=false;
    for(const key of FRONTIER_DIMENSIONS){
      const av=dimensionValue(a,key),bv=dimensionValue(b,key);
      if(av==null||bv==null)continue;
      comparable++;
      if(av<bv)return false;
      if(av>bv)strictlyBetter=true;
    }
    // Avoid declaring dominance from one or two partially populated fields.
    return comparable>=4&&strictlyBetter;
  }

  function paretoFrontier(openings=[]){
    const rows=Array.isArray(openings)?openings:[];
    return Object.freeze(rows.map((row,index)=>{
      const dominatedBy=[];
      for(let other=0;other<rows.length;other++)if(other!==index&&dominates(rows[other],row))dominatedBy.push(openingId(rows[other],other));
      const dimensions=Object.freeze(Object.fromEntries(FRONTIER_DIMENSIONS.map(key=>[key,dimensionValue(row,key)])));
      return Object.freeze({opening:row,id:openingId(row,index),frontier:dominatedBy.length===0,dominatedBy:Object.freeze(dominatedBy),dimensions,score:scoreOpening({...row,currentCapability:dimensionValue(row,'currentCapability'),endgameLeverage:dimensionValue(row,'endgameLeverage'),marketDemand:dimensionValue(row,'marketDemand'),compensation:dimensionValue(row,'compensation'),remoteFit:dimensionValue(row,'remoteFit'),travelFit:dimensionValue(row,'travelFit')}),classification:classify({...row,currentCapability:dimensionValue(row,'currentCapability'),endgameLeverage:dimensionValue(row,'endgameLeverage')})});
    }));
  }

  function opportunityFrontier(openings=[]){
    const assessed=paretoFrontier(openings);
    return Object.freeze({frontier:Object.freeze(assessed.filter(row=>row.frontier)),dominated:Object.freeze(assessed.filter(row=>!row.frontier)),assessed});
  }

  function normalisePosition(position={}){
    const pillar=String(position.pillar||'').toUpperCase();
    const seat=CAREER_SEATS[pillar];
    if(!seat)return null;
    const stance=VALID_STANCES.includes(String(position.stance||'').toUpperCase())?String(position.stance).toUpperCase():'UNCERTAIN';
    const material=position.material!==false;
    if(seat.conditional&&!material)return Object.freeze({pillar,stance:'ABSTAIN',confidence:0,material:false,rationale:String(position.rationale||''),falsifier:String(position.falsifier||''),seat});
    return Object.freeze({pillar,stance,confidence:clamp(position.confidence),material,rationale:String(position.rationale||''),falsifier:String(position.falsifier||''),seat});
  }

  function synthesiseCouncil(input={}){
    const latest=new Map();
    for(const raw of Array.isArray(input.positions)?input.positions:[]){const row=normalisePosition(raw);if(row)latest.set(row.pillar,row);}
    const positions=Object.freeze([...latest.values()]);
    const participants=positions.filter(row=>row.stance!=='ABSTAIN');
    const missingChairs=Object.keys(CAREER_SEATS).filter(pillar=>CAREER_SEATS[pillar].chair&&!participants.some(row=>row.pillar===pillar));
    const chairsSupport=['WORK','CERT'].every(pillar=>participants.some(row=>row.pillar===pillar&&['SUPPORT','ALTERNATIVE'].includes(row.stance)));
    const blockers=participants.filter(row=>{
      if(row.pillar==='WORK'||row.pillar==='CERT')return row.stance==='OPPOSE'||(row.stance==='NEEDS_EVIDENCE'&&row.confidence>=60);
      if(row.pillar==='VENDOR'||row.pillar==='TRAINING')return (row.stance==='OPPOSE'&&row.confidence>=70)||(row.stance==='NEEDS_EVIDENCE'&&row.confidence>=80);
      return row.stance==='OPPOSE'&&row.material&&row.confidence>=90;
    });
    const weighted=participants.filter(row=>STANCE_VALUE[row.stance]!=null).map(row=>({row,weight:row.seat.authority*Math.max(.25,row.confidence/100)}));
    const denominator=weighted.reduce((sum,item)=>sum+item.weight,0);
    const stanceRaw=denominator?weighted.reduce((sum,item)=>sum+STANCE_VALUE[item.row.stance]*item.weight,0)/denominator:0;
    const stanceScore=Math.round((stanceRaw+1)*50);
    const confidence=denominator?Math.round(weighted.reduce((sum,item)=>sum+item.row.confidence*item.weight,0)/denominator):0;
    const consensus=Math.round(stanceScore*.65+confidence*.35);
    let status='NEEDS_EVIDENCE';
    if(blockers.length)status='BLOCKED';
    else if(!missingChairs.length&&chairsSupport&&consensus>=85)status='APPROVED';
    else if(!missingChairs.length&&chairsSupport&&consensus>=65)status='PROPOSED';
    const dissent=Object.freeze(participants.filter(row=>row.stance!=='SUPPORT').map(row=>Object.freeze({pillar:row.pillar,stance:row.stance,confidence:row.confidence,rationale:row.rationale,falsifier:row.falsifier})));
    return Object.freeze({status,consensus,confidence,stanceScore,chairsSupport,missingChairs:Object.freeze(missingChairs),blockers:Object.freeze(blockers.map(row=>row.pillar)),participants:Object.freeze(participants.map(row=>row.pillar)),positions,dissent});
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

  function autoApplyEligibility(input={}){
    const council=input.council||synthesiseCouncil(input);
    const guards=input.guardrails||{};
    const checks=Object.freeze({
      councilApproved:council.status==='APPROVED'&&council.consensus>=MY_PATH_POLICY.minimumConsensus,
      currentMarketEvidence:guards.currentMarketEvidence===true,
      reversibleDiff:guards.reversibleDiff===true,
      changeReceipt:guards.changeReceipt===true,
      testsPassed:guards.testsPassed===true,
      scopeAllowed:guards.scopeAllowed===true,
      preservesProgress:guards.preservesProgress===true,
      preservesCatalogue:guards.preservesCatalogue===true
    });
    const failed=Object.freeze(Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name));
    return Object.freeze({eligible:failed.length===0,failed,checks,council});
  }

  CT.careerThinkTank=Object.freeze({version:'14.2',BRIDGE_LADDER,SEARCH_QUERIES,WEIGHTS,FRONTIER_DIMENSIONS,CAREER_SEATS,STANCE_VALUE,VALID_STANCES,MY_PATH_POLICY,scoreOpening,classify,explain,dimensionValue,dominates,paretoFrontier,opportunityFrontier,normalisePosition,synthesiseCouncil,autoApplyEligibility});
})(window);
