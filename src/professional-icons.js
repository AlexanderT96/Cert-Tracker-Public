// Cert Tracker — professional iconography adapter.
// Replaces legacy emoji/custom-medal presentation without changing the underlying tracker data.
(function initProfessionalIcons(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT)return;

  const ICONS={
    credential:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4.5h9a2 2 0 0 1 2 2v11h-13v-11a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 11.5h4.5"/><path d="m9.5 16 1.7 1.7 3.8-4.2"/></svg>',
    alert:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3.8 19h16.4L12 4Z"/><path d="M12 9v4.5M12 16.8h.01"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9h16"/></svg>',
    backup:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5V4Z"/><path d="M8 4v6h8V4M9 16h6"/></svg>',
    info:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v5M12 7.8h.01"/></svg>'
  };

  const emojiRe=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
  const legacySymbols=/[⌘★☆◆◇●○■□▲△▼▽▶▷◀◁↩⊘⠿]/g;
  const TIERS=['bronze','silver','gold','platinum','diamond'];
  const RANK_TO_TIER=Object.freeze({S:'diamond',A:'platinum',B:'gold',C:'silver',D:'bronze'});

  // One coherent HUD family for every career/filter identity. Roles share their
  // domain silhouette, then receive a stable three-node signature derived from
  // the role id so no two job chips reuse the same emblem.
  const FAMILY_PATHS=Object.freeze({
    infrastructure:'<path d="M7 6h10v4H7zM5 14h14v4H5zM9 10v4M15 10v4"/>',
    network:'<circle cx="6" cy="12" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="18" cy="17" r="2"/><path d="m8 11 8-3M8 13l8 3"/>',
    cloud:'<path d="M7 17h10a3 3 0 0 0 .4-6 5.5 5.5 0 0 0-10.6-1.3A3.7 3.7 0 0 0 7 17Z"/>',
    defence:'<path d="M12 4 19 7v5c0 4.2-2.5 6.7-7 8-4.5-1.3-7-3.8-7-8V7zM9 12h6M12 9v6"/>',
    identity:'<circle cx="9" cy="10" r="3"/><path d="M4 19c.7-3.3 2.3-5 5-5s4.3 1.7 5 5M15 8h5M18 8v5"/>',
    appsec:'<path d="m8 7-4 5 4 5M16 7l4 5-4 5M14 5l-4 14"/>',
    governance:'<path d="M7 4h10v16H7zM9.5 8h5M9.5 12h5M9.5 16h3"/>',
    physical:'<path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"/><circle cx="12" cy="12" r="2.5"/>',
    industrial:'<path d="M5 19V9l5 3V8l5 3V5h4v14zM8 16h2M13 16h2"/>',
    offensive:'<path d="m6 18 12-12M8 6l10 10M5 15l4 4M15 5l4 4"/>',
    software:'<path d="M5 7h14v10H5zM8 10h2M8 14h5M15 14h1"/>',
    data:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    customer:'<path d="M5 7h14v9H9l-4 4zM9 11h6"/>',
    leadership:'<path d="M12 4l3 4 5 1-3 4 .5 5-5.5-2-5.5 2 .5-5-3-4 5-1z"/>',
    contexts:'<path d="M12 4 19 8v4c0 4-2.3 6.5-7 8-4.7-1.5-7-4-7-8V8z"/>',
    path:'<path d="M6 18c0-7 12-5 12-12M6 18l4-1-2-3M15 6h3v3"/>'
  });
  const GROUP_FAMILY=Object.freeze({cloud:'cloud',physical:'physical',cyber:'defence','top-earners':'leadership',network:'network',infrastructure:'infrastructure'});

  function roleMeta(id,label=''){
    const role=CT.careerOptions?.byId?.(id);
    if(role)return {family:role.family,index:CT.careerOptions.ROLES.indexOf(role)+1};
    if(id==='my-path')return {family:'path',index:1};
    if(id==='passed')return {family:'defence',index:2};
    if(/^pv-(b-cni|top-finsec|top-cleared|top-contractor)$/.test(id))return {family:'contexts',index:3};
    const group=String(id).replace(/^group-(?:career-)?/,'');
    if(GROUP_FAMILY[group])return {family:GROUP_FAMILY[group],index:0};
    if(FAMILY_PATHS[group])return {family:group,index:0};
    const text=`${id} ${label}`.toLowerCase();
    const hints=[['cloud',['cloud','azure','aws']],['network',['network','firewall']],['physical',['physical','vms','access control']],['defence',['cyber','soc','security operations','incident','threat','grc','audit']],['industrial',['ot','ics','industrial','building']],['offensive',['penetration','red team','offensive']],['appsec',['appsec','devsecops','application']],['identity',['identity','iam']],['data',['data','privacy']],['customer',['account','sales','consultant']],['leadership',['manager','architect','product']],['software',['platform','embedded']],['contexts',['sector','cleared','contractor']]];
    for(const [family,words] of hints)if(words.some(word=>text.includes(word)))return {family,index:0};
    return {family:'contexts',index:0};
  }
  function filterIconHTML(id,label=''){
    const meta=roleMeta(String(id||''),label),seed=[...String(id||label)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
    const nodes=meta.index?Array.from({length:3},(_,i)=>{const x=7+((seed>>(i*4))%11),y=6+((seed>>(i*5+2))%12);return `<circle class="ct-role-sig" cx="${x}" cy="${y}" r=".7"/>`;}).join(''):'';
    return `<span class="ct-job-icon ct-job-icon-${meta.family}" data-role-icon="${String(id).replace(/[^a-z0-9-]/gi,'')}" aria-hidden="true"><svg viewBox="0 0 24 24">${FAMILY_PATHS[meta.family]||FAMILY_PATHS.contexts}${nodes}</svg></span>`;
  }

  function iconSpan(name){const span=document.createElement('span');span.className='ct-line-icon';span.innerHTML=ICONS[name]||ICONS.info;return span;}
  function tierFromMedallion(old){for(const tier of TIERS)if(old.classList.contains(`cbm-tier-${tier}`))return tier;return 'bronze';}
  function credentialMark(tier='bronze'){
    const span=document.createElement('span');
    span.className=`ct-credential-mark ct-credential-tier-${TIERS.includes(tier)?tier:'bronze'}`;
    span.dataset.tier=TIERS.includes(tier)?tier:'bronze';
    span.setAttribute('aria-label',`${span.dataset.tier} progression tier`);
    span.setAttribute('title',`${span.dataset.tier[0].toUpperCase()+span.dataset.tier.slice(1)} progression tier`);
    span.innerHTML=ICONS.credential;
    return span;
  }

  // Preserve intentional whitespace around inline elements while removing decorative glyphs.
  // The old trimStart() behaviour caused strings such as "Next up:CompTIA".
  function cleanTextNode(node){
    if(!node||node.nodeType!==Node.TEXT_NODE)return;
    const before=node.nodeValue||'';
    const leading=/^\s+/.test(before),trailing=/\s+$/.test(before);
    let core=before.replace(/Ctrl\/⌘\s*\+\s*K/gi,'Ctrl + K / Command + K').replace(/⌘\s*K/gi,'').replace(emojiRe,'').replace(legacySymbols,'');
    core=core.replace(/^\s*·\s*/,'').replace(/\s+/g,' ').trim();
    let after=core;
    if(core)after=`${leading?' ':''}${core}${trailing?' ':''}`;
    else if(/\s/.test(before))after=' ';
    if(after!==before)node.nodeValue=after;
  }

  function cleanElementText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      const p=n.parentElement;if(!p||['SCRIPT','STYLE','CODE','PRE','TEXTAREA'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(cleanTextNode);
  }

  function replaceMedallions(root=document){
    root.querySelectorAll('.cert-badge-medallion:not([data-ct-replaced])').forEach(old=>{
      old.dataset.ctReplaced='1';
      old.insertAdjacentElement('afterend',credentialMark(tierFromMedallion(old)));
    });
  }

  function matching(root,selector){
    const nodes=[];
    if(root.matches?.(selector))nodes.push(root);
    root.querySelectorAll?.(selector).forEach(node=>nodes.push(node));
    return nodes;
  }

  function tierFromCertRow(row){
    const fixed=row.dataset?.m;
    if(TIERS.includes(fixed))return fixed;
    for(const [rank,tier] of Object.entries(RANK_TO_TIER))if(row.querySelector(`.signature-tier-${rank}`))return tier;
    return 'bronze';
  }

  // Every certification keeps its ROI tier visible, including unearned rows. This
  // is presentational only: completion, expansion, drag and learning links remain
  // bound to the original controls and data model.
  function decorateCertRows(root=document){
    matching(root,'.cert-row').forEach(row=>{
      const summary=row.querySelector('.cert-summary');
      if(!summary||summary.querySelector('.ct-credential-mark'))return;
      const mark=credentialMark(tierFromCertRow(row));
      const status=summary.querySelector('.cert-status-dot,.drag-handle');
      if(status)status.insertAdjacentElement('afterend',mark);else summary.prepend(mark);
    });
  }

  function decorateMedalShelf(root=document){
    matching(root,'.trophy-row').forEach(row=>{
      const old=row.querySelector('.trophy-ico');
      if(!old||old.classList.contains('ct-credential-mark'))return;
      const label=(row.querySelector('.trophy-name')?.textContent||'bronze').trim().toLowerCase();
      const mark=credentialMark(TIERS.includes(label)?label:'bronze');
      mark.classList.add('trophy-ico');
      old.replaceWith(mark);
    });
  }

  function labelLauncher(root=document){
    const btn=root.querySelector('#ct3-launcher');
    if(btn&&btn.textContent!=="Today's Recommendations"){
      btn.textContent="Today's Recommendations";
      btn.setAttribute('aria-label',"Open Today's Recommendations");
    }
  }

  function bannerIcons(root=document){
    root.querySelectorAll('.banner').forEach(banner=>{
      const first=banner.firstElementChild;
      if(first?.classList?.contains('ct-line-icon'))return;
      if(first&&first.tagName==='SPAN')first.remove();
      let icon='info';
      if(banner.classList.contains('warn'))icon=banner.classList.contains('backup-banner')?'backup':'alert';
      else if(banner.classList.contains('critical'))icon='alert';
      else if(/data|verified|calendar|date/i.test(banner.textContent||''))icon='calendar';
      banner.insertBefore(iconSpan(icon),banner.firstChild);
    });
  }

  function stripDecorativeSymbols(root=document){
    if(root===document){
      ['.header','.tabs','.content','.ct-command-dock'].forEach(selector=>document.querySelectorAll(selector).forEach(cleanElementText));
      return;
    }
    if(root.matches?.('.header,.tabs,.content,.ct-command-dock'))cleanElementText(root);
    else root.querySelectorAll?.('.header,.tabs,.content,.ct-command-dock').forEach(cleanElementText);
  }

  function decorateFilterIdentities(root=document){
    matching(root,'.filter-chip').forEach(button=>{if(!button.querySelector('.ct-job-icon')){const onclick=button.getAttribute('onclick')||'',id=onclick.match(/setFilter\(['"]([^'"]+)/)?.[1]||onclick.match(/toggleFilterGroup\(['"]([^'"]+)/)?.[1]||(button.classList.contains('chip-overlay')?'passed':'');if(id)button.insertAdjacentHTML('afterbegin',filterIconHTML(id,button.textContent));}cleanElementText(button);});
    matching(root,'.ct-map-scope strong').forEach(host=>{if(!host.querySelector('.ct-job-icon'))host.insertAdjacentHTML('afterbegin',filterIconHTML(state.filter,host.textContent));cleanElementText(host);});
    matching(root,'.ct-map-filter-disclosure>summary>span:first-child').forEach(host=>{if(!host.querySelector('.ct-job-icon'))host.insertAdjacentHTML('afterbegin',filterIconHTML(state.filter,host.textContent));cleanElementText(host);});
    matching(root,'.role-match').forEach(card=>{const host=card.querySelector('.role-match-name');if(!host||host.querySelector('.ct-job-icon'))return;const id=(card.getAttribute('onclick')||'').match(/setFilter\(['"]([^'"]+)/)?.[1];if(id)host.insertAdjacentHTML('afterbegin',filterIconHTML(id,host.textContent));});
    matching(root,'.career-card').forEach(card=>{const host=card.querySelector('h3'),id=card.querySelector('[data-shortlist]')?.dataset.shortlist;if(host&&id&&!host.querySelector('.ct-job-icon'))host.insertAdjacentHTML('afterbegin',filterIconHTML(id,host.textContent));});
  }

  function apply(root=document){labelLauncher(root);replaceMedallions(root);decorateCertRows(root);decorateMedalShelf(root);bannerIcons(root);decorateFilterIdentities(root);stripDecorativeSymbols(root);}
  function init(){
    apply();let queued=false,pending=[];
    new MutationObserver(mutations=>{
      for(const m of mutations)for(const n of m.addedNodes)if(n.nodeType===1)pending.push(n);
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        const roots=pending.filter(node=>node.isConnected).filter((node,index,list)=>!list.some((other,i)=>i!==index&&other.contains?.(node)));
        pending=[];
        roots.forEach(apply);
      });
    }).observe(document.body,{childList:true,subtree:true});
  }

  CT.professionalIcons=Object.freeze({apply,icons:ICONS,tiers:Object.freeze([...TIERS]),rankToTier:RANK_TO_TIER,filterIconHTML});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
