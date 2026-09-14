// Cert Tracker — Account Connections UI.
(function initAccountConnectionsUI(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT?.accountConnections||!CT?.ux)return;
  const esc=CT.util.escapeHtml;

  function injectStyle(){
    if(document.getElementById('ct-account-connections-style'))return;
    const style=document.createElement('style');style.id='ct-account-connections-style';style.textContent=`
      #ct-account-connections-launcher{border:1px solid color-mix(in srgb,var(--border-2) 75%,transparent);background:color-mix(in srgb,var(--surface-2) 92%,transparent);color:var(--text);border-radius:var(--ct-control-radius,9px);padding:8px 11px;font:700 12px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer;min-height:36px}
      #ct-account-connections-launcher.connected::before{content:'●';color:var(--green);margin-right:6px}
      .ct-account-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .ct-account-card{border:1px solid var(--border);background:var(--surface-2);border-radius:var(--ct-card-radius,14px);padding:15px;min-width:0}
      .ct-account-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.ct-account-head strong{font-size:15px}.ct-account-status{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:4px 7px;border:1px solid var(--border);border-radius:999px;color:var(--muted)}
      .ct-account-status.ok{color:var(--green-text);border-color:color-mix(in srgb,var(--green) 45%,var(--border))}.ct-account-status.warn{color:var(--amber-text);border-color:color-mix(in srgb,var(--amber) 45%,var(--border))}
      .ct-account-detail{font-size:12px;line-height:1.55;color:var(--muted);overflow-wrap:anywhere}.ct-account-detail code{color:var(--text);font-size:11px}.ct-account-divider{border:0;border-top:1px solid var(--border);margin:12px 0}
      .ct-account-list{margin:8px 0 0;padding-left:18px;color:var(--muted);font-size:12px;line-height:1.5}.ct-account-upcoming{display:grid;gap:7px;margin-top:10px}.ct-account-upcoming-row{border:1px solid var(--border);border-radius:9px;padding:8px 9px;background:var(--surface-3)}
      .ct-account-upcoming-row strong{display:block;font-size:12px}.ct-account-upcoming-meta{font-size:11px;color:var(--muted);margin-top:3px}.ct-account-config{display:grid;gap:9px;margin-top:10px}.ct-account-config label{font-size:11px;color:var(--muted);font-weight:700}.ct-account-config input[type=text],.ct-account-config select{width:100%;margin-top:4px}.ct-account-config .ct-check{display:flex;gap:8px;align-items:flex-start}.ct-account-config .ct-check input{margin-top:2px}
      @media(max-width:900px){.ct-account-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function formatDate(value){if(!value)return'—';const d=new Date(value?.dateTime||value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function outlookStatus(){const s=CT.accountConnections.status().outlook;if(s.connected)return['Connected','ok'];if(s.configured)return['Ready to connect','warn'];return['Setup required',''];}
  function githubStatus(){return CT.githubSync?.isConnected?.()?['Session connected','ok']:['Available',''];}

  function renderUpcoming(snapshot){
    if(!snapshot)return'<div class="ct-account-detail">No Outlook snapshot loaded in this browser session yet.</div>';
    const upcoming=(snapshot.managed||[]).filter(row=>{const d=new Date(row?.start?.dateTime||0);return !Number.isNaN(d.getTime())&&d.getTime()>=Date.now()-86400000;}).slice(0,8);
    const counts=Object.entries(snapshot.counts||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'No managed watch events';
    return `<div class="ct-account-detail"><strong>Last sync:</strong> ${esc(new Date(snapshot.at).toLocaleString('en-GB'))}<br><strong>Managed events:</strong> ${esc(counts)}</div>${upcoming.length?`<div class="ct-account-upcoming">${upcoming.map(row=>`<div class="ct-account-upcoming-row"><strong>${esc(row.subject)}</strong><div class="ct-account-upcoming-meta">${esc(formatDate(row.start))}${row.impact!=null?` · Impact ${row.impact}`:''}${row.actionState?` · ${esc(row.actionState)}`:''}${row.nextAction?` · Next: ${esc(row.nextAction)}`:''}</div></div>`).join('')}</div>`:'<div class="ct-account-detail" style="margin-top:8px">No upcoming managed watch events in the current sync window.</div>'}`;
  }

  function bodyHtml(){
    const st=CT.accountConnections.status(),cfg=CT.accountConnections.loadConfig().outlook,[olabel,oclass]=outlookStatus(),[glabel,gclass]=githubStatus(),account=st.outlook.account;
    return `<div class="ct3-notice"><strong>Account Connections</strong><br>Connect external services without putting passwords, OAuth tokens or private mailbox/calendar data into the public repository or encrypted device-state vault. Outlook tokens stay in <strong>session storage only</strong> and are cleared when the browser session ends or you disconnect.</div>
      <div class="ct-account-grid" style="margin-top:14px">
        <section class="ct-account-card">
          <div class="ct-account-head"><div><strong>Microsoft Outlook</strong><div class="ct-account-detail">Calendar bridge for ChatGPT-managed milestones, leave and optional inbox context.</div></div><span class="ct-account-status ${oclass}">${esc(olabel)}</span></div>
          <div class="ct-account-detail">${account?`Signed in as <strong>${esc(account.displayName||account.mail||account.userPrincipalName||'Microsoft account')}</strong><br>${esc(account.mail||account.userPrincipalName||'')}`:'The tracker has its own Microsoft OAuth connection. It cannot reuse the Outlook permission granted to ChatGPT.'}</div>
          <div class="ct3-notice"><strong>Personal Outlook.com / Hotmail / Live account?</strong><br>Use the <code>consumers</code> authority and register the Entra app for <strong>Personal Microsoft accounts only</strong>. You do not need a business Microsoft 365 tenant for the Outlook calendar integration.</div>
          <div class="ct-account-config">
            <label>Microsoft Entra Application (client) ID<input id="ct-outlook-client-id" type="text" value="${esc(cfg.clientId)}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off"></label>
            <label>Microsoft account authority<input id="ct-outlook-tenant" type="text" value="${esc(cfg.tenant)}" placeholder="consumers" autocomplete="off"></label>
            <div class="ct-account-detail"><code>consumers</code> = personal Microsoft accounts only · <code>organizations</code> = work/school only · <code>common</code> = either.</div>
            <label class="ct-check"><input id="ct-outlook-mail" type="checkbox" ${cfg.includeMail?'checked':''}><span>Enable optional inbox intelligence (<code>Mail.Read</code>). Calendar integration works without this.</span></label>
          </div>
          <hr class="ct-account-divider">
          <div class="ct-account-detail"><strong>Redirect URI to register as SPA:</strong><br><code>${esc(st.outlook.redirectUri)}</code></div>
          <div class="ct-account-detail" style="margin-top:7px"><strong>Requested delegated scopes:</strong><br><code>${esc(st.outlook.scopes.join(' '))}</code></div>
          <div class="ct3-actions" style="margin-top:12px"><button class="ct3-btn" id="ct-outlook-personal">Use personal account</button><button class="ct3-btn" id="ct-outlook-save">Save setup</button><button class="ct3-btn primary" id="ct-outlook-connect">${st.outlook.connected?'Reconnect Outlook':'Connect Outlook'}</button></div>
          <div class="ct3-actions"><button class="ct3-btn" id="ct-outlook-test" ${st.outlook.connected?'':'disabled'}>Test access</button><button class="ct3-btn" id="ct-outlook-sync" ${st.outlook.connected?'':'disabled'}>Sync managed milestones</button><button class="ct3-btn danger" id="ct-outlook-disconnect" ${st.outlook.connected?'':'disabled'}>Disconnect session</button></div>
          <div id="ct-outlook-status" class="ct-account-detail" style="margin-top:8px">${st.outlook.lastSyncAt?`Last successful sync: ${esc(new Date(st.outlook.lastSyncAt).toLocaleString('en-GB'))} · ${st.outlook.lastManagedCount} managed events.`:'No Outlook sync recorded yet.'}</div>
        </section>
        <section class="ct-account-card">
          <div class="ct-account-head"><div><strong>Encrypted GitHub Sync</strong><div class="ct-account-detail">Cross-device tracker state vault.</div></div><span class="ct-account-status ${gclass}">${esc(glabel)}</span></div>
          <div class="ct-account-detail">Your existing GitHub sync remains separate from Outlook. The vault receives encrypted tracker state only; Outlook tokens and mailbox/calendar payloads are never added to it.</div>
          <div class="ct3-actions" style="margin-top:12px"><button class="ct3-btn primary" id="ct-open-github-sync">Open GitHub Sync</button></div>
        </section>
        <section class="ct-account-card">
          <div class="ct-account-head"><div><strong>Breathe HR</strong><div class="ct-account-detail">Leave bridge through Outlook Calendar.</div></div><span class="ct-account-status">Planned bridge</span></div>
          <div class="ct-account-detail">No Breathe credentials need to be stored in Cert Tracker. When Breathe Calendar Sync is enabled, its approved leave can arrive in Outlook and be consumed through the Outlook calendar connection. This avoids creating a second HR login integration.</div>
          <ul class="ct-account-list"><li>Approved/confirmed leave can drive calendar context.</li><li>Pending/declined requests should never be treated as booked leave.</li><li>Synced Outlook calendar data can supersede email inference when clearly authoritative.</li></ul>
        </section>
      </div>
      <section class="ct3-card" style="margin-top:14px"><div class="ct3-title">Outlook intelligence preview</div><div class="ct3-sub">Only ChatGPT-managed watch events are parsed into this preview. Ordinary personal calendar items are not persisted by this module.</div><div id="ct-outlook-preview" style="margin-top:10px">${renderUpcoming(CT.accountConnections.snapshot())}</div></section>
      <div class="ct3-notice" style="margin-top:14px"><strong>Recommended first deployment:</strong> enable Outlook Calendar only. Add <code>Mail.Read</code> later only if you decide the tracker itself should perform inbox analysis; ChatGPT already handles that separately.</div>`;
  }

  function saveForm(root){
    const clientId=root.querySelector('#ct-outlook-client-id')?.value||'',tenant=root.querySelector('#ct-outlook-tenant')?.value||'common',includeMail=!!root.querySelector('#ct-outlook-mail')?.checked;
    return CT.accountConnections.saveConfig({outlook:{clientId,tenant,includeMail}});
  }
  function show(){
    CT.ux.modal({title:'Account Connections',subtitle:'Outlook, encrypted device sync and HR calendar bridge',body:bodyHtml(),onMount(root){
      const status=root.querySelector('#ct-outlook-status'),preview=root.querySelector('#ct-outlook-preview');const setStatus=t=>{if(status)status.textContent=t;};
      root.querySelector('#ct-outlook-personal')?.addEventListener('click',()=>{const authority=root.querySelector('#ct-outlook-tenant');if(authority)authority.value='consumers';saveForm(root);setStatus('Personal Microsoft account mode selected. Use “Personal Microsoft accounts only” in the Entra app registration.');});
      root.querySelector('#ct-outlook-save')?.addEventListener('click',()=>{const cfg=saveForm(root).outlook;setStatus(cfg.clientId?'Outlook setup saved locally. Connect when ready.':'Setup saved, but a valid Microsoft Application (client) ID is still required.');});
      root.querySelector('#ct-outlook-connect')?.addEventListener('click',async()=>{try{saveForm(root);setStatus('Redirecting to Microsoft sign-in…');await CT.accountConnections.connectOutlook();}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-outlook-test')?.addEventListener('click',async()=>{try{setStatus('Testing Microsoft Graph access…');const r=await CT.accountConnections.testOutlook();setStatus(`Access confirmed for ${r.account?.displayName||r.account?.mail||'Microsoft account'} · ${r.calendars.length} calendar(s) visible.`);}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-outlook-sync')?.addEventListener('click',async()=>{try{setStatus('Syncing managed Outlook milestones…');const r=await CT.accountConnections.syncOutlook();if(preview)preview.innerHTML=renderUpcoming(r);setStatus(`Sync complete: ${r.managed.length} ChatGPT-managed event(s) in the calendar window.`);}catch(e){setStatus(e.message);}});
      root.querySelector('#ct-outlook-disconnect')?.addEventListener('click',()=>{CT.accountConnections.disconnectOutlook();setStatus('Outlook session disconnected. Your local client ID/authority setup was kept.');setLauncherState();});
      root.querySelector('#ct-open-github-sync')?.addEventListener('click',()=>{root.closest('.ct3-backdrop')?.querySelector('.ct3-close')?.click();CT.githubSyncUI?.show?.();});
    }});
  }

  function setLauncherState(){const b=document.getElementById('ct-account-connections-launcher');if(!b)return;const st=CT.accountConnections.status();b.classList.toggle('connected',st.outlook.connected||st.github.connected);b.textContent='Connections';}
  function placeLauncher(){
    let b=document.getElementById('ct-account-connections-launcher');
    if(!b){b=document.createElement('button');b.type='button';b.id='ct-account-connections-launcher';b.textContent='Connections';b.setAttribute('aria-label','Open account connections');b.addEventListener('click',show);}
    const header=document.querySelector('.header'),count=header?.querySelector('.header-count');
    if(header&&b.parentElement!==header)header.insertBefore(b,count||null);else if(!header&&!b.parentElement)document.body.appendChild(b);
    setLauncherState();
  }
  function init(){injectStyle();placeLauncher();global.addEventListener('certtracker:workspace-rendered',placeLauncher);CT.events?.on?.('account-connections-changed',setLauncherState);CT.events?.on?.('outlook-session',setLauncherState);global.addEventListener('certtracker:outlook-connected',()=>{setLauncherState();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  CT.accountConnectionsUI=Object.freeze({show,placeLauncher,setLauncherState});
})(window);
