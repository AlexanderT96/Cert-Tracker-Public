// Cert Tracker — five-pillar personal intelligence dashboard.
(function initPersonalIntelligenceUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.personalIntelligence)return;
  const esc=CT.util.escapeHtml;

  function injectStyle(){
    if(document.getElementById('ct-personal-intel-style'))return;
    const s=document.createElement('style');s.id='ct-personal-intel-style';s.textContent=`
      .ct-pintel{margin:0 0 16px;padding:16px;border:1px solid color-mix(in srgb,var(--amber) 32%,var(--border));border-radius:var(--ct-card-radius,14px);background:linear-gradient(135deg,color-mix(in srgb,var(--amber) 5%,var(--surface)),color-mix(in srgb,var(--blue) 6%,var(--surface-2)));overflow:hidden}
      .ct-pintel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ct-pintel-title{font-weight:900;font-size:16px;letter-spacing:.02em}.ct-pintel-sub{font-size:11px;color:var(--muted);margin-top:3px;line-height:1.45}
      .ct-pintel-pillars{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:13px}.ct-pintel-pillar{border:1px solid var(--border);background:color-mix(in srgb,var(--surface-3) 88%,transparent);border-radius:11px;padding:10px;min-width:0}.ct-pintel-pillar strong{display:block;font:800 22px/1 ui-monospace,monospace}.ct-pintel-pillar b{display:block;font-size:11px;margin-top:5px;line-height:1.25}.ct-pintel-pillar small{display:block;color:var(--muted);font-size:10px;margin-top:4px;line-height:1.35}.ct-pintel-status{font-size:9px;font-weight:900;letter-spacing:.08em;color:var(--blue-text)}
      .ct-pintel-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:10px;margin-top:12px}.ct-pintel-card{border:1px solid var(--border);background:var(--surface-3);border-radius:11px;padding:11px}.ct-pintel-card h3{font-size:12px;margin:0 0 8px}.ct-pintel-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:start;padding:7px 0;border-top:1px solid var(--border)}.ct-pintel-row:first-of-type{border-top:0;padding-top:0}.ct-pintel-type{font-size:9px;font-weight:900;letter-spacing:.06em;color:var(--blue-text)}.ct-pintel-row strong{font-size:11px;line-height:1.35}.ct-pintel-row small{display:block;color:var(--muted);font-size:10px;margin-top:2px;line-height:1.4}.ct-pintel-score{font:800 11px/1 ui-monospace,monospace;color:var(--amber-text)}
      .ct-pintel-context{display:grid;gap:7px}.ct-pintel-context>div{display:flex;justify-content:space-between;gap:10px;font-size:11px}.ct-pintel-context span{color:var(--muted);text-align:right}.ct-pintel-knowledge{margin-top:9px;padding-top:9px;border-top:1px solid var(--border);font-size:10px;color:var(--muted)}
      @media(max-width:900px){.ct-pintel-pillars{grid-template-columns:repeat(2,minmax(0,1fr))}.ct-pintel-grid{grid-template-columns:1fr}}@media(max-width:520px){.ct-pintel-pillars{grid-template-columns:1fr}.ct-pintel-row{grid-template-columns:1fr auto}.ct-pintel-type{grid-column:1/-1}}
    `;document.head.appendChild(s);
  }
  function dateLabel(row){
    const raw=row?.start?.dateTime||row?.start||'';const d=new Date(raw);
    return Number.isNaN(d.getTime())?'Date unavailable':d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }
  function pillarHtml(p){
    const next=p.next?`${dateLabel(p.next)} · ${p.next.subject}`:'No dated signal';
    return `<div class="ct-pintel-pillar"><span class="ct-pintel-status">${esc(p.status)}</span><strong>${p.score}</strong><b>${esc(p.label)}</b><small>${p.count} managed signal${p.count===1?'':'s'} · ${p.open} open<br>${esc(next)}</small></div>`;
  }
  function priorityHtml(row){
    const action=row.actionState?` · ${esc(row.actionState)}`:'';
    const next=row.nextAction&&String(row.nextAction).toLowerCase()!=='none'?` · Next: ${esc(row.nextAction)}`:'';
    return `<div class="ct-pintel-row"><span class="ct-pintel-type">${esc(row.pillar)}</span><div><strong>${esc(row.subject)}</strong><small>${esc(dateLabel(row))}${action}${next} · ${esc(row.mode)}</small></div><span class="ct-pintel-score">${row.personalScore}</span></div>`;
  }
  function contextHtml(s){
    const c=s.context,top=c.recommendations?.[0]||null;
    const path=c.path?(c.path.complete?'Complete':`Phase ${c.path.currentPhase}`):'Unknown';
    const gate=c.gate?`${c.gate.score}% · ${c.gate.ready?'ready':'developing'}`:'Not available';
    return `<div class="ct-pintel-context"><div><strong>Current goal</strong><span>${esc(c.goalLabel||'Not set')}</span></div><div><strong>Path status</strong><span>${esc(path)}</span></div><div><strong>Role knowledge</strong><span>${c.coverage?`${Math.round(c.coverage.score)}%`:'—'}</span></div><div><strong>Next role gate</strong><span>${esc(gate)}</span></div><div><strong>Current certification signal</strong><span>${top?`${esc(top.name)} · ${top.readiness}% readiness`:'No recommendation'}</span></div><div><strong>Urgent intelligence</strong><span>${s.urgent.length}</span></div></div>`;
  }
  function html(s){
    const priorities=s.priorities.slice(0,6),knowledge=s.knowledge.slice(0,3);
    const last=s.outlookAt?new Date(s.outlookAt).toLocaleString('en-GB'):'Not synced';
    return `<section class="ct-pintel" data-personal-intelligence aria-label="Personal intelligence">
      <div class="ct-pintel-head"><div><div class="ct-pintel-title">Personal Intelligence</div><div class="ct-pintel-sub">Five specialist pillars feeding one relevance layer · local tracker context + ChatGPT-managed Outlook milestones · last Outlook sync ${esc(last)}</div></div><span class="status-badge status-ok">Calendar-first</span></div>
      <div class="ct-pintel-pillars">${Object.values(s.pillars).map(pillarHtml).join('')}</div>
      <div class="ct-pintel-grid"><div class="ct-pintel-card"><h3>Highest personal relevance</h3>${priorities.length?priorities.map(priorityHtml).join(''):'<div class="ct-pintel-sub">No managed intelligence currently meets the relevance threshold.</div>'}</div><div class="ct-pintel-card"><h3>Local career context</h3>${contextHtml(s)}${knowledge.length?`<div class="ct-pintel-knowledge"><strong>Knowledge feedback</strong><br>${knowledge.map(x=>`${esc(x.intel.knowledge)} · ${esc(x.subject)}`).join('<br>')}</div>`:''}</div></div>
    </section>`;
  }
  function render(){
    if(global.state?.currentTab!=='dashboard')return;
    const content=document.getElementById('tab-content');if(!content)return;
    content.querySelector('[data-personal-intelligence]')?.remove();
    if(!CT.accountConnections?.isOutlookConnected?.()||!CT.accountConnections?.snapshot?.())return;
    const wrap=document.createElement('div');wrap.innerHTML=html(CT.personalIntelligence.snapshot());
    const section=wrap.firstElementChild;
    const outlook=content.querySelector('[data-outlook-intelligence]');
    if(outlook)outlook.before(section);else content.prepend(section);
  }
  function init(){
    injectStyle();
    global.addEventListener('certtracker:workspace-rendered',render);
    global.addEventListener('certtracker:outlook-sync',render);
    global.addEventListener('certtracker:goal-changed',render);
    global.addEventListener('certtracker:state-saved',render);
    setTimeout(render,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  CT.personalIntelligenceUI=Object.freeze({render});
})(window);
