// Cert Tracker — application bootstrap and non-invasive renderer integration.
(function bootstrap(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)throw new Error('Cert Tracker modules were not loaded correctly.');

  function applyVersionLabel(){const host=document.querySelector('.header-sub');if(!host)return;[...host.childNodes].forEach(node=>{if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent.replace(/v\d+(?:\.\d+){0,2}\b/g,`v${CT.version.app}`);});if(!/v\d/.test(host.textContent||''))host.insertAdjacentText('afterbegin',`v${CT.version.app} · `);}
  function patchTrackRows(){const card=[...document.querySelectorAll('.card')].find(el=>/Overall & Tracks/i.test(el.querySelector('.card-title')?.textContent||''));if(!card)return;for(const{track,colour}of[{track:'FOUNDATION',colour:'var(--blue)'},{track:'ARCHITECT',colour:'var(--purple,var(--blue))'},{track:'IDENTITY-SEC',colour:'var(--cyan,var(--blue))'}]){const certs=CERTS.filter(cert=>cert.track===track);if(!certs.length||card.querySelector(`[data-track-extension="${track}"]`))continue;const passed=certs.filter(cert=>state.passes?.[cert.id]).length,pct=Math.round(passed/certs.length*100),row=document.createElement('div');row.className='track-row';row.dataset.trackExtension=track;row.innerHTML=`<div class="track-row-meta"><span class="badge badge-cond">${CT.util.escapeHtml(track)}</span><span style="font-size:10px;color:var(--dim)">${passed}/${certs.length}</span></div>${typeof progressBarHTML==='function'?progressBarHTML(pct,colour,'5px'):''}`;card.appendChild(row);}}
  let queued=false;function postRender(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyVersionLabel();patchTrackRows();if(CT.ux&&!document.getElementById('ct3-launcher'))CT.ux.init();CT.ux?.refreshHealthBadge?.();});}

  function start(){
    const app=document.getElementById('app');
    if(app){
      try{
        if(!app.childNodes.length&&typeof renderApp==='function')renderApp();
        // The legacy renderer runs before the workspace shell. Finish that existing render once.
        else CT.workspaceShell?.decorate();
      }catch(error){console.error('[CertTracker] initial render failed',error);}
      if(!app.childNodes.length){
        app.innerHTML='<main class="ct3-card" role="alert" style="margin:16px;padding:20px"><h1>Cert Tracker could not start</h1><p>The saved workspace is still intact. Reload once; if the problem persists, clear this site\'s cached data and reopen it.</p><button class="ct3-btn" type="button" onclick="location.reload()">Reload tracker</button></main>';
      }
      const content=document.getElementById('tab-content');
      if(content)new MutationObserver(postRender).observe(content,{childList:true,subtree:false});
    }
    postRender();
    CT.notifications?.checkAndNotify?.();
    CT.events.emit('ready',{version:CT.version,diagnostics:CT.validation?.diagnostics,path:CT.phases?.pathStatus?.()});
  }
  global.addEventListener('certtracker:workspace-rendered',postRender);
  // Rendering the full dashboard during HTML parsing blocks DOM readiness and
  // delays the first usable navigation paint on slower phones. Yield once so
  // the document and browser chrome can settle before the application build.
  global.CertTracker=CT;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0),{once:true});
  else setTimeout(start,0);
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('[CertTracker] service worker registration failed',error));
})(window);
