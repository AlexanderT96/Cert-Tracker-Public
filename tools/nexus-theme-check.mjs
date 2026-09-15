import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const index=read('index.html');
const css=read('nexus-template-one.css');
const exact=read('nexus-template-one-exact.css');
const cleanup=read('nexus-template-one-cleanup.css');
const theme=read('src/nexus-theme.js');
const renderer=read('src/renderer.js');
const sw=read('sw.js');
const manifest=read('manifest.json');
const icon=read('icon.svg');

const legacyPos=index.indexOf('href="template-one.css"');
const nexusPos=index.indexOf('id="nexus-template-one-stylesheet"');
const exactPos=index.indexOf('id="nexus-template-one-exact-stylesheet"');
assert.ok(legacyPos>=0&&nexusPos>legacyPos,'Nexus Template 1 stylesheet must load after legacy presentation layers.');
assert.ok(exactPos>nexusPos,'Exact Template 1 contract must load after the previous theme layer.');
assert.match(index,/src\/nexus-theme\.js/,'Theme pinning runtime must be loaded.');
assert.match(theme,/MutationObserver/,'Theme pinning runtime must handle later component styles.');
assert.match(theme,/nexusTheme='template-one'/,'Theme runtime must expose active Template 1 state.');
assert.match(theme,/nexusGraphics='clean'/,'Theme runtime must expose the completed graphics-purge state.');
assert.match(theme,/nexusLayout='operations-console'/,'Theme runtime must expose the Template 1 structural shell.');
assert.match(theme,/nexus-template-one-cleanup\.css/,'Theme runtime must load the final graphics-purge layer.');
assert.match(theme,/nexus-template-one-exact-stylesheet/,'Theme runtime must pin the exact Template 1 contract.');
assert.match(theme,/\n\s*init\(\);/,'Graphics-purge layer must initialise immediately at the end of body.');

for(const selector of ['.ct-dual-brief','.ct-pintel','.ct-ng-card','.ct-si-card','.ct-outlook-intel','.ct-market-now','.ct-account-card','.ct-weekly','#ct3-launcher','.ct-mobile-navigation']){
  assert.ok(css.includes(selector),`Missing Template 1 coverage for ${selector}`);
}
assert.match(css,/NEXUS \/\/ PERSONAL INTELLIGENCE/,'Header must use Nexus operations branding.');
assert.match(css,/border-radius:0!important/,'Theme must explicitly retire rounded legacy cards.');
assert.match(css,/cert-status-dot[\s\S]*background-image:none!important/,'Legacy certification status artwork must be neutralised.');
assert.match(css,/nexus-template-one-reference\.jpg/,'Template 1 must use the approved reference artwork.');
assert.match(exact,/nexus-template-one-reference\.jpg/,'Exact theme must use the user-approved Template 1 reference artwork.');
for(const selector of ['.nx-main-topbar','.nx-sidebar-links','.nx-operations-grid','.nx-recommendations-panel','.nx-events-panel','.nx-quick-panel']){
  assert.ok(exact.includes(selector),`Missing approved Template 1 component ${selector}`);
}
assert.match(renderer,/ALEXANDER T\./,'Masthead signature must read Alexander T.');
assert.match(renderer,/Alexander T\./,'Desktop identity chip must read Alexander T.');
assert.match(manifest,/"theme_color":"#00eaf2"/,'Installed app must use the Template 1 cyan theme colour.');
assert.match(manifest,/app-icon-192\.png/,'Manifest must declare the mobile bookmark icon.');
assert.match(manifest,/app-icon-512\.png/,'Manifest must declare the maskable PWA icon.');
assert.match(icon,/aria-label="Nexus neon N"/,'Browser icon must use the Nexus Template 1 identity.');

for(const structure of ['nx-brand-banner','nx-sidebar','nx-mission-meter','nx-mission-briefs']){
  assert.ok(renderer.includes(structure),`Missing Template 1 structural element ${structure}`);
}
assert.match(css,/@media\(min-width:1041px\)[\s\S]*grid-template-columns:236px minmax\(0,1fr\)/,'Desktop must use the Template 1 sidebar shell.');
assert.match(css,/@media\(max-width:760px\)[\s\S]*\.nx-sidebar\{display:none!important\}/,'Mobile must retire the desktop sidebar in favour of mobile navigation.');
assert.ok(renderer.indexOf('${heroCard}') < renderer.indexOf('${toolsBar}'),'Mission hero must render before secondary tools.');

for(const selector of ['.tab-glyph,.ct-mobile-nav-icon','.cert-search-icon','.cert-filter-disclosure>summary','.ct-job-icon','.ct-mobile-today-button']){
  assert.ok(cleanup.includes(selector),`Missing graphics-purge coverage for ${selector}`);
}
assert.match(cleanup,/\.tab-glyph,.ct-mobile-nav-icon[\s\S]*background-image:none!important/,'Navigation must not render the retired HUD image icons.');
assert.match(cleanup,/data-workspace-tab="dashboard"[\s\S]*content:"01"!important/,'Desktop navigation must use Nexus terminal index markers.');
assert.match(cleanup,/data-mobile-more[\s\S]*content:"\+\+"!important/,'Mobile More must use the Nexus terminal marker.');
assert.match(cleanup,/\.cert-search-icon[\s\S]*background-image:none!important/,'Search control must not use retired HUD artwork.');
assert.match(cleanup,/\.cert-filter-disclosure>summary[\s\S]*background-image:none!important/,'Filter control must not use retired HUD artwork.');
assert.match(cleanup,/#ct3-launcher::before[\s\S]*content:none!important/,'Floating recommendations control must not inherit legacy pseudo-artwork.');
assert.ok(!/url\(["']?assets\/hud\//i.test(cleanup),'Final graphics-purge layer must not introduce HUD image dependencies.');

assert.ok(sw.includes('./nexus-template-one.css'),'Service worker must cache Nexus Template 1.');
assert.ok(sw.includes('./nexus-template-one-exact.css'),'Service worker must cache the exact Template 1 contract.');
assert.ok(sw.includes('./nexus-template-one-cleanup.css'),'Service worker must cache the Nexus graphics-purge layer.');
assert.ok(sw.includes('./src/nexus-theme.js'),'Service worker must cache Nexus theme runtime.');
assert.ok(sw.includes('./assets/nexus-template-one-reference.jpg'),'Service worker must cache the approved Template 1 reference artwork.');
assert.ok(sw.includes('./assets/hud/apple-touch-icon-dark-180.png'),'Service worker must cache the Apple Home Screen icon.');
console.log('Nexus Template 1 + icon purge contract OK');
