// Cert Tracker — next-generation intelligence dashboard panels.
(function initNextGenIntelligenceUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.nextGenIntelligence)return;
  const esc=CT.util.escapeHtml;
  function injectStyle(){
    if(document.getElementById('ct-nextgen-intel-style'))return;
    const s=document.createElement('style');s.id='ct-nextgen-intel-style';s.textContent=`
      .ct-ng{margin:0 0 16px;display:grid;gap:10px}.ct-ng-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:10px}.ct-ng-card{border:1px solid var(--border);background:var(--surface-3);border-radius:12px;padding:12px}.ct-ng-card h3{font-size:12px;margin:0 0 9px}.ct-ng-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ct-ng-kpi{border:1px solid var(--border);border-radius:10px;padding:9px;background:color-mix(in srgb,var(--surface-2) 88%,transparent)}.ct-ng-kpi strong{display:block;font:800 20px/1 ui-monospace,monospace}.ct-ng-kpi span{font-size:9px;color:var(--muted);letter-spacing:.04em}.ct-ng-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:7px 0;border-top:1px solid var(--border)}.ct-ng-row:first-of-type{border-top:0;padding-top:0}.ct-ng-row strong{font-size:11px}.ct-ng-row small{display:block;font-size:10px;color:var(--muted);margin-top:2px;line-height:1.35}.ct-ng-score{font:800 11px/1 ui-monospace,monospace;color:var(--amber-text)}.ct-ng-horizons{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.ct-ng-horizon{border:1px solid var(--border);border-radius:9px;padding:8px;text-align:center}.ct-ng-horizon strong{display:block;font:800 16px/1 ui-monospace,monospace}.ct-ng-horizon span{font-size:9px;color:var(--muted)}.ct-ng-note{font-size:10px;color:var(--muted);line-height:1.45}.ct-ng-badge{font-size:9px;font-weight:900;letter-spacing:.06em;color:var(--blue-text)}
      @media(max-width:900px){.ct-ng-grid{grid-template-columns:1fr}.ct-ng-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ct-ng-horizons{grid-template-columns:repeat(3,minmax(0,1fr))}}
    `;document.head.appendChild(s);
  }
  function timelineLabel(s){
    const last=s.last?.subject||'No current item';
    return `${s.count} event${s.count===1?'':'s'} · ${s.active} active · ${last}`;
  }
  function html(snap){
    const cal=snap.calibration,attention=snap.attention;
    const story=snap.storylines.slice(0,5);
    const packs=snap.evidencePacks.slice(0,4);
    const pattern=snap.patterns.slice(0,4);
    const horizonKeys=['TODAY','7D','30D','90D','12M','LONG'];
    return `<section class="ct-ng" data-nextgen-intelligence aria-label="Next-generation intelligence">
      <div class="ct-ng-card"><h3>Decision Intelligence</h3><div class="ct-ng-kpis">
        <div class="ct-ng-kpi"><strong>${attention.score}</strong><span>Attention load · ${esc(attention.state)}</span></div>
        <div class="ct-ng-kpi"><strong>${snap.storylines.length}</strong><span>Longitudinal threads</span></div>
        <div class="ct-ng-kpi"><strong>${cal.count?cal.accuracy+'%':'—'}</strong><span>Forecast calibration${cal.count?` · n=${cal.count}`:''}</span></div>
        <div class="ct-ng-kpi"><strong>${snap.causal.edges.length}</strong><span>Cross-pillar causal links</span></div>
      </div></div>
      <div class="ct-ng-card"><h3>Strategic horizons</h3><div class="ct-ng-horizons">${horizonKeys.map(k=>`<div class="ct-ng-horizon"><strong>${snap.horizons[k]?.length||0}</strong><span>${esc(k)}</span></div>`).join('')}</div></div>
      <div class="ct-ng-grid">
        <div class="ct-ng-card"><h3>Longitudinal intelligence threads</h3>${story.length?story.map(x=>`<div class="ct-ng-row"><div><span class="ct-ng-badge">${esc(x.pillar)}</span><strong>${esc(x.id)}</strong><small>${esc(timelineLabel(x))}${x.forecastOpen?` · ${x.forecastOpen} open forecast${x.forecastOpen===1?'':'s'}`:''}</small></div><span class="ct-ng-score">${x.peak}</span></div>`).join(''):'<div class="ct-ng-note">Storylines will form as managed calendar history accumulates.</div>'}</div>
        <div class="ct-ng-card"><h3>Evidence-pack candidates</h3>${packs.length?packs.map(x=>`<div class="ct-ng-row"><div><strong>${esc(x.subject)}</strong><small>${esc(x.pillar)} · ${esc(x.horizon)} · confidence ${x.confidence}% · source ${x.sourceReliability}%${x.nextAction?` · ${esc(x.nextAction)}`:''}</small></div><span class="ct-ng-score">${x.score}</span></div>`).join(''):'<div class="ct-ng-note">No high-value decisions currently need a compact evidence pack.</div>'}</div>
      </div>
      <div class="ct-ng-grid">
        <div class="ct-ng-card"><h3>Historical pattern detection</h3>${pattern.length?pattern.map(x=>`<div class="ct-ng-row"><div><strong>${esc(x.thread)}</strong><small>${esc(x.signal)} · ${x.count} milestones · avg gap ${x.averageGapDays}d · span ${x.spanDays}d</small></div><span class="ct-ng-score">${x.count}</span></div>`).join(''):'<div class="ct-ng-note">Patterns require at least three dated events in the same storyline.</div>'}</div>
        <div class="ct-ng-card"><h3>Opportunity-cost guard</h3><div class="ct-ng-note">${attention.state==='OVERLOADED'?'The active intelligence set is overloaded. Lower-relevance opportunities should be deferred before adding new commitments.':attention.state==='HEAVY'?'Attention demand is high. New opportunities should clear a meaningful value threshold before displacing existing priorities.':'Current attention demand is manageable.'}</div>${attention.deferrable.slice(0,3).map(x=>`<div class="ct-ng-row"><div><strong>${esc(x.subject)}</strong><small>${esc(x.pillar)} · attention ${x.attention} · relevance ${x.adjustedPersonalScore}</small></div><span class="ct-ng-score">WAIT</span></div>`).join('')}</div>
      </div>
    </section>`;
  }
  function render(){
    if(global.state?.currentTab!=='dashboard')return;
    const content=document.getElementById('tab-content');if(!content)return;
    content.querySelector('[data-nextgen-intelligence]')?.remove();
    if(!CT.accountConnections?.isOutlookConnected?.())return;
    const wrap=document.createElement('div');wrap.innerHTML=html(CT.nextGenIntelligence.snapshot());
    const section=wrap.firstElementChild;
    const pi=content.querySelector('[data-personal-intelligence]');
    if(pi)pi.after(section);else content.prepend(section);
  }
  function init(){injectStyle();global.addEventListener('certtracker:workspace-rendered',render);global.addEventListener('certtracker:outlook-sync',render);global.addEventListener('certtracker:goal-changed',render);global.addEventListener('certtracker:state-saved',render);setTimeout(render,0);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  CT.nextGenIntelligenceUI=Object.freeze({render});
})(window);
