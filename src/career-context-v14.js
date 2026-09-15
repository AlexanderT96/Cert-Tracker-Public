// Nexus V14 — convergence career-context defaults. Preserves explicit non-legacy choices.
(function initCareerContextV14(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.careerFramework)return;
  const storage=CT.careerFramework.STORAGE||{};
  const desired={currentRole:'physicalSupport',nextRole:'convergenceEngineer',targetRole:'convergence'};
  const legacy={currentRole:new Set(['','generalIT']),nextRole:new Set(['','network']),targetRole:new Set(['','networkPlatform'])};
  try{
    for(const [field,value] of Object.entries(desired)){
      const key=storage[field];
      if(!key)continue;
      const current=localStorage.getItem(key)||'';
      if(legacy[field].has(current))localStorage.setItem(key,value);
    }
    localStorage.setItem('ct4-career-context-strategy','security-convergence-v14');
  }catch(error){console.warn('[Nexus] V14 career defaults unavailable',error);}
  global.CERT_TRACKER_CAREER_CONTEXT_V14=Object.freeze({id:'security-convergence-v14',...desired});
})(window);
