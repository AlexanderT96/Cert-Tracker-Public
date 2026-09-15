import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const index=read('index.html');
const css=read('nexus-template-one.css');
const theme=read('src/nexus-theme.js');
const sw=read('sw.js');

const legacyPos=index.indexOf('href="template-one.css"');
const nexusPos=index.indexOf('id="nexus-template-one-stylesheet"');
assert.ok(legacyPos>=0&&nexusPos>legacyPos,'Nexus Template 1 stylesheet must load after legacy presentation layers.');
assert.match(index,/src\/nexus-theme\.js/,'Theme pinning runtime must be loaded.');
assert.match(theme,/MutationObserver/,'Theme pinning runtime must handle later component styles.');
assert.match(theme,/nexusTheme='template-one'/,'Theme runtime must expose active Template 1 state.');

for(const selector of ['.ct-dual-brief','.ct-pintel','.ct-ng-card','.ct-si-card','.ct-outlook-intel','.ct-market-now','.ct-account-card','.ct-weekly','#ct3-launcher','.ct-mobile-navigation']){
  assert.ok(css.includes(selector),`Missing Template 1 coverage for ${selector}`);
}
assert.match(css,/NEXUS \/\/ PERSONAL INTELLIGENCE/,'Header must use Nexus operations branding.');
assert.match(css,/border-radius:0!important/,'Theme must explicitly retire rounded legacy cards.');
assert.match(css,/cert-status-dot[\s\S]*background-image:none!important/,'Legacy certification status artwork must be neutralised.');
assert.match(css,/dash-hero::before[\s\S]*NEXUS \/ ACTIVE VECTOR/,'Legacy dashboard portal artwork must be replaced.');
assert.ok(sw.includes('./nexus-template-one.css'),'Service worker must cache Nexus Template 1.');
assert.ok(sw.includes('./src/nexus-theme.js'),'Service worker must cache Nexus theme runtime.');
console.log('Nexus Template 1 contract OK');
