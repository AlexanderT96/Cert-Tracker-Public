import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const errors=[];
const index=read('index.html');
const css=read('responsive-layout.css');
const mobileCss=read('mobile-navigation.css');
const js=read('src/responsive-layout.js');
const workspace=read('src/workspace-shell.js');
const personalization=read('src/personalization.js');
const sw=read('sw.js');
const bootstrap=read('src/bootstrap.js');
const renderer=read('src/renderer.js');
const alignmentCss=read('platform-alignment.css');

function require(condition,message){if(!condition)errors.push(message);}
require(!/loadState\(\);\s*renderApp\(\);\s*$/.test(renderer),'Initial render must wait for the complete workspace shell, not flash three legacy tabs.');

for(const asset of ['responsive-layout.css','src/responsive-layout.js','mobile-navigation.css','platform-alignment.css','weekly-coach.css']){
  require(index.includes(asset),`index.html is missing responsive asset ${asset}`);
  require(sw.includes(`./${asset}`),`service worker is missing responsive asset ${asset}`);
}
require(index.indexOf('responsive-layout.css')>index.indexOf('mechanical-chassis.css'),'Responsive CSS must load after the mechanical chassis layer.');
require(index.indexOf('mobile-navigation.css')>index.indexOf('browser-compat.css'),'Compact mobile navigation CSS must be the final responsive presentation layer.');
require(index.indexOf('platform-alignment.css')>index.indexOf('notification-center.css'),'Platform alignment must be the final layout cascade.');
require(js.includes("root.dataset.layout=mode"),'Responsive detector must expose data-layout on the root element.');
require(js.includes("'(pointer: coarse)'"),'Responsive detector must account for coarse/touch input.');
require(js.includes('visualViewport'),'Responsive detector must use visualViewport where available for mobile Safari accuracy.');
require(!/userAgent|navigator\.platform|navigator\.vendor/.test(js),'Responsive detection must not depend on brittle user-agent sniffing.');
for(const mode of ['mobile','tablet'])require(css.includes(`data-layout=\"${mode}\"`),`Missing ${mode} layout rules.`);
for(const token of ['safe-area-inset-top','safe-area-inset-bottom','touch-action:pan-x pan-y pinch-zoom','scroll-snap-type:x','font-size:16px'])require(css.includes(token),`Responsive CSS is missing required mobile behaviour: ${token}`);
require(css.includes('.ct-map-canvas{min-width:900px'),'Roadmap must remain a pan-able canvas on mobile rather than being crushed to viewport width.');
require(css.includes('.ct-command-dock'),'Responsive CSS must explicitly constrain the desktop/tablet command dock.');
require(css.includes('.dash-hero'),'Responsive CSS must explicitly recompose the dashboard hero.');

for(const token of ['#ct-mobile-navigation','.ct-mobile-more-sheet','grid-template-columns:repeat(5','html[data-layout="mobile"] .tabs{display:none!important}','html[data-layout="mobile"] .ct-command-dock{display:none!important}'])require(mobileCss.includes(token),`Compact mobile navigation is missing ${token}.`);
require(workspace.includes('dedupeNavigation'),'Workspace shell must actively remove duplicate workspace buttons.');
require(workspace.includes('data-ct-workspace'),'Workspace tabs must share the canonical personalization workspace attribute.');
require(workspace.includes('ct-mobile-navigation'),'Workspace shell must expose the compact mobile primary navigation.');
require(workspace.includes('ct-mobile-more-layer'),'Workspace shell must keep secondary tools behind the mobile More sheet.');
require(workspace.includes('ct-mobile-today-button'),'Today recommendations must remain a visible first-class mobile action.');
require(bootstrap.includes('else CT.workspaceShell?.decorate()'),'Startup must finish decorating an already-rendered page, including first-load mobile navigation.');
require(bootstrap.includes("document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0)"),'Full dashboard rendering must yield until after document readiness.');
require(mobileCss.includes('transform-style:flat!important')&&mobileCss.includes('will-change:auto!important'),'Mobile panels must avoid oversized 3D compositor layers.');
require(css.includes('background-attachment:scroll!important'),'Mobile backgrounds must scroll with the document.');
require(mobileCss.includes('#tab-content{min-height:0!important;contain:none!important}'),'Mobile tab content must not retain an oversized composited scroll layer.');
require(mobileCss.includes('clip-path:none!important'),'Tall mobile cards must avoid iOS clipped-layer paint gaps.');
require(workspace.includes('global.CertTrackerTabNavigation=true'),'Workspace navigation must mark tab changes so stale scroll offsets are not restored.');
require(workspace.includes("typeof global.renderTabContent==='function'"),'Workspace tabs must update content without rebuilding the entire application shell.');
require(renderer.includes('window.CertTrackerTabNavigation ? 0 : window.scrollY'),'Tab changes must reset scroll while in-place updates preserve reading position.');
require(personalization.includes('[data-workspace-tab=')&&personalization.includes('[data-ct-workspace='),'Personalization must reuse workspace-shell tabs instead of manufacturing duplicate menu buttons.');
for(const mode of ['mobile','tablet','desktop'])require(alignmentCss.includes(`data-layout=\"${mode}\"`),`Missing independent ${mode} emblem alignment rules.`);
require(alignmentCss.includes('grid-template-columns:42px minmax(0,1fr) auto auto'),'Banner icons, text and actions must occupy separate grid columns.');
require(alignmentCss.includes('.banner>.ct-line-icon')&&alignmentCss.includes('position:static!important'),'Banner icons must stay in layout flow instead of overlaying text.');
const weeklyCss=read('weekly-coach.css');for(const token of ['@media(max-width:620px)','.ct-weekly-review-grid,.ct-weekly-start{grid-template-columns:1fr}','.ct-weekly button{width:100%}'])require(weeklyCss.includes(token),`Weekly coach mobile layout is missing ${token}.`);

if(errors.length){console.error(`Responsive gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Responsive device-layout, compact mobile navigation and duplicate-menu checks passed.');
