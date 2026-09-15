import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const index=read('index.html');
const css=read('nexus-template-one.css');
const cleanup=read('nexus-template-one-cleanup.css');
const theme=read('src/nexus-theme.js');
const sw=read('sw.js');

const legacyPos=index.indexOf('href="template-one.css"');
const nexusPos=index.indexOf('id="nexus-template-one-stylesheet"');
assert.ok(legacyPos>=0&&nexusPos>legacyPos,'Nexus Template 1 stylesheet must load after legacy presentation layers.');
assert.match(index,/src\/nexus-theme\.js/,'Theme pinning runtime must be loaded.');
assert.match(theme,/MutationObserver/,'Theme pinning runtime must handle later component styles.');
assert.match(theme,/nexusTheme='template-one'/,'Theme runtime must expose active Template 1 state.');
assert.match(theme,/nexusGraphics='clean'/,'Theme runtime must expose the completed graphics-purge state.');
assert.match(theme,/nexus-template-one-cleanup\.css/,'Theme runtime must load the final graphics-purge layer.');
assert.match(theme,/\n\s*init\(\);/,'Graphics-purge layer must initialise immediately at the end of body.');

for(const selector of ['.ct-dual-brief','.ct-pintel','.ct-ng-card','.ct-si-card','.ct-outlook-intel','.ct-market-now','.ct-account-card','.ct-weekly','#ct3-launcher','.ct-mobile-navigation']){
  assert.ok(css.includes(selector),`Missing Template 1 coverage for ${selector}`);
}
assert.match(css,/NEXUS \/\/ PERSONAL INTELLIGENCE/,'Header must use Nexus operations branding.');
assert.match(css,/border-radius:0!important/,'Theme must explicitly retire rounded legacy cards.');
assert.match(css,/cert-status-dot[\s\S]*background-image:none!important/,'Legacy certification status artwork must be neutralised.');
assert.match(css,/dash-hero::before[\s\S]*NEXUS \/ ACTIVE VECTOR/,'Legacy dashboard portal artwork must be replaced.');

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
assert.ok(sw.includes('./nexus-template-one-cleanup.css'),'Service worker must cache the Nexus graphics-purge layer.');
assert.ok(sw.includes('./src/nexus-theme.js'),'Service worker must cache Nexus theme runtime.');
console.log('Nexus Template 1 + icon purge contract OK');
