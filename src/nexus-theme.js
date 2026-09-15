// Nexus — pins the Template 1 visual contract after runtime component styles.
(function initNexusTheme(global){
  'use strict';
  const LINK_ID='nexus-template-one-stylesheet';
  const CLEANUP_ID='nexus-template-one-cleanup-stylesheet';
  const CLEANUP_HREF='nexus-template-one-cleanup.css';
  let queued=false;

  function themeLink(){return document.getElementById(LINK_ID);}
  function cleanupLink(){
    let link=document.getElementById(CLEANUP_ID);
    if(link)return link;
    link=document.createElement('link');
    link.id=CLEANUP_ID;
    link.rel='stylesheet';
    link.href=CLEANUP_HREF;
    link.dataset.nexusFinalLayer='legacy-graphics-purge';
    document.head.appendChild(link);
    return link;
  }

  function pin(){
    const theme=themeLink();
    if(!theme)return false;
    const cleanup=cleanupLink();
    document.documentElement.dataset.nexusTheme='template-one';
    document.documentElement.dataset.nexusGraphics='clean';
    const styleNodes=[...document.head.children].filter(node=>node.tagName==='STYLE'||(node.tagName==='LINK'&&node.rel==='stylesheet'));
    const last=styleNodes.at(-1),penultimate=styleNodes.at(-2);
    if(penultimate!==theme||last!==cleanup){
      document.head.appendChild(theme);
      document.head.appendChild(cleanup);
    }
    return true;
  }

  function queuePin(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;pin();});
  }

  function init(){
    pin();
    new MutationObserver(queuePin).observe(document.head,{childList:true});
    global.addEventListener('certtracker:workspace-rendered',queuePin);
    global.addEventListener('certtracker:layout-changed',queuePin);
    global.addEventListener('certtracker:personalization-changed',queuePin);
  }

  // This script loads at the end of <body>; run immediately so the cleanup layer
  // is present before the first settled application frame, then keep it pinned.
  init();
  global.NexusTheme=Object.freeze({pin});
})(window);
