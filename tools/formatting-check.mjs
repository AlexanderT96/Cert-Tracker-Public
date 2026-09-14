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
const hud=read('cyberpunk-hud.css');
const chassis=read('mechanical-chassis.css');
const manifest=read('manifest.json');
const worker=read('sw.js');
const config=read('src/config.js');
const pkg=JSON.parse(read('package.json'));

function require(condition,message){if(!condition)errors.push(message);}

for(const asset of ['professional-overrides.css','professional-depth.css','professional-symbols.css','professional-typography.css','cyberpunk-hud.css','mechanical-chassis.css','src/professional-icons.js'])require(index.includes(asset),`index.html is missing final presentation asset ${asset}`);
require(index.indexOf('professional-typography.css')>index.indexOf('professional-symbols.css'),'professional-typography.css must load after professional-symbols.css');
require(index.indexOf('cyberpunk-hud.css')>index.indexOf('professional-typography.css'),'cyberpunk-hud.css must load after professional typography.');
require(index.indexOf('mechanical-chassis.css')>index.indexOf('cyberpunk-hud.css'),'mechanical-chassis.css must be the final presentation layer.');
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
const finalLayers=(symbols+typography+overrides+depth+hud+chassis+icon).toLowerCase();
for(const forbidden of ['#ff7ad9','#c084fc','#9b8cff','#ff6ee0'])require(!finalLayers.includes(forbidden),`Legacy purple/sakura colour ${forbidden} remains in a final presentation layer.`);
require((icon.match(/data-stage=/g)||[]).length===5,'Application icon must encode all five progression stages.');
require(icon.includes('data-goal="true"'),'Application icon is missing its explicit goal marker.');
require(!/[\u{1F300}-\u{1FAFF}]/u.test(typography+symbols),'Professional CSS should not use decorative emoji.');
for(const token of ['--hud-cyan:#16d9e3','--hud-teal:#20e39a','--hud-amber:#f0aa3c','--bg:#030811'])require(hud.includes(token),`Mechanical HUD token missing: ${token}`);
for(const selector of ['.ct-map-viewport','.ct-map-gate','.ct-map-tutor-summary','.ct-command-dock','.ct-credential-tier-diamond'])require(hud.includes(selector),`Mechanical HUD coverage missing ${selector}`);
require(chassis.includes('assets/hud/pathway-emblems.svg'),'Six-stage pathway emblem sprite is not wired into the HUD');
for(const phase of [2,3,4,5,6])require(chassis.includes(`.phase-block.ph${phase} .phase-num`),`Pathway emblem mapping missing for phase ${phase}`);
for(const phase of [2,3,4,5,6])require(chassis.includes(`.ct-map-phase[data-phase="${phase}"] .ct-map-phase-number`),`Map pathway emblem mapping missing for phase ${phase}`);
for(const tier of ['bronze','silver','gold','platinum','diamond'])require(chassis.includes(`.ct-credential-tier-${tier}`),`Certification tier emblem missing: ${tier}`);
for(const behavior of ['@media(hover:none)','@media(prefers-reduced-motion:reduce)','min-height:44px','touch-action:manipulation'])require(hud.includes(behavior),`Touch/accessibility contract missing ${behavior}`);
for(const spacing of ['gap:4px','padding:4px','--hud-cut:10px'])require(hud.includes(spacing),`HUD spacing contract missing ${spacing}`);
for(const forbidden of ['#ff7ad9','#c084fc','#9b8cff','#ff6ee0','#d946ef','#ec4899'])require(!hud.toLowerCase().includes(forbidden),`Forbidden legacy colour ${forbidden} remains in HUD layer.`);
require(worker.includes("'./cyberpunk-hud.css'"),'Service worker does not cache the HUD theme asset.');
require(worker.includes(`cert-tracker-assets-v${pkg.version}`),'Service-worker cache was not advanced for the HUD release.');
require(manifest.includes('"background_color":"#030811"')&&manifest.includes('"theme_color":"#08131f"'),'Manifest does not carry the HUD application colours.');
require(icon.includes('cybernetic five-tier progression core'),'Application icon does not identify the cybernetic progression system.');
require(config.includes(`app: '${pkg.version}'`),'Visible application version must match package.json.');
for(const selector of ['.header::before','.dash-hero::before','.ct-credential-tier-diamond','.strategy-marker','.ct-command-dock button::before'])require(chassis.includes(selector),`Approved mechanical chassis coverage missing ${selector}`);
for(const token of ['RANK_TO_TIER','decorateCertRows','decorateMedalShelf',"S:'diamond'","A:'platinum'","B:'gold'","C:'silver'","D:'bronze'"])require(icons.includes(token),`Certification emblem coverage token ${token} is missing.`);
for(const asset of ['chassis-frame.webp','portal.png','pathway-emblems.svg','tier-bronze.png','tier-silver.png','tier-gold.png','tier-platinum.png','tier-diamond.png','strategy.png','roadmap.png','learning.png','customize.png','app-icon-192.png','app-icon-512.png']){
  require(fs.existsSync(`assets/hud/${asset}`),`Approved HUD asset missing assets/hud/${asset}`);
  require(worker.includes(`'./assets/hud/${asset}'`),`Service worker does not cache assets/hud/${asset}`);
}
require(worker.includes("'./mechanical-chassis.css'"),'Service worker does not cache the mechanical chassis layer.');
require(worker.includes(`cert-tracker-assets-v${pkg.version}`),'Service-worker cache was not advanced for the approved chassis release.');
const presentationCss=fs.readdirSync('.').filter(file=>file.endsWith('.css')).map(read).join('\n').toLowerCase();
for(const forbidden of ['#ff7ad9','#c084fc','#9b8cff','#ff6ee0','#d946ef','#ec4899','#d8b0ff','#b03fd0','#ff5d7d','#ff6b8a','#a55ef0','#d0a6ff','rgba(167,139,250','rgba(255,140,225','rgba(255,110,224'])require(!presentationCss.includes(forbidden),`Forbidden legacy presentation colour ${forbidden} remains in CSS.`);
for(const forbidden of ['#c084fc','#d4d1e8','#d8b0ff','#b03fd0','#ff6ee0','#ff7ad9'])require(!renderer.toLowerCase().includes(forbidden),`Forbidden legacy renderer colour ${forbidden} remains.`);

if(errors.length){console.error(`Formatting gate failed (${errors.length}):`);errors.forEach(e=>console.error(`- ${e}`));process.exit(1);}
console.log('Mechanical HUD theme, typography, spacing, tier/icon coverage, touch states and asset-loading checks passed.');
