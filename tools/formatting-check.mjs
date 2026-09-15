import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const errors=[];
const index=read('index.html');
const icons=read('src/professional-icons.js');
const typography=read('professional-typography.css');
const symbols=read('professional-symbols.css');
const overrides=read('professional-overrides.css');
const depth=read('professional-depth.css');
const renderer=read('src/renderer.js');
const icon=read('icon.svg');
const manifest=read('manifest.json');
const worker=read('sw.js');
const config=read('src/config.js');
const pkg=JSON.parse(read('package.json'));
const templateOne=read('template-one.css');
const nexusTheme=read('nexus-template-one.css');
const nexusRuntime=read('src/nexus-theme.js');

function require(condition,message){if(!condition)errors.push(message);}

for(const asset of ['professional-overrides.css','professional-depth.css','professional-symbols.css','professional-typography.css','src/professional-icons.js'])require(index.includes(asset),`index.html is missing presentation asset ${asset}`);
require(index.includes('template-one.css'),'Template 1 base presentation layer is missing.');
require(index.includes('nexus-template-one.css'),'Nexus Template 1 authoritative layer is missing.');
require(index.indexOf('template-one.css')>index.indexOf('mobile-polish.css'),'Template 1 must load after legacy component presentation layers.');
require(index.indexOf('nexus-template-one.css')>index.indexOf('template-one.css'),'Nexus Template 1 must load after Template 1 base.');
require(!index.includes('cyberpunk-hud.css'),'Retired cyberpunk-hud.css must not be loaded by index.html.');
require(!index.includes('mechanical-chassis.css'),'Retired mechanical-chassis.css must not be loaded by index.html.');
require(index.includes('src/nexus-theme.js'),'Nexus runtime cascade controller is missing.');
require(index.indexOf('src/nexus-theme.js')>index.indexOf('src/bootstrap.js'),'Nexus theme controller must initialise after application modules.');
require(nexusRuntime.includes('MutationObserver'),'Nexus theme controller must repin after runtime-injected styles.');
require(nexusRuntime.includes("nexusTheme='template-one'"),'Nexus theme state marker is missing.');

require(index.indexOf('professional-typography.css')>index.indexOf('professional-symbols.css'),'professional-typography.css must load after professional-symbols.css');
require(!/\.trimStart\s*\(|\.trimLeft\s*\(/.test(icons),'Professional symbol cleanup must not trim leading inline whitespace.');
require(icons.includes("const leading=/^\\s+/.test(before),trailing=/\\s+$/.test(before)"),'Inline whitespace preservation guard is missing.');
require(renderer.includes('<strong>🎯 Next up:</strong> ${escape(nxt.name)}'),'Next-up markup changed; re-audit spacing around the certification name.');
require(typography.includes('Segoe UI Variable'),'Professional variable-system font stack is missing.');
for(const selector of ['.dash-hero-next > strong','.cert-code','.badge + .badge'])require(typography.includes(selector),`Typography/spacing safeguard missing ${selector}.`);

for(const tier of ['bronze','silver','gold','platinum','diamond']){
  require(symbols.includes(`ct-credential-tier-${tier}`),`Missing professional ${tier} credential emblem styling.`);
  require(icons.includes(`'${tier}'`),`Professional icon adapter does not preserve ${tier} tier.`);
}
for(const badge of ['badge-prio-5','badge-prio-4','badge-prio-3','badge-prio-2','badge-prio-1','badge-gateway','badge-tier-S','badge-tier-A','badge-tier-B','badge-tier-C','badge-tier-D'])require(symbols.includes(badge),`Missing professional badge treatment for ${badge}.`);
for(const control of ['.cert-status-dot','.cert-expand-toggle','.drag-handle','.badge-next'])require(symbols.includes(control),`Missing professional replacement for ${control}.`);
for(const glyph of ['↩','⊘','⠿'])require(icons.includes(glyph),`Professional icon cleanup does not remove legacy control glyph ${glyph}.`);
for(const token of ['RANK_TO_TIER','decorateCertRows','decorateMedalShelf',"S:'diamond'","A:'platinum'","B:'gold'","C:'silver'","D:'bronze'"])require(icons.includes(token),`Certification emblem coverage token ${token} is missing.`);

const finalLayers=(symbols+typography+overrides+depth+templateOne+nexusTheme+icon).toLowerCase();
for(const forbidden of ['#ff7ad9','#c084fc','#9b8cff','#ff6ee0','#d946ef','#ec4899','#d8b0ff','#b03fd0','#ff5d7d','#ff6b8a','#a55ef0','#d0a6ff'])require(!finalLayers.includes(forbidden),`Forbidden legacy presentation colour ${forbidden} remains in an active final layer.`);
require(icon.includes('aria-label="Nexus neon N"'),'Application icon must expose the Nexus identity.');
for(const colour of ['#00eaf2','#15f6ff','#ff1687'])require(icon.includes(colour),`Application icon is missing Template 1 colour ${colour}.`);
require(!/[\u{1F300}-\u{1FAFF}]/u.test(typography+symbols+nexusTheme),'Presentation CSS should not use decorative emoji.');

for(const token of ['--nx-black','--nx-white','--nx-cyan','--nx-red','--nx-amber','--nx-green'])require(nexusTheme.includes(token),`Nexus Template 1 design token missing ${token}`);
for(const selector of ['.header','.tabs','.dash-hero','.phase-block','.cert-row','.ct-learning-phase','.ct-map-phase','.ct-mobile-navigation','.ct-dual-brief','.ct-pintel','.ct-ng-card','.ct-si-card','.ct-outlook-intel','.ct-market-now','.ct-account-card','.ct-weekly','#ct3-launcher'])require(nexusTheme.includes(selector),`Nexus Template 1 workspace coverage missing ${selector}`);
for(const retired of ['assets/hud/chassis-frame.webp','assets/hud/portal.png'])require(!index.includes(retired),`Retired mechanical artwork is still referenced directly by index.html: ${retired}`);
require(nexusTheme.includes('NEXUS // PERSONAL INTELLIGENCE'),'Nexus header operations label is missing.');
require(nexusTheme.includes('NEXUS / ACTIVE VECTOR'),'Legacy dashboard portal has not been replaced by the Template 1 hero contract.');
require(nexusTheme.includes('.cert-status-dot{background-image:none!important'),'Legacy image-backed certification status dots are not neutralised.');
require(nexusTheme.includes('border-radius:0!important'),'Nexus Template 1 must explicitly retire rounded legacy surfaces.');

require(worker.includes("'./template-one.css'")||worker.includes("'./template-one.css'"),'Service worker does not cache Template 1 base.');
require(worker.includes("'./nexus-template-one.css'"),'Service worker does not cache Nexus Template 1.');
require(worker.includes("'./src/nexus-theme.js'"),'Service worker does not cache Nexus theme controller.');
require(!worker.includes("'./cyberpunk-hud.css'"),'Service worker still treats retired cyberpunk-hud.css as an active core asset.');
require(!worker.includes("'./mechanical-chassis.css'"),'Service worker still treats retired mechanical-chassis.css as an active core asset.');
require(!worker.includes("'./assets/hud/chassis-frame.webp'"),'Service worker still caches retired chassis artwork as a core asset.');
require(!worker.includes("'./assets/hud/portal.png'"),'Service worker still caches retired portal artwork as a core asset.');
require(worker.includes(`cert-tracker-assets-v${pkg.version}`),'Service-worker cache version must match package.json while preserving the compatibility prefix.');
require(manifest.includes('"background_color":"#01070a"')&&manifest.includes('"theme_color":"#00eaf2"'),'Manifest does not carry the installed-app Template 1 colours.');
require(config.includes(`app: '${pkg.version}'`),'Visible application version must match package.json.');

for(const asset of ['pathway-emblems.svg','tier-bronze.png','tier-silver.png','tier-gold.png','tier-platinum.png','tier-diamond.png','strategy.png','roadmap.png','learning.png','customize.png','app-icon-192.png','app-icon-512.png','apple-touch-icon-dark-180.png']){
  require(fs.existsSync(`assets/hud/${asset}`),`Supported Nexus asset missing assets/hud/${asset}`);
  require(worker.includes(`'./assets/hud/${asset}'`),`Service worker does not cache assets/hud/${asset}`);
}
for(const selector of ['.header','.tabs','.dash-hero','.phase-block','.cert-row','.ct-learning-phase','.ct-map-viewport','.ct-mobile-navigation','.ct-command-dock'])require(templateOne.includes(selector),`Template 1 base workspace coverage missing ${selector}`);
for(const token of ['--t1-black','--t1-white','--t1-cyan','--t1-red','--t1-amber'])require(templateOne.includes(token),`Template 1 base design token missing ${token}`);
for(const forbidden of ['#c084fc','#d4d1e8','#d8b0ff','#b03fd0','#ff6ee0','#ff7ad9'])require(!renderer.toLowerCase().includes(forbidden),`Forbidden legacy renderer colour ${forbidden} remains.`);

if(errors.length){console.error(`Formatting gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Nexus Template 1, typography, spacing, emblem, responsive and asset-loading checks passed.');
