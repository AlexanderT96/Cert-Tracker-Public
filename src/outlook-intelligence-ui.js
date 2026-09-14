// Cert Tracker — transient Outlook intelligence panel.
// Uses the live Outlook session/snapshot only; it does not persist raw calendar payloads.
(function initOutlookIntelligenceUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.accountConnections)return;
  const esc=CT.util.escapeHtml;
  let syncing=false,lastAutoAttempt=0;

  function injectStyle(){
    if(document.getElementById('ct-outlook-intelligence-style'))return;
    const s=document.createElement('style');s.id='ct-outlook-intelligence-style';s.textContent=`
      .ct-outlook-intel{margin:0 0 16px;padding:15px;border:1px solid color-mix(in srgb,var(--blue) 34%,var(--border));border-radius:var(--ct-card-radius,14px);background:linear-gradient(135deg,color-mix(in srgb,var(--blue) 9%,var(--surface)),var(--surface-2));overflow-wrap:anywhere}
      .ct-outlook-intel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.ct-outlook-intel-title{font-weight:800;font-size:15px}.ct-outlook-intel-sub{font-size:11px;color:var(--muted);margin-top:3px}
      .ct-outlook-horizons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.ct-outlook-horizon{border:1px solid var(--border);background:var(--surface-3);border-radius:10px;padding:10px}.ct-outlook-horizon strong{display:block;font-size:21px}.ct-outlook-horizon span{font-size:11px;color:var(--muted)}
      .ct-outlook-priority{display:grid;gap:7px;margin-top:12px}.ct-outlook-priority-row{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;border-top:1px solid var(--border);padding-top:8px}.ct-outlook-type{font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--blue-text)}.ct-outlook-priority-row strong{font-size:12px}.ct-outlook-priority-row small{display:block;color:var(--muted);margin-top:2px}.ct-outlook-impact{font-size:11px;font-weight:800;color:var(--amber-text)}
      .ct-outlook-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.ct-outlook-actions button{min-height:36px}
      @media(max-width:640px){.ct-outlook-horizons{grid-template-columns:1fr 1fr 1fr}.ct-outlook-priority-row{grid-template-columns:1fr auto}.ct-outlook-type{grid-column:1/-1}}
    `;document.head.appendChild(s);
  }
  function when(row){const raw=row?.start?.dateTime||row?.start||'';const d=new Date(raw);return Number.isNaN(d.getTime())?null:d;}
  function days(row){const d=when(row);return d?Math.ceil((d.getTime()-Date.now())/86400000):Infinity;}
  function dateLabel(row){const d=when(row);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'Date unavailable';}
  function meaningful(row){return row.actionState&&row.actionState!=='NONE'||Number(row.impact)>=40;}
  function horizon(rows,max){return rows.filter(row=>{const n=days(row);return n>=0&&n<=max;});}
  function priorityRows(rows){
    return rows.filter(row=>days(row)>=0&&days(row)<=90&&meaningful(row)).sort((a,b)=>{
      const ai=Number(a.impact||0),bi=Number(b.impact||0);if(ai!==bi)return bi-ai;return days(a)-days(b);
    }).slice(0,6);
  }
  function html(snapshot){
    const rows=snapshot?.managed||[],p=priorityRows(rows),h7=horizon(rows,7),h30=horizon(rows,30),h90=horizon(rows,90),open=rows.filter(row=>['OPEN','WAITING','NEEDS REVIEW'].includes(row.actionState)).length;
    return `<section class="ct-outlook-intel" data-outlook-intelligence aria-label="Outlook intelligence">
      <div class="ct-outlook-intel-head"><div><div class="ct-outlook-intel-title">Outlook intelligence</div><div class="ct-outlook-intel-sub">Live ChatGPT-managed milestones · ${open} open/waiting action${open===1?'':'s'} · synced ${esc(new Date(snapshot.at).toLocaleString('en-GB'))}</div></div><span class="status-badge status-ok">Connected</span></div>
      <div class="ct-outlook-horizons"><div class="ct-outlook-horizon"><strong>${h7.length}</strong><span>next 7 days</span></div><div class="ct-outlook-horizon"><strong>${h30.length}</strong><span>next 30 days</span></div><div class="ct-outlook-horizon"><strong>${h90.length}</strong><span>next 90 days</span></div></div>
      ${p.length?`<div class="ct-outlook-priority">${p.map(row=>`<div class="ct-outlook-priority-row"><span class="ct-outlook-type">${esc(row.type)}</span><div><strong>${esc(row.subject)}</strong><small>${esc(dateLabel(row))}${row.actionState?` · ${esc(row.actionState)}`:''}${row.nextAction&&row.nextAction.toLowerCase()!=='none'?` · Next: ${esc(row.nextAction)}`:''}</small></div>${row.impact!=null?`<span class="ct-outlook-impact">${row.impact}</span>`:''}</div>`).join('')}</div>`:'<div class="ct-outlook-intel-sub" style="margin-top:10px">No action-bearing/high-impact managed milestones inside the next 90 days.</div>'}
      <div class="ct-outlook-actions"><button type="button" class="ct3-btn" data-outlook-refresh>Refresh Outlook</button><button type="button" class="ct3-btn" data-outlook-connections>Connections</button></div>
    </section>`;
  }
  function bind(section){
    section?.querySelector('[data-outlook-refresh]')?.addEventListener('click',async e=>{const b=e.currentTarget;try{b.disabled=true;b.textContent='Refreshing…';await sync(true);}finally{b.disabled=false;b.textContent='Refresh Outlook';}});
    section?.querySelector('[data-outlook-connections]')?.addEventListener('click',()=>CT.accountConnectionsUI?.show?.());
  }
  function render(){
    if(state?.currentTab!=='dashboard')return;
    const content=document.getElementById('tab-content');if(!content)return;
    content.querySelector('[data-outlook-intelligence]')?.remove();
    const snapshot=CT.accountConnections.snapshot();
    if(!CT.accountConnections.isOutlookConnected()||!snapshot)return;
    const wrap=document.createElement('div');wrap.innerHTML=html(snapshot);const section=wrap.firstElementChild;content.prepend(section);bind(section);
  }
  async function sync(force=false){
    if(syncing||!CT.accountConnections.isOutlookConnected())return null;
    const now=Date.now();if(!force&&now-lastAutoAttempt<15*60*1000)return CT.accountConnections.snapshot();lastAutoAttempt=now;syncing=true;
    try{const result=await CT.accountConnections.syncOutlook();render();return result;}catch(error){console.warn('[Cert Tracker] Outlook intelligence refresh failed:',error.message);return null;}finally{syncing=false;}
  }
  function maybeAutoSync(){
    render();
    if(CT.accountConnections.isOutlookConnected()&&!CT.accountConnections.snapshot())sync(false);
  }
  function init(){
    injectStyle();
    global.addEventListener('certtracker:workspace-rendered',maybeAutoSync);
    global.addEventListener('certtracker:outlook-sync',render);
    global.addEventListener('certtracker:outlook-connected',()=>sync(true));
    global.addEventListener('certtracker:outlook-disconnected',render);
    setTimeout(maybeAutoSync,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  CT.outlookIntelligenceUI=Object.freeze({render,sync});
})(window);
