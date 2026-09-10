// Cert Tracker — dedicated filter-aware certification roadmap flow map.
(function initRoadmapMap(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.learningResources||!CT?.careerFramework||!CT?.capabilityGates||!CT?.store)return;
  const esc=CT.util.escapeHtml;
  const GATE_AFTER=CT.learningPath?.GATE_AFTER||{1:'physicalSystemsEngineer',2:'networkSecurityEngineer',3:'otSecurityEngineer',4:'convergenceEngineer',5:'solutionsArchitect',6:'principalConvergenceArchitect'};
  const PHASES=CT.learningPath?.PHASES||{};
  const timingRank={DONE:0,T0:1,T1:2,T2:3,T3:4};

  function scope(){
    if(typeof global.getScope==='function')return global.getScope();
    const certs=state.filter==='my-path'?CERTS.filter(c=>state.myPath?.[c.id]):CERTS.slice();
    return {certs,label:state.filter==='my-path'?'My Path':'All certs',scoped:state.filter!=='all'};
  }
  function filterOptions(){
    if(typeof global.getFilterDefs!=='function')return[{id:'my-path',label:'My Path'},{id:'all',label:'All'}];
    const {filters,filterGroups}=global.getFilterDefs(),rows=[];
    (filters||[]).filter(x=>x.test).forEach(x=>rows.push({id:x.id,label:x.label.replace(/\s*▾$/,'')}));
    Object.values(filterGroups||{}).forEach(group=>(group.chips||[]).filter(x=>x.test).forEach(x=>rows.push({id:x.id,label:x.label.replace(/\s*▾$/,'')})));
    return [...new Map(rows.map(x=>[x.id,x])).values()];
  }
  function sortCerts(rows){if(CT.focusedRoute?.scoped())return CT.focusedRoute.ordered(rows);return rows.slice().sort((a,b)=>{
    const ap=!!state.passes?.[a.id],bp=!!state.passes?.[b.id];if(ap!==bp)return ap?-1:1;
    const ad=(a.deps||[]).filter(id=>!state.passes?.[id]).length,bd=(b.deps||[]).filter(id=>!state.passes?.[id]).length;if(ad!==bd)return ad-bd;
    const ac=CT.careerFramework.scoreCard(a),bc=CT.careerFramework.scoreCard(b);
    if((timingRank[ac.T]??9)!==(timingRank[bc.T]??9))return (timingRank[ac.T]??9)-(timingRank[bc.T]??9);
    if(ac.K!==bc.K)return bc.K-ac.K;
    return String(a.name).localeCompare(String(b.name));
  });}
  function phaseCerts(phase,rows=scope().certs){return sortCerts(rows.filter(c=>CT.store.effectivePhase(c)===phase));}
  function gauge(depth){return `<span class="ct-map-depth" title="Required exam depth D${depth}/5">${[1,2,3,4,5].map(n=>`<i class="${n<=depth?'on':''}"></i>`).join('')}</span>`;}
  function subdomain(topic){
    const t=String(topic||'').toLowerCase();
    if(/bgp|ospf|routing|switch|vlan|stp|ip connectivity|network access|wireless|transport|packet/.test(t))return'Networking';
    if(/firewall|threat|vulnerab|incident|forensic|security operations|attack|pentest|mitigat/.test(t))return'Cyber Security';
    if(/identity|entra|authentication|access management|zero trust|credential/.test(t))return'Identity';
    if(/azure|aws|cloud|virtual network|compute|storage/.test(t))return'Cloud / Infrastructure';
    if(/active directory|dns|pki|hyper-v|database|sql|server|recovery|resilience/.test(t))return'Enterprise Infrastructure';
    if(/plc|scada|hmi|iacs|industrial|modbus|opc|mqtt|bacnet|dnp3|sis|sil|automation and control/.test(t))return'OT / Automation';
    if(/architecture|design|requirements|stakeholder|trade-off|integration|lifecycle|governance/.test(t))return'Architecture / Design';
    if(/python|programm|api|terraform|ansible|code|module|package|object-oriented/.test(t))return'Automation / Software';
    if(/video|vms|axis|xprotect|camera|analytics|briefcam|onvif|access control/.test(t))return'Physical Security';
    if(/ai|machine learning|computer vision|model|natural language|data security/.test(t))return'AI / Data';
    if(/risk|compliance|legal|program management|oversight/.test(t))return'Governance / Risk';
    return'Core Domain';
  }
  function tutorAdvice(cert,row){
    const plan=row.tutor;if(!plan||plan.recommendation==='SELF_STUDY')return null;const readiness=Number(CT.competency?.readiness?.(cert)?.score||0),done=!!state.passes?.[cert.id],level=plan.recommendation==='CHECKPOINT'&&!done&&readiness<80?'strong':plan.recommendation==='RECOMMENDED'&&!done&&readiness<65?'recommended':'watch',label=plan.recommendation==='CHECKPOINT'?'Tutor checkpoint':plan.recommendation==='RECOMMENDED'?'Tutor recommended':'Tutor if stalled';return{level,label,reason:`${plan.bottleneck} · ${String(plan.stage).replaceAll('_',' ').toLowerCase()}. ${plan.trigger} Exit when: ${plan.exit}`};
  }
  function resourceLinks(row){return (row.resources||[]).slice(0,3).map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.purpose||'Open learning resource')}">${esc(r.label)} ↗</a>`).join('');}
  function subjectBranch(cert,row){
    const tutor=tutorAdvice(cert,row);
    return `<li class="ct-map-subject ${tutor?'has-tutor':''}"><span class="ct-map-branch-dot"></span><details class="ct-map-subject-details"><summary class="ct-map-subject-main"><div><strong>${esc(row.topic)}</strong><b class="ct-map-domain">${esc(subdomain(row.topic))}</b></div><span>${gauge(row.depth)} D${row.depth} · ${esc(row.depthInfo?.label||'')} · ${esc(row.emphasis||'Supporting')} emphasis</span></summary><div class="ct-map-subject-study">${tutor?`<div class="ct-map-tutor ${tutor.level}"><b>${esc(tutor.label)}</b><span>${esc(tutor.reason)}</span></div>`:''}<div class="ct-map-resource-mini">${resourceLinks(row)}</div></div></details></li>`;
  }
  function dependencyLine(cert,scopeIds){const deps=(cert.deps||[]).map(id=>CERTS.find(c=>c.id===id)).filter(Boolean);if(!deps.length)return'';return `<div class="ct-map-deps"><span>Study dependencies / check issuer prerequisites</span>${deps.map(d=>`<b class="${state.passes?.[d.id]?'done':scopeIds.has(d.id)?'in-scope':'external'}">${state.passes?.[d.id]?'Done · ':''}${esc(d.code||d.name)}${!scopeIds.has(d.id)&&!state.passes?.[d.id]?' · outside filter':''}</b>`).join('')}</div>`;}
  function tutorSummary(cert,subjects){const rows=subjects.map(s=>({subject:s,advice:tutorAdvice(cert,s)})).filter(x=>x.advice);if(!rows.length)return'';const strong=rows.filter(x=>x.advice.level==='strong').length,rec=rows.filter(x=>x.advice.level==='recommended').length;return `<div class="ct-map-tutor-summary"><span>Tutor bottleneck scan</span><strong>${strong?`${strong} checkpoint${strong===1?'':'s'}`:rec?`${rec} likely bottleneck${rec===1?'':'s'}`:'Tutor escalation points mapped'}</strong><small>Tutor involvement is targeted at high-depth subjects where independent study commonly stalls; it is not a substitute for labs.</small></div>`;}
  function certBody(cert,scopeIds){
    const card=CT.careerFramework.scoreCard(cert),profile=CT.learningResources.profile(cert);
    return `${dependencyLine(cert,scopeIds)}
        <div class="ct-map-cert-metrics"><span>K${card.K} knowledge</span><span>M${card.M} market</span><span>C${card.C} current-role</span><span>N${card.N} next-role</span><span>E${card.E} endgame</span><span>${esc(card.T)} timing</span></div>
        ${tutorSummary(cert,profile.subjects)}
        <div class="ct-map-subject-label">Select a subject / sub-domain to expand its required depth and study materials</div>
        <ul class="ct-map-subjects">${profile.subjects.map(s=>subjectBranch(cert,s)).join('')}</ul>
        <div class="ct-map-subject-label ct-map-overall-label">Overall certification resources</div><div class="ct-map-resource-mini ct-map-overall-resources">${resourceLinks({resources:profile.stack})}</div>
        <button type="button" class="ct-map-open-cert" data-cert-open="${esc(cert.id)}">Open full certification details</button>`;
  }
  function certNode(cert){
    const card=CT.careerFramework.scoreCard(cert),done=!!state.passes?.[cert.id],blocked=(cert.deps||[]).some(id=>!state.passes?.[id]),readiness=CT.competency?.readiness?.(cert)?.score||0;
    const status=done?'Completed':blocked?'Dependency blocked':`${card.T} · K${card.K} · M${card.M}`;
    return `<details id="ct-map-cert-${esc(cert.id)}" class="ct-map-cert ${done?'done':''} ${blocked&&!done?'blocked':''}" data-map-cert="${esc(cert.id)}">
      <summary><span class="ct-map-node-dot"></span><div class="ct-map-cert-main"><strong>${esc(cert.name)}</strong><span>${esc(cert.code||'')} ${cert.code?'· ':''}${esc(status)} · ${readiness}% exam ready</span></div><span class="ct-map-class">${esc(CT.focusedRoute?.scoped()?'LOCKED MILESTONE':CT.capabilityGates.portfolioClass(cert,card))}</span></summary>
      <div class="ct-map-cert-body" data-map-cert-body></div>
    </details>`;
  }
  function evidenceRequirement(id,required){const item=CT.capabilityGates.EVIDENCE.find(x=>x.id===id),actual=CT.capabilityGates.evidenceRecord(id);return `<li class="${actual.score>=(CT.capabilityGates.LEVELS[required]?.score||0)?'met':''}"><b>${esc(item?.label||id)}</b><span>${esc(actual.level)} / ${esc(required)}</span></li>`;}
  function gate(phase){
    if(CT.focusedRoute?.scoped())return '';const key=GATE_AFTER[phase],g=key?CT.capabilityGates.roleGateStatus(key):null;if(!g)return'';
    const pillarRows=Object.entries(g.requirements.pillars||{}).map(([pillar,required])=>{const snap=CT.capabilityGates.pillarSnapshot()[pillar];return `<li class="${(snap?.score||0)>=required?'met':''}"><b>${esc(snap?.label||pillar)}</b><span>${snap?.score||0}% / ${required}%</span></li>`;}).join('');
    const evidenceRows=Object.entries(g.requirements.evidence||{}).map(([id,required])=>evidenceRequirement(id,required)).join('');
    return `<details id="ct-map-gate-${phase}" class="ct-map-gate ${g.ready?'ready':''}"><summary><span>PHASE ${phase} EXIT / ROLE GATE</span><strong>${esc(g.label)}</strong><b>${g.score}%${g.ready?' · READY':''}</b></summary><div class="ct-map-gate-body"><div><h4>Capability thresholds</h4><ul>${pillarRows}</ul></div><div><h4>Practical evidence thresholds</h4><ul>${evidenceRows}</ul></div>${g.blockers.length?`<div class="ct-map-gate-blockers"><h4>Current blockers</h4>${g.blockers.slice(0,8).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'<div class="ct-map-gate-ready">Gate requirements are currently met.</div>'}</div></details>`;
  }
  function phaseSummary(phase,certs){
    const subjects=certs.flatMap(c=>CT.learningResources.profile(c).subjects.map(s=>({cert:c,subject:s,advice:tutorAdvice(c,s)}))),tutors=subjects.filter(x=>x.advice),deep=subjects.filter(x=>x.subject.depth>=4),done=certs.filter(c=>state.passes?.[c.id]).length;
    return `<div class="ct-map-phase-summary"><span><b>${done}/${certs.length}</b> certifications complete</span><span><b>${subjects.length}</b> subject branches</span><span><b>${deep.length}</b> D4/D5 depth areas</span><span><b>${tutors.length}</b> tutor checkpoints / escalation points</span></div>`;
  }
  let mapFiltersPreference;
  function mapFiltersExpanded(){
    if(mapFiltersPreference===undefined){let saved=null;try{saved=localStorage.getItem('ct-map-filters-expanded');}catch{}mapFiltersPreference=saved==='true'?true:saved==='false'?false:!global.matchMedia('(max-width: 640px)').matches;}
    return mapFiltersPreference;
  }
  function navigation(rows){
    const filters=filterOptions(),certs=sortCerts(rows),filterHtml=filters.map(x=>`<option value="${esc(x.id)}"${x.id===state.filter?' selected':''}>${esc(x.label)}</option>`).join(''),certHtml=certs.map(c=>`<option value="${esc(c.id)}">P${CT.store.effectivePhase(c)} · ${esc(c.code||c.name)}${c.code?` · ${esc(c.name)}`:''}</option>`).join('');
    return `<details class="cert-filter-disclosure ct-map-filter-disclosure" ${mapFiltersExpanded()?'open':''}><summary><span>Path filters · ${esc(filters.find(x=>x.id===state.filter)?.label||'My Path')}</span><span class="cert-filter-expand">Expand</span><span class="cert-filter-collapse">Collapse</span></summary><div class="ct-map-toolbar"><div class="ct-map-tool"><label>Path filter</label><select data-map-filter>${filterHtml}</select></div><div class="ct-map-tool grow"><label>Jump to certification</label><select data-map-jump-cert><option value="">Choose certification…</option>${certHtml}</select></div><div class="ct-map-tool"><label>Jump to phase / gate</label><select data-map-jump-phase><option value="">Choose…</option>${[1,2,3,4,5,6].map(p=>`<option value="phase:${p}">Phase ${p}</option><option value="gate:${p}">Phase ${p} gate</option>`).join('')}</select></div><div class="ct-map-zoom-group" role="group" aria-label="Roadmap zoom controls"><button type="button" data-map-zoom-out aria-label="Zoom out">−</button><output data-map-zoom-readout aria-live="polite">100%</output><button type="button" data-map-zoom-in aria-label="Zoom in">+</button><button type="button" data-map-zoom-fit>Fit</button><button type="button" data-map-zoom-reset>Reset</button></div><button type="button" class="ct-map-home" data-map-home>Map start</button></div></details>`;
  }
  function render(){
    const s=scope(),rows=s.certs,scopeIds=new Set(rows.map(c=>c.id)),done=rows.filter(c=>state.passes?.[c.id]).length;
    const phases=[];
    for(let p=1;p<=6;p++){
      const certs=phaseCerts(p,rows),spec=(CT.focusedRoute?.scoped()?CT.focusedRoute.definition.phases:PHASES)[p]||{title:`Phase ${p}`,sub:''},pc=certs.filter(c=>state.passes?.[c.id]).length;
      phases.push(`<section id="ct-map-phase-${p}" class="ct-map-phase" data-phase="${p}"><header><div class="ct-map-phase-number">P${p}</div><div><strong>${esc(spec.title)}</strong><span>${esc(spec.sub||'')}</span></div><b>${pc}/${certs.length}</b></header>${phaseSummary(p,certs)}<div class="ct-map-spine">${certs.length?certs.map(certNode).join(''):'<div class="ct-map-empty">No certifications in this filter for Phase '+p+'.</div>'}</div></section>${gate(p)}${p<6?'<div class="ct-map-phase-arrow" aria-hidden="true"></div>':''}`);
    }
    return `<div class="ct-roadmap-map-workspace"><div class="ct3-card ct-map-hero"><div><div class="ct3-title">Certification Roadmap Map</div><div class="ct3-sub">The entire selected pathway visualised: phases → certification roadmap → prerequisites → subject/sub-domain branches → D1–D5 exam depth → tutor bottlenecks → practical evidence → role gates.</div></div><div class="ct-map-scope"><span>ACTIVE FILTER</span><strong>${esc(s.label)}</strong><b>${done}/${rows.length} complete</b></div></div><div class="ct3-notice"><strong>Interactive map:</strong> drag to pan. On phones and tablets, pinch directly on the map to zoom. The + / − controls, Fit and Reset work on every browser and provide an accessible alternative to gestures.</div>${navigation(rows)}<div class="ct-map-legend"><span><i class="node"></i> Certification</span><span><i class="branch"></i> Subject / sub-domain branch</span><span>${gauge(4)} D1–D5 exam depth</span><span>Tutor bottleneck / escalation</span><span><i class="gate"></i> Phase + role gate</span></div><div class="ct-map-viewport" tabindex="0" aria-label="Pan and zoom certification roadmap map"><div class="ct-map-stage"><div class="ct-map-canvas">${phases.join('')}</div></div></div></div>`;
  }
  function hydrateCert(node,scopeIds){
    if(!node||node.dataset.loaded==='true')return;
    const cert=CERTS.find(item=>item.id===node.dataset.mapCert),body=node.querySelector('[data-map-cert-body]');if(!cert||!body)return;
    body.innerHTML=certBody(cert,scopeIds);node.dataset.loaded='true';
    requestAnimationFrame(()=>global.dispatchEvent(new Event('resize')));
  }
  function bindCertActions(root){
    root.querySelectorAll?.('[data-cert-open]').forEach(button=>{if(button.dataset.bound)return;button.dataset.bound='true';button.addEventListener('click',()=>{const cert=CERTS.find(c=>c.id===button.dataset.certOpen);if(!cert)return;state.searchQuery=cert.name;state.currentTab='certifications';global.renderApp?.();});});
  }
  function reveal(root,selector,scopeIds){const target=root.querySelector(selector);if(!target)return;if(target.tagName==='DETAILS'){if(target.matches('[data-map-cert]'))hydrateCert(target,scopeIds);target.open=true;}target.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});target.classList.add('ct-map-flash');setTimeout(()=>target.classList.remove('ct-map-flash'),1400);}
  function bind(root=document){
    const scopeIds=new Set(scope().certs.map(cert=>cert.id));
    const disclosure=root.querySelector?.('.ct-map-filter-disclosure');
    if(disclosure&&!disclosure.dataset.bound){
      disclosure.dataset.bound='true';
      const remember=()=>{if(!disclosure.isConnected)return;mapFiltersPreference=disclosure.open;try{localStorage.setItem('ct-map-filters-expanded',String(disclosure.open));}catch{}};
      disclosure.querySelector('summary').addEventListener('click',event=>{event.preventDefault();disclosure.open=!disclosure.open;remember();});
      disclosure.addEventListener('toggle',remember);
    }
    root.querySelectorAll?.('[data-map-cert]').forEach(node=>{if(node.dataset.bound)return;node.dataset.bound='true';const summary=node.querySelector(':scope > summary');summary?.addEventListener('click',()=>{if(!node.open){hydrateCert(node,scopeIds);bindCertActions(node);}});node.addEventListener('toggle',()=>{if(node.open){hydrateCert(node,scopeIds);bindCertActions(node);}});});
    bindCertActions(root);
    root.querySelector?.('[data-map-filter]')?.addEventListener('change',e=>{const id=e.target.value;if(typeof global.setFilter==='function')global.setFilter(id);else{state.filter=id;save.filter?.();global.renderApp?.();}});
    root.querySelector?.('[data-map-jump-cert]')?.addEventListener('change',e=>{if(e.target.value)reveal(root,`#ct-map-cert-${CSS.escape(e.target.value)}`,scopeIds);});
    root.querySelector?.('[data-map-jump-phase]')?.addEventListener('change',e=>{const [kind,value]=String(e.target.value||'').split(':');if(!value)return;reveal(root,kind==='gate'?`#ct-map-gate-${value}`:`#ct-map-phase-${value}`,scopeIds);});
    root.querySelector?.('[data-map-home]')?.addEventListener('click',()=>{const view=root.querySelector('.ct-map-viewport');view?.scrollTo({top:0,left:0,behavior:'smooth'});});
    global.CertTrackerRoadmapZoom?.bind?.(root);
  }
  CT.roadmapMap=Object.freeze({render,bind,scope,phaseCerts,subdomain,tutorAdvice,filterOptions});
})(window);
