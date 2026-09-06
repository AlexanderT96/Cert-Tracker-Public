// Cert Tracker — dashboard interface for adaptive career advice.
(function initCareerAdvisorUI(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.careerAdvisor)return;
  let feed=null,loading=false;
  const esc=value=>CT.util?.esc?CT.util.esc(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>value?new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'Not scheduled';
  const list=(rows,render)=>rows.length?`<ul>${rows.map(render).join('')}</ul>`:'<p class="ct-advisor-muted">None for the current selection.</p>';
  function roleOptions(selected){return CT.careerOptions.ROLES.slice().sort((a,b)=>a.title.localeCompare(b.title)).map(role=>`<option value="${esc(role.id)}"${role.id===selected?' selected':''}>${esc(role.title)}</option>`).join('');}
  function render(){
    if(state.currentTab!=='dashboard')return;
    const content=document.getElementById('tab-content');if(!content)return;
    const evidenceFeed=CT.careerMentor?.combinedFeed(feed)||feed,advice=CT.careerAdvisor.advise({feed:evidenceFeed}),p=CT.careerAdvisor.prefs(),existing=content.querySelector('[data-career-advisor]');
    const materials=advice.study.materials.map(item=>`<li><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title||item.label)}</a><span>${esc(item.description||item.purpose||item.type||'Study resource')}</span></li>`).join('');
    const html=`<section class="ct-advisor" data-career-advisor aria-labelledby="ct-advisor-title">
      <header class="ct-advisor-head"><div><span class="ct-advisor-eyebrow">Personal career assistant</span><h2 id="ct-advisor-title">Your next decision: ${esc(advice.primary.title)}</h2><p>${esc(advice.primary.summary)}</p></div><div class="ct-advisor-review"><span>Next review</span><strong>${esc(date(p.nextReviewAt))}</strong><button type="button" data-advisor-review>Record review</button></div></header>
      <div class="ct-advisor-controls"><label>Target role<select data-advisor-target>${roleOptions(advice.role.id)}</select></label><label>Action horizon<select data-advisor-weeks><option value="4"${p.horizonWeeks===4?' selected':''}>4 weeks</option><option value="6"${p.horizonWeeks===6?' selected':''}>6 weeks</option><option value="8"${p.horizonWeeks===8?' selected':''}>8 weeks</option></select></label><label>Review cycle<select data-advisor-cadence><option value="7"${p.reviewCadenceDays===7?' selected':''}>Weekly</option><option value="14"${p.reviewCadenceDays===14?' selected':''}>Every 2 weeks</option><option value="30"${p.reviewCadenceDays===30?' selected':''}>Monthly</option></select></label></div>
      <div class="ct-advisor-moves"><article class="ct-advisor-primary"><span>Do this first</span><h3>${esc(advice.primary.title)}</h3><p>${esc(advice.primary.reason)}</p>${advice.primary.cert?`<div class="ct-advisor-metrics"><b>${Math.round(advice.primary.hours||0)}h estimated</b><b>${esc(advice.primary.stage?.label||'Current stage')}</b><b>${advice.assessment.compatibility}% route fit</b></div>`:''}</article><article><span>Build alongside it</span><h3>${esc(advice.parallel.title)}</h3><p>${esc(advice.parallel.summary)}</p>${list(advice.parallel.actions.slice(0,3),x=>`<li>${esc(x)}</li>`)}</article><article><span>Do not pursue yet</span>${list(advice.defer,x=>`<li><strong>${esc(x.name)}</strong><small>${esc(x.reason)}</small></li>`)}</article></div>
      ${advice.change.changed||p.history?.length?`<div class="ct-advisor-change ${advice.change.changed?'changed':''}"><strong>${advice.change.changed?'Your plan changed':'Plan review'}</strong><span>${esc(advice.change.reasons.join(' '))}</span>${advice.change.previous?`<small>Previous: ${esc(advice.change.previous.primaryTitle)} · ${new Date(advice.change.previous.at).toLocaleDateString()}</small>`:''}</div>`:''}
      <div class="ct-advisor-details">
        <details open><summary>${advice.study.weeks}-week action plan</summary><div class="ct-advisor-table-wrap"><table><thead><tr><th>Week</th><th>Mode</th><th>Focus</th><th>Evidence due</th></tr></thead><tbody>${advice.study.schedule.map(row=>`<tr><td>${row.week}</td><td>${esc(row.phase)}</td><td>${esc(row.focus)} <small>${row.hours}h</small></td><td>${esc(row.deliverable)}</td></tr>`).join('')}</tbody></table></div></details>
        <details><summary>Knowledge, materials and study method</summary><div class="ct-advisor-split"><div><h3>Depth targets</h3>${list(advice.study.subjects,x=>`<li><strong>${esc(x.topic)}</strong><small>${esc(x.depthInfo?.short||`Depth ${x.depth}`)} · ${esc(x.emphasis)}</small></li>`)}</div><div><h3>Resource stack</h3><ul class="ct-advisor-links">${materials}</ul></div></div><h3>Best-practice loop</h3>${list(advice.study.practices,x=>`<li>${esc(x)}</li>`)}</details>
        <details><summary>Portfolio project and assessment rubric</summary><h3>${esc(advice.project.title)}</h3><p>${esc(advice.project.scenario)}</p><div class="ct-advisor-split"><div><h3>Build and break</h3><p>${esc(advice.project.build)}</p><p>${esc(advice.project.faults)}</p><h3>Deliverables</h3>${list(advice.project.deliverables,x=>`<li>${esc(x)}</li>`)}</div><div><h3>Acceptance criteria</h3>${list(advice.project.criteria,x=>`<li>${esc(x)}</li>`)}</div></div></details>
        <details><summary>Career-move decision gate</summary><p>${esc(advice.gate.decision)}</p><div class="ct-advisor-gate">${advice.gate.conditions.map(x=>`<div class="${x.met?'met':''}"><span aria-hidden="true">${x.met?'✓':'○'}</span><span>${esc(x.label)}</span></div>`).join('')}</div></details>
        <details><summary>Compare plausible routes</summary><div class="ct-advisor-table-wrap"><table><thead><tr><th>Route</th><th>Fit</th><th>Evidence ready</th><th>Remaining cost</th><th>Market evidence</th><th>Decision trigger</th></tr></thead><tbody>${advice.comparison.map((x,i)=>`<tr class="${i===0?'selected':''}"><td><strong>${esc(x.role.title)}</strong><small>${esc(x.advantage)}</small></td><td>${x.compatibility}%</td><td>${x.readiness==null?'Not assessed':`${x.readiness}%`}<small>${x.evidenceGaps} evidence gaps</small></td><td>${x.distance} certs remain<small>${i===0?'Current route':`${x.switchingCost} route-specific · ${x.shared} shared`}</small></td><td>${esc(x.market.label)}</td><td>${esc(x.decisionPoint)}</td></tr>`).join('')}</tbody></table></div><p class="ct-advisor-market"><strong>${esc(advice.market.label)}.</strong> ${esc(advice.market.note)} ${loading?'Refreshing published feed…':''}</p></details>
        <details><summary>Review history (${(p.history||[]).length})</summary>${list((p.history||[]).slice(0,10),x=>`<li><strong>${esc(x.primaryTitle)}</strong><small>${esc(x.roleTitle)} · ${new Date(x.at).toLocaleString()}</small></li>`)}</details>
      </div></section>`;
    if(existing)existing.outerHTML=html;else content.insertAdjacentHTML('afterbegin',html);
    const root=content.querySelector('[data-career-advisor]');
    // Other dashboard adapters also add panels during the render event. The advisor is
    // the decision surface, so keep it at the top after those synchronous decorators settle.
    content.prepend(root);requestAnimationFrame(()=>{if(root?.isConnected&&content.firstElementChild!==root)content.prepend(root);});
    bind(root);loadMarket();
  }
  function bind(root){if(!root||root.dataset.bound)return;root.dataset.bound='1';
    root.querySelector('[data-advisor-target]')?.addEventListener('change',event=>{CT.careerAdvisor.update({targetRole:event.target.value});render();});
    root.querySelector('[data-advisor-weeks]')?.addEventListener('change',event=>{CT.careerAdvisor.update({horizonWeeks:Number(event.target.value)});render();});
    root.querySelector('[data-advisor-cadence]')?.addEventListener('change',event=>{CT.careerAdvisor.update({reviewCadenceDays:Number(event.target.value)});render();});
    root.querySelector('[data-advisor-review]')?.addEventListener('click',()=>{CT.careerAdvisor.recordReview(CT.careerAdvisor.advise({feed:CT.careerMentor?.combinedFeed(feed)||feed}));render();});
  }
  async function loadMarket(){if(feed||loading||!CT.jobMarket?.load)return;loading=true;try{feed=await CT.jobMarket.load();}finally{loading=false;if(document.querySelector('[data-career-advisor]'))render();}}
  global.addEventListener('certtracker:workspace-rendered',render);
  CT.events?.on?.('career-options-changed',render);CT.events?.on?.('state-saved',detail=>{if(detail?.key!=='careerAdvisor')render();});
  CT.careerAdvisorUI=Object.freeze({render,loadMarket});
})(window);
