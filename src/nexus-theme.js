// Nexus — pins the Template 1 visual contract after runtime component styles.
(function initNexusTheme(global){
  'use strict';
  const LINK_ID='nexus-template-one-stylesheet';
  let queued=false;

  function themeLink(){return document.getElementById(LINK_ID);}

  function pin(){
    const link=themeLink();
    if(!link)return false;
    document.documentElement.dataset.nexusTheme='template-one';
    const styleNodes=[...document.head.children].filter(node=>node.tagName==='STYLE'||(node.tagName==='LINK'&&node.rel==='stylesheet'));
    if(styleNodes.at(-1)!==link)document.head.appendChild(link);
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  global.NexusTheme=Object.freeze({pin});
})(window);
