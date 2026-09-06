import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';

const engine=process.argv[2]||'chromium';
const browserType={chromium,firefox,webkit}[engine];
assert.ok(browserType,'Unknown browser engine');
const browser=await browserType.launch({headless:true});
const errors=[];
async function open(options){
  const context=await browser.newContext({ignoreHTTPSErrors:true,...options}),page=await context.newPage();
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(120000);
  page.on('pageerror',error=>{errors.push(error.message);console.error('Application error:',error.stack||error.message);});
  page.on('console',message=>{if(message.type()==='error'&&message.text().includes('[CertTracker] initial render failed'))errors.push(message.text());});
  page.on('requestfailed',request=>console.error('Request failed:',request.url(),request.failure()?.errorText));
  // The tracker is ready at DOMContentLoaded; third-party image latency must not
  // hold navigation tests (or the interface readiness signal) behind window.load.
  await page.goto('https://localhost:4173/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.CertTracker?.workspaceShell,null,{timeout:60000});
  await page.locator('[data-market-dashboard]').waitFor({timeout:60000});
  await page.locator('[data-career-advisor]').waitFor({timeout:60000});
  await page.locator('[data-career-mentor]').waitFor({timeout:60000});
  await page.locator('[data-weekly-coach]').waitFor({timeout:60000});
  return{context,page};
}
async function navigationInViewport(page){
  const nav=page.locator('#ct-mobile-navigation');
  await nav.waitFor({state:'visible'});
  assert.equal(await nav.count(),1,'Mobile navigation must not duplicate');
  const box=await nav.boundingBox(),viewport=page.viewportSize();
  assert.ok(box&&box.y>=0&&box.y+box.height<=viewport.height+1,'Mobile navigation must remain inside the visible viewport');
  assert.equal(await nav.locator('button').count(),5,'Expected Dashboard, Learn, Map, Certs and More');
  assert.ok(await nav.locator('button').evaluateAll(buttons=>buttons.every(button=>button.scrollWidth<=button.clientWidth+1)),'Mobile navigation labels must not truncate');
  assert.equal(await nav.locator('[data-mobile-tab="dashboard"]').getAttribute('aria-label'),'Dashboard');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Phone layout must not overflow the document horizontally');
  const today=page.locator('#ct-mobile-today-button');
  await today.waitFor({state:'visible'});
  const todayBox=await today.boundingBox();
  assert.ok(todayBox&&todayBox.y+todayBox.height<=box.y+1,'Today recommendations must sit visibly above the mobile navigation');
}
async function persistentHealth(page){
  const button=page.locator('#ct-data-help');
  await button.waitFor({state:'visible'});
  assert.equal(await button.count(),1);
  assert.equal((await button.textContent()).trim(),'?');
  assert.equal(await button.getAttribute('aria-label'),'Data accuracy and verification');
  const bounds=await button.boundingBox();assert.ok(bounds.width<=45&&bounds.height<=45,'Health control stays compact');
  const icon=await button.locator('span').boundingBox();assert.equal(icon.width,22);assert.equal(icon.height,22);
  assert.ok(bounds.width>=44&&bounds.height>=44,'Small visual retains an accessible tap target');
  const title=await page.locator('.header-title').boundingBox();
  assert.ok(bounds.x>title.x+title.width&&Math.abs(bounds.y+bounds.height/2-(title.y+title.height/2))<=12,'Help aligns with the mobile title row');
  assert.equal(await button.evaluate(el=>getComputedStyle(el).position),'static');
  assert.equal(await button.evaluate(el=>el.parentElement===document.querySelector('.header>div:first-child')),true,'Help stays in the header title row across rerenders');
  assert.equal(await button.evaluate(el=>el.closest('.header-sub')===null),true);
  const same=await page.evaluate(async()=>{
    const before=document.querySelector('.ct3-health');
    updateHeaderCount();updateHeaderCount();
    await new Promise(resolve=>setTimeout(resolve,300));
    return before===document.querySelector('.ct3-health')&&before.isConnected;
  });
  assert.equal(same,true,'Header updates must not remove or replace the data-health control');
  await button.waitFor({state:'visible'});
}
async function healthSpacing(page){
  const issues=await page.locator('.ct3-panel').evaluate(panel=>{
    const problems=[],audit=panel.querySelector('[data-full-audit]'),link=audit.querySelector('a.ct3-btn');
    const before=link.previousElementSibling.getBoundingClientRect(),button=link.getBoundingClientRect(),after=link.nextElementSibling.getBoundingClientRect();
    if(button.top-before.bottom<10||after.top-button.bottom<10)problems.push('Audit action overlaps or crowds neighbouring text');
    if(panel.scrollWidth>panel.clientWidth+1)problems.push('Dialog overflows horizontally');
    for(const el of panel.querySelectorAll('.ct3-btn'))if(el.getClientRects().length&&getComputedStyle(el).display==='inline')problems.push('Padded inline button');
    const tabs=panel.querySelector('[role=tablist]').getBoundingClientRect(),heading=audit.querySelector('h3').getBoundingClientRect();
    if(heading.top<tabs.bottom+8)problems.push('Tabs crowd section heading');
    return problems;
  });
  assert.deepEqual(issues,[],'Dialog spacing and overlap regression');
  await dialogControls(page);
}
async function dialogControls(page){
  const overlaps=await page.locator('.ct3-panel').evaluate(panel=>{
    const issues=[];
    for(const group of panel.querySelectorAll('.ct3-actions,.ct3-row,.ct3-head')){
      const children=[...group.children].filter(el=>el.getClientRects().length).map(el=>({text:el.textContent.slice(0,55),box:el.getBoundingClientRect()}));
      for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){const a=children[i].box,b=children[j].box;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push(children[i].text+' / '+children[j].text);}
    }
    return issues;
  });
  assert.deepEqual(overlaps,[],'Dialog actions, headings and rows must not overlap');
}
async function alignmentAudit(page,expectedMode){
  await page.waitForFunction(mode=>document.documentElement.dataset.layout===mode,expectedMode);
  const issues=await page.evaluate(mode=>{
    const issues=[],overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    for(const banner of document.querySelectorAll('.banner')){
      if(!banner.getClientRects().length)continue;
      const children=[...banner.children].filter(el=>el.getClientRects().length);
      for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++)if(overlap(children[i].getBoundingClientRect(),children[j].getBoundingClientRect()))issues.push('Banner children overlap');
    }
    for(const hero of document.querySelectorAll('.ct-map-hero,.learning-path-hero')){
      if(!hero.getClientRects().length)continue;
      const first=hero.firstElementChild?.getBoundingClientRect(),box=hero.getBoundingClientRect(),pseudo=getComputedStyle(hero,'::before'),size=parseFloat(pseudo.width)||0;
      if(!first)continue;
      if(mode==='mobile'&&first.top<box.top+size-1)issues.push('Phone hero copy overlaps emblem row');
      if(mode!=='mobile'&&first.left<box.left+size-1)issues.push(`${mode} hero copy overlaps emblem column`);
    }
    for(const img of document.querySelectorAll('img')){
      if(!img.getClientRects().length)continue;
      const b=img.getBoundingClientRect();
      if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||b.width<1||b.height<1)issues.push('Visible image has invalid geometry');
    }
    if(document.documentElement.scrollWidth>innerWidth+2)issues.push('Page has unintended horizontal overflow');
    return issues;
  },expectedMode);
  assert.deepEqual(issues,[],`${expectedMode} image/emblem alignment audit`);
}
try{
  console.log(`${engine}: desktop first load`);
  // Deterministic routed refresh fixtures; the phone context below still exercises the service worker.
  const desktop=await open({viewport:{width:1280,height:900},serviceWorkers:'block'});
  await persistentHealth(desktop.page);
  await desktop.page.evaluate(()=>renderApp());
  await desktop.page.locator('[data-workspace-tab="strategy"]').waitFor();
  await persistentHealth(desktop.page);
  const advisor=desktop.page.locator('[data-career-advisor]');
  assert.equal(await desktop.page.locator('#tab-content > :first-child').getAttribute('data-career-advisor'),'','Career advisor must remain the first dashboard decision surface');
  assert.equal(await advisor.locator('.ct-advisor-moves article').count(),3,'Advisor must show primary, parallel and deferred moves');
  assert.equal(await advisor.locator('[data-advisor-target] option').count(),70,'Advisor target picker must expose every career route');
  assert.equal(await advisor.locator('details').count(),6,'Advisor must expose study, project, decision, comparison and review detail');
  assert.equal(await advisor.locator('details').first().locator('tbody tr').count(),6,'Default advisor horizon must produce six weekly deliverables');
  const mentor=desktop.page.locator('[data-career-mentor]');
  assert.equal(await mentor.locator('.ct-mentor-scoreboard > div').count(),4,'Mentor must expose mastery, project, vacancy and application evidence');
  assert.equal(await mentor.locator('[data-knowledge-form] input[type="radio"]').count(),4,'Knowledge check must provide four automatically marked choices');
  assert.equal(await mentor.locator('[data-mentor-assessment] [data-assessment-criterion]').count(),5,'Adaptive assessment must use the complete applied-answer rubric');
  assert.equal(await mentor.locator('[data-mentor-project] input[type="checkbox"]').count(),7,'Project review must expose every role-specific acceptance criterion');
  assert.ok(await mentor.locator('[data-project-export]').count(),'Project evidence must be exportable');
  assert.ok(await mentor.locator('[data-vacancy-form]').count(),'Manual vacancy evidence must remain available without a provider account');
  assert.ok(await mentor.locator('[data-vacancy-import]').count(),'Vacancy CSV import must remain available without a provider account');
  const coach=desktop.page.locator('[data-weekly-coach]');
  assert.equal(await coach.locator('[data-weekly-start]').count(),1,'Weekly coach must begin with one explicit commitment action');
  await coach.locator('[data-weekly-start]').click();
  await desktop.page.locator('[data-weekly-review]').waitFor();
  assert.equal(await desktop.page.locator('[data-weekly-coach]').count(),1,'Weekly coach must not duplicate after state changes');
  assert.ok((await desktop.page.locator('[data-weekly-coach]').textContent()).includes('Definition of done'),'Weekly commitment must expose a proof condition');
  const marketProfile=desktop.page.locator('[data-market-profile]');
  await marketProfile.waitFor();
  await marketProfile.locator('[data-market-role-title]').fill('Fictional Infrastructure Analyst');
  await marketProfile.locator('[data-market-salary]').fill('38123');
  await desktop.page.evaluate(()=>renderApp());
  await marketProfile.waitFor();
  assert.deepEqual(await marketProfile.locator('input').evaluateAll(inputs=>inputs.map(input=>input.value)),['Fictional Infrastructure Analyst','38123'],'Unsaved market baseline must survive a dashboard rerender');
  await marketProfile.locator('[data-market-role-title]').fill('Network Engineer');
  await marketProfile.locator('[data-market-salary]').fill('41789');
  await marketProfile.locator('[data-market-profile-save]').click();
  await desktop.page.waitForFunction(()=>state.currentSalary===41789&&document.querySelector('[data-market-profile-match]'));
  assert.ok((await desktop.page.locator('[data-market-profile]').textContent()).includes('Network Engineer'),'Market baseline should evaluate a role-title fixture');
  assert.equal(await desktop.page.evaluate(()=>CertTrackerV3.storage.serializableState().customization.marketProfile?.roleTitle),'Network Engineer','Market role title must survive backup and sync serialization');
  assert.equal(await desktop.page.locator('.tabs [data-workspace-tab]').count(),6);
  assert.equal(await desktop.page.locator('#ct-mobile-navigation').isVisible(),false);
  assert.equal(await desktop.page.locator('#ct-command-dock').isVisible(),false,'Retired tool dock must not be visible');
  const launcher=desktop.page.getByRole('button',{name:"Open Today's Recommendations",exact:true});
  assert.equal(await launcher.count(),1);await launcher.waitFor({state:'visible'});
  await launcher.click();
  const today=desktop.page.locator('[data-today-recommendations]');
  await today.waitFor();
  await dialogControls(desktop.page);
  await desktop.page.waitForFunction(()=>document.querySelector('[data-today-market-status]')?.textContent.includes('Checked'));
  assert.ok((await today.textContent()).includes('Recommendations recalculated'));
  await today.locator('[data-act="refresh-today"]').click();
  await desktop.page.waitForFunction(()=>document.querySelector('[data-today-market-status]')?.textContent.includes('Checked'));
  await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-recommendations.png`,animations:'disabled',timeout:30000});
  await today.locator('.ct3-close').click();
  assert.equal(await launcher.evaluate(el=>document.activeElement===el),true,'Closing recommendations restores launcher focus');
  await desktop.page.route('**/data/tracker-audit.json?*',route=>route.fulfill({json:{schemaVersion:1,completedAt:new Date().toISOString(),status:'partial',summary:{certifications:185,roles:70,sources:2839,checked:100,changed:2,newBaselines:98,broken:1,unavailable:1,blocked:1,discoveryLinks:2686,manualReview:0,identityMatches:10,fieldsRequiringReview:1100},sources:[{url:'https://example.com/cert',refs:['cert:test'],status:'checked',changed:true}],facts:[{name:'Example credential',fields:{identity:{status:'source-match'},price:{status:'needs-review'}}}]}}));
  await desktop.page.locator('.ct3-health').click();
  const dataHealth=desktop.page.locator('[data-cert-data-health]');
  await dataHealth.waitFor();
  const healthText=await dataHealth.textContent();
  assert.ok(healthText.includes('100%')&&healthText.includes('187/187 linked'));
  assert.ok(healthText.includes('117 cert-level')&&healthText.includes('70 vendor-level'));
  assert.ok(healthText.includes('Credential retired')&&healthText.includes('Credential in development'));
  assert.ok(healthText.includes('Not currently verified')&&healthText.includes('1100'));
  assert.equal(await dataHealth.locator('.ct3-health-table tbody tr').count(),6);
  assert.ok(healthText.includes('Unchecked does not mean incorrect'));
  await desktop.page.waitForFunction(()=>document.querySelector('[data-full-audit-results]')?.textContent.includes('Pages retrieved'));
  for(const width of [320,390,768,1280]){await desktop.page.setViewportSize({width,height:900});await healthSpacing(desktop.page);}
  assert.ok((await dataHealth.locator('[data-full-audit-results]').textContent()).includes('Changed pages'));
  const connectionsTab=desktop.page.getByRole('tab',{name:'Account Connections',exact:true});
  await connectionsTab.click();
  const connections=desktop.page.locator('#ct3-connections-panel');
  assert.equal(await connections.isVisible(),true);
  await dialogControls(desktop.page);
  assert.equal(await dataHealth.isVisible(),false);
  assert.equal(await connections.locator('input').count(),0,'No credential fields in public tracker');
  assert.ok((await connections.textContent()).includes('not an OAuth connection'));
  assert.equal(await connections.getByRole('link',{name:'Secure setup on GitHub ↗'}).getAttribute('href'),'https://github.com/AlexanderT96/Cert-Tracker-Public/settings/secrets/actions');
  await connectionsTab.press('ArrowLeft');
  assert.equal(await dataHealth.isVisible(),true);
  assert.equal(await connections.isVisible(),false);
  const beforeChecks=await desktop.page.evaluate(async()=>({hash:await CertTrackerV3.sync.digest(CertTrackerV3.storage.serializableState()),facts:JSON.stringify(CERTS.map(c=>c.factChecks))}));
  let refreshRequests=0;
  await desktop.page.route('**/data/job-market.json?*',route=>{refreshRequests++;return route.fulfill({json:{status:'live',fetchedAt:new Date().toISOString(),jobs:[],providerStatus:['Test fixture']}});});
  await dataHealth.locator('#ct3-health-refresh').click();
  await desktop.page.waitForFunction(()=>document.querySelector('#ct3-health-refresh-status')?.textContent.includes('Checks run')&&!document.querySelector('#ct3-health-refresh').disabled);
  const refreshed=await dataHealth.locator('#ct3-health-refresh-status').textContent();
  assert.ok(refreshed.includes('Recent published market data')&&refreshed.includes('matches published metadata'));
  assert.ok(refreshed.includes('Catalogue structure:')&&refreshed.includes('Saved-data structure: valid')&&refreshed.includes('70 role assessments'));
  assert.equal(refreshRequests,1,'Manual check refreshes the feed once');
  await connectionsTab.click();
  await connections.locator('#ct3-connections-check').click();
  await desktop.page.waitForFunction(()=>document.querySelector('[data-connection-market-status]')?.textContent.includes('Recent successful provider snapshot'));
  assert.ok((await connections.locator('[data-connection-market-status]').textContent()).includes('not your account sign-in status'));
  await desktop.page.getByRole('tab',{name:'Accuracy & checks',exact:true}).click();
  assert.deepEqual(await desktop.page.evaluate(async()=>({hash:await CertTrackerV3.sync.digest(CertTrackerV3.storage.serializableState()),facts:JSON.stringify(CERTS.map(c=>c.factChecks))})),beforeChecks,'Checks must not mutate private state or verification records');
  await desktop.page.unroute('**/data/job-market.json?*');
  await desktop.page.route('**/data/job-market.json?*',route=>route.abort());
  await dataHealth.locator('#ct3-health-refresh').click();
  await desktop.page.waitForFunction(()=>document.querySelector('#ct3-health-refresh-status')?.textContent.includes('Unavailable / cached data')&&!document.querySelector('#ct3-health-refresh').disabled);
  await desktop.page.unroute('**/data/job-market.json?*');
  await desktop.page.getByRole('dialog',{name:'Certification data health'}).getByRole('button',{name:'Close',exact:true}).click();
  await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-desktop.png`,animations:'disabled',timeout:30000});
  await desktop.page.locator('[data-workspace-tab="strategy"]').click();
  await desktop.page.locator('.career-explorer').waitFor();
  assert.equal(await desktop.page.locator('.ct-dual-brief').count(),0);
  const roleIconAudit=await desktop.page.evaluate(()=>{const icons=[...document.querySelectorAll('.career-card h3 .ct-job-icon')];return {cards:document.querySelectorAll('.career-card').length,icons:icons.length,unique:new Set(icons.map(x=>x.dataset.roleIcon)).size};});
  assert.deepEqual(roleIconAudit,{cards:70,icons:70,unique:70},'Every career option must have a distinct theme emblem');
  const pathwayAudit=await desktop.page.evaluate(()=>{const pathways=[...document.querySelectorAll('[data-career-pathway]')];return {cards:document.querySelectorAll('.career-card').length,pathways:pathways.length,hydrated:pathways.filter(pathway=>pathway.dataset.loaded==='true').length,stages:document.querySelectorAll('[data-pathway-stage]').length,nodes:document.querySelector('.career-explorer').querySelectorAll('*').length};});
  assert.equal(pathwayAudit.cards,70);
  assert.equal(pathwayAudit.pathways,70);
  assert.equal(pathwayAudit.hydrated,0,'Collapsed career routes must remain lazy');
  assert.equal(pathwayAudit.stages,0,'Collapsed career routes must not build hidden stage trees');
  assert.ok(pathwayAudit.nodes<3500,`Career explorer exceeded its initial DOM budget: ${pathwayAudit.nodes}`);
  const filterRouteAudit=await desktop.page.evaluate(()=>{const defs=getFilterDefs(),chips=Object.values(defs.filterGroups||{}).flatMap(group=>group.chips||[]),roles=window.CertTrackerV3.careerOptions.ROLES;return {roles:roles.length,complete:roles.every(role=>{const chip=chips.find(item=>item.id===role.id);return !!chip&&CERTS.filter(chip.test).length===window.CertTrackerV3.careerOptions.pathway(role).totalCerts;})};});
  assert.deepEqual(filterRouteAudit,{roles:70,complete:true},'Every career filter chip must expose its complete route');
  await desktop.page.setViewportSize({width:390,height:844});
  const mobilePathway=desktop.page.locator('.career-pathway-details').first();
  await mobilePathway.locator(':scope > summary').click();
  await mobilePathway.locator('.career-pathway-ladder').waitFor();
  const pathwayLayout=await mobilePathway.evaluate(details=>{const ladder=details.querySelector('.career-pathway-ladder');const stages=[...details.querySelectorAll('.career-pathway-step')];return {columns:getComputedStyle(ladder).gridTemplateColumns,columnCount:getComputedStyle(ladder).gridTemplateColumns.trim().split(/\s+/).length,stageCount:stages.length,stageOverflow:stages.some(stage=>stage.scrollWidth>stage.clientWidth+1),verticalText:stages.some(stage=>getComputedStyle(stage).writingMode!=='horizontal-tb'||getComputedStyle(stage).wordBreak==='break-all')};});
  assert.equal(pathwayLayout.columnCount,1,'Phone pathway stages must stack into readable cards');
  assert.equal(pathwayLayout.stageCount,5,'Phone pathway must retain all five stages');
  assert.equal(pathwayLayout.stageOverflow,false,'Phone pathway stage cards must not overflow');
  assert.equal(pathwayLayout.verticalText,false,'Phone pathway text must remain horizontal');
  await desktop.page.setViewportSize({width:1280,height:900});
  await desktop.page.locator('[data-career-search]').fill('GIS');
  await desktop.page.waitForFunction(()=>{
    const shown=[...document.querySelectorAll('[data-shortlist]')].map(el=>el.dataset.shortlist);
    const expected=window.CertTrackerV3.careerOptions.options({search:'GIS'}).map(a=>a.role.id);
    return shown.length>0&&JSON.stringify(shown)===JSON.stringify(expected);
  });
  assert.ok(await desktop.page.locator('.career-card').count()>0);
  await desktop.page.locator('[data-shortlist]').first().click();
  await desktop.page.locator('[data-career-shortlist]').check();
  assert.equal(await desktop.page.locator('.career-card').count(),1);
  await desktop.page.locator('.career-assessment-details > summary').first().click();
  await desktop.page.locator('[data-interest]').selectOption('100');
  await desktop.page.locator('[data-evidence]').first().selectOption('LAB');
  assert.ok(await desktop.page.evaluate(()=>Object.keys(state.customization.careerOptions.evidence).length===1));
  for(const tab of ['learning','roadmap','certifications','customize','dashboard']){await desktop.page.locator(`[data-workspace-tab="${tab}"]`).click();await desktop.page.waitForTimeout(150);assert.equal(await desktop.page.locator('.ct-dual-brief').count(),tab==='dashboard'?1:0);}
  for(const target of [{width:768,height:1024,mode:'tablet'},{width:1280,height:900,mode:'desktop'},{width:1920,height:1080,mode:'desktop'}]){
    await desktop.page.setViewportSize({width:target.width,height:target.height});
    await desktop.page.locator('[data-workspace-tab="roadmap"]').click();
    await alignmentAudit(desktop.page,target.mode);
    await desktop.page.screenshot({path:`/tmp/certtracker-${engine}-${target.mode}-${target.width}.png`,animations:'disabled',timeout:30000});
  }
  await desktop.context.close();

  console.log(`${engine}: phone first load`);
  const {context,page}=await open({viewport:{width:430,height:932},deviceScaleFactor:3,hasTouch:true,...(engine==='firefox'?{}:{isMobile:true})});
  await page.waitForFunction(()=>document.documentElement.dataset.layout==='mobile');
  await persistentHealth(page);
  assert.ok(await page.locator('#ct-mobile-navigation').count()===1,'Mobile navigation remains singular');
  await navigationInViewport(page);
  assert.equal(await page.locator('.tabs').isVisible(),false,'Desktop tabs must stay hidden on phones');
  assert.equal(await page.locator('.header-title').evaluate(el=>getComputedStyle(el).textShadow),'none');
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'),'black','Standalone iOS must not request an overlay status bar');
  const headerEffects=await page.locator('.header').evaluate(el=>{const s=getComputedStyle(el);return {clip:s.clipPath,filter:s.filter,backdrop:s.backdropFilter,transform:s.transform,background:s.backgroundColor};});
  assert.deepEqual(headerEffects,{clip:'none',filter:'none',backdrop:'none',transform:'none',background:'rgb(6, 17, 23)'});
  assert.ok((await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundAttachment)).split(',').every(value=>value.trim()==='scroll'));
  assert.equal(await page.locator('#ct-mobile-navigation').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  const transforms=await page.locator('.ct-depth-surface').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transform));
  assert.ok(transforms.every(value=>value==='none'),'Phone panels must not use desktop 3D layers');
  const cardLayers=await page.locator('#tab-content .ct3-card').evaluateAll(nodes=>nodes.map(el=>({clip:getComputedStyle(el).clipPath,contain:getComputedStyle(el).contain})));
  assert.ok(cardLayers.every(layer=>layer.clip==='none'&&layer.contain==='none'),'Tall phone cards must stay in the normal paint layer');
  for(const tab of ['learning','roadmap','certifications','dashboard']){
    console.log(`${engine}: mobile tab ${tab}`);
    await page.locator(`[data-mobile-tab="${tab}"]`).click();
    await page.waitForFunction(tab=>state.currentTab===tab,tab);
    assert.equal(await page.locator(`[data-mobile-tab="${tab}"]`).getAttribute('aria-current'),'page');
    await navigationInViewport(page);
    await persistentHealth(page);
    if(tab==='roadmap'){
      assert.equal(await page.locator('.ct-map-scope .ct-job-icon').count(),1,'Active roadmap filter must use a theme emblem');
      const firstCert=page.locator('.ct-map-cert').first();
      assert.equal(await firstCert.getAttribute('data-loaded'),null,'Collapsed map certifications stay lightweight');
      assert.equal(await firstCert.locator('.ct-map-subject').count(),0,'Collapsed map certifications do not build hidden subjects');
      await firstCert.locator(':scope > summary').click();
      await firstCert.locator('.ct-map-subject').first().waitFor();
      const firstSubject=firstCert.locator('.ct-map-subject-details').first();
      assert.equal(await firstSubject.evaluate(el=>el.open),false,'Study subjects start collapsed');
      await firstSubject.locator(':scope > summary').click();
      assert.ok(await firstSubject.locator('.ct-map-resource-mini a').count()>=3,'Each expanded subject exposes its study materials');
      assert.ok(await firstSubject.locator('.ct-map-resource-mini a').first().isVisible(),'Subject study links become visible on expansion');
      const filters=page.locator('.ct-map-filter-disclosure'),summary=filters.locator('summary');
      assert.equal(await filters.evaluate(el=>el.open),false,'Map filters start collapsed on phones');
      const selected=await page.evaluate(()=>state.filter);
      await summary.click();assert.equal(await filters.locator('[data-map-filter]').isVisible(),true);
      await page.evaluate(()=>rerenderCurrentTab());
      assert.equal(await filters.evaluate(el=>el.open),true,'Map filter expansion survives rerender');
      await summary.focus();await summary.press('Enter');
      assert.equal(await filters.locator('[data-map-filter]').isVisible(),false);
      assert.equal(await page.evaluate(()=>state.filter),selected,'Collapsing map controls preserves path');
      await page.reload();await page.locator('[data-mobile-tab="roadmap"]').click();
      assert.equal(await filters.evaluate(el=>el.open),false,'Map collapse survives reload');
      const hero=page.locator('.ct-map-hero');
      const emblem=await hero.evaluate(el=>{const s=getComputedStyle(el,'::before');return{position:s.position,width:s.width,transform:s.transform};});
      assert.deepEqual(emblem,{position:'static',width:'58px',transform:'none'},'Mobile emblem must occupy layout space instead of overlaying text');
      await page.screenshot({path:`/tmp/certtracker-${engine}-${tab}-mobile.png`,animations:'disabled',timeout:30000});
    }
    if(tab==='certifications'){
      const disclosure=page.locator('.cert-filter-disclosure'),summary=disclosure.locator('summary');
      assert.equal(await disclosure.getAttribute('open'),null,'Phone filters default collapsed');
      assert.equal(await disclosure.locator('.cert-filter-bar').isVisible(),false);
      const filter=await page.evaluate(()=>state.filter);
      await summary.click();await disclosure.locator('.cert-filter-bar').waitFor({state:'visible'});
      await page.evaluate(()=>rerenderCurrentTab());
      assert.equal(await disclosure.evaluate(el=>el.open),true,'Expansion survives rerenders');
      await summary.focus();await summary.press('Enter');
      await page.waitForFunction(()=>localStorage.getItem('ct-cert-filters-expanded')==='false');
      assert.equal(await disclosure.locator('.cert-filter-bar').isVisible(),false);
      assert.equal(await page.evaluate(()=>state.filter),filter,'Collapsing does not clear selection');
      await page.reload();await page.locator('[data-mobile-tab="certifications"]').click();
      assert.equal(await disclosure.evaluate(el=>el.open),false,'Collapsed preference survives reload');
    }
    assert.equal(await page.locator('.ct-dual-brief').count(),tab==='dashboard'?1:0);
  }
  console.log(`${engine}: scrolling and More menu`);
  const switchTimes=[];
  for(const tab of ['learning','roadmap','certifications','dashboard']){
    const started=Date.now();await page.locator(`[data-mobile-tab="${tab}"]`).click();await page.waitForFunction(value=>state.currentTab===value,tab);switchTimes.push(Date.now()-started);
  }
  const averageSwitch=switchTimes.reduce((sum,value)=>sum+value,0)/switchTimes.length,maxSwitch=Math.max(...switchTimes),maxBudget=engine==='webkit'?2500:1500;
  assert.ok(averageSwitch<1200&&maxSwitch<maxBudget,`Mobile tab switching exceeded its sustained/outlier budget: ${switchTimes.join(', ')}ms (average ${Math.round(averageSwitch)}ms; max ${maxSwitch}ms; ${engine} ceiling ${maxBudget}ms)`);
  assert.ok(await page.locator('body *').count()<10000,'Mobile workspace DOM must remain within a practical interaction budget');
  await alignmentAudit(page,'mobile');
  await page.evaluate(()=>window.scrollTo(0,Math.min(1200,document.documentElement.scrollHeight-innerHeight)));
  await page.waitForFunction(()=>scrollY>200);
  await navigationInViewport(page);
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('#ct-mobile-more-layer').waitFor({state:'visible'});
  await page.getByRole('button',{name:"Today's Recommendations",exact:true}).click();
  await page.locator('[data-today-recommendations]').waitFor();
  await page.locator('[data-today-recommendations] [data-act="health"]').click();
  await page.locator('[data-cert-data-health]').waitFor();
  await healthSpacing(page);
  await page.screenshot({path:`/tmp/certtracker-${engine}-health-mobile.png`,animations:'disabled',timeout:30000});
  assert.ok((await page.locator('[data-cert-data-health]').textContent()).includes('187/187 linked'));
  await page.getByRole('dialog',{name:'Certification data health'}).getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('#ct-mobile-more-button').click();
  await page.getByRole('button',{name:"Today's Recommendations",exact:true}).click();
  await page.locator('[data-today-recommendations] .ct3-close').click();
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('.ct-mobile-more-close').click();
  await page.locator('#ct-mobile-more-layer').waitFor({state:'hidden'});
  await page.locator('#ct-mobile-more-button').click();
  await page.locator('.ct-mobile-more-action').first().click();
  await page.waitForFunction(()=>state.currentTab==='strategy');
  assert.ok(await page.locator('body *').count()<5000,'Career Options must not construct every hidden plan on mobile');
  await page.locator('[data-mobile-tab="dashboard"]').click();
  await page.waitForFunction(()=>scrollY===0);
  assert.equal(await page.evaluate(()=>scrollY),0,'Workspace changes must not restore a stale deep scroll offset');
  await page.screenshot({path:`/tmp/certtracker-${engine}-mobile.png`,animations:'disabled',timeout:30000});
  console.log(`${engine}: phone reload`);
  await page.reload();await navigationInViewport(page);
  await context.close();
  const focused=await open({viewport:{width:390,height:844}});
  await focused.page.evaluate(()=>{
    state.myPath={ccna:true};state.passes=Object.fromEntries(['a-plus','network-plus','mcit','mcde','arcules-csp'].map(id=>[id,'2026-01-01']));
    state.notes={ccna:{text:'Preserve route adoption note'}};CertTrackerV3.storage.persistAll();renderApp();
  });
  await focused.page.getByRole('button',{name:'Apply focused route',exact:true}).click();
  assert.ok((await focused.page.locator('[data-focused-route]').textContent()).includes('5 recorded complete'));
  assert.equal(await focused.page.evaluate(()=>CertTrackerV3.recommendations.recommend()[0].id),'mcie');
  await focused.page.reload();await navigationInViewport(focused.page);
  assert.equal(await focused.page.evaluate(()=>Object.keys(state.myPath).length),25);
  assert.equal(await focused.page.evaluate(()=>state.notes.ccna.text),'Preserve route adoption note');
  await focused.page.locator('[data-focused-route] summary').click();
  assert.equal(await focused.page.locator('[data-focused-route] li').count(),25);
  await focused.page.evaluate(()=>{
    state.myPath=Object.fromEntries(CertTrackerV3.focusedRoute.definition.previousIds.map(id=>[id,true]));
    CertTrackerV3.storage.persistAll();
  });
  await focused.page.reload();await navigationInViewport(focused.page);
  assert.equal(await focused.page.evaluate(()=>Object.keys(state.myPath).length),25,'Previous focused route upgrades without removing milestones');
  assert.equal(await focused.page.evaluate(()=>state.notes.ccna.text),'Preserve route adoption note');
  assert.ok(await focused.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Focused route must not overflow mobile');
  await focused.page.locator('[data-mobile-tab="learning"]').click();
  assert.ok(!(await focused.page.locator('#tab-content').textContent()).includes('OT + convergence engineering'));
  for(const width of [320,390,768,1280]){
    await focused.page.setViewportSize({width,height:900});
    await focused.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.ok(await focused.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Learning layout fits ${width}px`);
    assert.ok(await focused.page.locator('.ct-learning-phase-head').evaluateAll(heads=>heads.every(head=>{
      const title=head.firstElementChild.getBoundingClientRect(),counter=head.lastElementChild.getBoundingClientRect();
      return Math.min(title.right,counter.right)-Math.max(title.left,counter.left)<=1||Math.min(title.bottom,counter.bottom)-Math.max(title.top,counter.top)<=1;
    })),`Phase headings and counters do not overlap at ${width}px`);
  }
  await focused.page.setViewportSize({width:390,height:844});
  await navigationInViewport(focused.page);
  await focused.page.locator('[data-mobile-tab="roadmap"]').click();
  assert.ok(!(await focused.page.locator('#tab-content').textContent()).includes('Principal / professional capstone'));
  await focused.context.close();
  assert.deepEqual(errors,[],'Application errors during browser smoke tests');
  console.log(`${engine}: desktop and phone startup, all primary tabs, scrolling, More and reload passed.`);
}finally{await browser.close();}
