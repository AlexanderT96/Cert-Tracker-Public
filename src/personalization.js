// Cert Tracker — user-controlled visual and layout personalisation.
// Settings are browser-local state and participate in encrypted backup/sync.
(function initPersonalization(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.store)throw new Error('state-core.js must load before personalization.js');

  const PRESETS=Object.freeze({
    professional:Object.freeze({label:'Professional Navy',description:'Layered enterprise engineering workspace',colors:{bg:'#06101d',surface:'#0b1828',surface2:'#112238',surface3:'#182c45',border:'#28415d',border2:'#3d6284',text:'#f2f7fc',muted:'#a5b8cc',dim:'#7089a2',accent:'#4ea8ff',success:'#3bd3a1',warning:'#f0b957',danger:'#ef7480',secondary:'#6f91b8'}}),
    graphite:Object.freeze({label:'Graphite',description:'Neutral dark operations console',colors:{bg:'#0a0d11',surface:'#11161c',surface2:'#182029',surface3:'#222d38',border:'#344353',border2:'#4c6073',text:'#f4f7f9',muted:'#a8b4c0',dim:'#788693',accent:'#62a9f7',success:'#4bd0a0',warning:'#e6b75c',danger:'#ea7883',secondary:'#7f97b3'}}),
    steel:Object.freeze({label:'Steel Blue',description:'Cool technical architecture workspace',colors:{bg:'#071319',surface:'#0d1c25',surface2:'#142834',surface3:'#1c3543',border:'#2d4b5b',border2:'#426b7c',text:'#eff8fb',muted:'#a6bec9',dim:'#718f9d',accent:'#53bfd9',success:'#41d6a3',warning:'#ecba5a',danger:'#ed7883',secondary:'#63a9b8'}}),
    light:Object.freeze({label:'Executive Light',description:'High-legibility light professional theme',colors:{bg:'#edf3f8',surface:'#ffffff',surface2:'#f4f8fb',surface3:'#e7eef5',border:'#c8d5e1',border2:'#aabccc',text:'#102033',muted:'#52677a',dim:'#7a8ea0',accent:'#1769d2',success:'#087e5d',warning:'#986600',danger:'#b64050',secondary:'#4c789e'}}),
    contrast:Object.freeze({label:'High Contrast',description:'Maximum separation and accessibility',colors:{bg:'#000000',surface:'#0b0d0f',surface2:'#15191d',surface3:'#20272d',border:'#626f7a',border2:'#91a1ae',text:'#ffffff',muted:'#d5dde4',dim:'#aab7c2',accent:'#5bb7ff',success:'#51e3ab',warning:'#ffd166',danger:'#ff7185',secondary:'#8cc5e8'}})
  });

  const DEFAULTS=Object.freeze({
    preset:'professional',appTitle:'Cert Tracker',fontScale:1,density:1,radius:10,cardRadius:14,controlRadius:9,contentWidth:1240,panelOpacity:.97,shadowStrength:.4,glowStrength:.15,borderWidth:1,
    animations:true,glass:true,shadows:true,navStyle:'standard',badgeStyle:'standard',
    colors:{...PRESETS.professional.colors},
    phaseColors:{ph1:'#4ea8ff',ph2:'#47bdd4',ph3:'#3bd3a1',ph4:'#f0b957',ph5:'#e38b5a',ph6:'#8fa5b9'},
    visibility:{header:true,navigation:true,dashboard:true,certifications:true,strategy:true,learning:true,roadmap:true,market:true,career:true,plan:true,sync:true},
    tabOrder:['dashboard','learning','roadmap','certifications','strategy','customize'],
    tabLabels:{dashboard:'Dashboard',learning:'Learning Path',roadmap:'Roadmap Map',certifications:'Certifications',strategy:'Strategy',customize:'Customize'}
  });

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(base,extra){const out=clone(base);if(!extra||typeof extra!=='object')return out;for(const [k,v]of Object.entries(extra)){if(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]={...out[k],...v};else out[k]=v;}return out;}
  function settings(){return merge(DEFAULTS,state.customization||{});}
  function safeColor(value,fallback){return /^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):fallback;}
  function setVar(name,value){document.documentElement.style.setProperty(name,String(value));}
  function tabOrder(){const s=settings();const valid=['dashboard','learning','roadmap','certifications','strategy','customize'];return [...new Set((s.tabOrder||[]).filter(x=>valid.includes(x)).concat(valid))].filter(tab=>tab==='customize'||s.visibility?.[tab]!==false);}
  function tabLabel(tab){const label=String(settings().tabLabels?.[tab]||DEFAULTS.tabLabels[tab]||tab);return tab==='strategy'&&label==='Strategy'?'Career Options':label;}
  function title(){return String(settings().appTitle||DEFAULTS.appTitle).slice(0,40);}

  function migrateLegacyProfessional(){
    const current=state.customization;
    if(!current||typeof current!=='object')return false;
    if((current.preset||'professional')!=='professional')return false;
    let changed=false;
    current.colors=current.colors&&typeof current.colors==='object'?current.colors:{};
    current.phaseColors=current.phaseColors&&typeof current.phaseColors==='object'?current.phaseColors:{};
    const oldSecondary=String(current.colors.secondary||'').toLowerCase();
    if(!oldSecondary||['#9b8cff','#a89cff','#8fa7ff','#c084fc','#6757c7','#b7a6ff'].includes(oldSecondary)){current.colors.secondary=DEFAULTS.colors.secondary;changed=true;}
    const oldPh5=String(current.phaseColors.ph5||'').toLowerCase();
    if(!oldPh5||['#9b8cff','#c084fc','#ff5d7d'].includes(oldPh5)){current.phaseColors.ph5=DEFAULTS.phaseColors.ph5;changed=true;}
    if((Number(current.cardRadius)||0)<=12){current.cardRadius=DEFAULTS.cardRadius;changed=true;}
    if((Number(current.contentWidth)||0)<=1180){current.contentWidth=DEFAULTS.contentWidth;changed=true;}
    if((Number(current.shadowStrength)||0)<=.28){current.shadowStrength=DEFAULTS.shadowStrength;changed=true;}
    if((Number(current.glowStrength)||0)<=.12){current.glowStrength=DEFAULTS.glowStrength;changed=true;}
    if(changed)save.customization?.();
    return changed;
  }

  function apply(input=settings()){
    const s=merge(DEFAULTS,input);const c=s.colors||DEFAULTS.colors,p=s.phaseColors||DEFAULTS.phaseColors,root=document.documentElement;
    setVar('--bg',safeColor(c.bg,DEFAULTS.colors.bg));setVar('--surface',safeColor(c.surface,DEFAULTS.colors.surface));setVar('--surface-2',safeColor(c.surface2,DEFAULTS.colors.surface2));setVar('--surface-3',safeColor(c.surface3,DEFAULTS.colors.surface3));
    setVar('--border',safeColor(c.border,DEFAULTS.colors.border));setVar('--border-2',safeColor(c.border2,DEFAULTS.colors.border2));setVar('--text',safeColor(c.text,DEFAULTS.colors.text));setVar('--muted',safeColor(c.muted,DEFAULTS.colors.muted));setVar('--dim',safeColor(c.dim,DEFAULTS.colors.dim));
    setVar('--blue',safeColor(c.accent,DEFAULTS.colors.accent));setVar('--green',safeColor(c.success,DEFAULTS.colors.success));setVar('--amber',safeColor(c.warning,DEFAULTS.colors.warning));setVar('--red',safeColor(c.danger,DEFAULTS.colors.danger));setVar('--purple',safeColor(c.secondary,DEFAULTS.colors.secondary));
    setVar('--blue-bg',`color-mix(in srgb, ${safeColor(c.accent,DEFAULTS.colors.accent)} 22%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--blue-text',`color-mix(in srgb, ${safeColor(c.accent,DEFAULTS.colors.accent)} 58%, white)`);
    setVar('--green-bg',`color-mix(in srgb, ${safeColor(c.success,DEFAULTS.colors.success)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--green-text',`color-mix(in srgb, ${safeColor(c.success,DEFAULTS.colors.success)} 58%, white)`);
    setVar('--amber-bg',`color-mix(in srgb, ${safeColor(c.warning,DEFAULTS.colors.warning)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--amber-text',`color-mix(in srgb, ${safeColor(c.warning,DEFAULTS.colors.warning)} 60%, white)`);
    setVar('--red-bg',`color-mix(in srgb, ${safeColor(c.danger,DEFAULTS.colors.danger)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--red-text',`color-mix(in srgb, ${safeColor(c.danger,DEFAULTS.colors.danger)} 60%, white)`);
    setVar('--purple-bg',`color-mix(in srgb, ${safeColor(c.secondary,DEFAULTS.colors.secondary)} 18%, ${safeColor(c.bg,DEFAULTS.colors.bg)})`);setVar('--purple-text',`color-mix(in srgb, ${safeColor(c.secondary,DEFAULTS.colors.secondary)} 58%, white)`);
    Object.keys(p).forEach(key=>setVar(`--${key}`,safeColor(p[key],DEFAULTS.phaseColors[key])));
    setVar('--ct-font-scale',Math.max(.8,Math.min(1.35,Number(s.fontScale)||1)));setVar('--ct-density',Math.max(.72,Math.min(1.3,Number(s.density)||1)));setVar('--ct-radius',`${Math.max(0,Math.min(24,Number(s.radius)||0))}px`);setVar('--ct-card-radius',`${Math.max(0,Math.min(28,Number(s.cardRadius)||0))}px`);setVar('--ct-control-radius',`${Math.max(0,Math.min(20,Number(s.controlRadius)||0))}px`);setVar('--ct-content-width',`${Math.max(760,Math.min(1800,Number(s.contentWidth)||1240))}px`);setVar('--ct-panel-opacity',Math.max(.72,Math.min(1,Number(s.panelOpacity)||.97)));setVar('--ct-shadow-strength',Math.max(0,Math.min(.75,Number(s.shadowStrength)||0)));setVar('--ct-glow-strength',Math.max(0,Math.min(.5,Number(s.glowStrength)||0)));setVar('--ct-border-width',`${Math.max(0,Math.min(3,Number(s.borderWidth)||1))}px`);
    root.dataset.ctAnimations=s.animations===false?'off':'on';root.dataset.ctGlass=s.glass===false?'off':'on';root.dataset.ctShadows=s.shadows===false?'off':'on';root.dataset.ctNav=s.navStyle==='compact'?'compact':'standard';root.dataset.ctBadges=s.badgeStyle==='compact'?'compact':'standard';
    applyVisibility(s.visibility||{});applyNavigation();organiseDock();return s;
  }
  function applyVisibility(v){const rules={header:'.header',navigation:'.tabs',market:'#ct31-market-launcher',career:'#ct-career-launcher',plan:'#ct-intel-launcher',sync:'#ct-github-sync-launcher',learning:'#ct-learning-launcher'};for(const [key,selector]of Object.entries(rules)){document.querySelectorAll(selector).forEach(el=>{const wanted=v[key]===false?'none':'';if(el.style.display!==wanted)el.style.display=wanted;});}document.querySelectorAll('#ct-customize-launcher').forEach(el=>{if(el.style.display)el.style.display='';});}
  function ensureWorkspaceButton(tab){
    const nav=document.querySelector('.tabs');if(!nav)return null;
    let button=nav.querySelector(`[data-workspace-tab="${tab}"], [data-ct-workspace="${tab}"]`);
    if(button){button.dataset.workspaceTab=tab;button.dataset.ctWorkspace=tab;return button;}
    if(['dashboard','certifications','strategy'].includes(tab)){
      button=[...nav.querySelectorAll('.tab')].find(b=>(b.getAttribute('onclick')||'').includes(`'${tab}'`));
      if(button){button.dataset.workspaceTab=tab;button.dataset.ctWorkspace=tab;return button;}
    }
    button=document.createElement('button');button.className='tab';button.type='button';button.dataset.workspaceTab=tab;button.dataset.ctWorkspace=tab;
    button.addEventListener('click',()=>{if(CT.workspaceShell?.switchTab)CT.workspaceShell.switchTab(tab);else if(tab==='learning')CT.learningPath?.open?.();else if(tab==='customize')CT.personalizationUI?.open?.();});
    nav.appendChild(button);return button;
  }
  function applyNavigation(){
    const nav=document.querySelector('.tabs');if(!nav)return;const s=settings();
    const seen=new Set();
    [...nav.querySelectorAll('.tab')].forEach(button=>{
      const tab=button.dataset.workspaceTab||button.dataset.ctWorkspace;
      if(!tab)return;
      if(seen.has(tab)){button.remove();return;}
      seen.add(tab);button.dataset.workspaceTab=tab;button.dataset.ctWorkspace=tab;
    });
    for(const tab of ['dashboard','learning','roadmap','certifications','strategy','customize']){const b=ensureWorkspaceButton(tab);if(!b)continue;const label=tabLabel(tab);if(b.textContent!==label)b.textContent=label;const wanted=(tab==='customize'||s.visibility?.[tab]!==false)?'':'none';if(b.style.display!==wanted)b.style.display=wanted;}
    const ordered=tabOrder().map(tab=>nav.querySelector(`[data-workspace-tab="${tab}"]`)||nav.querySelector(`[data-ct-workspace="${tab}"]`)).filter(Boolean);
    ordered.forEach((button,index)=>{const current=nav.children[index];if(current!==button)nav.insertBefore(button,current||null);});
    const titleNode=document.querySelector('.header-title');const t=title();if(titleNode&&titleNode.textContent!==t)titleNode.textContent=t;
  }
  function update(patch){state.customization=merge(settings(),patch);save.customization?.();apply(state.customization);CT.events.emit('personalization-changed',settings());if(typeof renderApp==='function')renderApp();requestAnimationFrame(()=>apply());return settings();}
  function preset(key){const p=PRESETS[key];if(!p)throw new Error('Unknown preset.');return update({preset:key,colors:{...p.colors},...(key==='professional'?{phaseColors:{...DEFAULTS.phaseColors},shadowStrength:DEFAULTS.shadowStrength,glowStrength:DEFAULTS.glowStrength,cardRadius:DEFAULTS.cardRadius,contentWidth:DEFAULTS.contentWidth}:{})});}
  function reset(){const substantive=Object.fromEntries(['careerOptions','careerAdvisor','careerMentor','weeklyCoach','marketProfile','credentials'].filter(key=>state.customization?.[key]!=null).map(key=>[key,state.customization[key]]));state.customization={...clone(DEFAULTS),...substantive};save.customization?.();apply(state.customization);CT.events.emit('personalization-changed',settings());if(typeof renderApp==='function')renderApp();requestAnimationFrame(()=>apply());return settings();}
  function organiseDock(){
    let dock=document.getElementById('ct-command-dock');if(!dock){dock=document.createElement('div');dock.id='ct-command-dock';dock.className='ct-command-dock';dock.setAttribute('aria-label','Tracker tools');document.body.appendChild(dock);}
    // Keep existing tool handlers available inside Recommendations and mobile More,
    // but retire the multi-button floating dock entirely.
    ['ct-learning-launcher','ct-intel-launcher','ct-career-launcher','ct31-market-launcher','ct-github-sync-launcher','ct-customize-launcher'].forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==dock)dock.appendChild(el);});
    const today=document.getElementById('ct3-launcher');if(today&&today.parentElement!==document.body)document.body.appendChild(today);
    if(!dock.hidden)dock.hidden=true;
  }
  function init(){if(!state.customization||typeof state.customization!=='object')state.customization=clone(DEFAULTS);else migrateLegacyProfessional();apply();let queued=false;const refresh=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyVisibility(settings().visibility||{});applyNavigation();organiseDock();});};new MutationObserver(refresh).observe(document.body,{childList:true,subtree:false});global.addEventListener('certtracker:workspace-rendered',refresh);}
  CT.personalization=Object.freeze({PRESETS,DEFAULTS,settings,apply,update,preset,reset,tabOrder,tabLabel,title,applyNavigation,organiseDock,migrateLegacyProfessional});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
