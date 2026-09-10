// Cert Tracker v3 — product-quality UX layer: Today, command palette, health and sync.
(function initUX(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before ux.js');
  const esc = CT.util.escapeHtml;

  const STYLE = `
    #ct3-launcher{position:fixed;right:18px;bottom:18px;z-index:9997;border:1px solid rgba(255,255,255,.18);background:rgba(23,17,48,.94);color:#fff;border-radius:999px;padding:10px 14px;font:600 12px/1 IBM Plex Sans,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.32);cursor:pointer;backdrop-filter:blur(14px)}
    #ct3-launcher:hover{transform:translateY(-1px)}
    .ct3-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(5,4,14,.72);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:8vh 16px 24px;overflow:auto}
    .ct3-panel{width:min(760px,100%);background:#171130;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.48);color:#f7f4ff;overflow:hidden}
    .ct3-head{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.1)}
    .ct3-title{font:700 18px/1.2 IBM Plex Sans,sans-serif}.ct3-sub{font:500 11px/1.4 IBM Plex Mono,monospace;color:#aaa4c8;margin-top:4px}
    .ct3-close{border:0;background:transparent;color:#c8c1e8;font-size:24px;cursor:pointer;padding:2px 8px}
    .ct3-body{padding:16px 18px 20px;max-height:72vh;overflow:auto}
    .ct3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ct3-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px}
    .ct3-card h3{font:700 13px IBM Plex Sans,sans-serif;margin:0 0 8px}.ct3-muted{color:#aaa4c8;font-size:12px}.ct3-big{font:700 28px IBM Plex Sans,sans-serif}
    .ct3-list{display:grid;gap:8px}.ct3-row{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)}.ct3-row:last-child{border-bottom:0}
    .ct3-pill{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:3px 7px;font:600 10px IBM Plex Mono,monospace;color:#d8d2f2}.ct3-score{font:700 18px IBM Plex Mono,monospace}
    .ct3-btn{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#fff;border-radius:10px;padding:9px 11px;font:600 12px IBM Plex Sans,sans-serif;cursor:pointer}.ct3-btn:hover{background:rgba(255,255,255,.11)}.ct3-btn.primary{background:#6d5bd0;border-color:#8373dc}.ct3-btn.danger{border-color:#9a5366}
    .ct3-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ct3-field{display:grid;gap:5px;margin:10px 0}.ct3-field label{font:600 10px IBM Plex Mono,monospace;color:#aaa4c8;text-transform:uppercase}.ct3-field input,.ct3-field select{width:100%;box-sizing:border-box;background:#0f0b22;border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:9px;padding:10px;font:500 13px IBM Plex Sans,sans-serif}
     .ct3-body:has(#award-cert) label{display:grid;gap:6px;margin:12px 0}.ct3-body:has(#award-cert) :is(select,input:not([type=checkbox])){width:100%;min-height:44px;background:var(--surface,#08131f);color:var(--text,#fff);border:1px solid var(--border,#456);padding:8px}
    .ct3-search{width:100%;box-sizing:border-box;background:#0f0b22;border:0;border-bottom:1px solid rgba(255,255,255,.1);color:#fff;padding:15px 18px;font:500 16px IBM Plex Sans,sans-serif;outline:none}.ct3-command{width:100%;text-align:left;border:0;background:transparent;color:#fff;padding:11px 18px;cursor:pointer;display:flex;justify-content:space-between;gap:10px}.ct3-command:hover,.ct3-command.active{background:rgba(255,255,255,.065)}.ct3-command small{color:#9891ba}
    .ct3-health{display:inline-flex;align-items:center;gap:6px;margin-left:8px;vertical-align:middle}.ct3-dot{width:7px;height:7px;border-radius:50%;background:#72d5a1}.ct3-dot.warn{background:#e5bd6d}.ct3-dot.bad{background:#e8798f}
    #ct-data-help{position:fixed!important;top:calc(4px + env(safe-area-inset-top,0px))!important;right:calc(4px + env(safe-area-inset-right,0px))!important;z-index:9997;display:grid!important;place-items:center;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;transform:none!important;animation:none!important;border-radius:50%!important;cursor:pointer;color:#9eb1bf!important}#ct-data-help>span{display:grid;place-items:center;width:26px;height:26px;border:1px solid rgba(158,177,191,.35);border-radius:50%;background:#08131b;font:600 14px/1 ui-sans-serif,system-ui,sans-serif}#ct-data-help:is(:hover,:focus-visible)>span{color:#d7f8ff;border-color:#68c4cf}#ct-data-help:focus-visible{outline:2px solid #68c4cf!important;outline-offset:-4px}.ct3-btn:disabled{opacity:.6;cursor:wait}.ct3-refresh-status{white-space:pre-line;line-height:1.5}.ct3-health-counters{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:8px;margin:12px 0}.ct3-health-counter{padding:10px;border:1px solid var(--border,#456);border-radius:6px}.ct3-health-counter strong{display:block}.ct3-health-counter span{font-size:12px}.ct3-health-table{width:100%;border-collapse:collapse;font-size:12px}.ct3-health-table :is(th,td){padding:8px 4px;border-bottom:1px solid var(--border,#456);text-align:left;overflow-wrap:anywhere}
    .ct3-notice{padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);font-size:12px;color:#cbc5e6;margin:10px 0}.ct3-link{color:#b9adff;text-decoration:none}.ct3-link:hover{text-decoration:underline}
    @media(max-width:640px){.ct3-grid{grid-template-columns:1fr}.ct3-backdrop{padding:4vh 10px 18px}.ct3-body{max-height:78vh}#ct3-launcher{right:12px;bottom:12px}}
    /* Links styled as buttons must participate in line layout at their full
       padded height; inline anchors otherwise paint over adjacent paragraphs. */
    .ct3-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;max-width:100%;white-space:normal;overflow-wrap:anywhere;line-height:1.4;text-align:center;text-decoration:none;vertical-align:middle}
    .ct3-head>div,.ct3-row>div,.ct3-card,.ct3-field{min-width:0}
    .ct3-close{flex:0 0 auto;min-width:44px;min-height:44px}
    .ct3-title,.ct3-sub,.ct3-body{overflow-wrap:anywhere}
    .ct3-body :is(p,ul,ol){line-height:1.55}
    .ct3-body p{margin:12px 0}
    .ct3-body h3{line-height:1.35}
    .ct3-body .ct3-actions{gap:10px;margin:12px 0}
    .ct3-body [role=tabpanel]{padding-top:8px}
    .ct3-body [role=tabpanel][hidden]{display:none}
    [data-full-audit]{display:grid;gap:14px;margin-bottom:20px}
    [data-full-audit]>:is(h3,p){margin:0}
    [data-full-audit]>a.ct3-btn{justify-self:start}
    #ct3-connections-panel>.ct3-card{margin:16px 0}
    .ct3-health-counter{min-width:0;line-height:1.45}.ct3-health-counter strong{margin-bottom:4px}
    .ct3-body details{margin:14px 0}.ct3-body summary{line-height:1.45;cursor:pointer}
    @media(max-width:480px){.ct3-head{padding:14px;align-items:flex-start}.ct3-body{padding:14px}.ct3-row{flex-wrap:wrap;gap:8px}.ct3-body [role=tablist]{display:grid;grid-template-columns:1fr}.ct3-body [role=tablist]>.ct3-btn{width:100%}.ct3-pill{white-space:normal;max-width:100%}}
    @media(prefers-reduced-motion:no-preference){#ct3-launcher,.ct3-btn{transition:.15s ease}}
  `;

  function injectStyle() {
    if (document.getElementById('ct3-style')) return;
    const style = document.createElement('style'); style.id = 'ct3-style'; style.textContent = STYLE; document.head.appendChild(style);
  }

  let activeModal = null;
  let previousFocus = null;
  let todayTimer = null;
  function closeModal() {
    clearInterval(todayTimer);todayTimer=null;
    if (!activeModal) return;
    activeModal.remove(); activeModal = null;
    previousFocus?.focus?.(); previousFocus = null;
  }

  function modal({ title, subtitle = '', body = '', onMount }) {
    closeModal();
    previousFocus = document.activeElement;
    const wrap = document.createElement('div'); wrap.className = 'ct3-backdrop'; wrap.setAttribute('role', 'presentation');
    wrap.innerHTML = `<section class="ct3-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="ct3-head"><div><div class="ct3-title">${esc(title)}</div>${subtitle ? `<div class="ct3-sub">${esc(subtitle)}</div>` : ''}</div><button class="ct3-close" aria-label="Close">×</button></div><div class="ct3-body">${body}</div></section>`;
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) closeModal(); });
    wrap.querySelector('.ct3-close').addEventListener('click', closeModal);
    document.body.appendChild(wrap); activeModal = wrap;
    onMount?.(wrap);
    const focusable = wrap.querySelector('input,select,button,a'); focusable?.focus?.();
    return wrap;
  }

  function dueItems() {
    const exams = CERTS.map(cert => ({ cert, date: state.exams?.[cert.id], days: state.exams?.[cert.id] ? CT.dates.daysUntil(state.exams[cert.id]) : null }))
      .filter(x => x.date && x.days >= 0 && x.days <= 30).sort((a,b) => a.days - b.days);
    const renewals = CERTS.map(cert => ({ cert, info: state.passes?.[cert.id] ? CT.dates.expiryInfo(cert, state.passes[cert.id]) : null }))
      .filter(x => x.info && ['EXPIRED','URGENT','WARN'].includes(x.info.status)).sort((a,b) => (a.info.days ?? 9999) - (b.info.days ?? 9999));
    return { exams, renewals };
  }

  function showToday() {
    const calculatedAt=new Date();
    const explanation = CT.recommendations.explainTop();
    const top = explanation?.top;
    const due = dueItems();
    const health = CT.dataHealth.summary();
    const phase = CT.phases.currentPhase();
    const blockers = CT.phases.phaseBlockers(phase);
    const lastBackup = CT.storage.lastBackupAt();
    const backupAge = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;
    const topic=CT.topicEngine?.next({cert:top?.cert||null});
    const body = `
      <div class="ct3-grid">
        <div class="ct3-card"><h3>Best next move</h3>${top ? `<div class="ct3-big">${esc(top.name)}</div><div class="ct3-muted">Score ${top.score} · M${top.career.M} market · K${top.career.K} capability · ~${Math.round(top.estimatedHours)} focused hours</div><div class="ct3-notice">${esc(top.reasons.slice(0,3).join(' · '))}</div>` : '<div class="ct3-muted">No available recommendation.</div>'}${topic?`<h3>Study alongside it</h3><strong>${esc(topic.topic.title)}</strong><div class="ct3-muted">${esc(topic.topic.actions[0]||topic.topic.why)}</div>`:''}</div>
        <div class="ct3-card"><h3>Phase ${phase}</h3><div class="ct3-big">${blockers.length}</div><div class="ct3-muted">remaining blocker${blockers.length === 1 ? '' : 's'}</div><div class="ct3-list">${blockers.slice(0,3).map(b => `<div class="ct3-row"><span>${esc(b.label)}</span><span class="ct3-pill">${esc(b.type)}</span></div>`).join('') || '<div class="ct3-muted">Phase gate complete.</div>'}</div></div>
        <div class="ct3-card"><h3>Next 30 days</h3><div class="ct3-list">${due.exams.slice(0,4).map(x => `<div class="ct3-row"><span>${esc(x.cert.name)}</span><span>${x.days}d</span></div>`).join('') || '<div class="ct3-muted">No exams due.</div>'}</div></div>
        <div class="ct3-card"><h3>Verified fact fields</h3><div class="ct3-big">${health.averageConfidence}%</div><div class="ct3-muted">${health.stale} stale · ${health.review} review · ${health.unknown} unknown</div><div class="ct3-muted" style="margin-top:8px">Backup: ${backupAge == null ? 'never exported' : backupAge === 0 ? 'today' : `${backupAge}d ago`}</div></div>
      </div>
      ${due.renewals.length ? `<div class="ct3-card" style="margin-top:12px"><h3>Renewal attention</h3>${due.renewals.slice(0,5).map(x => `<div class="ct3-row"><span>${esc(x.cert.name)}</span><span class="ct3-pill">${esc(x.info.status)} ${x.info.days == null ? '' : `${x.info.days}d`}</span></div>`).join('')}</div>` : ''}
      <div class="ct3-notice" data-today-calculated>Recommendations recalculated ${esc(calculatedAt.toLocaleString())} from your current progress, evidence and bundled certification catalogue. Catalogue sources are not fetched live; check Data health before booking.</div>
      <div class="ct3-card ct-today-market" style="margin-top:12px"><h3>Latest available job-market matches</h3><div data-today-market-status role="status">Checking the published market feed…</div><div data-today-jobs></div></div>
      <div class="ct3-actions"><button class="ct3-btn primary" data-act="refresh-today">Refresh recommendations</button><button class="ct3-btn" data-act="recommend">All recommendations</button><button class="ct3-btn" data-act="health">Data health</button><button class="ct3-btn" data-act="sync">Sync vault</button><button class="ct3-btn" data-act="backup">Export backup</button><button class="ct3-btn" data-act="credentials">Awards &amp; funding</button></div>
      <details class="ct-today-tools"><summary>Additional tools</summary><div class="ct3-actions"><button class="ct3-btn" data-tool="ct-intel-launcher">Plan</button><button class="ct3-btn" data-tool="ct31-market-launcher">Market value</button><button class="ct3-btn" data-tool="ct-career-launcher">Career</button><button class="ct3-btn" data-tool="ct-github-sync-launcher">GitHub sync</button></div></details>`;
    modal({ title: "Today's Recommendations", subtitle: `${explanation?.goalLabel || 'Career plan'} · Cert Tracker v${CT.version.app}`, body, onMount(root) {
      root.dataset.todayRecommendations='true';
      root.querySelector('[data-act="refresh-today"]').addEventListener('click',showToday);
      root.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>{closeModal();document.getElementById(button.dataset.tool)?.click();}));
      root.querySelector('[data-act="recommend"]')?.addEventListener('click', showRecommendations);
      root.querySelector('[data-act="health"]')?.addEventListener('click', showDataHealth);
      root.querySelector('[data-act="credentials"]')?.addEventListener('click',showCredentialRecords);
      root.querySelector('[data-act="sync"]')?.addEventListener('click', showSync);
      root.querySelector('[data-act="backup"]')?.addEventListener('click', () => CT.storage.exportBackup());
      let loading=false;
      const refreshMarket=async()=>{
        if(loading||!root.isConnected)return;loading=true;
        try{
          const feed=await CT.jobMarket.load({force:true});
          if(root!==activeModal||!root.isConnected)return;
          const freshness=CT.jobMarket.freshness(feed),checked=new Date().toLocaleString();
          root.querySelector('[data-today-market-status]').textContent=`${freshness.label}. ${freshness.detail} Checked ${checked}.`;
          const jobs=CT.jobMarket.bestFit(feed,4);
          root.querySelector('[data-today-jobs]').innerHTML=jobs.map(({job,role})=>{
            let url='';try{const parsed=new URL(job.url);if(['https:','http:'].includes(parsed.protocol))url=parsed.href;}catch{}
            return `<div class="ct3-row"><div><strong>${esc(job.title)}</strong><div class="ct3-muted">${esc(job.company||'')} · ${esc(role?.label||'')} · ${esc(job.location||'UK')}</div></div>${url?`<a class="ct3-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">View listing</a>`:''}</div>`;
          }).join('')||'<div class="ct3-muted" style="margin-top:8px">No suitable published matches available. Your learning recommendations still work locally.</div>';
        }catch{if(root===activeModal)root.querySelector('[data-today-market-status]').textContent='Market feed unavailable. Local recommendations remain available.';}
        finally{loading=false;}
      };
      refreshMarket();
      todayTimer=setInterval(()=>{if(document.visibilityState==='visible')refreshMarket();},300000);
    }});
  }

  function showRecommendations() {
    const goal = CT.recommendations.currentGoal();
    const picks = CT.recommendations.recommend({ limit: 8 });
    const options = Object.entries(CT.recommendations.GOALS).map(([key, profile]) => `<option value="${esc(key)}" ${key === goal ? 'selected' : ''}>${esc(profile.label)}</option>`).join('');
    const rows = picks.map((item, index) => `<div class="ct3-card" style="margin-bottom:9px"><div class="ct3-row"><div><strong>${index + 1}. ${esc(item.name)}</strong><div class="ct3-muted">${esc(item.reasons.slice(0,4).join(' · '))}</div></div><div class="ct3-score">${item.score}</div></div><div class="ct3-muted">Effort ~${Math.round(item.estimatedHours)}h · Data confidence ${item.health.confidence}%${item.dependencies.missing.length ? ` · Blocked by ${item.dependencies.missing.length}` : ''}</div></div>`).join('');
    const body = `<div class="ct3-field"><label>Target role</label><select id="ct3-goal">${options}</select></div>${rows || '<div class="ct3-muted">No uncompleted recommendations.</div>'}`;
    modal({ title: 'Recommendation engine', subtitle: 'Scores career relevance, phase, prerequisites, effort, funding and data confidence', body, onMount(root) {
      root.querySelector('#ct3-goal').addEventListener('change', e => { CT.recommendations.setGoal(e.target.value); showRecommendations(); });
    }});
  }

  let healthCheckRunning=false,healthCheckReport='No manual checks run this session.';
  function dataHealthBody() {
    const s = CT.dataHealth.summary();
    const queue = CT.dataHealth.reviewQueue();
    const labels={identity:'Credential identity',availability:'Availability',eligibility:'Prerequisites / eligibility',blueprint:'Syllabus / blueprint',renewal:'Renewal / validity',price:'Regional price'};
    const counters=`<div class="ct3-health-counters">${[['Not currently verified',s.totalFacts-s.verifiedFacts],['Missing source links',s.missingSources],['Certification-level sources',s.exactSources],['Vendor-level sources',s.vendorSources],['Availability warnings',s.availabilityWarnings],['Records requiring review',queue.length],['Records with no flagged issues',s.healthy]].map(([label,value])=>`<div class="ct3-health-counter"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><table class="ct3-health-table"><caption>Recorded checks by field (within 180 days)</caption><thead><tr><th scope="col">Field</th><th scope="col">Verified</th><th scope="col">Not verified</th></tr></thead><tbody>${Object.entries(labels).map(([key,label])=>`<tr><th scope="row">${label}</th><td>${s.fieldTotals[key]}/${s.total}</td><td>${s.total-s.fieldTotals[key]}</td></tr>`).join('')}</tbody></table><div class="ct3-notice">Catalogue record dates: ${s.fresh} recent · ${s.review} due for review · ${s.stale} stale · ${s.unknown} unknown. These date counters do not establish factual accuracy. Verification coverage is ${s.verifiedFacts}/${s.totalFacts} recorded checks, not a measured accuracy score. Unchecked does not mean incorrect.</div>`;
    const body = `<div data-cert-data-health><section data-full-audit><h3>Background source audit</h3><p class="ct3-muted">Daily source scans · hourly, quota-limited market snapshots. Full scans run securely on GitHub; no token is stored in this page.</p><a class="ct3-btn" href="https://github.com/AlexanderT96/Cert-Tracker-Public/actions/workflows/full-audit.yml" target="_blank" rel="noopener noreferrer">Run full audit ↗</a><p class="ct3-muted">On GitHub, select Run workflow. Return here and Refresh checks after it finishes. A scan takes several minutes.</p><div data-full-audit-results role="status">Loading latest published audit…</div></section><div class="ct3-actions"><button class="ct3-btn primary" id="ct3-health-refresh"${healthCheckRunning?' disabled':''}>Refresh checks</button></div><p class="ct3-muted">Rechecks the loaded catalogue, verification dates, saved-data validity and recommendations; downloads the latest market snapshot and checks for an app update. This does not independently verify issuer facts or sync your private vault.</p><div class="ct3-notice ct3-refresh-status" role="status" id="ct3-health-refresh-status">${esc(healthCheckRunning?'Checking…':healthCheckReport)}</div><div class="ct3-grid"><div class="ct3-card"><h3>Recorded verification coverage</h3><div class="ct3-big">${s.verifiedFacts}/${s.totalFacts}</div><div class="ct3-muted">${s.verifiedFacts}/${s.totalFacts} dated field checks · ${s.priceVerified} prices verified</div></div><div class="ct3-card"><h3>Source coverage</h3><div class="ct3-big">${s.sourceCoverage}%</div><div class="ct3-muted">${s.total - s.missingSources}/${s.total} linked · ${s.exactSources} cert-level · ${s.vendorSources} vendor-level</div></div></div><div class="ct3-notice" style="margin-top:12px">Coverage means an official source is linked, not that every detail is verified. Verification counts identity, availability, eligibility, blueprint, renewal and regional price separately. Unknown fields are not verified. This is not a probability of correctness. Cert-level sources identify the credential; vendor-level sources still need exact-track verification. Source checks do not refresh price-verification dates.</div>${counters}<div class="ct3-card" style="margin-top:12px"><h3>Review queue · ${queue.length}</h3><div class="ct3-muted">${s.availabilityWarnings} credential-availability warnings</div>${queue.map(row => `<div class="ct3-row"><div><strong>${esc(row.name)}</strong><div class="ct3-muted">${esc(row.issues.join(' · '))}</div>${row.sourceNote ? `<div class="ct3-muted">${esc(row.sourceNote)}</div>` : ''}<div class="ct3-muted">Source checked: ${esc(row.sourceCheckedAt || 'not independently checked')} · Record dated: ${esc(row.verifiedAt || 'unknown')}</div>${row.sourceUrl ? `<a class="ct3-link" href="${esc(row.sourceUrl)}" target="_blank" rel="noopener">Official source</a>` : ''}</div><span class="ct3-pill">${esc(row.freshness)} · ${row.confidence}%</span></div>`).join('') || '<div class="ct3-muted">No records require review.</div>'}</div><div class="ct3-actions"><button class="ct3-btn" id="ct3-health-export">Export audit CSV</button></div></div>`;
    return `<div class="ct3-actions" role="tablist" aria-label="Information panel"><button class="ct3-btn primary" role="tab" id="ct3-info-tab" aria-selected="true" aria-controls="ct3-info-panel" data-health-tab="info">Accuracy &amp; checks</button><button class="ct3-btn" role="tab" id="ct3-connections-tab" aria-selected="false" aria-controls="ct3-connections-panel" tabindex="-1" data-health-tab="connections">Account Connections</button></div><section role="tabpanel" id="ct3-info-panel" aria-labelledby="ct3-info-tab">${body}</section><section role="tabpanel" id="ct3-connections-panel" aria-labelledby="ct3-connections-tab" hidden>${accountConnectionsBody()}</section>`;
  }
  function accountConnectionsBody(){
    return `<p class="ct3-muted">Sign in only on the provider's own website. This public tracker never asks for your password or stores account tokens. These are setup links, not an OAuth connection.</p><div class="ct3-card"><h3>GitHub · background audits</h3><p>Use your existing GitHub account to run audits. GitHub checks whether you have access to this repository; the tracker cannot see your sign-in status.</p><div class="ct3-actions"><a class="ct3-btn primary" href="https://github.com/AlexanderT96/Cert-Tracker-Public/actions/workflows/full-audit.yml" target="_blank" rel="noopener noreferrer">Open GitHub / sign in ↗</a></div><p class="ct3-muted">Select Run workflow on GitHub. The audit can read the public catalogue and publish generated reports to this repository. It does not access your private tracker progress or other repositories.</p></div><div class="ct3-card"><h3>Adzuna · UK job-market data</h3><p data-connection-market-status role="status">Provider status has not been checked.</p><p>Adzuna supplies an application ID and key, not a one-click account-linking flow.</p><div class="ct3-actions"><a class="ct3-btn" href="https://developer.adzuna.com/login" target="_blank" rel="noopener noreferrer">Sign in to Adzuna ↗</a><a class="ct3-btn" href="https://developer.adzuna.com/signup" target="_blank" rel="noopener noreferrer">Create account ↗</a><a class="ct3-btn primary" href="https://github.com/AlexanderT96/Cert-Tracker-Public/settings/secrets/actions" target="_blank" rel="noopener noreferrer">Secure setup on GitHub ↗</a></div><p>Add two repository secrets: <code>ADZUNA_APP_ID</code> and <code>ADZUNA_APP_KEY</code>. Then run the full audit above. Never paste either value into this tracker.</p><p class="ct3-muted">The background workflow uses these keys to request job data within its quota. Your private progress is not sent to Adzuna. <a href="https://developer.adzuna.com/docs/terms_of_service" target="_blank" rel="noopener noreferrer">Check provider terms</a>. To disconnect, remove both repository secrets; revoke the key with Adzuna if needed. Previously published public data is not erased by disconnecting.</p><button class="ct3-btn" id="ct3-connections-check">Check published provider status</button></div><p class="ct3-muted">Public certification sources need no account. Daily audits work without Adzuna; UK vacancy updates need its credentials. Status below reflects the last published job, not a live account session.</p>`;
  }
  function bindHealthPanel(root){
    const tabs=[...root.querySelectorAll('[data-health-tab]')];
    const select=tab=>{for(const button of tabs){const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;button.classList.toggle('primary',active);root.querySelector('#'+button.getAttribute('aria-controls')).hidden=!active;}};
    tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',event=>{const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:null;if(next!==null){event.preventDefault();select(tabs[next]);tabs[next].focus();}});});
    root.querySelector('#ct3-connections-check').addEventListener('click',async event=>{
      const button=event.currentTarget,target=root.querySelector('[data-connection-market-status]');button.disabled=true;target.textContent='Checking the latest published provider result…';
      try{const feed=await CT.jobMarket.load({force:true});if(!root.isConnected)return;const at=Date.parse(feed?.lastAttemptAt),stamp=Number.isFinite(at)?new Date(at).toLocaleString():'unknown';target.textContent=(CT.jobMarket.usable(feed)?'Recent successful provider snapshot. ':feed?.providerStatus?.includes('Adzuna credentials not configured')?'Setup required: Adzuna credentials were missing at the last run. ':'Provider connection is not currently confirmed. ')+(feed?.providerStatus||[]).join(' · ')+' Last published attempt: '+stamp+'. This is not your account sign-in status.';}catch{if(root.isConnected)target.textContent='Provider status unavailable. No connection has been confirmed.';}finally{button.disabled=false;}
    });
    root.querySelector('#ct3-health-export').addEventListener('click',CT.dataHealth.exportAudit);
    root.querySelector('#ct3-health-refresh').addEventListener('click',refreshHealthChecks);
    loadAuditReport(root);
  }
  function showDataHealth(){
    modal({title:'Certification data health',subtitle:'Sources, recorded verification and current checks',body:dataHealthBody(),onMount:bindHealthPanel});
  }
  async function loadAuditReport(root){
    const target=root.querySelector('[data-full-audit-results]');if(!target)return;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
    try{
      const auditURL=global.location?.hostname==='alexandert96.github.io'?'https://raw.githubusercontent.com/AlexanderT96/Cert-Tracker-Public/main/data/tracker-audit.json':'data/tracker-audit.json';
      const response=await fetch(auditURL+'?check='+Date.now(),{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('Not published');
      const report=await response.json(),s=report.summary;
      if(report.schemaVersion!==1||!s||!Array.isArray(report.sources)||!Array.isArray(report.facts))throw Error('Invalid report');
      const completed=Date.parse(report.completedAt),age=Date.now()-completed;
      if(!Number.isFinite(age)||age< -60000)throw Error('Invalid date');
      const safeLink=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:'';}catch{return '';}};
      const row=r=>{const url=safeLink(r.url);return '<div class="ct3-row"><div>'+(url?'<a class="ct3-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(new URL(url).hostname)+'</a>':'Source')+'<div class="ct3-muted">'+esc((r.refs||[]).join(', '))+'</div></div><span>'+esc(r.changed?'Changed — review required':r.status)+'</span></div>';};
      const flagged=report.sources.filter(r=>r.changed||['broken','blocked','unavailable','manual-review'].includes(r.status));
      if(!root.isConnected)return;
      target.innerHTML='<div class="ct3-notice">Last scan: '+esc(new Date(completed).toLocaleString())+' · '+(age>36*3600000?'OUTDATED — run a new scan':esc(report.status))+'. Checked pages are not a guarantee of factual accuracy.</div><div class="ct3-health-counters">'+[['Navigational links',s.navigationalLinks??s.sources],['Evidence sources',s.evidenceSources??Math.max(0,(s.sources||0)-(s.discoveryLinks||0))],['Pages retrieved',s.checked],['Changed pages',s.changed],['New baselines',s.newBaselines],['Broken links',s.broken],['Unavailable',s.unavailable],['Access blocked',s.blocked],['Search links (not evidence)',s.discoveryLinks],['Non-text review',s.manualReview],['Exact name matches',s.identityMatches],['Fields requiring review',s.fieldsRequiringReview]].map(([label,n])=>'<div class="ct3-health-counter"><strong>'+esc(n)+'</strong><span>'+label+'</span></div>').join('')+'</div><p class="ct3-muted">'+esc(s.certifications)+' certifications and '+esc(s.roles)+' roles inventoried. Search navigation is separated from evidence. No issuer facts or personal progress were overwritten.</p><details><summary>Source changes and access problems ('+flagged.length+')</summary>'+flagged.map(row).join('')+'</details><details><summary>Fact-review coverage</summary>'+report.facts.map(f=>'<div class="ct3-row"><div><strong>'+esc(f.name)+'</strong><div class="ct3-muted">'+Object.entries(f.fields||{}).map(([key,value])=>esc(key)+': '+esc(value.status)).join(' · ')+'</div></div></div>').join('')+'</details><p><a class="ct3-link" href="'+esc(auditURL)+'" target="_blank" rel="noopener">Full source evidence and timestamps (JSON)</a></p>';
    }catch{if(root.isConnected)target.textContent='Audit report unavailable or not yet published. Run the full audit on GitHub; unavailable checks are not counted as passed.';}
    finally{clearTimeout(timer);}
  }
  async function checkPublishedVersion(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    try{
      const response=await fetch('src/config.js?health-check='+Date.now(),{cache:'no-store',credentials:'same-origin',signal:controller.signal});
      if(!response.ok)throw Error('Unavailable');
      const version=(await response.text()).match(/app:\s*['"]([0-9.]+)['"]/);
      if(!version)throw Error('No version');
      return version[1]===CT.version.app?'App version: '+CT.version.app+' matches published metadata.':'App update available: '+version[1]+'. Save your changes and reopen/reload to load the latest catalogue.';
    }catch{return 'App version check unavailable; using loaded '+CT.version.app+'.';}finally{clearTimeout(timer);}
  }
  async function refreshHealthChecks(){
    if(healthCheckRunning)return;
    healthCheckRunning=true;
    const button=activeModal?.querySelector('#ct3-health-refresh');
    if(button)button.disabled=true;
    const status=activeModal?.querySelector('#ct3-health-refresh-status');if(status)status.textContent='Checking…';
    const lines=[];
    try{
      const schema=CT.validation.validateCertData();
      lines.push('Catalogue structure: '+schema.errors.length+' errors · '+schema.warnings.length+' warnings.');
      const saved=CT.storage.validateBackup(CT.storage.serializableState());
      lines.push('Saved-data structure: '+(saved.ok?'valid':saved.errors.length+' issues')+'.');
      const picks=CT.recommendations.recommend({limit:3}),roles=CT.marketReadiness.roles();
      lines.push('Recalculated '+picks.length+' next-step suggestions and '+roles.length+' role assessments.');
      badgeSummary=CT.dataHealth.summary();badgeSummaryDay=new Date().toISOString().slice(0,10);
      lines.push('Recorded verification: '+badgeSummary.verifiedFacts+'/'+badgeSummary.totalFacts+' fields. Source links: '+(badgeSummary.total-badgeSummary.missingSources)+'/'+badgeSummary.total+'.');
      const [market,version]=await Promise.allSettled([CT.jobMarket.load({force:true}),checkPublishedVersion()]);
      if(market.status==='fulfilled'){
        const feed=market.value,fresh=CT.jobMarket.freshness(feed);
        lines.push('Market: '+fresh.label+'. '+fresh.detail);
        lines.push('Published listings: '+(feed.jobs?.length||0)+' · usable recent listings: '+(CT.jobMarket.usable(feed)?feed.jobs.filter(CT.jobMarket.recentJob).length:0)+'.');
      }else lines.push('Market refresh unavailable; no new provider data confirmed.');
      lines.push(version.status==='fulfilled'?version.value:'App version check unavailable.');
    }catch{lines.push('Some checks could not finish. No verification dates or private vault data were changed.');}
    finally{
      healthCheckRunning=false;
      healthCheckReport='Checks run '+new Date().toLocaleString()+'\n'+lines.join('\n')+'\nIssuer facts not independently reverified; existing verification dates are preserved.';
      const root=activeModal;if(root?.querySelector('[data-cert-data-health]')){root.querySelector('.ct3-body').innerHTML=dataHealthBody();bindHealthPanel(root);root.querySelector('#ct3-health-refresh').focus({preventScroll:true});}
    }
  }

  function showDiagnostics() {
    const d = CT.validation.diagnostics;
    const body = `<div class="ct3-grid"><div class="ct3-card"><h3>Schema</h3><div class="ct3-big">${d.ok ? 'PASS' : 'FAIL'}</div><div class="ct3-muted">${d.certCount} records · ${d.errors.length} errors · ${d.warnings.length} warnings</div></div><div class="ct3-card"><h3>Storage</h3><div class="ct3-big">v${CT.version.storage}</div><div class="ct3-muted">App ${esc(CT.version.app)} · Data ${CT.version.data}</div></div></div>${d.errors.length ? `<div class="ct3-card" style="margin-top:12px"><h3>Errors</h3>${d.errors.map(x => `<div class="ct3-row">${esc(x)}</div>`).join('')}</div>` : ''}${d.warnings.length ? `<div class="ct3-card" style="margin-top:12px"><h3>Warnings</h3>${d.warnings.slice(0,30).map(x => `<div class="ct3-row">${esc(x)}</div>`).join('')}</div>` : ''}`;
    modal({ title: 'Diagnostics', subtitle: 'Runtime schema and migration checks', body });
  }

  function showSync() {
    const cfg = CT.sync.getConfig();
    const connected = CT.sync.isConnected();
    const body = `<div class="ct3-notice">Sync is optional. Vault contents are AES-GCM encrypted in your browser before upload. The vault passphrase and WebDAV password are never written to localStorage.</div><div class="ct3-field"><label>WebDAV vault URL</label><input id="ct3-sync-url" value="${esc(cfg.endpoint)}" placeholder="https://cloud.example.com/remote.php/dav/files/user/cert-tracker.ctvault"></div><div class="ct3-field"><label>Username</label><input id="ct3-sync-user" value="${esc(cfg.username)}"></div><div class="ct3-field"><label>WebDAV password (session only)</label><input id="ct3-sync-password" type="password" autocomplete="current-password"></div><div class="ct3-field"><label>Vault passphrase (10+ chars, session only)</label><input id="ct3-sync-passphrase" type="password" autocomplete="new-password"></div><div class="ct3-field"><label><input id="ct3-sync-auto" type="checkbox" ${cfg.autoSync ? 'checked' : ''}> Auto-sync while this browser session is connected</label></div><div class="ct3-actions"><button class="ct3-btn primary" id="ct3-connect">${connected ? 'Reconnect session' : 'Connect session'}</button><button class="ct3-btn" id="ct3-smart">Smart sync</button><button class="ct3-btn" id="ct3-push">Push</button><button class="ct3-btn" id="ct3-pull">Pull</button></div><div class="ct3-actions"><button class="ct3-btn" id="ct3-vault-export">Encrypted file backup</button><button class="ct3-btn" id="ct3-vault-import">Import encrypted file</button><button class="ct3-btn danger" id="ct3-disconnect">Forget session secrets</button></div><div id="ct3-sync-status" class="ct3-muted" style="margin-top:12px">${connected ? 'Session connected.' : 'Not connected.'}</div>`;
    modal({ title: 'Encrypted sync vault', subtitle: 'WebDAV / Nextcloud / ownCloud compatible', body, onMount(root) {
      const status = root.querySelector('#ct3-sync-status');
      const setStatus = text => status.textContent = text;
      const saveCfg = () => CT.sync.setConfig({ endpoint: root.querySelector('#ct3-sync-url').value, username: root.querySelector('#ct3-sync-user').value, autoSync: root.querySelector('#ct3-sync-auto').checked });
      const connect = () => { saveCfg(); CT.sync.connect({ password: root.querySelector('#ct3-sync-password').value, passphrase: root.querySelector('#ct3-sync-passphrase').value }); setStatus('Session connected. Secrets remain in memory only.'); };
      root.querySelector('#ct3-connect').addEventListener('click', () => { try { connect(); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-smart').addEventListener('click', async () => { try { if (!CT.sync.isConnected()) connect(); setStatus('Syncing…'); const r = await CT.sync.smartSync(); setStatus(`Sync complete: ${r.direction}.`); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-push').addEventListener('click', async () => { try { if (!CT.sync.isConnected()) connect(); setStatus('Uploading encrypted vault…'); await CT.sync.push(); setStatus('Push complete.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-pull').addEventListener('click', async () => { try { if (!CT.sync.isConnected()) connect(); setStatus('Downloading encrypted vault…'); await CT.sync.pull(); setStatus('Pull complete.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-vault-export').addEventListener('click', async () => { try { const p = root.querySelector('#ct3-sync-passphrase').value; await CT.sync.exportEncryptedVault(p); setStatus('Encrypted backup exported.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-vault-import').addEventListener('click', async () => { try { const p = root.querySelector('#ct3-sync-passphrase').value; await CT.sync.importEncryptedVaultFile(p); setStatus('Encrypted backup restored.'); } catch (e) { setStatus(e.message); } });
      root.querySelector('#ct3-disconnect').addEventListener('click', () => { CT.sync.disconnect(); root.querySelector('#ct3-sync-password').value = ''; root.querySelector('#ct3-sync-passphrase').value = ''; setStatus('Session secrets forgotten.'); });
    }});
  }


  function showCredentialRecords(selectedId=CERTS[0].id){
    const cert=CERTS.find(c=>c.id===selectedId)||CERTS[0],r=CT.credentials.record(cert),sel=(a,b)=>a===b?' selected':'';
    modal({title:'Credential awards & funding',subtitle:'Exam passes are not always full awards. Changes stay in your saved tracker data.',body:`<label>Credential<select id="award-cert">${CERTS.map(c=>`<option value="${c.id}"${sel(c.id,cert.id)}>${esc(c.name)}</option>`).join('')}</select></label><p>${esc(cert.requiresAwardConfirmation?'Full award confirmation is required before this credential counts towards market access.':'Existing pass dates are preserved.')}</p>${cert.requiresExternalPrerequisites?`<label><input type="checkbox" id="award-eligibility"${r.eligibilityConfirmed?' checked':''}> I checked the complete active issuer prerequisite chain, including credentials not tracked here</label><p>${esc(cert.prerequisites)}</p>`:''}<label>Award status<select id="award-status"><option value="">Use recorded pass / issuer requirements</option>${['PENDING','ASSOCIATE','ACTIVE','EXPIRED'].map(v=>`<option${sel(v,r.status)}>${v}</option>`).join('')}</select></label><label>Issuer-confirmed expiry<input type="date" id="award-expiry" value="${esc(r.expiry||'')}"></label><label>Renewed on<input type="date" id="award-renewed" value="${esc(r.renewedAt||'')}"></label><label>Funding<select id="award-funding"><option value="self">Self-funded / not confirmed</option><option value="employer"${sel(r.funding,'employer')}>Employer funding confirmed</option></select></label><label>Total quoted cost (£, blank = catalogue estimate)<input type="number" min="0" id="award-cost" value="${r.cost??''}"></label><p>Include required courses, exam, taxes and travel in your quote. Catalogue amounts are estimates. Confirm awards and renewals against the issuer record; reminders run when this app opens, not independently in the background.</p><p id="award-error" role="alert"></p><button class="ct3-btn primary" id="award-save">Save record</button>`,onMount(root){
      root.querySelector('#award-cert').addEventListener('change',e=>showCredentialRecords(e.target.value));
      root.querySelector('#award-save').addEventListener('click',()=>{
        const row={funding:root.querySelector('#award-funding').value};if(cert.requiresExternalPrerequisites)row.eligibilityConfirmed=root.querySelector('#award-eligibility').checked;
        for(const [key,id]of [['status','award-status'],['expiry','award-expiry'],['renewedAt','award-renewed']])if(root.querySelector('#'+id).value)row[key]=root.querySelector('#'+id).value;
        const cost=root.querySelector('#award-cost').value;if(cost!=='')row.cost=Number(cost);
        const customization={...state.customization,credentials:{...state.customization?.credentials,[cert.id]:row}},check=CT.storage.validateBackup({version:CT.version.backup,customization});
        if(!check.ok){root.querySelector('#award-error').textContent=check.errors.join(' ');return;}
        state.customization=customization;save.customization();closeModal();showToday();
      });
    }});
  }
  const commands = [
    { name: "Today's Recommendations", hint: 'Current progress and latest published market data', action: showToday },
    { name: 'Recommendations', hint: 'Best next certification', action: showRecommendations },
    { name: 'Credential awards & funding', hint: 'Award status, renewals and confirmed costs', action: showCredentialRecords },
    { name: 'Data health', hint: 'Sources and freshness', action: showDataHealth },
    { name: 'Encrypted sync', hint: 'Multi-device vault', action: showSync },
    { name: 'Undo last change', hint: 'Restore previous saved state', action: () => CT.storage.undoLastChange() },
    { name: 'Export backup', hint: 'JSON recovery copy', action: () => CT.storage.exportBackup() },
    { name: 'Export calendar', hint: 'Exam and expiry ICS', action: () => CT.exports.downloadICS() },
    { name: 'Diagnostics', hint: 'Schema and runtime checks', action: showDiagnostics }
  ];

  function showCertQuickView(cert) {
    const health = CT.dataHealth.record(cert);
    const recommendation = CT.recommendations.score(cert);
    modal({ title: cert.name, subtitle: cert.code || cert.id, body: `<div class="ct3-grid"><div class="ct3-card"><h3>Career score</h3><div class="ct3-big">${recommendation.score}</div><div class="ct3-muted">Goal-aware ranking</div></div><div class="ct3-card"><h3>Verified fact fields</h3><div class="ct3-big">${health.confidence}%</div><div class="ct3-muted">${esc(health.freshness)} · ${esc(health.sourceLevel)} source</div></div></div><div class="ct3-card" style="margin-top:12px"><h3>Why it ranks here</h3>${recommendation.reasons.map(r => `<div class="ct3-row">${esc(r)}</div>`).join('') || '<div class="ct3-muted">No ranking factors available.</div>'}</div>${health.sourceUrl ? `<div class="ct3-actions"><a class="ct3-btn ct3-link" href="${esc(health.sourceUrl)}" target="_blank" rel="noopener">Open official source</a></div>` : ''}` });
  }

  function showPalette() {
    const body = `<input id="ct3-search" class="ct3-search" placeholder="Search commands or certifications…" autocomplete="off"><div id="ct3-results"></div>`;
    modal({ title: 'Command palette', subtitle: 'Ctrl/⌘ + K', body, onMount(root) {
      const input = root.querySelector('#ct3-search'); const results = root.querySelector('#ct3-results');
      function render() {
        const q = input.value.trim().toLowerCase();
        const commandMatches = commands.filter(c => !q || `${c.name} ${c.hint}`.toLowerCase().includes(q)).slice(0, 8);
        const certMatches = q ? CERTS.filter(c => `${c.name} ${c.code || ''} ${c.vendor || ''}`.toLowerCase().includes(q)).slice(0, 8) : [];
        results.innerHTML = commandMatches.map((c,i) => `<button class="ct3-command" data-command="${i}"><span>${esc(c.name)}</span><small>${esc(c.hint)}</small></button>`).join('') + certMatches.map((c,i) => `<button class="ct3-command" data-cert="${i}"><span>${esc(c.name)}</span><small>${esc(c.code || c.track)}</small></button>`).join('');
        [...results.querySelectorAll('[data-command]')].forEach((el,i) => el.addEventListener('click', () => commandMatches[i].action()));
        [...results.querySelectorAll('[data-cert]')].forEach((el,i) => el.addEventListener('click', () => showCertQuickView(certMatches[i])));
      }
      input.addEventListener('input', render); render(); input.focus();
    }});
  }

  function addLauncher() {
    if (document.getElementById('ct3-launcher')) return;
    const button = document.createElement('button'); button.id = 'ct3-launcher'; button.type = 'button'; button.textContent = "Today's Recommendations"; button.setAttribute('aria-label', "Open Today's Recommendations");button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click', showToday); document.body.appendChild(button);
  }

  function addHealthBadge() {
    const host = document.querySelector('.header > div:first-child');
    if (!host) return;
    const day=new Date().toISOString().slice(0,10);
    if(!badgeSummary||badgeSummaryDay!==day){badgeSummary=CT.dataHealth.summary();badgeSummaryDay=day;}
    let badge=document.getElementById('ct-data-help');
    if(badge&&badge.parentElement!==host)host.appendChild(badge);
    if(!badge){badge=document.createElement('button');badge.id='ct-data-help';badge.className='ct3-health';badge.type='button';badge.setAttribute('aria-haspopup','dialog');badge.setAttribute('aria-label','Data accuracy and verification');badge.title='Data accuracy and verification';badge.addEventListener('click',showDataHealth);const icon=document.createElement('span');icon.textContent='?';icon.setAttribute('aria-hidden','true');badge.appendChild(icon);host.appendChild(badge);}
  }
  let badgeSummary=null,badgeSummaryDay='',initialised=false;

  function maybeOnboard() {
    if (localStorage.getItem(CT.config.onboardingKey)) return;
    const existing = Object.keys(state.passes || {}).length || Object.keys(state.myPath || {}).length;
    if (existing) { localStorage.setItem(CT.config.onboardingKey, 'migrated'); return; }
    modal({ title: 'Cert Tracker v3', subtitle: 'Your private career operating system', body: `<div class="ct3-card"><h3>What changed</h3><div class="ct3-row">Today view prioritises what matters now.</div><div class="ct3-row">Recommendations adapt to your target role.</div><div class="ct3-row">Certification data exposes freshness and source confidence.</div><div class="ct3-row">Optional encrypted sync keeps devices aligned without a Cert Tracker backend.</div></div><div class="ct3-actions"><button class="ct3-btn primary" id="ct3-onboard-done">Start</button></div>`, onMount(root) { root.querySelector('#ct3-onboard-done').addEventListener('click', () => { localStorage.setItem(CT.config.onboardingKey, '1'); closeModal(); showToday(); }); }});
  }

  function backupReminder() {
    const last = CT.storage.lastBackupAt();
    const age = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
    if (age > 14 && typeof showToast === 'function') setTimeout(() => showToast('Backup is overdue — use Today → Export backup'), 1400);
  }

  function init() {
    if(initialised){addHealthBadge();return;}initialised=true;
    injectStyle(); addLauncher(); addHealthBadge(); maybeOnboard(); backupReminder();
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); showPalette(); }
      else if (e.key === 'Escape') closeModal();
    });
    CT.events.on('goal-changed', addHealthBadge);
    CT.events.on('state-restored', () => { closeModal(); setTimeout(showToday, 0); });
  }

  CT.ux = Object.freeze({ init, refreshHealthBadge:addHealthBadge, modal, closeModal, showToday, showPalette, showRecommendations, showDataHealth, showSync, showDiagnostics });
})(window);
