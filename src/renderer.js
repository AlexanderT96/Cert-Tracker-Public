

function certPhase(cert) { return window.CertTrackerV3?.store?.effectivePhase ? window.CertTrackerV3.store.effectivePhase(cert) : Number(cert?.phase || 6); }
function today() { return new Date().toISOString().split('T')[0]; }
function formatPassDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
function addMonths(dateStr, months) { const d = new Date(dateStr); d.setMonth(d.getMonth() + months); return d; }
function daysUntil(date) { return Math.floor((new Date(date) - new Date()) / 86400000); }
function fmt(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function escape(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}



function expiryInfo(cert, passDate) {
  if (!passDate) return { status: 'PENDING', days: null, expiry: null };
  if (cert.validity === null) return { status: 'NEVER', days: null, expiry: null };
  if (!cert.validity) return { status: 'NOEXP', days: null, expiry: null };
  const expiry = addMonths(passDate, cert.validity);
  const days = daysUntil(expiry);
  if (isNaN(days)) return `<span class="status-badge status-warn">date?</span>`;
  const status = days < 0 ? 'EXPIRED' : days <= 60 ? 'URGENT' : days <= 180 ? 'WARN' : 'OK';
  return { status, days, expiry };
}
function statusBadgeHTML(status, days) {
  if (status === 'PENDING') return `<span class="status-badge status-pending">Not passed</span>`;
  if (status === 'NEVER')   return `<span class="status-badge status-never">Never expires</span>`;
  if (status === 'NOEXP')   return `<span class="status-badge status-noexp">No expiry</span>`;
  if (status === 'EXPIRED') return `<span class="status-badge status-expired">Expired ${Math.abs(days)}d ago</span>`;
  if (status === 'URGENT')  return `<span class="status-badge status-urgent">⚠ ${days}d left</span>`;
  if (status === 'WARN')    return `<span class="status-badge status-warn">${days}d left</span>`;
  return `<span class="status-badge status-ok">${days}d left</span>`;
}
function progressBarHTML(pct, color = 'var(--blue)', height = '6px') {
  return `<div class="progress" style="height:${height}"><div class="progress-bar" style="width:${pct}%;background:${color}"></div></div>`;
}
function examBadgeHTML(certId) {
  const ed = state.exams[certId];
  if (!ed) return `<span class="status-badge status-pending">Not booked</span>`;
  const d = daysUntil(new Date(ed));
  if (d < 0)   return `<span class="status-badge status-expired">Was ${Math.abs(d)}d ago</span>`;
  if (d === 0) return `<span class="status-badge status-urgent">⚠ Today</span>`;
  if (d <= 7)  return `<span class="status-badge status-urgent">⚠ ${d}d away</span>`;
  if (d <= 30) return `<span class="status-badge status-warn">${d}d away</span>`;
  return `<span class="status-badge status-ok">${d}d away</span>`;
}

function priorityScore(cert) {
  if (cert.gateway) return 5;                                    // P1
  if (cert.track === 'CORE') return 4;                           // P2
  if (cert.track === 'ROLE-DRIVEN' && cert.employer) return 3;   // P3
  if (cert.track === 'CONDITIONAL' && cert.roi >= 8) return 3;   // P3
  if (cert.track === 'CONDITIONAL' && cert.roi >= 6) return 2;   // P4
  return 1;                                                      // P5
}
function priorityTag(n) { return ({ 5:'P1', 4:'P2', 3:'P3', 2:'P4', 1:'P5' })[n] || 'P5'; }
function priorityLabel(n) { return ({ 5:'MUST', 4:'CORE', 3:'IF TRIGGERED', 2:'SITUATIONAL', 1:'DROP FIRST' })[n] || 'DROP'; }

function weeklyActions(cert) {
  if (!cert) return [];
  const actions = [];
  const id = cert.id;
  const code = cert.code || '';
  const examBooked = !!state.exams[id];
  const examDate = examBooked ? new Date(state.exams[id]) : null;
  const daysToExam = examDate ? Math.floor((examDate - new Date()) / 86400000) : null;
  const depsMet = !cert.deps || cert.deps.every(d => state.passes[d]);

  if (!depsMet) {
    const blocker = cert.deps.find(d => !state.passes[d]);
    const blockerCert = CERTS.find(c => c.id === blocker);
    if (blockerCert) {
      actions.push(`⚠ Pass ${blockerCert.code || blockerCert.name} first — it's the dependency unlocking ${code || cert.name}.`);
    }
  }

  if (examBooked && daysToExam !== null && daysToExam >= 0 && daysToExam <= 14) {
    actions.push(`📝 Exam in ${daysToExam} day${daysToExam === 1 ? '' : 's'} — switch from study mode to practice exams. 80%+ on Boson/Dion practice before exam day.`);
  } else if (!examBooked && depsMet) {
    actions.push(`📅 Book the exam window. Picking a date forces commitment and reveals pace gaps early.`);
  }

  const studyMap = {
    'security-plus':  ['Watch Professor Messer SY0-701 free YouTube series (~12 hrs total — break into 30-min blocks).', 'Drill subnetting and port memorisation daily — 15 min via subnettingpractice.com.'],
    'cysa-plus':      ['Build one KQL query a day in a free Sentinel tenant — start with sign-in anomalies.', 'Review Jason Dion CySA+ Udemy practice exam questions in 30-min daily blocks.'],
    'secai-plus':     ['Read OWASP LLM Top 10 (~2 hrs total). Use it as a core reference and verify coverage against the current exam objectives.', 'Run one PyRIT probe against the Azure OpenAI sandbox this week.'],
    'az-104':         ['Spin up a free Azure tenant and follow Scott Duffy AZ-104 Udemy Module 1.', 'Build one VNet + subnet + NSG combo from scratch (no GUI — use CLI or Bicep).'],
    'az-400':         ['Set up an Azure DevOps pipeline that deploys a Bicep template via OIDC — 2 hours, covers ~30% of the exam.', 'Watch John Savill AZ-400 Study Cram (~4 hrs, free).'],
    'sc-300':         ['Configure a Conditional Access policy with named locations and break-glass account in the Entra tenant.', 'Document one PIM activation flow as a runbook — exportable portfolio piece.'],
    'sc-500':         ['Spin up Sentinel free trial and connect Defender for Cloud as a data source.', 'Write one custom KQL detection rule — start simple (failed sign-ins from impossible-travel pattern).'],
    'az-305':         ['Watch John Savill AZ-305 Study Cram (~6 hrs, free) — comes right before exam, not at study start.', 'Read 3 Azure Architecture Center reference architectures in detail this week.'],
    'cissp':          ['Listen to one Pete Zerger CISSP Cram episode on commute (free YouTube, ~1 hr each).', 'Drill CISSP MCQs daily — Boson or Wannapractice. Aim for 100/day in final 2 weeks.'],
    'terraform':['Write one Terraform module for an Azure resource the candidate use in relevant hands-on experience.', 'Read HashiCorp Terraform Associate study guide section by section, hands-on after each.'],
    'cka':            ['Set up local Kubernetes via kind or minikube. Practise kubectl until muscle memory.', 'Run through Killer.sh CKA simulator — 2 sessions included with exam booking.'],
    'cks':            ['Deploy Falco in the kind cluster. Write one custom rule that catches a privileged container.', 'Read CIS Kubernetes Benchmark — 80% of CKS gotchas come from there.'],
    'sc-200':         ['Build a hunting query in Sentinel that finds first-time sign-ins from a country.', 'Wire a Logic App to auto-isolate a device based on a Defender alert.'],
    'sc-401':         ['Configure 3 sensitivity labels with auto-labelling rules in Purview free trial.', 'Build one DLP policy that detects credit-card numbers in Teams chats.'],
    'az-140':         ['Deploy a 2-host AVD pool in the Azure tenant. Cost it for 25 concurrent users.', 'Configure FSLogix profile containers — covers ~25% of the exam.'],
    'az-700':         ['Build hub-and-spoke topology with Azure Firewall and one peered spoke.', 'Configure Private Endpoint for one PaaS service — covers Private Link section.'],
    'md-102':         ['Decision week: book the exam OR remove from CV and skip. Do not let it drift.', 'If proceeding: deploy one Autopilot enrolment profile in M365 Developer Tenant.'],
    'az-900':         ['Watch John Savill AZ-900 Study Cram (~4 hrs, free).', 'Take Microsoft Learn practice assessment — score 80%+ before booking.'],
    'sc-900':         ['Read Microsoft Learn SC-900 path (~6 hrs).', 'Practice questions on Microsoft Learn until 85%+.'],
    'ccna':           ['Set up Cisco Packet Tracer (free) and build a 2-router static-route lab.', 'Watch Jeremy IT Lab CCNA YouTube — Module 1 (free).'],
    'mcit':           ['Complete Milestone XProtect VMS Essentials (free, ~4 hrs) in the Milestone Learning Portal.', 'Build a small XProtect Express+ test deployment — even just two cameras.'],
    'mcie':           ['Tour the Milestone Integration Tools and document one integration scenario.', 'Practise XProtect troubleshooting flows — the exam tests these heavily.'],
    'acp':            ['Complete the Axis Academy ACP eLearning path (free, ~15 hrs).', 'Configure one Axis camera end-to-end in the home lab — record the steps.'],
    'lca':            ['Complete LenelS2 fundamentals on the partner portal (~6 hrs).', 'Practise OnGuard or Elements navigation — exam tests UI fluency.'],
    'lcp':            ['Build one access-control scenario in OnGuard or Elements — multi-door, schedules.', 'Document a credential lifecycle flow — exportable as runbook for portfolio.'],
    'thm-sec0':       ['Complete TryHackMe Pre-Security learning path (~10 hrs, free with sub).'],
    'thm-sec1':       ['Complete TryHackMe Cyber Security 101 modules — 30 min/day.'],
    'thm-sal1':       ['Run through TryHackMe SOC Analyst Level 1 simulator under timed conditions.'],
    'htb-cdsa':       ['Complete the 15 prerequisite HTB Academy modules — track progress weekly.', 'Practise SOC Analyst-style investigation reports — they are the exam deliverable.'],
    'ukcsc-assoc':    ['Pull together the evidence portfolio — A+, Network+, a representative organisation role mapped to 5 competency areas.', 'Benched — direct entry at higher levels verified; kept for reference.'],
  };

  const specific = studyMap[id] || [];
  specific.forEach(s => actions.push(s));

  if (actions.length === 0) {
    actions.push(`📚 Begin study with the official ${code || cert.name} learning path.`);
    actions.push('🛠 Identify one hands-on lab task that mirrors a real exam objective.');
  }

  return actions.slice(0, 3);
}
function currentPhase() {
  for (let p = 1; p <= 6; p++) {
    if (CERTS.filter(c => certPhase(c) === p && c.track === 'CORE').some(c => !state.passes[c.id])) return p;
  }
  return 6;
}
function nextCoreCert(filterTest) {
  const ph = currentPhase();
  const passes = state.passes || {};
  const skipped = state.skipped || {};
  const depsMet = cert => !cert.deps || cert.deps.every(d => passes[d]);

  const pool = filterTest
    ? CERTS.filter(c => filterTest(c) && !passes[c.id] && !skipped[c.id])
    : CERTS.filter(c => certPhase(c) === ph && !passes[c.id] && !skipped[c.id]);

  const candidates = pool
    .map(c => ({ cert: c, ps: priorityScore(c), depsOK: depsMet(c), inCurrentPhase: certPhase(c) === ph }))
    .sort((a, b) => {
      if (filterTest && a.inCurrentPhase !== b.inCurrentPhase) return a.inCurrentPhase ? -1 : 1;
      if (a.depsOK !== b.depsOK) return a.depsOK ? -1 : 1;
      if (a.ps !== b.ps) return b.ps - a.ps;
      return (a.cert.difficulty || 0) - (b.cert.difficulty || 0);
    });
  return candidates[0]?.cert || null;
}

function shouldShowNotifyBanner() {
  return 'Notification' in window && Notification.permission === 'default';
}
async function requestNotifications() {
  const perm = await Notification.requestPermission();
  if (perm === 'granted') checkAndNotify();
  renderApp();
}
function checkAndNotify() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const lastCheck = localStorage.getItem(SK.notify);
  const todayStr = today();
  if (lastCheck === todayStr) return;
  localStorage.setItem(SK.notify, todayStr);

  const urgent = [], warn = [];
  CERTS.forEach(cert => {
    const pd = state.passes[cert.id];
    if (!pd) return;
    const { status, days, expiry } = expiryInfo(cert, pd);
    if (status === 'EXPIRED') urgent.push(`${cert.name} — expired ${Math.abs(days)}d ago`);
    else if (status === 'URGENT') urgent.push(`${cert.name} — ${days}d left (expires ${fmt(expiry)})`);
    else if (status === 'WARN') warn.push(`${cert.name} — ${days}d left`);
  });
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (urgent.length > 0 && sw) {
    const body = urgent.slice(0, 3).join('\n') + (urgent.length > 3 ? `\n+${urgent.length - 3} more` : '');
    sw.postMessage({ type: 'NOTIFY', title: `⚠ ${urgent.length} cert${urgent.length > 1 ? 's' : ''} expiring`, body, tag: 'urgent' });
  }
  if (warn.length > 0 && urgent.length === 0 && sw) {
    const body = warn.slice(0, 3).join('\n') + (warn.length > 3 ? `\n+${warn.length - 3} more` : '');
    sw.postMessage({ type: 'NOTIFY', title: `${warn.length} cert${warn.length > 1 ? 's' : ''} renewing soon`, body, tag: 'warn' });
  }
}

function renderBanners() {
  const banners = [];
  PERSONAL_DEADLINES.forEach(d => {
    const daysLeft = daysUntil(new Date(d.date));
    if (daysLeft < 0 || daysLeft > 365) return;
    banners.push(`
      <div class="banner ${d.severity}">
        <span>⏱</span>
        <div><strong>${daysLeft}d</strong> · ${escape(d.label)} · ${fmt(d.date)}</div>
      </div>`);
  });
  (typeof MARKET_EVENTS !== 'undefined' ? MARKET_EVENTS : []).forEach(ev => {
    if (state.eventsDismissed.includes(ev.id)) return;
    const daysLeft = daysUntil(new Date(ev.date));
    if (daysLeft < 0 || daysLeft > 300) return;
    banners.push(`
      <div class="banner ${ev.severity}">
        <span>📣</span>
        <div><strong>${daysLeft}d</strong> · ${escape(ev.label)} · ${fmt(ev.date)}</div>
        <button class="banner-x" onclick="dismissEvent('${ev.id}')" aria-label="Dismiss">×</button>
      </div>`);
  });
  try {
    const stamps = CERTS.map(c => c.verifiedAt).filter(Boolean).sort();
    if (stamps.length) {
      const oldest = new Date(stamps[0] + '-01');
      const months = (Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30.4);
      if (months >= 6 && !state.eventsDismissed.includes('freshness')) {
        banners.push(`<div class="banner info"><span>🗓</span><div>Cert market data was last verified ${escape(stamps[0])} — prices, formats and dates may have moved. Worth a re-verify pass.</div><button class="banner-x" onclick="dismissEvent('freshness')" aria-label="Dismiss">×</button></div>`);
      }
    }
  } catch {}
  if (!state.dismissedBackup) {
    const days = state.lastBackup ? Math.floor((Date.now() - new Date(state.lastBackup)) / 86400000) : null;
    if (days === null || days >= 30) {
      const txt = days === null ? 'Progress is saved only on this device — back it up' : ('Last backup was ' + days + 'd ago — back up the progress');
      banners.push('<div class="banner warn backup-banner"><span>💾</span><div>' + txt + '</div><button class="banner-btn" onclick="exportJSON()">Export</button><button class="banner-x" onclick="dismissBackup()" aria-label="Dismiss reminder">×</button></div>');
    }
  }
  return banners.join('');
}

function getScope() {
  const id = state.filter || 'all';
  let test = null, label = 'All certs';
  if (id === 'not-passed') { test = c => !state.passes[c.id]; label = 'Not yet passed'; }
  else if (id !== 'all') {
    const { filters: defF, filterGroups: gF } = getFilterDefs();
    const allChips = [...defF, ...Object.values(gF).flatMap(g => g.chips || [])];
    const found = allChips.find(f => f.id === id);
    if (found && found.test) { test = found.test; label = found.label.replace(/\s*▾$/, ''); }
  }
  const certs = CERTS.filter(c => test ? test(c) : true);
  return { test, label, certs, scoped: !!test };
}

function goalFor(filterId) {
  const explicit = {
    'my-path':           { goal: 'OT-Convergence Security Architect', band: '£90–130k+', track: null },
    'all':               { goal: 'Highest £/hour — market-wide',      band: '',          track: null },
    'not-passed':        { goal: 'Highest £/hour — market-wide',      band: '',          track: null },
    'passed':            { goal: 'Credentials already earned',         band: '',          track: null },
    'portfolio':         { goal: 'Application-based credentials',      band: '',          track: null },
    'group-top-earners': { goal: 'Highest-earning specialisations',    band: '£80–120k',  track: null },
    'cloud-arch':        { goal: 'Cloud Security Architect',           band: '£90–120k',  track: 'A' },
    'physical-arch':     { goal: 'Physical Security Architect',        band: '£70–95k',   track: 'B' },
    'cyber-arch':        { goal: 'Cyber Security Architect',           band: '£80–110k',  track: 'C' },
  };
  if (explicit[filterId]) return explicit[filterId];
  const { filters, filterGroups } = getFilterDefs();
  let label = null, track = null;
  for (const [gid, g] of Object.entries(filterGroups)) {
    const chip = (g.chips || []).find(ch => ch.id === filterId);
    if (chip) { label = chip.label; track = gid === 'cloud' ? 'A' : gid === 'physical' ? 'B' : gid === 'cyber' ? 'C' : null; break; }
  }
  if (!label) { const f = filters.find(x => x.id === filterId); label = f ? f.label : 'the plan'; }
  const role = label.replace(/^[^A-Za-z]+/, '').replace(/\s*▾$/, '').trim();
  let band = '£45–65k';
  if (/Principal|Lead|Chartered|Head|Architect/i.test(role)) band = '£80–110k';
  else if (/Consultant|Manager/i.test(role)) band = '£70–95k';
  else if (/Engineer|Specialist/i.test(role)) band = '£55–75k';
  else if (/Analyst/i.test(role)) band = '£35–55k';
  else if (/\bSE\b/.test(role)) band = '£50–70k';
  return { goal: role, band, track };
}
function bandMid(band) {
  if (!band) return 0;
  const nums = (band.match(/\d+/g) || []).map(Number);
  if (!nums.length) return 0;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.round(avg * 1000);
}
function editSalary() {
  const v = prompt('current annual salary (£) — stored only in this browser:', state.currentSalary);
  if (v === null) return;
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  if (!isNaN(n) && n >= 0) {
    state.currentSalary = n;
    try { localStorage.setItem(SK.salary, String(n)); } catch {}
    renderApp();
  }
}
function dismissEvent(id) {
  if (!state.eventsDismissed.includes(id)) state.eventsDismissed.push(id);
  try { localStorage.setItem(SK.eventsDis, JSON.stringify(state.eventsDismissed)); } catch {}
  renderApp();
}
function effPasses() {
  return state.simMode ? Object.assign({}, state.passes, state.simPasses) : state.passes;
}
function toggleSimMode() {
  state.simMode = !state.simMode;
  if (!state.simMode) state.simPasses = {};
  renderApp();
}
function simTogglePass(id) {
  if (state.passes[id]) return;
  if (state.simPasses[id]) delete state.simPasses[id]; else state.simPasses[id] = 'sim';
  renderApp();
}
function clearSim(){state.simPasses={};renderApp();}
function editPace2() {
  const v = prompt('Study hours per week the candidate expect AFTER Sep 2026 (stored only in this browser):', state.pace2);
  if (v === null) return;
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  if (!isNaN(n) && n >= 0 && n <= 80) {
    state.pace2 = n;
    try { localStorage.setItem(SK.pace2, String(n)); } catch {}
    renderApp();
  }
}
function saveExpLog() { try { localStorage.setItem(SK.explog, JSON.stringify(state.expLog)); } catch {} }
function addExp() {
  const t = prompt('Describe the experience (lab project, deployment, incident, design win):');
  if (!t || !t.trim()) return;
  const g = prompt('Tag a track - type A (Cloud), B (Physical/OT) or C (Cyber), or leave blank:') || '';
  const tag = ['A','B','C'].includes(g.trim().toUpperCase()) ? g.trim().toUpperCase() : '';
  state.expLog.push({ t: t.trim().slice(0, 140), d: new Date().toISOString().slice(0, 10), g: tag });
  saveExpLog(); renderApp();
}
function delExp(i) {
  if (!confirm('Remove this experience entry?')) return;
  state.expLog.splice(i, 1); saveExpLog(); renderApp();
}
function roleMatches() {
  const { filterGroups } = getFilterDefs();
  const P = effPasses();
  const chips = Object.entries(filterGroups)
    .flatMap(([gid, g]) => (g.chips || []).map(ch => ({ ch, gid })))
    .filter(x => x.ch.id.startsWith('pv-') && x.ch.test);
  return chips.map(({ ch, gid }) => {
    let members;
    try { members = CERTS.filter(ch.test); } catch { members = []; }
    const totV = members.reduce((s, c) => s + (c.cvValue || 0), 0);
    const done = members.filter(c => P[c.id]);
    const doneV = done.reduce((s, c) => s + (c.cvValue || 0), 0);
    const cov = totV ? doneV / totV : 0;
    const next = members
      .filter(c => !P[c.id] && (c.deps || []).every(d => P[d]))
      .sort((a, b) => (b.cvValue || 0) - (a.cvValue || 0))[0];
    const label = ch.label.replace(/^[^A-Za-z]+/, '').replace(/\s*▾$/, '').trim();
    const band = /Principal|Lead|Chartered|Head|Architect/i.test(label) ? '£80–110k'
      : /Consultant|Manager/i.test(label) ? '£70–95k'
      : /Engineer|Specialist/i.test(label) ? '£55–75k'
      : /Analyst/i.test(label) ? '£35–55k'
      : /\bSE\b/.test(label) ? '£50–70k' : '£45–65k';
    const trk = gid === 'cloud' ? 'A' : gid === 'physical' ? 'B' : gid === 'cyber' ? 'C' : '';
    const exp = trk ? state.expLog.filter(e => e.g === trk).length : 0;
    return { id: ch.id, label: ch.label.replace(/\s*▾$/, ''), cov, done: done.length, total: members.length, band, next, exp };
  })
    .filter(r => r.total >= 4)
    .sort((a, b) => b.cov - a.cov || b.done - a.done);
}

function renderApp() {
  const { certs: scopeCerts, label: scopeLabel, scoped } = getScope();
  const total = scopeCerts.length;
  const passed = scopeCerts.filter(c => state.passes[c.id]).length;
  const coreTotal = scopeCerts.filter(c => c.track === 'CORE').length;
  const corePassed = scopeCerts.filter(c => c.track === 'CORE' && state.passes[c.id]).length;
  const ph = currentPhase();
  document.documentElement.dataset.phase = ph;

  document.getElementById('app').innerHTML = `
    <div class="header">
      <div>
        <div class="header-title">Cert Tracker</div>
        <div class="header-sub">v24 · ${scoped ? escape(scopeLabel) : total + ' certs'} · <span style="color: var(--blue-text)">Phase ${ph}</span></div>
      </div>
      <div class="header-count">
        ${passed}/${total}
        <small>Core ${corePassed}/${coreTotal}</small>
      </div>
    </div>
    <div class="tabs">
      <button class="tab${state.currentTab === 'dashboard' ? ' active' : ''}" onclick="switchTab('dashboard')">Dashboard</button>
      <button class="tab${state.currentTab === 'certifications' ? ' active' : ''}" onclick="switchTab('certifications')">Certifications</button>
      <button class="tab${state.currentTab === 'strategy' ? ' active' : ''}" onclick="switchTab('strategy')">📋 Strategy</button>
    </div>
    <div class="content" id="tab-content"></div>
  `;
  renderTabContent();
}

function renderTabContent() {
  const el = document.getElementById('tab-content');
  if (!el) return;
  const y = window.CertTrackerTabNavigation ? 0 : window.scrollY;
  if (state.currentTab === 'dashboard')      el.innerHTML = renderDashboard();
  if (state.currentTab === 'strategy')       el.innerHTML = renderStrategy();
  if (state.currentTab === 'certifications') el.innerHTML = renderCertifications();
  requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'instant' }));
}

function switchTab(tab) { state.currentTab = tab; renderApp(); }

function updateHeaderCount() {
  const { certs: scopeCerts, label: scopeLabel, scoped } = getScope();
  const total = scopeCerts.length;
  const passed = scopeCerts.filter(c => state.passes[c.id]).length;
  const coreTotal = scopeCerts.filter(c => c.track === 'CORE').length;
  const corePassed = scopeCerts.filter(c => c.track === 'CORE' && state.passes[c.id]).length;
  const hc = document.querySelector('.header-count');
  if (hc) hc.innerHTML = `${passed}/${total}<small>Core ${corePassed}/${coreTotal}</small>`;
  const hs = document.querySelector('.header-sub');
  const ph = currentPhase();
  if (hs) hs.textContent = `v24 · ${scoped ? scopeLabel : total + ' certs'} · Phase ${ph}`;
}

function getFilterDefs() {
  const filters = [
    { id: 'my-path', label: '🌟 My Path', test: c => state.myPath && state.myPath[c.id] },
    { id: 'all',      label: '🗂 All', test: () => true },
    { id: 'group-cloud',    label: '☁️ Cloud ▾',    groupToggle: 'cloud' },
    { id: 'group-physical', label: '🛡️ Physical ▾', groupToggle: 'physical' },
    { id: 'group-cyber',    label: '🔒 Cyber ▾',    groupToggle: 'cyber' },
    { id: 'group-top-earners', label: '🚀 Top Earners ▾', groupToggle: 'top-earners' },
    { id: 'portfolio', label: '📋 Application-Based', test: c => c.applicationBased },
  ];


  const filterGroups = {
    cloud: {
      label: '☁️ Cloud',
      chips: [
        { id: 'cloud-arch',  label: '☁️ Cloud Architect', test: c => c.tracks.includes('A') },
        { id: 'pv-a-se', label: '💼 Cloud SE', test: c => ['wiz-cse','crowdstrike-ccf','cissp','ccsp','sc-100','security-plus','az-104','pan-practitioner','pan-netsec-pro','pan-ngfw-eng','pan-cloudsec-pro','pan-sse-eng','crowdstrike-cccs'].includes(c.id) },
        { id: 'pv-a-devsecops', label: '🛠️ DevSecOps Engineer', test: c => ['autoops-plus','terraform','hashicorp-vault','az-400','cka','cks','kcsa','caisp','csslp','issap','sc-500','az-700','pan-cloudsec-pro','pan-xsoar-eng','aws-dop','gcp-pcde','security-plus','pcpp1','jsnad','jsnsd'].includes(c.id) },
        { id: 'pv-a-privacy', label: '🔏 Privacy Engineer', test: c => ['iso-27001-li','caisp','cdpse','cipp-e','aigp','aaism','security-plus','sc-900','cysa-plus','ccsk','cissp'].includes(c.id) },
        { id: 'pv-a-cloudsoc', label: '🚨 Cloud SOC Analyst', test: c => ['sc-200','cysa-plus','ccsk','htb-cdsa','gcih','gcda','gcfa','ccsp','mad','aws-security-specialty','sc-500','sc-401','crowdstrike-ccfh','pan-xsiam-eng','crowdstrike-ccsa','crowdstrike-ccse','security-plus'].includes(c.id) },
        { id: 'pv-a-ai', label: '🤖 AI Security Engineer', test: c => ['ai-901','secai-plus',
      'pcep','caisp','gaips','aaism','aigp','sc-500','ccsk','cissp','pcpp1','pcpp2'].includes(c.id) },
        { id: 'pv-a-iam', label: '🔐 Cloud Identity Engineer', test: c => ['security-plus','az-104','sc-900','sc-300','sc-401','sc-100','cissp','issap','crowdstrike-ccis','cismp','ccsk'].includes(c.id) },
        { id: 'pv-a-data', label: '🗄️ Cloud Data Security Engineer', test: c => ['security-plus','az-104','sc-900','sc-401','ccsp','cissp','issap','sc-100','cdpse','pan-cloudsec-pro','cismp','ccsk'].includes(c.id) },
        { id: 'pv-a-k8s', label: '🐳 Kubernetes Security Specialist', test: c => ['security-plus','linux-plus','az-104','cka','kcsa','cks','ccsp','cissp','issap','pan-cloudsec-pro','pcpp1'].includes(c.id) },
        { id: 'pv-a-ir', label: '🚑 Cloud Forensics & IR Specialist', test: c => ['security-plus','cysa-plus','az-104','sc-200','gcfa','gcih','crowdstrike-ccfh','aws-security-specialty','cissp','ccsp','pan-cloudsec-pro','crowdstrike-cccs','crowdstrike-ccsa','btl2','pcpp1'].includes(c.id) }
      ]
    },
    physical: {
      label: '🛡️ Physical',
      chips: [
        { id: 'physical-arch', label: '🛡️ Physical Architect', test: c => c.tracks.includes('B') },
        { id: 'pv-b-se', label: '💼 Physical SE', test: c => ['mcde','lcda','genetec-sc-ent','asis-psp','ukcsc-chart','csyp','network-plus','security-plus','lcp','mcie','cismp'].includes(c.id) },
        { id: 'pv-b-otics', label: '⚡ OT/ICS Security Engineer', test: c => ['iec-62443-cfs','iec-62443-cra','iec-62443-cds','iec-62443-cms','iec-62443-expert','secot-plus','gicsp','crisc','gcih','grid','security-plus','cysa-plus','linux-plus','pcpp1'].includes(c.id) },
        { id: 'pv-b-consultancy', label: '📐 Security Consultant', test: c => ['itil-4-foundation','bcs-esa','prince2-prac','togaf-10','sabsa-found','ukcsc-chart','csyp','ukcsc-assoc','ukcsc-princ','pan-netsec-pro'].includes(c.id) },
        { id: 'pv-b-cpsoc', label: '🛰️ Convergence SOC Analyst', test: c => ['sc-200','cysa-plus','gicsp','secot-plus','mad','gcih','cism','ukcsc-chart','crowdstrike-ccsa','fcss-secops','arcgis-foundation','security-plus'].includes(c.id) },
        { id: 'pv-b-cni', label: '🏰 CNI Security Specialist', test: c => ['iec-62443-cfs','iec-62443-cra','iec-62443-cds','secot-plus','gicsp','grid','iso-27001-li','cisa','crisc','csyp','ukcsc-chart','security-plus','lcda','asis-psp','cismp'].includes(c.id) },
        { id: 'pv-b-pentest', label: '🥷 Physical Penetration Tester', test: c => ['security-plus','network-plus','a-plus','pentest-plus','oscp','asis-psp','ukcsc-chart','cissp','cismp','thm-pt1'].includes(c.id) },
        { id: 'pv-b-insider', label: '🕵️ Insider Threat Analyst', test: c => ['security-plus','cysa-plus','gcfa','cism','ukcsc-chart','csyp','cisa','crisc','btl2','sc-300'].includes(c.id) },
        { id: 'pv-b-crisis', label: '🆘 Crisis & Resilience Manager', test: c => ['itil-4-foundation','prince2-prac','iso-27001-li','ukcsc-chart','csyp','cism','crisc','security-plus','ccsk'].includes(c.id) },
        { id: 'pv-b-smartbuilding', label: '🏢 Smart Building & IoT Security', test: c => ['security-plus','network-plus','ccna','iec-62443-cfs','iec-62443-cra','gicsp','asis-psp','ukcsc-chart','cissp','ccsp','pan-ngfw-eng','pan-sse-eng','arcgis-foundation','esri-ent-admin'].includes(c.id) }
      ]
    },
    cyber: {
      label: '🔒 Cyber',
      chips: [
        { id: 'cyber-arch', label: '🔒 Cyber Architect', test: c => c.tracks.includes('C') },
        { id: 'pv-c-se', label: '💼 Cyber SE', test: c => ['crowdstrike-ccf','crowdstrike-ccfh','wiz-cse','cissp','issap','ccsp','security-plus','cysa-plus','sc-200','pan-practitioner','pan-netsec-pro','pan-ngfw-eng','pan-cloudsec-pro','pan-netsec-arch','securityx','crowdstrike-ccis','crowdstrike-cccs'].includes(c.id) },
        { id: 'pv-c-detection', label: '🔬 Detection Engineer', test: c => ['btl2','htb-cdsa','splunk-scda','gcda','mad','splunk-scde','gcih','gcfa','grem','issap','splunk-power-user','crowdstrike-ccfh','security-plus','cysa-plus','btl1','thm-sal1','pan-xsiam-eng','pan-xsoar-eng','crowdstrike-ccsa','crowdstrike-ccse','fcss-secops','pcpp1'].includes(c.id) },
        { id: 'pv-c-offensive', label: '⚔️ Penetration Tester', test: c => ['thm-pt1','pentest-plus','htb-cpts','crest-crt','crest-cct','crto','pnpt','oscp','issap','htb-cjca','thm-se1','security-plus','pcpp1'].includes(c.id) },
        { id: 'pv-c-grc', label: '🏛️ GRC / Audit Analyst', test: c => ['iso-27001-li','cysa-plus','caisp','cisa','crisc','cipp-e','cism','security-plus','ccsk'].includes(c.id) },
        { id: 'pv-c-appsec', label: '🐛 AppSec Engineer', test: c => ['pentest-plus','bscp','pcep','pcap','htb-cpts','csslp','issap','oscp','oswe','thm-se1','pan-cloudsec-pro','security-plus','thm-pt1','cissp','jsnsd','jsnad'].includes(c.id) },
        { id: 'pv-c-ir', label: '🚑 Incident Response & DFIR', test: c => ['security-plus','cysa-plus','btl1','btl2','gcfa','gcih','grem','crowdstrike-ccfh','cissp','issap','pan-xsoar-eng','crowdstrike-ccsa','crowdstrike-ccse','pcpp1'].includes(c.id) },
        { id: 'pv-c-cti', label: '🔭 Threat Intelligence Analyst', test: c => ['security-plus','cysa-plus','mad','cism','cissp','ukcsc-chart','crisc','pan-xsiam-eng','btl2','pcpp1'].includes(c.id) },
        { id: 'pv-c-malware', label: '🔬 Malware Analyst & Reverse Engineer', test: c => ['security-plus','linux-plus','oscp','grem','cissp','issap','pcep','pcap','osed','btl2','sc-300','pcpp1'].includes(c.id) },
        { id: 'pv-c-redteam', label: '⚡ Red Team Operator', test: c => ['security-plus','pentest-plus','oscp','crto','crest-cct','oswe','htb-cpts','cissp','issap','thm-pt1','pan-ngfw-eng','osep','osed','osee','cismp','pcpp1'].includes(c.id) }
      ]
    },
    'top-earners': {
      label: '🚀 Top Earners',
      chips: [
        { id: 'pv-top-pm', label: '💡 Security Product Manager', test: c => ['security-plus','cysa-plus','cissp','cism','ccsp','az-305','aws-sap','sc-100','prince2-prac','togaf-10','aigp','pragmatic-pmc','pragmatic-pcpm','sc-300'].includes(c.id) },
        { id: 'pv-top-tam', label: '🤝 Technical Account Manager', test: c => ['security-plus','az-104','sc-100','sc-200','sc-300','cissp','ccsp','pan-ngfw-eng','pan-cloudsec-pro','crowdstrike-ccf','crowdstrike-ccfh','crowdstrike-ccsa','crowdstrike-ccse','wiz-cse','mcde','lcda','itil-4-foundation','gcp-ace','nse-4'].includes(c.id) },
        { id: 'pv-top-platform', label: '⚙️ Security Platform Engineer', test: c => ['security-plus','cysa-plus','az-104','sc-200','sc-401','sc-100','az-305','az-400','terraform','hashicorp-vault','cka','cks','kcsa','ccsp','pan-ngfw-eng','pan-xsiam-eng','pan-xsoar-eng','crowdstrike-ccsa','crowdstrike-ccse','cissp','issap','gcp-pcse','gcp-pcde','aws-dop','gcp-pcne','pcpp1'].includes(c.id) },
        { id: 'pv-top-finsec', label: '🏦 Financial Services Security Engineer', test: c => ['security-plus','cysa-plus','az-104','sc-300','sc-200','sc-100','sc-401','cissp','ccsp','issap','splunk-scda','splunk-scde','gcfa','gcih','cisa','crisc','cism','ukcsc-chart','csyp','cipm','nse-4','cismp','fcss-secops','fcx'].includes(c.id) },
        { id: 'pv-top-cleared', label: '🛡️ Cleared Cyber Engineer', test: c => ['security-plus','network-plus','ccna','cysa-plus','sc-200','sc-100','cissp','ccsp','issap','cism','gcih','gcfa','gicsp','iec-62443-cfs','ukcsc-chart','csyp','iso-27001-li','cismp'].includes(c.id) },
        { id: 'pv-top-ma', label: '💼 Cyber M&A / Tech Due Diligence', test: c => ['security-plus','cysa-plus','az-104','sc-100','cissp','ccsp','cisa','crisc','cism','iso-27001-li','itil-4-foundation','prince2-prac','ukcsc-chart','csyp','cdpse','cipm','cismp','ccsk'].includes(c.id) },
        { id: 'pv-top-csa', label: '☁️ Cloud Solutions Architect', test: c => ['security-plus','az-104','az-305','aws-sap','sc-100','sc-200','sc-300','cissp','ccsp','issap','togaf-10','ai-901','gcp-ace','gcp-pcse','gcp-pca','gcp-pcne','gcp-pcde','ccsk'].includes(c.id) },
        { id: 'pv-top-embed', label: '🔌 Embedded Systems Security Engineer', test: c => ['security-plus','network-plus','linux-plus','cysa-plus','cissp','csslp','grem','issap','cism','iec-62443-cfs','iec-62443-cra','ukcsc-chart','oscp','osep','osed','osee','sc-300'].includes(c.id) },
        { id: 'pv-top-ae', label: '🎯 Enterprise Account Executive', test: c => ['security-plus','az-104','sc-100','sc-200','cissp','ccsp','pan-ngfw-eng','pan-cloudsec-pro','crowdstrike-ccf','crowdstrike-ccfh','wiz-cse','itil-4-foundation','prince2-prac','meddic-found','meddpicc-master'].includes(c.id) },
        { id: 'pv-top-contractor', label: '📈 Independent Cyber Contractor / Day-Rate Specialist', test: c => ['security-plus','cissp','ccsp','issap','cism','crisc','cisa','ukcsc-chart','csyp','iso-27001-li','gicsp','togaf-10','cismp','ccsk'].includes(c.id) }
      ]
    }
  };
  return { filters, filterGroups };
}

function renderDashboard() {
  const ph = currentPhase();

  const { test: scopeTest, label: scopeLabel, certs: scopeCerts, scoped } = getScope();

  const nxt = nextCoreCert(scopeTest);
  const total = scopeCerts.length;
  const passed = scopeCerts.filter(c => state.passes[c.id]).length;
  const overallPct = total ? Math.round(passed / total * 100) : 0;

  const gatewayCerts = scopeCerts.filter(c => c.gateway);
  const gatewayPassed = gatewayCerts.filter(c => state.passes[c.id]).length;

  const selfCerts = scopeCerts.filter(c => !c.employer && (c.costNum || 0) > 0);
  const budgetTotal = selfCerts.reduce((s, c) => s + (c.costNum || 0), 0);
  const spent = selfCerts.filter(c => state.passes[c.id]).reduce((s, c) => s + (c.costNum || 0), 0);
  const spentPct = budgetTotal ? Math.round(spent / budgetTotal * 100) : 0;
  const empCerts = scopeCerts.filter(c => c.employer);
  const empPassed = empCerts.filter(c => state.passes[c.id]).length;
  const moneyCard = `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--amber)"></span>Investment</div>
        <div class="big-number">£${spent.toLocaleString()}</div>
        <div class="big-sub">of £${budgetTotal.toLocaleString()} self-funded · £${(budgetTotal - spent).toLocaleString()} to go</div>
        ${progressBarHTML(spentPct, 'var(--amber)', '8px')}
        <div style="margin-top:10px;font-size:10px;color:var(--dim);text-align:center">Employer-funded: ${empPassed}/${empCerts.length} certs · £0 to the candidate</div>
      </div>`;

  const _TIERS = ['diamond','platinum','gold','silver','bronze'];
  const _TM = { diamond:['💎','Diamond','#8ee7ff'], platinum:['🏆','Platinum','#e2d9f7'], gold:['🥇','Gold','#ffc94d'], silver:['🥈','Silver','#c9bff0'], bronze:['🥉','Bronze','#e8965a'] };
  const _tc = {}; _TIERS.forEach(t => _tc[t] = { e: 0, n: 0 });
  scopeCerts.forEach(c => { const t = medalTier(c); if (_tc[t]) { _tc[t].n++; if (state.passes[c.id]) _tc[t].e++; } });
  const trophyRows = _TIERS.map(t => { const m = _TM[t], x = _tc[t]; const pct = x.n ? Math.round(x.e / x.n * 100) : 0;
    return `<div class="trophy-row"><span class="trophy-ico">${m[0]}</span><span class="trophy-name" style="color:${m[1] === 'Silver' || m[1] === 'Platinum' ? '#c0d7dc' : m[2]}">${m[1]}</span><span class="trophy-bar"><span class="trophy-bar-fill" style="width:${pct}%;background:${m[2]}"></span></span><span class="trophy-count">${x.e}<span style="opacity:.5">/${x.n}</span></span></div>`;
  }).join('');
  const selfFunded = CERTS.filter(c => state.myPath[c.id] && !state.passes[c.id] && !state.skipped[c.id] && !c.employer && c.costNum > 0);
  const selfTotal = Math.round(selfFunded.reduce((s2,c) => s2 + c.costNum, 0));
  const bigTickets = [...selfFunded].sort((a,b) => b.costNum - a.costNum).slice(0,5);
  const fundingCard = selfTotal > 0 ? `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--amber)"></span>Funding Exposure</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:12px;color:var(--muted)">Self-funded remaining</span>
          <strong style="font-size:20px;color:${selfTotal > 8000 ? 'var(--red-text)' : 'var(--green-text)'}">£${selfTotal.toLocaleString()}</strong>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Target: <strong>&lt;£8k</strong> — everything above that line is a negotiation item, not a savings goal.</div>
        ${bigTickets.map(c => `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-top:1px solid var(--border)"><span>${escape(c.name)}</span><span style="color:var(--amber-text);white-space:nowrap;margin-left:8px">£${Math.round(c.costNum).toLocaleString()} → negotiate</span></div>`).join('')}
      </div>` : '';

  const PARTNER_VENDORS = ['Milestone','Axis','LenelS2','Genetec','Claroty','Nozomi Networks'];
  const partnerCard = `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--ph1)"></span>Partner Status <span style="font-weight:500;color:var(--dim);text-transform:none;letter-spacing:0">· gate check</span></div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Partner-gated certs stall without these. Verify each with the relevant organisation — front-load asks while goodwill is high.</div>
        ${PARTNER_VENDORS.map(v => `<label style="display:flex;gap:8px;align-items:center;font-size:12px;padding:4px 0;cursor:pointer"><input type="checkbox" ${state.partners[v] ? 'checked' : ''} onchange="togglePartner('${v}')" style="accent-color:var(--green)"><span style="${state.partners[v] ? 'color:var(--green-text)' : ''}">${v}${state.partners[v] ? ' ✓ verified' : ''}</span></label>`).join('')}
      </div>`;

  const tail = CERTS.filter(c => state.myPath[c.id] && !state.passes[c.id] && !state.skipped[c.id] && (c.tier === 'C' || c.tier === 'D'));
  const tailHours = Math.round(tail.reduce((s2,c) => s2 + (c.hours[0]+c.hours[1])/2, 0));
  const tailCard = tail.length > 0 ? `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--slate)"></span>Tail Review</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:6px"><strong>${tail.length} C/D-tier certs · ≈${tailHours}h</strong> — the bottom of the value ladder. Each bench pulls the pace outlook forward. Benching ≠ deleting; they stay in the catalogue.</div>
        ${tail.slice(0,8).map(c => `<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;padding:4px 0;border-top:1px solid var(--border)"><span>${escape(c.name)} <span style="color:var(--dim)">· ${Math.round((c.hours[0]+c.hours[1])/2)}h</span></span><button class="btn-tool" style="padding:2px 8px;font-size:10px" onclick="benchCert('${c.id}')">Bench</button></div>`).join('')}
        ${tail.length > 8 ? `<div style="font-size:10px;color:var(--dim);margin-top:4px">+${tail.length - 8} more in Certifications tab</div>` : ''}
      </div>` : '';

  const trophyCard = `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:#00cdb7"></span>Medal Shelf <span style="font-weight:500;color:var(--dim);text-transform:none;letter-spacing:0">· tier = ROI rank</span></div>
        ${trophyRows}
      </div>`;

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Sunday
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekHours = state.studyLog
    .filter(s => new Date(s.date) >= thisWeekStart && s.type === 'study')
    .reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
  const studyTarget = 13;

  const notifyBanner = shouldShowNotifyBanner() ? `
    <div class="notify-banner">
      <span>Enable tracker reminders</span>
      <button onclick="requestNotifications()">Enable</button>
    </div>` : '';

  const toolsBar = `
    <div class="tools-bar">
      <span class="tools-bar-label">Tools</span>
      <button class="btn-tool" onclick="exportICS()">📅 Calendar (.ics)</button>
      <button class="btn-tool" onclick="exportCV()">📋 CV markdown</button>
      <button class="btn-tool" onclick="exportJSON()">⬇ Backup</button>
      <button class="btn-tool" onclick="importJSON()">⬆ Restore</button>
    </div>`;

  const heroCard = `
    <div class="dash-hero">
      <div class="strat-framer" style="margin:0 0 8px">📊 Showing <strong>${escape(scopeLabel)}</strong> · ${passed}/${total} passed${scoped ? `<span style="opacity:.6"> · tap the active chip again or 🌟 My Path to change scope</span>` : `<span style="opacity:.6"> · tap 🌟 My Path to focus the dashboard on the plan</span>`}</div>
      <div class="dash-hero-top">
        <div>
          <div class="dash-hero-eyebrow">the candidate are here</div>
          <div class="dash-hero-title">Phase ${ph} · ${escape(trackerPhaseSpec(ph).name)}</div>
          <div class="dash-hero-sub">${(() => { const e = phaseETA(ph); return e ? `pace outlook ≈ ${e}` : escape(trackerPhaseSpec(ph).window); })()} · ${escape(trackerPhaseSpec(ph).layer)}</div>
          ${trackerPhaseSpec(ph).applyOut ? `<div style="margin-top:8px;padding:8px 10px;background:var(--green-bg);border-left:3px solid var(--green);border-radius:8px;font-size:11px;color:var(--green-text)">📈 <strong>Apply-out trigger:</strong> ${escape(trackerPhaseSpec(ph).applyOut)}</div>` : ''}
          ${trackerPhaseSpec(ph).artifact ? `<div style="margin-top:6px;padding:8px 10px;background:${state.artifacts[ph] ? 'var(--green-bg)' : 'var(--purple-bg)'};border-left:3px solid ${state.artifacts[ph] ? 'var(--green)' : 'var(--purple)'};border-radius:8px;font-size:11px;color:var(--text);display:flex;gap:8px;align-items:flex-start">
            <input type="checkbox" ${state.artifacts[ph] ? 'checked' : ''} onchange="toggleArtifact(${ph})" style="margin-top:1px;accent-color:var(--green)">
            <span>🛠 <strong>Artifact gate:</strong> ${escape(trackerPhaseSpec(ph).artifact)} — <em>phase isn't done without it</em></span>
          </div>` : ''}
          ${trackerPhaseSpec(ph).roles ? `<div class="dash-hero-roles"><span class="hero-roles-label">Now realistic to apply for</span><span class="hero-roles-band">${escape(trackerPhaseSpec(ph).band)}</span><div class="hero-roles-list">${trackerPhaseSpec(ph).roles.map(r => `<span class="role-pill">${escape(r)}</span>`).join('')}</div></div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="big-number" style="font-size:32px">${overallPct}<span style="font-size:16px;color:var(--dim)">%</span></div>
          <div style="font-size:10px;color:var(--dim)">${passed} of ${total}</div>
        </div>
      </div>
      ${nxt ? `
        <div class="dash-hero-next">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
            <span class="badge badge-prio badge-prio-${priorityScore(nxt)}">${priorityTag(priorityScore(nxt))} · ${priorityLabel(priorityScore(nxt))}</span>
            ${nxt.gateway ? `<span class="badge badge-gateway">🔑 GATEWAY</span>` : ''}
            ${(nxt.deps || []).length && !nxt.deps.every(d => state.passes[d]) ? `<span class="badge badge-1yr">⚠ Deps not met</span>` : ''}
          </div>
          <strong>🎯 Next up:</strong> ${escape(nxt.name)}${nxt.code ? ` <span style="color:var(--dim);font-family:'IBM Plex Mono',ui-monospace,monospace">(${escape(nxt.code)})</span>` : ''}
          ${nxt.hours[0] > 0 ? `<br><span style="color:var(--dim)">≈ ${nxt.hours[0]}–${nxt.hours[1]} hrs · ${nxt.cost}</span>` : ''}
        </div>
        ${(() => {
          const acts = weeklyActions(nxt);
          if (!acts.length) return '';
          return `
            <div class="dash-hero-week">
              <div class="dash-hero-week-label">📋 What to do this week</div>
              <ul class="dash-hero-week-list">
                ${acts.map(a => `<li>${escape(a)}</li>`).join('')}
              </ul>
            </div>`;
        })()}` : `
        <div class="dash-hero-next" style="background:var(--green-bg);border-color:var(--green)">
          <strong>✓ All Phase ${ph} certs passed.</strong> Move to the next phase or conditional work.
        </div>`}
      <div class="stat-pill-row">
        <div class="stat-pill"><div class="stat-pill-num" style="color:var(--amber)">${gatewayPassed}/${gatewayCerts.length}</div><div class="stat-pill-label">🔑 Gateway</div></div>
        <div class="stat-pill"><div class="stat-pill-num" style="color:${thisWeekHours >= studyTarget ? 'var(--green)' : thisWeekHours >= studyTarget * 0.5 ? 'var(--blue)' : 'var(--amber)'}">${thisWeekHours.toFixed(1)}h</div><div class="stat-pill-label">This week (${studyTarget}h target)</div></div>
        <div class="stat-pill"><div class="stat-pill-num">${(() => {
          const phaseSet = scopeCerts.filter(c => certPhase(c) === ph);
          const phPassed = phaseSet.filter(c => state.passes[c.id]).length;
          return `${phPassed}/${phaseSet.length}`;
        })()}</div><div class="stat-pill-label">Phase ${ph}${scoped ? ' (scoped)' : ''}</div></div>
      </div>
      ${(() => {
        const hoursNeeded = scopeCerts
          .filter(c => certPhase(c) === ph && !state.passes[c.id] && !state.skipped[c.id])
          .reduce((s2, c) => s2 + (c.hours ? (c.hours[0]+c.hours[1])/2 : 0), 0);
        if (hoursNeeded === 0) return '';
        const pace = (state.pace2 && Date.now() >= new Date('2026-09-01')) ? state.pace2 : studyTarget;
        const weeks = hoursNeeded / pace;
        const eta = new Date(Date.now() + weeks*7*86400000).toLocaleDateString('en-GB',{month:'short',year:'numeric'});
        return `
          <div class="capacity-gauge" style="margin-top:10px;padding:10px 12px;background:var(--blue-bg);border-left:3px solid var(--blue);border-radius:8px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
              <strong style="font-size:11px;color:var(--blue-text);text-transform:uppercase;letter-spacing:.04em">⏱ Phase ${ph} pace outlook</strong>
              <span style="font-size:14px;font-weight:800;color:var(--blue-text)">≈ ${eta}</span>
            </div>
            <div style="font-size:11px;color:var(--muted);line-height:1.5">
              <strong>${Math.round(hoursNeeded)}h remaining</strong> @ ${pace}h/wk · ${Math.round(weeks)} wks. Pace sets the date — no fixed deadline.
            </div>
          </div>`;
      })()}
    </div>`;

  const expiring = CERTS
    .filter(c => state.passes[c.id] && c.validity)
    .map(c => ({ ...c, ...expiryInfo(c, state.passes[c.id]) }))
    .filter(c => ['OK', 'WARN', 'URGENT', 'EXPIRED'].includes(c.status))
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));

  const upcomingExams = CERTS
    .filter(c => state.exams[c.id] && !state.passes[c.id])
    .map(c => ({ ...c, examDays: daysUntil(new Date(state.exams[c.id])), examDate: state.exams[c.id] }))
    .sort((a, b) => a.examDays - b.examDays);

  const examsHTML = upcomingExams.length > 0 ? `
    <div style="margin-bottom:10px">
      <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">📝 Upcoming exams</div>
      ${upcomingExams.map(c => `
        <div class="expiry-item ${c.examDays <= 7 ? 'urgent' : c.examDays <= 30 ? 'warn' : ''}">
          <div class="expiry-item-top">
            <div>
              <div class="expiry-item-name">${escape(c.name)}</div>
              <div class="expiry-item-date">${fmt(c.examDate)}</div>
            </div>
            ${examBadgeHTML(c.id)}
          </div>
        </div>`).join('')}
    </div>` : '';

  const cpeAnnual = Math.round(CERTS
    .filter(c => state.myPath[c.id] && c.cpe > 0 && c.cpePeriod > 0)
    .reduce((s2, c) => s2 + c.cpe / (c.cpePeriod / 12), 0));
  const cpeProjection = cpeAnnual > 0 ? `
    <div style="margin-top:8px;padding:8px 10px;background:var(--surface-2);border-radius:8px;font-size:11px;color:var(--muted)">
      ♻️ <strong>CPE at full build:</strong> ≈ ${cpeAnnual} hrs/yr maintenance across My Path (naive sum — CE cascades like CompTIA/ISC2 reduce this substantially).
    </div>` : '';

  const expiryHTML = expiring.length === 0 && upcomingExams.length === 0
    ? `<div class="empty">No exams booked or certs with expiry. Set dates in the Certifications tab.</div>${cpeProjection}`
    : `${examsHTML}
       ${expiring.length > 0 ? `<div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">🔁 Renewals</div>` : ''}
       ${expiring.map(c => `
         <div class="expiry-item ${c.status.toLowerCase()}">
           <div class="expiry-item-top">
             <div>
               <div class="expiry-item-name">${escape(c.name)}</div>
               <div class="expiry-item-date">${c.expiry ? 'Expires ' + fmt(c.expiry) : ''}</div>
             </div>
             ${statusBadgeHTML(c.status, c.days)}
           </div>
         </div>`).join('')}${cpeProjection}`;

  const phaseHTML = [1, 2, 3, 4, 5, 6].map(p => {
    const activeFilterId = state.filter || 'all';
    let filterTest = null;
    if (activeFilterId !== 'all' && activeFilterId !== 'not-passed') {
      const { filters: defaultFilters, filterGroups: groups } = getFilterDefs();
      const groupChips = Object.values(groups).flatMap(g => g.chips || []);
      const allChips = [...defaultFilters, ...groupChips];
      const found = allChips.find(f => f.id === activeFilterId);
      if (found && found.test) filterTest = found.test;
    }
    const all = CERTS.filter(c => certPhase(c) === p && (filterTest ? filterTest(c) : true));
    const core = all.filter(c => c.track === 'CORE');
    const cpPassed = core.filter(c => state.passes[c.id]).length;
    const allPassed = all.filter(c => state.passes[c.id]).length;
    const pct = core.length ? Math.round(cpPassed / core.length * 100) : 0;
    const done = core.length > 0 && cpPassed === core.length;
    const active = p === ph;
    const color = done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--slate)';
    return `
      <div class="phase-item ph${p} ${active ? 'active' : done ? 'done' : ''}">
        <div class="phase-meta">
          <span class="phase-name ${active ? 'active' : done ? 'done' : 'pending'}">${active ? '▶ ' : done ? '✓ ' : ''}Phase ${p}</span>
          <span class="phase-count">${allPassed}/${all.length}</span>
        </div>
        <div class="phase-sub">${escape(trackerPhaseSpec(p).name)}</div>
        ${progressBarHTML(pct, color, '5px')}
        <div style="font-size:9px;color:var(--dim);margin-top:3px">Core ${cpPassed}/${core.length}</div>
        ${trackerPhaseSpec(p).roles ? `<div class="phase-roles"><span class="phase-roles-band">${escape(trackerPhaseSpec(p).band)}</span> ${trackerPhaseSpec(p).roles.slice(0, 3).map(r => escape(r)).join(' · ')}</div>` : ''}
      </div>`;
  }).join('');

  const trackRows = ['CORE', 'ROLE-DRIVEN', 'CONDITIONAL', 'OPTIONAL', 'POST-PLAN'].map(tr => {
    const tc = CERTS.filter(c => c.track === tr);
    const tp = tc.filter(c => state.passes[c.id]).length;
    const pct = tc.length ? Math.round(tp / tc.length * 100) : 0;
    const info = TRACK_INFO[tr];
    return `
      <div class="track-row">
        <div class="track-row-meta">
          <span class="badge ${info.cls}">${info.label}</span>
          <span style="font-size:10px;color:var(--dim)">${tp}/${tc.length}</span>
        </div>
        ${progressBarHTML(pct, info.bar, '5px')}
      </div>`;
  }).join('');

  const cpeRows = '';

  const prioLevels = [5, 4, 3, 2, 1];
  const prioRows = prioLevels.map(lvl => {
    const certsAtLvl = CERTS.filter(c => priorityScore(c) === lvl);
    if (certsAtLvl.length === 0) return '';
    const passedAtLvl = certsAtLvl.filter(c => state.passes[c.id]).length;
    const pct = certsAtLvl.length > 0 ? Math.round(passedAtLvl / certsAtLvl.length * 100) : 0;
    const barColor = lvl === 5 ? 'var(--red)' : lvl === 4 ? 'var(--amber)' : lvl === 3 ? 'var(--blue)' : 'var(--slate)';
    return `
      <div class="track-row">
        <div class="track-row-meta">
          <span class="badge badge-prio badge-prio-${lvl}">${priorityTag(lvl)} · ${priorityLabel(lvl)}</span>
          <span style="font-size:10px;color:var(--dim)">${passedAtLvl}/${certsAtLvl.length}</span>
        </div>
        ${progressBarHTML(pct, barColor, '5px')}
      </div>`;
  }).join('');

  const EP = effPasses();
  const roiActionable = scopeCerts.filter(c =>
    !EP[c.id] && !state.skipped[c.id] && (c.cvValue || 0) > 0 &&
    c.hours && c.hours[1] > 0 && (c.deps || []).every(d => EP[d]));
  const fmtK = v => v >= 1000 ? '£' + (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : '£' + v;
  const roiGoal = goalFor(state.filter);
  const goalMid = bandMid(roiGoal.band);
  const gapScope = scopeCerts.filter(c => (c.cvValue || 0) > 0);
  const gapTotV = gapScope.reduce((s, c) => s + c.cvValue, 0);
  const gapDoneV = gapScope.filter(c => EP[c.id]).reduce((s, c) => s + c.cvValue, 0);
  const gapProg = gapTotV ? gapDoneV / gapTotV : 0;
  const gapY = Math.max(0, goalMid - (state.currentSalary || 0));
  const gapClosed = Math.round(gapY * gapProg);
  const remHours = gapScope.filter(c => !EP[c.id] && !state.skipped[c.id] && c.hours).reduce((s, c) => s + c.hours[1], 0);
  let projHTML = '';
  if (remHours > 0) {
    const now = Date.now(), drop = new Date('2026-09-01').getTime();
    const wks1 = Math.max(0, (drop - now) / (7 * 86400000));
    const h1 = wks1 * 13;
    let totalWks = null;
    if (remHours <= h1) totalWks = remHours / 13;
    else if (state.pace2 > 0) totalWks = wks1 + (remHours - h1) / state.pace2;
    const projDate = totalWks !== null ? new Date(now + totalWks * 7 * 86400000) : null;
    const projStr = projDate ? projDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'paused (0h/wk after Sep)';
    projHTML = `<div class="roi-proj">⏳ ${remHours}h of study left in this scope · at 13h/wk now → <button class="roi-salary-edit" onclick="editPace2()" title="Edit post-Sep pace — stored only in the browser">${state.pace2}h/wk from Sep 2026 ✎</button> · credential-ready ≈ <strong>${projStr}</strong></div>`;
  }
  const gapHTML = goalMid ? `
      <div class="roi-gap">
        <div class="roi-gap-top">
          <button class="roi-salary-edit" onclick="editSalary()" title="Edit — stored only in the browser, never in the file">the candidate is at £${(state.currentSalary || 0).toLocaleString()} ✎</button>
          <span class="roi-gap-goalmid">target ~£${goalMid.toLocaleString()}</span>
        </div>
        <div class="roi-gap-bar"><div class="roi-gap-fill" style="width:${Math.round(gapProg * 100)}%"></div></div>
        <div class="roi-gap-cap">Gap £${gapY.toLocaleString()} · path has closed ~£${gapClosed.toLocaleString()} (${Math.round(gapProg * 100)}% credential-ready) · £${(gapY - gapClosed).toLocaleString()} to go. Credentials open the door; the salary also needs the experience.</div>
        ${projHTML}
      </div>` : '';
  const roiRanked = roiActionable
    .map(c => ({ c, h: c.hours[1], vel: (c.cvValue || 0) / c.hours[1] }))
    .sort((a, b) => b.vel - a.vel).slice(0, 8);
  const roiRows = roiRanked.map((r, i) => `
    <div class="roi-move">
      <div class="roi-rank">${i + 1}</div>
      <div class="roi-move-main">
        <div class="roi-move-name">${escape(r.c.name)}</div>
        <div class="roi-move-sub">~${r.h}h · ${r.c.employer ? 'employer-funded' : '£' + (r.c.costNum || 0)}${r.c.gateway ? ' · 🔑 gateway' : ''}</div>
      </div>
      <div class="roi-move-val">
        <div class="roi-move-cv">+${fmtK(r.c.cvValue)}</div>
        <div class="roi-move-vel">${Math.round(r.vel)} £/h</div>
      </div>
    </div>`).join('');
  const roiCard = `
    <div class="card roi-card">
      <div class="card-title"><span class="dot" style="background:var(--green)"></span>Fastest £ ROI — Next Moves</div>
      <div class="roi-goal">🎯 Optimising for <strong>${escape(roiGoal.goal)}</strong>${roiGoal.band ? ` · <span class="roi-goal-band">${escape(roiGoal.band)}</span>` : ''}</div>
      <div class="roi-lede">Unblocked certs in this filter, ranked by £ value per study hour toward the goal above. Switch the filter chip to optimise for a different destination. Estimates, non-additive.</div>
      ${gapHTML}
      ${roiRows || '<div class="roi-empty">No unblocked moves right now — clear current prerequisites first.</div>'}
    </div>`;

  const roleRanked = roleMatches().slice(0, 5);
  const roleRows = roleRanked.map(r => {
    const pct = Math.round(r.cov * 100);
    const tier = pct >= 70 ? 'Ready' : pct >= 40 ? 'Strong' : pct >= 15 ? 'Developing' : 'Emerging';
    return `
      <div class="role-match" onclick="setFilter('${r.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setFilter('${r.id}');}" title="Tap to optimise the ROI card for this role">
        <div class="role-match-head">
          <span class="role-match-name">${escape(r.label)}</span>
          <span class="role-match-pct">${pct}%</span>
        </div>
        <div class="role-match-bar"><div class="role-match-fill" style="width:${Math.max(pct, 2)}%"></div></div>
        <div class="role-match-sub"><span class="role-match-tier">${tier}</span> · ${r.done}/${r.total} certs${r.exp ? ` · 🧰 ${r.exp} exp` : ''} · ${escape(r.band)}${r.next ? ` · next: ${escape(r.next.name)}` : ''}</div>
      </div>`;
  }).join('');
  const roleCard = `
    <div class="card role-card">
      <div class="card-title" style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:var(--purple)"></span><span style="flex:1">Role Match — by what the candidate has completed</span><button class="sim-btn${state.simMode ? ' on' : ''}" onclick="toggleSimMode()" title="What-if simulator: preview how hypothetical passes change the role match and gap">🧪 What-if${state.simMode ? ' ON' : ''}</button></div>
      ${state.simMode ? `<div class="sim-banner">Simulation active — ${Object.keys(state.simPasses).length} hypothetical pass${Object.keys(state.simPasses).length === 1 ? '' : 'es'}. Open any cert on the Certifications tab and tap “Simulate pass”. Nothing is saved. <button class="sim-link" onclick="clearSim()">Clear</button> <button class="sim-link" onclick="toggleSimMode()">Exit</button></div>` : ''}
      <div class="roi-lede">Live ranking of which roles the passed certs point to — by share of each role's credentials earned (value-weighted). Re-ranks as the candidate mark certs complete. Tap a role to optimise the card above for it. Credential coverage, not a job guarantee.</div>
      ${roleRows || '<div class="roi-empty">Mark some certs complete to see the closest roles.</div>'}
    </div>`;

  return `
    ${renderBanners()}
    ${notifyBanner}
    ${toolsBar}
    ${heroCard}
    <div class="dash-grid">
      ${roiCard}
      ${roleCard}
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--red)"></span>Expiry Timeline</div>
        ${(() => { let h = 0, n = 0; scopeCerts.forEach(c => { if (c.cpe > 0 && c.cpePeriod > 0) { h += c.cpe / (c.cpePeriod / 12); n++; } }); return h ? `<div class="roi-lede">Maintenance at full build-out: ${n} certs · ~${Math.round(h)} CPE hrs/yr (≈${(h / 52).toFixed(1)}h/wk) before double-counting — one activity often renews several, and CE cascades (higher CompTIA certs auto-renew lower).</div>` : ''; })()}
        ${expiryHTML}
      </div>
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--blue)"></span>Phase Progress</div>
        ${phaseHTML}
      </div>
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--green)"></span>Overall & Tracks</div>
        <div class="big-number">${passed}</div>
        <div class="big-sub">of ${total} certifications passed</div>
        ${progressBarHTML(overallPct, 'var(--blue)', '8px')}
        <div style="margin:10px 0 10px 0;font-size:10px;color:var(--dim);text-align:center">Core: ${CERTS.filter(c => c.track === 'CORE' && state.passes[c.id]).length}/${CERTS.filter(c => c.track === 'CORE').length} · Gateway: ${gatewayPassed}/${gatewayCerts.length}</div>
        <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin:10px 0 8px">By Priority</div>
        ${prioRows}
        <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 8px;border-top:1px solid var(--border);padding-top:12px">By Track</div>
        ${trackRows}
              </div>
      ${moneyCard}
      ${fundingCard}${partnerCard}${tailCard}${trophyCard}
    </div>`;
}

function renderStrategy() {
  const total = CERTS.length;
  const trackACount = CERTS.filter(c => c.tracks && c.tracks.includes('A')).length;
  const trackBCount = CERTS.filter(c => c.tracks && c.tracks.includes('B')).length;
  const trackCCount = CERTS.filter(c => c.tracks && c.tracks.includes('C')).length;

  return `
    <div class="card explog-card">
      <div class="card-title" style="display:flex;align-items:center;gap:8px"><span class="dot" style="background:var(--amber)"></span><span style="flex:1">Experience Log</span><button class="sim-btn" onclick="addExp()">+ Add</button></div>
      <div class="roi-lede">Credentials open the door; experience walks through it. Log labs, deployments, incidents and design wins here — tagged entries count toward the matching roles on the dashboard. Stored only in this browser.</div>
      ${state.expLog.length ? state.expLog.map((e, i) => `
        <div class="explog-row">
          <span class="explog-tag${e.g ? ' t' + e.g : ''}">${e.g || '·'}</span>
          <div class="explog-main"><div class="explog-title">${escape(e.t)}</div><div class="explog-date">${escape(e.d)}</div></div>
          <button class="explog-del" onclick="delExp(${i})" aria-label="Remove entry">×</button>
        </div>`).join('') : '<div class="roi-empty">No entries yet — tap + Add after the next lab or deployment.</div>'}
    </div>
    <div class="strategy-intro">
      <h2>📋 Career Strategy</h2>
      <p class="strategy-lede">A structured certification plan organised in 6 phases. Certs are tagged across three career destination tracks — <strong>Physical Security Architect</strong> (B), <strong>Cyber Security Engineer/Architect</strong> (C), and <strong>Cloud Security Architect</strong> (A) — so the candidate can filter by relevance to current direction. Foundation certs (A·B·C) serve all three tracks.</p>
      <p class="strategy-lede" style="font-size:12px;opacity:.85">the <strong>saved plan</strong> sits at the top. Everything below is the framework that shaped it: <strong>where to start</strong>, the <strong>three career tracks</strong> (role ladders &amp; gateway projects), the <strong>highest-earning paths</strong>, and <strong>reference</strong> (credentials, study stack, costs).</p>
      <div class="strategy-stats">
        <div class="strategy-stat"><strong>${total}</strong><span>total certs</span></div>
        <div class="strategy-stat"><strong>${trackACount}</strong><span>Track A applicable</span></div>
        <div class="strategy-stat"><strong>${trackBCount}</strong><span>Track B applicable</span></div>
        <div class="strategy-stat"><strong>${trackCCount}</strong><span>Track C applicable</span></div>
      </div>
    </div>

    <div class="strat-framer">⭐ <strong style="color:var(--blue-text)">This is the saved plan</strong> — the framework that shaped it (foundation, tracks, top paths, reference) follows below.</div>
    <details class="strategy-section track-section track-mypath-section" open>
      <summary><span class="strategy-marker">🌟</span> My Path · Convergence Solutions Architect → Principal / Lead OT-Convergence Architect (AI-multiplied · v5 · OT-convergence focus)</summary>
      <div class="strategy-body">
        <p class="strat-note">Refined to remove bloat and resequence by realistic timing. Three tiers building from current VMS + physical architecture work toward the technical apex (Principal / Lead / Distinguished architect, or independent OT-convergence specialist). AI security as a multiplicative layer in every tier. Total: <strong>~71 core certs</strong> (v19 — dual-vendor consultancy position locked: CrowdStrike + Palo Alto both at architect level, SOC-engineering depth optional) (was 66) — trimmed for cohesion, not coverage.</p>


        <div style="background: linear-gradient(135deg, rgba(62, 230, 160, 0.08), rgba(62, 230, 160, 0.04)); border-left: 3px solid #34d399; padding: 12px 14px; margin: 12px 0; border-radius: 6px; font-size: 11px; line-height: 1.6;">
          <strong style="color: #8ef5c9; font-size: 12.5px;">💰 ROI Optimisation — maximise return, minimise spend</strong>
          <p style="margin: 6px 0; color: #c0d7dc;">The path costs ~£32.5k of exam fees over the ~10-year horizon — but with the right approach, the <em>real</em> spend is far lower and the early return is far higher. Four levers:</p>

          <p style="margin: 8px 0 3px; color: #8ef5c9;"><strong>① Free training is the biggest cost lever (cuts ~80% of effective cost):</strong></p>
          <p style="margin: 2px 0 6px; color: #c0d7dc;">Almost every cert here has a 100% free study route — the exam fee is the only unavoidable cost. <strong>Microsoft Learn</strong> (all SC-/AZ-/AI- certs), <strong>CrowdStrike University</strong> (free for partners), <strong>AWS Skill Builder</strong>, <strong>Palo Alto Beacon</strong> (free for partners), <strong>Professor Messer</strong> (all CompTIA). Never pay for a training course where a free path exists — it rarely changes pass rates.</p>

          <p style="margin: 8px 0 3px; color: #8ef5c9;"><strong>② Front-load the quick wins (highest efficiency — do Year 1-2):</strong></p>
          <ul style="margin: 2px 0 6px 16px; padding: 0; color: #c0d7dc;">
            <li><strong>Employer-funded (£0 to the candidate):</strong> LCA · LCP · LCDA · MCIT · MCIE · MCDE · ACP · IEC 62443-CFS — the relevant organisation pays for these as an Axis/Milestone/LenelS2 partner. Pure ROI: career value at zero personal cost. Knock these out first.</li>
            <li><strong>Cheap + high-value (£89-130, free study):</strong> AZ-900 · AI-900 · Security+ (Professor Messer) · Palo Alto Practitioner (free Beacon) · ISA/IEC 62443 Fundamentals.</li>
          </ul>

          <p style="margin: 8px 0 3px; color: #8ef5c9;"><strong>③ Budget for the expensive essentials (low efficiency, but non-negotiable):</strong></p>
          <p style="margin: 2px 0 6px; color: #c0d7dc;">CISSP (£590) · SABSA (£2k) · ISSAP (£475) · CCSP (£480) · ISO 27001 LI (£800) · ESDP (£240). These score "low" on cost-efficiency only because they're expensive and slow — but they're the credentials that unlock Senior/Director roles. They're not optional; just <em>plan and time</em> them (one major cert per 6-9 months) and seek employer funding where clawback terms are acceptable.</p>

          <p style="margin: 8px 0 3px; color: #8ef5c9;"><strong>④ The one genuine reconsider:</strong></p>
          <p style="margin: 2px 0 0; color: #c0d7dc;"><strong>GICSP via SANS (~£7,800)</strong> is the single biggest line item. The <strong>exam-only challenge route (~£1,300)</strong> cuts it dramatically if the candidate self-study with the ISA/IEC 62443 materials and the OT lab — strongly worth weighing before committing to the full SANS course. Saving here ≈ £6,500.</p>

          <p style="margin: 8px 0 0; color: #c0d7dc;"><strong style="color: #8ef5c9;">Net effect:</strong> Of the ~£32.5k headline — most certs have free training (Microsoft Learn, vendor academies), employer covers the physical-vendor certs (£0 to the candidate), and the GICSP exam-only route saves ~£6,500. Realistic personal exam-fee spend over the ~10-year horizon: <strong>~£22-26k (~£2,200-2,600/year)</strong> — and the highest-value certs come early, so the earning uplift compounds across the whole decade.</p>
        </div>
        <div class="tier-block tier-junior">
          <div class="tier-header"><span class="tier-icon">🚀</span><strong>Junior Tier</strong> · Years 1-3 · <span class="tier-pay">£30-55k</span> · 25 certs</div>
          <div class="tier-focus">Foundation across both layers + AI literacy + UK project methodology</div>
        <div style="background: rgba(160, 160, 200, 0.07); border-left: 3px solid #7ea5b0; padding: 9px 12px; margin: 8px 0 12px; border-radius: 6px; font-size: 10.5px; line-height: 1.55; color: #c0d7dc;">
          <strong style="color: #c0d7dc;">📊 Wage brackets — calibrated to 2026 UK market data.</strong> Junior £30-55k reflects an entry-level systems-engineer start (UK security-systems engineer averages ~£34k; junior cyber £30-50k). Senior £60-135k = mid-to-senior security architect (UK avg £66-88k; London cyber architect £95-130k). Director £120-400k+ = head-of-security/CISO base (£110-185k) rising to Big-4 partner / independent specialist (day rates £900-2,500 = £180-450k annualised). <em>The video-analytics + GIS convergence premium is a <em>benched</em> upside — if ever un-benched, it pushes the ceiling toward £400-500k+ — treat that as the scarce-specialist case, not the baseline.</em>
        </div>
          <div class="tier-certs">
            <span class="tier-group"><strong>Physical:</strong> MCIT · LCA · LCP · ACP</span>
            <span class="tier-group"><strong>Cyber + network foundation:</strong> Sec+ · CySA+ · Net+ · CCNA (200-301, traditional routing/switching) · Meraki CMSS (cloud-managed networking) · AZ-104 · SC-900</span>
            <span class="tier-group"><strong>Vendor entry:</strong> PAN Practitioner · CrowdStrike CCF · NSE-4 (Fortinet)</span>
            <span class="tier-group"><strong>UK + methodology:</strong> CISMP · UKCSC Associate · ITIL 4 F</span>
            <span class="tier-group ai-multiplier"><strong>🤖 AI:</strong> AI-901 · CompTIA SecAI+</span>
            <span class="tier-group ai-multiplier"><strong>🛰️ Geospatial specialist — ⏸ BENCHED (option, not plan):</strong> ArcGIS Pro Foundation (~£120 entry — GIS literacy, free MOOC)</span>
            <span class="tier-group lang-group"><strong>💻 Languages &amp; scripting:</strong> Bash (Linux/cloud CLI, log grep) · PowerShell (Entra/M365/Azure + Defender admin) · SQL basics (KQL for Sentinel queries)</span>
          </div>
          <div class="tier-target">→ <em>Position: Convergence Engineer at a physical security integrator</em></div>
        </div>

        <div class="tier-block tier-senior">
          <div class="tier-header"><span class="tier-icon">📈</span><strong>Senior Tier</strong> · Years 4-7 · <span class="tier-pay">£60-135k</span> · trimmed for focus</div>
          <div class="tier-focus">Dual-stack architecture + AI security operationalisation · architect-grade certs only</div>
          <div class="tier-certs">
            <span class="tier-group"><strong>Microsoft stack:</strong> SC-200 · SC-300 · SC-401 · SC-100 · AZ-305</span>
            <span class="tier-group"><strong>Architect:</strong> CISSP + ISSAP (architect specialism — replaces CISM)</span>
            <span class="tier-group"><strong>Cloud:</strong> CCSP · CCSK · AWS SAA</span>
            <span class="tier-group"><strong>Physical depth:</strong> LCE · LCDA · MCIE · <strong>MCDE</strong> · IEC 62443 CFS · CDS · GICSP</span>
            <span class="tier-group"><strong>CrowdStrike (vendor-agnostic depth):</strong> Falcon Admin+Responder · Hunter · Identity · Cloud</span>
            <span class="tier-group"><strong>Palo Alto (vendor-agnostic depth):</strong> Practitioner · NetSec Pro · NGFW Eng · Cloud Sec Pro · NetSec Architect <span style="color:#68838b">(SecOps/XDR chain → optional SOC specialism)</span></span>
            <span class="tier-group"><strong>Service mgmt:</strong> ITIL 4 Foundation (Junior) — MP deferred (low ROI for architect; star if service-lead role)</span>
            <span class="tier-group"><strong>UK chartered:</strong> UKCSC Practitioner · Principal</span>
            <span class="tier-group ai-multiplier"><strong>🤖 AI:</strong> CAISP · SC-500 (Cloud + AI Security Engineer)</span>
            <span class="tier-group ai-multiplier"><strong>🛰️ Geospatial convergence — ⏸ BENCHED (~440h freed):</strong> ArcGIS Pro Associate (site mapping + imagery) · Developer Foundation + <strong>API for Python Associate</strong> (build the edge-analytics → GIS pipeline) · Online Admin (deliver per-customer web COPs)</span>
            <span class="tier-group lang-group"><strong>💻 Languages &amp; scripting:</strong> <strong>Python (PCEP → PCAP)</strong> — automation, log parsing, AI-security tooling + <strong>ArcGIS API for Python</strong> (the camera-analytics–GIS integration language) · SQL (KQL for Sentinel + Splunk SPL) · PowerShell (Entra/Defender/Sentinel runbooks) — functional scripting literacy, not software-engineering depth</span>
          </div>
          <div class="tier-target">→ <em>Position: Principal / Lead OT-Convergence Security Architect (technical apex — not people-management)</em></div>
        </div>


        <div class="tier-block tier-director">
          <div class="tier-header"><span class="tier-icon">🏆</span><strong>Principal / Distinguished Tier</strong> · Years 8+ · <span class="tier-pay">£120-400k+</span> · trimmed for focus</div>
          <div class="tier-focus">Deep convergence architecture · OT/CNI mastery · AI security · technical authority</div>
          <div class="tier-certs">
            <span class="tier-group"><strong>Senior vendor architect:</strong> PAN NetSec Architect <span style="color:#68838b">(SecOps Architect → optional)</span></span>
            <span class="tier-group"><strong>Risk:</strong> CRISC</span>
            <span class="tier-group"><strong>🏭 OT/CNI mastery (spearhead):</strong> GICSP · 62443 CRA · CMS · <strong>62443 Expert</strong> (capstone) · GRID · ASIS PSP</span>
            <span class="tier-group"><strong>UK Chartered top:</strong> UKCSC Chartered · CSyP</span>
            <span class="tier-group"><strong>Standards:</strong> ISO 27001 LI</span>
            <span class="tier-group"><strong>Security architecture:</strong> <strong>SABSA Foundation</strong> (UK gold standard) · ISSAP (architect specialism)</span>
            <span class="tier-group ai-multiplier"><strong>🤖 AI security ladder:</strong> CAISP · <strong>GIAC GAIPS</strong> (AI platform security)</span>
            <span class="tier-group lang-group"><strong>💻 Languages &amp; scripting:</strong> Python maintained (PoC demos, thought-leadership notebooks) · JavaScript/TypeScript <em>literacy</em> (to review serverless + web-app security architectures) — at this tier the candidate read &amp; direct code more than write it</span>
          </div>
        <div style="background: linear-gradient(135deg, rgba(85, 214, 255, 0.08), rgba(85, 214, 255, 0.04)); border-left: 3px solid #38bdf8; padding: 12px 14px; margin: 12px 0; border-radius: 6px; font-size: 11px; line-height: 1.6;">
          <strong style="color: #8ee7ff; font-size: 12.5px;">💻 Language Certifications — only where they're worth it</strong>
          <p style="margin: 6px 0; color: #c0d7dc;">Of the five core languages, only two have certifications worth holding. The rest are validated through certs the candidate already have — chasing a standalone cert for them would be the time-waste to avoid:</p>
          <ul style="margin: 4px 0 6px 16px; padding: 0; color: #c0d7dc;">
            <li><strong style="color:#8ee7ff;">Python ✅ — the scripting backbone</strong> — <strong>PCEP → PCAP</strong> (Python Institute) is in My Path. Python is the automation and AI-security tooling language: parsing logs, wiring detections, prototyping against APIs — including the <strong>ArcGIS API for Python</strong>, which is how a camera-analytics–GIS integration is actually built (paired with the Developer Foundation cert). PCEP/PCAP cover that working literacy; the professional-developer ladder (PCPP1/PCPP2) stays skipped — that’s software-engineer depth the architect role doesn’t need.</li>
            <li><strong style="color:#8ee7ff;">JavaScript/TypeScript ⚪ — relevant, but deliberately NOT in My Path</strong> — useful for reviewing serverless + web-app security architectures, but that's <em>developer</em> territory — the target is architect/advisory, not building apps, so JS stays literacy-level. <strong>JSNSD</strong> (security-focused services) + <strong>JSNAD</strong> live in the AppSec/DevSecOps pathways for anyone who pivots that way; they are intentionally absent from the core path.</li>
            <li><strong style="color:#7ea5b0;">PowerShell ❌</strong> — no standalone cert exists. Validated inside AZ-104 / SC-200 / SC-300 (already in path).</li>
            <li><strong style="color:#7ea5b0;">SQL ❌</strong> — no security-relevant standalone cert. the SQL (KQL + Splunk SPL) is validated via the Splunk certs + SC-200. A pure Oracle/DP-900 SQL cert is a data-admin credential — wrong signal, skip it.</li>
            <li><strong style="color:#7ea5b0;">Bash ❌</strong> — no standalone Bash cert exists; covered by <strong>Linux+ (XK0-006)</strong> if the candidate want the credential (now part of My Path — add only if a Linux/cloud-heavy role demands it).</li>
          </ul>
          <p style="margin: 6px 0 0; color: #c0d7dc;"><strong style="color:#8ee7ff;">Bottom line:</strong> PCEP → PCAP give the scripting signal worth holding. Everything else is either already validated (PowerShell/SQL/Bash via existing certs) or a deliberate skip.</p>
        </div>
          <div class="tier-target">→ <em>Position: Principal / Lead / Distinguished Security Architect · independent OT-convergence specialist (£1,200-2,000/day)</em></div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(0, 205, 183, 0.10), rgba(0, 205, 183, 0.04)); border-left: 3px solid #00cdb7; padding: 12px 14px; margin: 12px 0; border-radius: 6px; font-size: 11px; line-height: 1.6;">
          <strong style="color: #67ffe9; font-size: 12.5px;">🏆 Director-Level Requirements — what actually gates this tier</strong>
          <p style="margin: 6px 0; color: #c0d7dc;">Certs are necessary but <strong>not sufficient</strong> for Director. The tier has three distinct gates — credentials are only the first.</p>

          <p style="margin: 8px 0 3px; color: #67ffe9;"><strong>① Experience gates (hard minimums):</strong></p>
          <ul style="margin: 2px 0 6px 16px; padding: 0; color: #c0d7dc;">
            <li>10-15 years total industry experience (the candidate is ~5 now — Director is realistically Year 10-12 from today)</li>
            <li>4-6 years demonstrable at Senior Architect level</li>
            <li>Ownership of at least one major delivery's technical architecture end-to-end</li>
            <li>Line-management or practice-lead experience (2+ direct reports or workstream ownership)</li>
          </ul>

          <p style="margin: 8px 0 3px; color: #67ffe9;"><strong>② Credential gates (experience-locked certs):</strong></p>
          <ul style="margin: 2px 0 6px 16px; padding: 0; color: #c0d7dc;">
            <li><strong>CISM</strong> — requires 5 years infosec work, 3 in management roles</li>
            <li><strong>CRISC</strong> — requires 3 years risk-management experience</li>
            <li><strong>CSyP (Chartered Security Professional)</strong> — requires 5+ years senior experience + peer endorsement + interview panel</li>
            <li><strong>UKCSC Chartered</strong> — sequential: Associate → Practitioner → Principal → Chartered (each with its own experience window; ~4 years minimum from Principal)</li>
            <li><strong>ASIS PSP</strong> — requires 4-6 years physical security experience</li>
            <li><strong>PAN architect certs</strong> — require the full Professional-tier chain held first</li>
          </ul>

          <p style="margin: 8px 0 3px; color: #67ffe9;"><strong>③ Non-credential requirements (the actual ceiling-breakers — no cert delivers these):</strong></p>
          <ul style="margin: 2px 0 6px 16px; padding: 0; color: #c0d7dc;">
            <li><strong>Book of business</strong> — relationships with 50-100 UK security buyers who know the name. This is what separates £200k seniors from £400k+ directors.</li>
            <li><strong>Thought leadership track record</strong> — published reference designs, in-depth articles, and open-source tooling; a recognised POV on convergence (built through writing, not the speaking circuit)</li>
            <li><strong>2-3 signature deliveries</strong> — major convergence projects the candidate can name and reference (anonymised). Proof the candidate has done it, not just certified for it.</li>
            <li><strong>Commercial acumen</strong> — proposal leadership, deal shaping, bid ownership. (This is the one place MEDDIC/MEDDPICC sales methodology genuinely helps — optional star-add if going consultancy-partner route.)</li>
            <li><strong>Practice-building</strong> — mentoring juniors, growing capability, contributing to the firm's IP/methodology</li>
          </ul>

          <p style="margin: 8px 0 0; color: #c0d7dc;"><strong style="color: #67ffe9;">Honest framing:</strong> The certs in this tier get the candidate <em>into the room</em> for Director interviews and consultancy-partner conversations. Gates ① and ② are checkboxes that accumulate with time. Gate ③ is the real work — and it must be built <strong>in parallel</strong> with Senior-tier cert study (Years 4-7), not after. Start the thought-leadership and relationship-building now; they compound over a decade. A Director with 14 certs and no book of business earns less than a Director with 6 certs and 80 client relationships.</p>
        </div>

        <div class="why-natural">
          <strong>💡 What changed (v5 · OT-convergence focus):</strong> Endgame refocused from Director/consulting to the <strong>technical apex</strong> (Principal / Lead / Distinguished architect). <strong>Benched as off-path</strong> for a technical IC: CISM, TOGAF, PRINCE2, CIPM, AIGP, AAISM (management / sales / governance breadth — all recoverable from the bench). <strong>Added:</strong> the full OT/CNI ladder (GICSP → IEC 62443 Design + Maintenance → <strong>62443 Expert</strong> capstone → GRID), a technical AI-security ladder (SecAI+ → CAISP → <strong>GIAC GAIPS</strong>), and <strong>ISSAP</strong> (architect specialism — replaces CISM as the senior signal). SABSA Foundation retained as the UK security-architecture gold standard.
        </div>

        <div class="gateway-project">
          <span class="gp-icon">🎯</span><strong>Gateway Project per tier:</strong>
          <ul style="margin:6px 0 0 0;padding-left:18px;font-size:11px;line-height:1.5">
            <li><strong>Junior:</strong> Multi-vendor home lab — Milestone XProtect VMS + Axis cameras + a 62443-style OT segment + Sentinel SIEM + Palo Alto/CrowdStrike trials + Azure OpenAI. Document the physical-to-cyber data flow and a basic OT network zoning model as the first ADRs.</li>
            <li><strong>Senior (the differentiator):</strong> Build a converged physical + OT + cyber reference architecture for a fictional CNI site — VMS/access-control on the IT side, a 62443-zoned OT network, and the secured boundary between them. Document it as a full ADR (mapping to NCSC CAF + ISO 27001 + IEC 62443 + NIST AI RMF + SABSA attributes) and publish it. THIS is the portfolio piece that proves convergence design depth. <strong>If the candidate pursue the geospatial track,</strong> extend it with a camera-analytics → ArcGIS <strong>common operating picture</strong> — a site map with live camera analytics plotted spatially, delivered as a customer-style web dashboard. That’s a differentiator almost no one else can demonstrate.</li>
            <li><strong>Director:</strong> Become a recognised technical authority on OT-physical-cyber convergence through writing — reference designs, in-depth articles, and open-source tooling on GitHub. Publish a convergence architecture methodology. Passive visibility only: the published body of work speaks for this path, no speaking circuit required.</li>
          </ul>
        </div>

        <p class="strat-note">💼 <strong>UK target employers:</strong> Convergence consultancies (Convergint, Anixter) · Big 4 cyber practices (KPMG/Deloitte/PwC/EY) · Defence integrators (BAE Systems Digital Intelligence, QinetiQ, Leidos UK) · NCSC Assured Service providers · Smart-city consultancies (ARUP, AECOM, Mott MacDonald) · Insurance broker advisory (Marsh, Aon, Willis) · Specialist boutiques.</p>

        <p class="strat-note">🎓 <strong>Optional add-ons (star manually if the candidate go that direction):</strong> ISSAP (multinational/US architect roles) · MEDDIC Foundation (consultancy-partner sales) · <strong>SOC-engineering specialism</strong> (Palo Alto SecOps/XDR/XSIAM chain + CrowdStrike SIEM Analyst/Engineer — add as a bundle only if the consultancy develops SOC-build/MSSP work) (if leading proposals at Senior) · PAN XSIAM/XSOAR Engineer (if SOC-engineering direction emerges) · CISA (if audit-direction emerges).</p>

        <p class="strat-note">💡 <strong>Personalise:</strong> Tap the ★ on any cert tile to add/remove. The 🌟 My Path filter chip surfaces the starred certs. Currently <strong><span id="mypath-count"></span></strong> certs in the path.</p>
      </div>
    </details>

    <details class="strategy-section" open>
      <summary><span class="strategy-marker">🚦</span> Start Here · Phase 1 Foundation</summary>
      <div class="strategy-body">
        <p>Phase 1 is the foundation skeleton. Every Phase 1 cert meets the criterion: <strong>role-foundational OR high-ROI easy win</strong>.</p>
        <p><strong>Already passed</strong> (counted in Phase 1 totals but not in study sequence): A+ (Core 1/2), Network+ (N10-009, passed Mar 2026). UKCSC ACSP is also in Phase 1 but is a separate evidence-based application (£362 via CIISec, not exam-based) requiring Sec+ or equivalent — apply post-Sec+, not auto-earned.</p>
        <p><strong>Sequence (priority order, time-flexible):</strong></p>
        <ol>
          <li><strong>Vendor wall</strong> (employer-funded, role essentials, run throughout Phase 1 paced by project arrival): LenelS2 entry rungs (LCA → LCP), Milestone ladder (MCIT → MCIE capstone · MCDE design track), Axis ACP, Cisco Meraki CMSS. LenelS2 senior rungs (LCE → LCDA) sit in Phase 3-4 because they require accumulated deployment hours, not just study.</li>
          <li><strong>AZ-900</strong> — Azure stepping stone (~30h, ~£89)</li>
          <li><strong>SC-900</strong> — security stepping stone (~25h, ~£89)</li>
          <li><strong>Security+</strong> — Tier S gateway anchor (~90h, ~£350)</li>
          <li><strong>SecAI+</strong> — cheap cascade post-Sec+ (~40h, ~£130)</li>
          <li><strong>TryHackMe SEC0 + SEC1</strong> — ambient hands-on (~40h, ~£12/mo)</li>
          <li><strong>AZ-104</strong> — cloud foundation (~90h, ~£136)</li>
          <li><strong>CCNA</strong> — Phase 1 capstone, networking confidence (~150h, ~£260)</li>
        </ol>
        <p>Phase 1 ends when CCNA passes. Realistic close for self-study spine: mid-2027 to mid-2028. Tap the <strong>P1 Must</strong> filter on the Certifications tab to view all 24 Phase 1 certs.</p>
        <p><strong>Vendor ladder note:</strong> Most vendor certs (LenelS2 LCA→LCP, Milestone MCIT→MCIE (capstone) + MCDE (design), Cisco Meraki CMSS) sit in Phase 1 because they're employer-funded and run continuously alongside the self-study spine — paced by customer project arrival rather than by the study schedule. The LenelS2 senior tier (LCE Phase 3, LCDA Phase 4) is gated by deployment-hour accumulation: LCE realistically lands when the candidate has shadowed 2-3 OnGuard enterprise installs, LCDA lands when the candidate has led one. Phase placement reflects eligibility, not study order.</p>
      </div>
    </details>

    <div class="strat-band">🛠️ Portfolio &amp; Visibility (the moat)</div>
    <details class="strategy-section" open>
      <summary><span class="strategy-marker">🛠️</span> Portfolio &amp; Visibility Track · the work that wins Principal roles</summary>
      <div class="strategy-body">
        <p class="strat-framer"><strong>Why this track exists:</strong> certs get the candidate shortlisted — demonstrated convergence work gets the candidate hired as a Principal / Lead Architect. It is the differentiator a long cert list can never provide. Built for a <strong>passive, written-first</strong> approach: GitHub, documented designs and async writing. <strong>No public speaking required.</strong></p>
        <p><strong>P1–2 · Foundation — build the public surface</strong></p>
        <ul>
          <li><strong>GitHub portfolio repo</strong> — lab configs + PowerShell/Python automation scripts. Doubles as the scripting-gap closer (the one portfolio weakness flagged in earlier reviews).</li>
          <li><strong>Home convergence lab v1, documented</strong> — document existing home network / DNS-filtering lab as a clean reference README. The lab already exists; the documentation is the visibility.</li>
        </ul>
        <p><strong>P3–4 · Build — produce reference designs</strong></p>
        <ul>
          <li><strong>Convergence reference architecture #1</strong> — Milestone VMS events into a SIEM (Sentinel/Splunk), access-control logs correlated with network telemetry. Publish the design doc + diagrams. the single most valuable artefact.</li>
          <li><strong>Integration code</strong> — a public VMS-to-SIEM or access-control-to-SIEM connector/script. Proves the candidate can build, not just diagram.</li>
          <li><strong>Written articles (async)</strong> — a handful of LinkedIn/blog posts on what the candidate are building (e.g. "correlating physical access events with SIEM alerts"). Searchable, compounding, zero speaking.</li>
        </ul>
        <p><strong>P5–6 · Authority — own the niche</strong></p>
        <ul>
          <li><strong>OT/CNI lab</strong> — a segmented OT network (Purdue model) with IEC 62443 controls documented. Direct evidence for the OT-Convergence Architect target.</li>
          <li><strong>Published reference architecture / whitepaper</strong> on physical–cyber–OT convergence. In a niche this thin, one strong written piece makes the candidate a recognised name.</li>
          <li><strong>Open-source contribution or a released tool</strong> — the highest-signal passive credential there is.</li>
        </ul>
        <p class="strat-note"><strong>Visibility, passively:</strong> GitHub, written articles, published designs and open-source build reputation while the candidate sleep — searchable and compounding. Conference talks stay optional, never required for this path.</p>
      </div>
    </details>

    <div class="strat-band">🎯 the North Star</div>
    <details class="strategy-section" open>
      <summary><span class="strategy-marker">🎯</span> Target Role · Principal / Lead OT-Convergence Security Architect</summary>
      <div class="strategy-body">
        <p class="strat-framer"><strong>The destination:</strong> the technical apex — a Principal / Lead / Distinguished-Engineer-level architect who designs converged physical + OT + cyber + cloud security systems. An individual-contributor authority role: deep design and hands-on work, <strong>not</strong> people-management, sales, or public speaking. Visibility is built passively via the Portfolio track above.</p>
        <p><strong>Why the candidate is rare (the moat)</strong> — almost no one holds all of these at once:</p>
        <ul>
          <li><strong>Physical-security vendor depth</strong> — Milestone, LenelS2, Axis (employer-funded, straight from the day job)</li>
          <li><strong>OT / industrial</strong> — the spearhead (flagship ladder below)</li>
          <li><strong>Cyber-defensive core</strong> — Security+ → CySA+ → CISSP + ISSAP (architect specialism)</li>
          <li><strong>Cloud, Azure-centric</strong> — AZ-104 → AZ-305 + the SC- security line</li>
          <li><strong>AI security</strong> — the new ladder, future-proofing as AI enters OT</li>
          <li><strong>UK chartership</strong> — ChCSP + CSyP (technical credibility, not a management title)</li>
        </ul>
        <p><strong>🏭 Flagship ladder — OT/CNI (the spearhead):</strong> GICSP → ISA/IEC 62443 Fundamentals → Design → Risk Assessment → Maintenance → <strong>62443 Expert</strong> (auto-awarded capstone) + GRID (ICS active defence). Best-fit, best-paid expression of the skills, with regulatory tailwinds (NIS2, Martyn's Law, CNI). Most of these never expire — it compounds without a renewal tax.</p>
        <p><strong>🤖 Flagship ladder — AI security:</strong> SecAI+ → CAISP (hands-on LLM / adversarial ML) → GIAC GAIPS (AI platform security). Technical, not governance.</p>
        <p><strong>🛰️ Specialist edge (a bet the candidate is genuinely excited about):</strong> a <strong>geospatial common operating picture</strong> for physical security. Site maps (survey + optionally drone imagery) form the base; live analytic data from <strong>edge-analytics-enabled cameras</strong> — object/vehicle/person detection, ANPR, line-crossing — is plotted onto it, with the data model tailored per customer. A focused ArcGIS track (Foundation → Associate → Developer Foundation → API for Python → Online Admin, ~£900) lets the candidate <em>build</em> the camera→GIS pipeline (Developer Foundation + ArcGIS API for Python) and deliver each customer a bespoke web COP. It sits on top of the Axis depth + Python — a rare, buildable combination. A specialist layer sharpening the physical/CNI edge, deliberately not a core pillar competing with the OT + cyber spine.</p>
        <p class="strat-note"><strong>Deliberately off-path:</strong> the Sales-Engineer branches, Director/management rungs, and consulting-generalist breadth in the tracks below are <em>market landscape for context</em> — worth understanding, but the candidate is aiming at the technical-IC convergence apex, not those forks.</p>
      </div>
    </details>

    <div style="background: linear-gradient(135deg, rgba(255, 201, 77, 0.07), rgba(255, 181, 77, 0.03)); border-left: 3px solid #ffc94d; padding: 10px 12px; margin: 10px 0; border-radius: 6px; font-size: 11px; line-height: 1.55;">
      <strong style="color: #ffe08a; font-size: 12px;">🛰️ The video-analytics + GIS angle — a specialist bet, framed honestly</strong>
      <p style="margin: 6px 0 0; color: #c0d7dc;">Modern <strong>edge-analytics</strong> platforms run detection directly on the cameras — object, vehicle and person detection, ANPR, line-crossing, occupancy. The play: feed that live analytic data onto geospatial site maps (built from survey data and, where useful, drone imagery) to give each customer a tailored <strong>common operating picture</strong>. The analytic model differs per customer — a local authority maps town-centre cameras for public safety and footfall, a port tracks vehicles and containers, an industrial site watches perimeter zones, a campus monitors occupancy — so the architect's job is designing how each customer's analytics feeds map into the spatial view and delivering it as a web COP. The combination of <strong>deep Axis deployment experience + ArcGIS fluency + the Python to build the pipeline</strong> is rare and valuable, and it plugs straight into CNI work where geospatial and OT security already overlap.</p>
      <p style="margin: 6px 0 0; color: #c0d7dc;"><strong style="color:#ffc94d;">Held honestly:</strong> this is a <em>forward bet</em> — timing and mainstream adoption aren't guaranteed — so it's sized as a focused 5-cert layer (~£900), not a career-defining commitment. the candidate is also pursuing it because it genuinely interests the candidate, which is a perfectly good reason to hold a small, cheap, on-theme specialist track. It enriches the physical/CNI edge of the convergence profile; it never replaces the OT + cyber spine.</p>
    </div>

    <div class="strat-band">🧭 The Three Career Tracks</div>
    <div style="margin: 6px 0 8px 0; padding: 0 4px;"><p style="font-size:12px;color:var(--dim);margin:0"><strong>Market landscape — context, not prescription.</strong> The full role map across the three knowledge domains: Junior → Intermediate → Senior/Principal rungs, plus Sales-Engineer and specialism forks, included so the candidate understand the terrain. the focus is the convergence of all three at the technical-IC apex (see North Star above); the SE and management forks are deliberately off-path. Tap a track for its strategies + gateway projects.</p></div>

    <details class="strategy-section track-section track-a-section">
      <summary><span class="strategy-marker">☁️</span> Cloud Security · Track A</summary>
      <div class="strategy-body">
        <div class="role-ladder">
          <div class="role-ladder-track"><span class="role-ladder-letter track-a">A</span><strong>Cloud Security · Engineer → Architect</strong><div class="track-tagline">the candidate design and lead cloud security across an organisation. Start as a cloud support engineer, grow into a senior architect deciding security strategy for the whole company.</div></div>
          <ul class="role-ladder-list">
            <li><span class="role-rung-tag rung-junior">Junior</span> Cloud Support Engineer · Cloud Security Analyst · Junior Cloud Engineer<div class="rung-daily">Fielding tickets when cloud systems break, investigating why permissions or services aren't working, helping users get access, restarting things. Lots of documentation reading and learning how each cloud service behaves.</div><div class="rung-meta"><span class="meta-demand">📊 8/10</span> · <span class="meta-pay">💷 £30-45k</span></div><div class="rung-skills"><strong>Skills:</strong> ticket handling · cloud platform navigation · basic scripting · documentation reading · access management basics</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(automation, Lambda/Functions)</em> · Bash (CLI) · PowerShell (Azure) · SQL (KQL/log queries)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> A+ · Net+ · AZ-900 · CCNA · Sec+ · 📈 <strong>Advance to Intermediate via:</strong> AZ-104 (Azure Admin gateway) + CySA+ + AZ-700</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Sign up for free Azure tier. Configure 1 VM, 1 storage account, 1 SQL DB. Apply NSGs, RBAC, Key Vault. Document architecture in Markdown. Commit to public GitHub portfolio.</div></li>
            <li><span class="role-rung-tag rung-mid">Intermediate</span> Cloud Security Engineer · Cloud Solutions Architect · Senior Cloud Engineer<div class="rung-daily">Building and maintaining the security tools that protect cloud systems. Writing scripts to automate routine checks, configuring access permissions, responding to alerts, reviewing new applications before they go live.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 £55-90k</span></div><div class="rung-skills"><strong>Skills:</strong> identity & access management · automation scripting · alert triage · cloud security tooling · architecture review</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(automation, Lambda/Functions)</em> · Bash (CLI) · PowerShell (Azure) · SQL (KQL/log queries)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> AZ-104 · SC-300 · SAA-C03 · CySA+ · 📈 <strong>Advance to Senior via:</strong> AZ-305 (Architect Expert gateway) + CISSP + SC-500 (Cloud+AI Security gateway)</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Deploy 3-tier app on Azure with security controls — Defender for Cloud baseline, Sentinel SIEM with 5 detection rules, ARM/Bicep IaC. Public GitHub demo.</div></li>
            <li><span class="role-rung-tag rung-senior">Senior/Director</span> Principal Cloud Security Architect · Head of Cloud Security · Cloud Security Director<div class="rung-daily">Designing the company's cloud security strategy. Most days in meetings, reviewing designs from the team, deciding which security products to invest in, writing standards. Less hands-on building, more shaping direction.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 £100-180k+</span></div><div class="rung-skills"><strong>Skills:</strong> security strategy · vendor evaluation · stakeholder communication · standards authoring · team leadership</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(automation, Lambda/Functions)</em> · Bash (CLI) · PowerShell (Azure) · SQL (KQL/log queries)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> AZ-305 · SAP-C02 · CISSP · CCSP · SC-100 · 🏆 <strong>Top-tier signals:</strong> ChCSP (UK chartered) · ISSAP (architect specialism)</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author security architecture decision record (ADR) for a fictional 1,000-employee SaaS company migrating from AWS to Azure. Identity, network, data, monitoring. 10-15 pages.</div></li>
            <li class="path-divider"><span class="path-divider-label">↓ Alternative pivot branches (instead of or in addition to default Senior)</span></li>
            <li><span class="role-rung-tag rung-se">💼 SE Branch</span> Cloud Security Sales Engineer · Solutions Engineer · Pre-Sales Engineer<div class="pivot-daily">the candidate sell cloud security products to other companies — demo the tools, answer deep technical questions during sales calls, help customers prove the product works for them.</div><div class="rung-meta"><span class="meta-demand">📊 7/10</span> · <span class="meta-pay">💷 Mid £70-100k OTE · Senior £110-160k OTE</span></div><div class="rung-skills"><strong>Skills:</strong> technical demos · customer engagement · sales support · solution sizing · objection handling</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(automation, Lambda/Functions)</em> · Bash (CLI) · PowerShell (Azure) · SQL (KQL/log queries)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires SC-500 or SC-300 + customer-facing experience</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · AZ-104 + customer-facing experience<br><span class="pivot-rung">📈 Mid (P4):</span> WCSE · PAN NGFW Engineer · CCFA+CCFR → unlocks Cloud Solutions Engineer<br><span class="pivot-rung">📈 Senior (P5-6):</span> CISSP · CCSP · SC-100 → unlocks Principal SE / SE Manager</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build 20-slide demo deck for Wiz/CrowdStrike/Palo Alto cloud security to a fictional prospect. POC plan + value mapping + objection responses.</div></li>
            <li><span class="role-rung-tag rung-pivot-a">🛠️ DevSecOps</span> Cloud DevSecOps Engineer · Platform Security Engineer · SRE<div class="pivot-daily">the candidate build the automated security checks that run every time a developer ships code — catching vulnerabilities before they reach production. Lots of scripting and pipeline tooling.</div><div class="rung-meta"><span class="meta-demand">📊 10/10</span> · <span class="meta-pay">💷 Mid £60-95k · Senior £100-160k</span></div><div class="rung-skills"><strong>Skills:</strong> CI/CD pipelines · IaC (Terraform/Ansible) · container security · automated testing · Git workflow</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(security gates/automation)</em> · Bash (Linux/containers) · YAML+Go (operators) · TypeScript (IaC/CDK)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires AZ-104 + Linux+ + PCEP foundation</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> AZ-104 · AZ-700 (network) · Linux+ · PCEP · Sec+<br><span class="pivot-rung">📈 Mid (P2-4):</span> AutoOps+ · Terraform · Vault-003 · KCSA · AZ-400 · CKA → unlocks DevSecOps Engineer<br><span class="pivot-rung">📈 Senior (P4-6):</span> CKS · CAISP · CSSLP · ISSAP → unlocks Senior DevSecOps / Platform Security Architect</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build CI/CD pipeline (GitHub Actions) with SAST (Semgrep), DAST (OWASP ZAP), container scanning (Trivy), IaC scanning (Checkov), secrets scanning (Gitleaks), signed images (Cosign). Public repo.</div></li>
            <li><span class="role-rung-tag rung-pivot-b">🔏 Privacy/Governance</span> Cloud Privacy Engineer · Cloud Compliance Lead<div class="pivot-daily">the candidate make sure the company's data handling follows the law (UK GDPR, Data Protection Act 2018) — writing policies, advising legal teams, auditing where personal data lives across cloud systems.</div><div class="rung-meta"><span class="meta-demand">📊 8/10</span> · <span class="meta-pay">💷 Mid £55-85k · Senior £90-140k</span></div><div class="rung-skills"><strong>Skills:</strong> GDPR knowledge · DPIA execution · policy writing · data flow mapping · stakeholder advisory</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(data discovery/classification)</em> · Python (data-flow tooling, PII scanning)</div><span class="pivot-prereq">⇣ Pivot from Senior-tier. Requires Sec+ minimum; CISSP strongly recommended for AAISM</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · SC-900 · CySA+<br><span class="pivot-rung">📈 Mid (P4-5):</span> ISO 27001 LI · CAISP · CDPSE → unlocks Privacy Engineer / Compliance Analyst<br><span class="pivot-rung">📈 Senior (P6):</span> CIPP/E · AIGP · AAISM → unlocks Privacy Lead / AI Governance Specialist</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author DPIA for a fictional product processing EU citizen data. Data flow map (Mermaid), risk register, mitigations, residual risk, DPO sign-off template.</div></li>
            <li><span class="role-rung-tag rung-pivot-c">🚨 Cloud SOC / IR</span> Cloud Incident Responder · Cloud Detection Engineer<div class="pivot-daily">When cloud systems get attacked, the candidate is the first responder — investigating what happened, containing the damage, helping the company recover. High-pressure, often out-of-hours.</div><div class="rung-meta"><span class="meta-demand">📊 8/10</span> · <span class="meta-pay">💷 Mid £55-85k · Senior £85-140k</span></div><div class="rung-skills"><strong>Skills:</strong> cloud forensics · containment procedures · log analysis · runbook execution · post-incident reporting</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires AZ-104 + Sec+ + CySA+ + SC-200 defensive foundation</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> AZ-104 · Sec+ · CySA+ · BTL1<br><span class="pivot-rung">📈 Mid (P3-4):</span> SC-200 · SC-401 · SC-500 · CySA+ · CCSK · CDSA → unlocks Cloud Detection Engineer / Cloud SOC Analyst<br><span class="pivot-rung">📈 Senior (P5-6):</span> GCIH · GCDA · GCFA · CCFH · SCS-C02 · CCSP · MAD → unlocks Cloud IR Lead / Cloud SOC Architect</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Free Sentinel tenant. Ingest VM activity logs. Write 10 KQL detection rules (lateral movement, privesc, exfil). Build hunt notebook for one APT TTP. Public GitHub.</div></li>
            <li><span class="role-rung-tag rung-pivot-d">🤖 AI/ML Security</span> AI Security Engineer · ML Security Architect<div class="pivot-daily">the candidate protect AI models and their training data — preventing attackers from stealing models, poisoning training data, or tricking AI into doing the wrong thing. Emerging field, fast-moving.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 Mid £65-100k · Senior £100-170k</span></div><div class="rung-skills"><strong>Skills:</strong> model security · training data governance · adversarial ML basics · MLOps integration · privacy engineering</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(primary — model/adversarial tooling, MLOps)</em> · SQL (training-data queries)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires Sec+ + AZ-104 + AI-901 minimum; CISSP for AAISM</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · AZ-104 · AI-901<br><span class="pivot-rung">📈 Mid (P1-4):</span> AI-901 · SecAI+ · SC-500 · CAISP → unlocks AI Security Engineer / MLOps Security Specialist<br><span class="pivot-rung">📈 Senior (P6):</span> AAISM · AIGP → unlocks AI Security Architect / AI Governance Lead</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Pick a HuggingFace model. Run adversarial attacks (TextFooler, prompt injection, model extraction). Document via MITRE ATLAS framework. Propose 3 defences.</div></li>

            <li>
              <span class="role-rung-tag rung-pivot">🔐</span>
              <strong>Cloud Identity Engineer</strong> <span class="rung-roles">— IAM Engineer · Identity Architect · IAM Solutions Architect</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Provision user accounts, troubleshoot MFA failures, manage app integrations in Entra/Okta, review access reviews.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Design conditional access policies, set up SAML/OIDC SSO with new SaaS apps, build PIM workflows, run quarterly access certification.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Architect identity governance lifecycle, lead Zero Trust identity programmes, advise on IAM strategy across business units, manage identity vendor relationships.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 9/10</span>
                <span class="meta-pay">💷 £55-95k mid · £90-140k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Conditional Access · SAML/OIDC · PIM · MFA · Identity governance</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Graph/Entra automation — primary)</em> · Python (Graph API, identity analytics)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> AZ-104 or AWS Cloud Practitioner + understanding of SSO/SAML basics</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> AZ-104 · SC-900<br>
                <span class="pivot-rung">📈 Mid:</span> SC-300 · SC-401<br>
                <span class="pivot-rung">🏆 Senior:</span> SC-100 · CISSP · ISSAP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Set up free Entra ID tenant. Configure SSO for 3 SaaS apps via SAML, build conditional access policies (location-based, device-based, risk-based). Document policy decisions with rationale. Public GitHub.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🗄️</span>
              <strong>Cloud Data Security Engineer</strong> <span class="rung-roles">— Data Security Engineer · Data Protection Architect · Cloud Encryption Engineer</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Configure encryption at rest in Azure SQL/Blob/S3, manage Key Vault access policies, run DLP scans on shared drives.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Design data classification schemes, implement BYOK/HYOK key management workflows, scope tokenisation for sensitive datasets, integrate DLP with M365.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Author enterprise data protection strategy, drive cross-cloud key management governance, lead data sovereignty programmes for EU/UK compliance.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 8/10</span>
                <span class="meta-pay">💷 £55-90k mid · £90-140k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Encryption at rest/transit · Key management · DLP · Data classification · Tokenisation</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(data discovery/classification)</em> · Python (data-flow tooling, PII scanning)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> AZ-104 + data engineering familiarity</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> AZ-104 · SC-900<br>
                <span class="pivot-rung">📈 Mid:</span> SC-401 · CCSP<br>
                <span class="pivot-rung">🏆 Senior:</span> CISSP · ISSAP · SC-100
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a data classification system in Azure: deploy Purview, classify a sample dataset across 4 sensitivity labels, configure DLP policies preventing exfiltration, document policy rationale. Public GitHub.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🐳</span>
              <strong>Kubernetes Security Specialist</strong> <span class="rung-roles">— Container Security Engineer · K8s Security Specialist · Platform Security Engineer</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Apply pod security standards, troubleshoot RBAC failures, review container image vulnerabilities from Trivy reports, manage namespace isolation.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Build OPA Gatekeeper admission controllers, design network policies for multi-tenant clusters, integrate Falco for runtime protection, harden cluster baselines (CIS).</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Architect multi-cluster security, lead supply-chain security programmes (signed images via Cosign, SBOMs via Syft), advise platform teams on K8s security strategy.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 9/10</span>
                <span class="meta-pay">💷 £65-110k mid · £100-150k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> K8s RBAC · Pod Security Standards · OPA Gatekeeper · Runtime protection · Supply chain (Cosign/SBOM)</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(security gates/automation)</em> · Bash (Linux/containers) · YAML+Go (operators) · TypeScript (IaC/CDK)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Linux fluency · Docker basics · CKA-level Kubernetes</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Linux+ · AZ-104<br>
                <span class="pivot-rung">📈 Mid:</span> CKA · KCSA · CKS<br>
                <span class="pivot-rung">🏆 Senior:</span> CCSP · CISSP · ISSAP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Deploy a 3-node K8s cluster (kind or minikube). Apply pod security standards, deploy OPA Gatekeeper with 5 custom policies, integrate Falco for runtime alerts, sign images with Cosign. Public GitHub.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🚑</span>
              <strong>Cloud Forensics & IR Specialist</strong> <span class="rung-roles">— Cloud IR Engineer · DFIR Cloud Specialist · Incident Response Consultant</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Pull CloudTrail/Activity logs, isolate compromised cloud instances, document incident timelines, support memory captures from VMs.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Lead cloud-native incident investigations, perform memory acquisition from running cloud workloads, write IR playbooks for AWS/Azure services, coordinate with SOC.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Author enterprise IR strategy for cloud, lead crisis response during major cloud breaches, coordinate with vendor IR teams (Mandiant, CrowdStrike), brief executive committee.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 8/10</span>
                <span class="meta-pay">💷 £60-105k mid · £100-150k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Cloud logging · Memory forensics · IR playbooks · Cloud-native forensics tools · Crisis coordination</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(parsing/timelining)</em> · PowerShell (Windows live-response) · Bash (Linux/cloud artefacts)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> CySA+ or SC-200 + cloud foundations</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · CySA+ · AZ-104<br>
                <span class="pivot-rung">📈 Mid:</span> GCFA · GCIH · CCFH<br>
                <span class="pivot-rung">🏆 Senior:</span> AWS Security Specialty · CISSP · CCSP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Simulate a cloud breach in the free Azure tenant (e.g., compromised service principal). Capture CloudTrail/Activity logs, build a timeline, write an executive-style incident report (5-10 pages). Public GitHub.</div>
            </li>
          </ul>
        </div>

        </div>
    </details>

    <details class="strategy-section track-section track-b-section">
      <summary><span class="strategy-marker">🛡️</span> Physical Security · Track B</summary>
      <div class="strategy-body">
        <div class="role-ladder">
          <div class="role-ladder-track"><span class="role-ladder-letter track-b">B</span><strong>Physical Security · Off-Tools Direction</strong><div class="track-tagline">the candidate work in physical security <strong>off the tools</strong> — designing systems, advising clients, pre-sales engineering, or cyber-physical convergence. Field installation work is treated as a brief stepping stone, not a destination. Long-term direction is architect, consultant, or pivot into Track A (Cloud) or Track C (Cyber).</div></div>
          <ul class="role-ladder-list">
            <li><span class="role-rung-tag rung-junior">Junior</span> VMS Administrator · Access Control Administrator · Junior Security Designer · Vendor Support Engineer · Junior Solutions Engineer<div class="rung-daily">Configuring and managing physical security software (VMS, access control platforms) for clients. Days involve user access management, software updates, remote troubleshooting, supporting installed systems, basic configuration changes. Mostly desk-based with occasional brief site visits — not the field-installation role.</div><div class="rung-meta"><span class="meta-demand">📊 7/10</span> · <span class="meta-pay">💷 £28-40k</span></div><div class="rung-skills"><strong>Skills:</strong> VMS/access control admin · platform configuration · remote troubleshooting · user access management · vendor support</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Windows/AD, VMS servers)</em> · SQL (VMS DB queries) · light Python (integrations)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> A+ · Net+ · CCNA · MCIT or LCA or ACP · 📈 <strong>Advance to Intermediate via:</strong> Sec+ + MCIE or LCP + ECMS (Meraki)</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a Milestone XProtect lab (free tier) with 5 RTSP camera streams. Configure recording, user roles, alarms. Document layout + rationale in Markdown.</div></li>
            <li><span class="role-rung-tag rung-mid">Intermediate</span> Solutions Architect · Sales Engineer · Pre-Sales Engineer · Senior Security Designer · Convergence Engineer · Vendor Solutions Specialist<div class="rung-daily">Designing how cameras, access control and intrusion systems fit together for new customer projects. Drawing system designs, calculating equipment needs, writing technical documentation, advising clients on best practices, supporting sales bids. Predominantly office-based — occasional site surveys only when essential.</div><div class="rung-meta"><span class="meta-demand">📊 7/10</span> · <span class="meta-pay">💷 £45-75k</span></div><div class="rung-skills"><strong>Skills:</strong> system design · solution architecture · client advisory · technical documentation · sales bid support</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL — VMS+SIEM correlation)</em> · Python (ArcGIS/edge-analytics integration) · PowerShell (MS stack)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> Sec+ · LCE or MCDE · LCP · 📈 <strong>Advance to Senior via:</strong> LCDA + CISSP (cyber bridge)</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Design a multi-site architecture for a fictional retail chain (10 stores). VMS HA/failover, access control integration, network requirements. draw.io diagram.</div></li>
            <li><span class="role-rung-tag rung-senior">Senior/Director</span> Principal Physical Security Architect · Cyber-Physical Convergence Architect · Director of Security Systems<div class="rung-daily">Designing enterprise-scale security systems for large clients — airports, hospitals, government buildings. Mostly in meetings with stakeholders, writing strategic recommendations, reviewing team designs, shaping how physical and cyber security work together company-wide.</div><div class="rung-meta"><span class="meta-demand">📊 6/10</span> · <span class="meta-pay">💷 £70-130k</span></div><div class="rung-skills"><strong>Skills:</strong> enterprise architecture · cyber-physical convergence · executive advisory · strategic planning · vendor selection</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL — VMS+SIEM correlation)</em> · Python (ArcGIS/edge-analytics integration) · PowerShell (MS stack)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> LCDA · CISSP · PSP · 🏆 <strong>Top-tier signals:</strong> ChCSP · CSyP (UK chartered) · ISSAP (architect specialism)</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author physical security strategy for fictional CNI organisation. ISO 27001 controls + BS 5979 + ASIS guidelines + cyber integration. 15-20 pages.</div></li>
            <li class="path-divider"><span class="path-divider-label">↓ Alternative pivot branches (instead of or in addition to default Senior)</span></li>
            <li><span class="role-rung-tag rung-se">💼 SE Branch</span> Vendor Sales Engineer · Pre-Sales Engineer · Solutions Consultant · TAM<div class="pivot-daily">the candidate pitch physical security products (VMS, access control, intrusion) to customers — running demos, answering deep technical questions during sales calls, helping close deals.</div><div class="rung-meta"><span class="meta-demand">📊 7/10</span> · <span class="meta-pay">💷 Mid £55-90k OTE · Senior £80-150k+ OTE</span></div><div class="rung-skills"><strong>Skills:</strong> product demos · customer scoping · technical sales · pre-sales engineering · vendor representation</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Windows/AD, VMS servers)</em> · SQL (VMS DB queries) · light Python (integrations)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires LCP + MCIE minimum; LCDA or MCDE strongly preferred for senior SE roles</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Net+ · Sec+ · LCP · MCIE + customer-facing experience<br><span class="pivot-rung">📈 Mid (P1-4):</span> MCDE · LCDA → unlocks Vendor Pre-Sales Engineer / Solutions Consultant<br><span class="pivot-rung">📈 Senior (P5-6):</span> PSP · ChCSP · CSyP → unlocks SE Manager / Principal Solutions Consultant<br><em>Industry note: physical security uses architect credentials for SE roles, no separate SE-stream certs published.</em></div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a vendor convergence demo — Milestone + LenelS2 + Axis. Document API integrations, single-pane-of-glass console, SE talking points.</div></li>
            <li><span class="role-rung-tag rung-pivot-a">⚡ OT/ICS Specialist</span> Industrial Cyber Security Engineer · CNI OT Lead<div class="pivot-daily">the candidate secure industrial systems — factories, power plants, water treatment. These systems can't just be patched anytime so the work involves careful planning, unusual constraints, and high-stakes risk.</div><div class="rung-meta"><span class="meta-demand">📊 8/10</span> · <span class="meta-pay">💷 Mid £55-90k · Senior £85-150k</span></div><div class="rung-skills"><strong>Skills:</strong> ICS protocols · Purdue Model · safety constraints · OT incident response · change windows</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(parsing/timelining)</em> · PowerShell (Windows live-response) · Bash (Linux/cloud artefacts)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires LCA + Sec+ + CySA+ foundation, ideally vendor experience</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · CySA+ · Linux+ + OT or vendor experience<br><span class="pivot-rung">📈 Mid (P3-4):</span> IEC 62443-CFS · GICSP → unlocks Industrial Cyber Security Engineer / ICS Compliance Specialist<br><span class="pivot-rung">📈 Senior (P5):</span> CRISC · GCIH · GRID · 62443-CRA → unlocks CNI OT Security Lead / OT Risk Manager</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build Purdue model network diagram for a fictional manufacturing site. Map IEC 62443 zones/conduits. Propose monitoring placement + detection logic.</div></li>
            <li><span class="role-rung-tag rung-pivot-b">📐 Consultancy/Architect Plus</span> Senior Security Consultant · Enterprise Architect · Programme Lead<div class="pivot-daily">the candidate advise large organisations on their overall physical security strategy — writing reports, leading workshops, helping companies plan major security investments. Senior-only, talking to executives.</div><div class="rung-meta"><span class="meta-demand">📊 7/10</span> · <span class="meta-pay">💷 Mid £55-85k · Senior £90-180k (Big 4)</span></div><div class="rung-skills"><strong>Skills:</strong> client engagement · workshop facilitation · report writing · executive presentation · programme management</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Windows/AD, VMS servers)</em> · SQL (VMS DB queries) · light Python (integrations)</div><span class="pivot-prereq">⇣ Pivot from Senior-tier. Requires LCDA or PSP first; CISSP strongly recommended</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · ACSP (UKCSC Associate) + LCDA or PSP (senior architect background)<br><span class="pivot-rung">📈 Mid (P5):</span> ITIL 4 Foundation · BCS-ESA · PRINCE2 · TOGAF · PCSP · PrCSP (UKCSC chartered progression) → unlocks Senior Security Solutions Consultant / Programme Lead<br><span class="pivot-rung">📈 Senior (P6):</span> ITIL 4 MP · ChCSP · CSyP → unlocks Principal Consultant / Big 4 Advisory Director</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author security maturity assessment for fictional 500-employee company. Use ITIL 4 service management framework. 10 prioritised recommendations with maturity scoring.</div></li>
            <li><span class="role-rung-tag rung-pivot-c">🛰️ Cyber-Physical SOC</span> Cyber-Physical SOC Analyst · Convergence Ops Lead<div class="pivot-daily">the candidate watch both physical (cameras, doors) and cyber alerts at the same time — investigating when they cross over (e.g., physical break-in combined with network attack). Hybrid skill set, growing demand.</div><div class="rung-meta"><span class="meta-demand">📊 6/10</span> · <span class="meta-pay">💷 Mid £45-75k · Senior £70-120k</span></div><div class="rung-skills"><strong>Skills:</strong> VMS + SIEM correlation · cross-domain alerting · hybrid incident response · physical-cyber threat fusion · convergence playbooks</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires LCP + Sec+ + CySA+ + SC-200 foundation</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · CySA+ · LCP (physical exposure)<br><span class="pivot-rung">📈 Mid (P3-4):</span> SC-200 · CySA+ · GICSP · MAD → unlocks Cyber-Physical SOC Analyst / Convergence Operations Lead<br><span class="pivot-rung">📈 Senior (P5-6):</span> GCIH · CISM · ChCSP → unlocks Hybrid SOC Manager / Convergence Director</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a Sentinel KQL rule correlating VMS access events (CSV import) with network logs. Document detection logic, false-positive tuning, runbook.</div></li>
            <li><span class="role-rung-tag rung-pivot-d">🏰 CNI/Defense-Adjacent</span> CNI Security Engineer · Defense-Sector Lead<div class="pivot-daily">the candidate secure critical national infrastructure (energy, transport, government). Often requires security clearance and involves national-scale risk. Niche but well-paid and stable.</div><div class="rung-meta"><span class="meta-demand">📊 7/10</span> · <span class="meta-pay">💷 Mid £55-85k · Senior £85-140k +clearance</span></div><div class="rung-skills"><strong>Skills:</strong> clearance-eligible mindset · regulatory framework knowledge (NCSC, NIS2, CAF) · CNI threat modelling · classified environment handling · supply chain risk assessment</div><div class="rung-langs">💻 <strong>Code:</strong> Python + SQL <em>(general security scripting + log queries)</em></div><span class="pivot-prereq">⇣ Pivot from Senior-tier. Requires LCDA or PSP first; CISSP + SC clearance route</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ + LCDA or PSP + clearance eligibility<br><span class="pivot-rung">📈 Mid (P3-4):</span> IEC 62443-CFS · ISO 27001 LI → unlocks CNI Security Engineer / Defence Sector Analyst<br><span class="pivot-rung">📈 Senior (P5-6):</span> CISA · CRISC · CSyP · ChCSP → unlocks Defence Security Lead / Government Security Consultant</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Map a fictional water utility OT environment to IEC 62443 zones, ISO 27001 controls, and NCSC CAF outcomes. Identify 5 critical gaps + remediation plan.</div></li>

            <li>
              <span class="role-rung-tag rung-pivot">🥷</span>
              <strong>Physical Penetration Tester</strong> <span class="rung-roles">— Physical Red Teamer · Tiger Team Operator · Covert Entry Specialist</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Document target reconnaissance (OSINT), assist on lock-picking and bypass attempts under supervision, write findings reports.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Plan multi-day covert entry engagements, perform RFID/NFC cloning, social-engineer reception staff, test alarm response times.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Lead red team programme strategy, design adversary simulation scenarios for CNI clients, brief boards on physical risk findings, develop bespoke tooling.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 6/10 (niche)</span>
                <span class="meta-pay">💷 £55-90k mid · £90-140k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Lock-picking · RFID/NFC cloning · Social engineering · Surveillance/anti-surveillance · Report writing</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(tooling/exploits)</em> · Bash (Linux ops) · PowerShell (AD/Windows) · JavaScript (web payloads)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Pen Test fundamentals + physical security awareness</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · Net+ · A+<br>
                <span class="pivot-rung">📈 Mid:</span> PenTest+ · OSCP (cyber crossover) · proprietary physical training (Red Team Alliance PPTP)<br>
                <span class="pivot-rung">🏆 Senior:</span> PSP · ChCSP · CISSP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Conduct a sanctioned physical recon exercise (with explicit permission) on a personal building/property. Document entry points, social engineering scenarios, RFID exposure, and remediation. Build a 15-page report.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🕵️</span>
              <strong>Insider Threat Analyst</strong> <span class="rung-roles">— Insider Risk Analyst · Insider Threat Investigator · People Risk Analyst</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Triage UEBA alerts, review badge swipe anomalies, investigate unusual file access patterns, document case files.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Build behavioural risk indicators, coordinate with HR/Legal on sensitive investigations, present risk reports to management, run insider threat exercises.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Author insider threat programme strategy, build company-wide insider risk frameworks, advise CISO on people-risk posture, manage insider risk tooling vendor relationships.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 7/10</span>
                <span class="meta-pay">💷 £50-85k mid · £85-130k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> UEBA · Behavioural analysis · Forensic interviewing · HR/Legal coordination · Risk modelling</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(parsing/timelining)</em> · PowerShell (Windows live-response) · Bash (Linux/cloud artefacts)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> CySA+ + behavioural analysis basics + cross-functional comms</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · CySA+<br>
                <span class="pivot-rung">📈 Mid:</span> CySA+ · GCFA · ASIS Insider Threat Awareness<br>
                <span class="pivot-rung">🏆 Senior:</span> CISM · ChCSP · CSyP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a fictional insider threat scenario: privileged user exfiltrating customer data over 8 weeks. Map detection logic (badge anomalies + file access + email patterns), produce investigation playbook + executive briefing template.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🆘</span>
              <strong>Crisis & Resilience Manager</strong> <span class="rung-roles">— Business Continuity Manager · Crisis Manager · Resilience Lead</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Maintain BCM plan documentation, support tabletop exercises and walkthroughs, track plan-test outcomes, update contact rosters.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Run tabletop and live simulation exercises, coordinate incident response across business units, manage supplier resilience reviews, author response playbooks.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Author organisational resilience strategy, brief executive committee during real crises, lead post-incident reviews, manage external crisis communications vendors.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 7/10</span>
                <span class="meta-pay">💷 £55-90k mid · £90-140k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> BCM frameworks (ISO 22301) · Tabletop exercises · Crisis communication · Stakeholder management · Supplier resilience</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(parsing/timelining)</em> · PowerShell (Windows live-response) · Bash (Linux/cloud artefacts)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> ITIL 4 Foundation or PRINCE2 + understanding of risk</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> ITIL 4 Foundation · PRINCE2 Foundation<br>
                <span class="pivot-rung">📈 Mid:</span> PRINCE2 Practitioner · ITIL 4 MP · BCI CBCI · ISO 22301 Lead Auditor<br>
                <span class="pivot-rung">🏆 Senior:</span> ChCSP · CSyP · MBCI/FBCI
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author a Business Continuity Plan + crisis communication playbook for a fictional 500-employee organisation. Include risk assessment, RTOs/RPOs for 10 services, tabletop scenario, and post-incident review template.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🏢</span>
              <strong>Smart Building & IoT Security</strong> <span class="rung-roles">— Smart Building Security Engineer · BMS Security Specialist · IoT Security Engineer</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Inventory BMS devices, scan for default credentials on IoT endpoints, document network segmentation gaps, manage firmware update logs.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Design network microsegmentation for BMS/IoT, integrate IoT devices into SIEM monitoring, harden firmware update workflows, audit vendor APIs.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Architect secure smart building reference designs, advise property developers on cyber-physical convergence, lead vendor risk programmes for IoT suppliers.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 7/10</span>
                <span class="meta-pay">💷 £55-90k mid · £90-130k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> BMS protocols (BACnet, Modbus) · IoT discovery · Network segmentation · Firmware security · Vendor risk</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Net+ + IoT/BMS protocol awareness</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · Net+ · CCNA<br>
                <span class="pivot-rung">📈 Mid:</span> IEC 62443-CFS · GICSP · CCSP<br>
                <span class="pivot-rung">🏆 Senior:</span> PSP · ChCSP · CISSP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Audit a fictional smart-building IoT deployment: 50 BACnet devices + 30 IP cameras + access control. Map network segmentation gaps, identify default-credential risks, propose remediation plan. 10-page report.</div>
            </li>
          </ul>
        </div>

        </div>
    </details>

    <details class="strategy-section track-section track-c-section">
      <summary><span class="strategy-marker">🔒</span> Cyber Security · Track C</summary>
      <div class="strategy-body">
        <div class="role-ladder">
          <div class="role-ladder-track"><span class="role-ladder-letter track-c">C</span><strong>Cyber Security · Analyst → Architect</strong><div class="track-tagline">the candidate defend organisations from cyber attacks. Start watching alerts in a SOC, grow into designing how the company defends itself at strategic level.</div></div>
          <ul class="role-ladder-list">
            <li><span class="role-rung-tag rung-junior">Junior</span> SOC Analyst L1 · Junior Cyber Security Analyst · Junior Detection Engineer<div class="rung-daily">Watching security alerts on screens all day. When something suspicious happens — unusual login, possible malware — the candidate investigate, decide if it's real, then either fix it or escalate it. Lots of repetition and pattern recognition.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 £25-40k</span></div><div class="rung-skills"><strong>Skills:</strong> alert triage · log analysis · ticket escalation · pattern recognition · documentation</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(Ghidra/IDA automation, unpackers)</em> · Bash · (C/asm to read)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> Sec+ · CCNA · CySA+ · BTL1 · SAL1 · CJCA · 📈 <strong>Advance to Intermediate via:</strong> SC-200 (Microsoft SIEM gateway) + GCIH + SE1</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Set up Splunk Enterprise Trial (60-day, full features) or Splunk Free (500MB/day, perpetual) + TheHive (open-source IR platform). Ingest Sysmon logs from home PC. Write 5 detection rules. Public GitHub.</div></li>
            <li><span class="role-rung-tag rung-mid">Intermediate</span> SOC Analyst L2/L3 · Cyber Security Engineer · Senior Detection Engineer · Threat Hunter<div class="rung-daily">Handling alerts that junior analysts escalate, plus harder investigations. Digging into what attackers actually did, writing new detection rules to catch similar attacks next time, configuring security tools, coordinating response when something serious happens.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 £45-75k</span></div><div class="rung-skills"><strong>Skills:</strong> incident investigation · detection rule writing · SIEM administration · threat hunting · incident coordination</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div><div class="rung-unlock">🔓 <strong>Enter with:</strong> SC-200 · SC-401 · CySA+ · GCIH · BTL2 · 📈 <strong>Advance to Senior via:</strong> SC-500 (Cloud+AI Security gateway) + CISSP + ISSAP</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Design a SOC reference architecture: SIEM, SOAR, EDR, threat intel feeds, ticketing. Map MITRE ATT&CK coverage. 8-10 page architectural decision record.</div></li>
            <li><span class="role-rung-tag rung-senior">Senior/Director</span> Principal Cyber Engineer · SOC Architect · Head of SOC · Director of Cyber Security<div class="rung-daily">Designing how the company defends against attacks at strategic level. Mostly in meetings explaining risks to executives, deciding which security products to buy, reviewing major incidents, shaping security policy. Less hands-on, more advising and directing.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 £80-150k+</span></div><div class="rung-skills"><strong>Skills:</strong> security strategy · executive risk communication · product selection · policy authoring · team leadership</div><div class="rung-langs">💻 <strong>Code:</strong> Python + SQL <em>(general security scripting + log queries)</em></div><div class="rung-unlock">🔓 <strong>Enter with:</strong> CISSP · CAS-005 (SecurityX) · ISSAP · CISM · SC-100 · 🏆 <strong>Top-tier signals:</strong> CRISC · CISA · ChCSP (UK chartered)</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author CISSP-style enterprise security strategy document for fictional 2,000-employee org. Cover all 8 CISSP domains. Risk-based prioritisation. 20+ pages.</div></li>
            <li class="path-divider"><span class="path-divider-label">↓ Alternative pivot branches (instead of or in addition to default Senior)</span></li>
            <li><span class="role-rung-tag rung-se">💼 SE Branch</span> Cyber Security Sales Engineer · Solutions Engineer · Pre-Sales Engineer<div class="pivot-daily">the candidate sell cyber security tools to companies — deep technical demos, answering hard questions during sales calls, helping customers prove the product works for them.</div><div class="rung-meta"><span class="meta-demand">📊 8/10</span> · <span class="meta-pay">💷 Mid £70-110k OTE · Senior £110-170k OTE</span></div><div class="rung-skills"><strong>Skills:</strong> deep platform expertise · technical sales · POC delivery · customer technical advocacy · objection handling</div><div class="rung-langs">💻 <strong>Code:</strong> light Python + SQL <em>(demo automation, POC data)</em></div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires SC-200 + CySA+ minimum; CISSP strongly preferred for senior SE</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · CySA+ · SC-200 + customer-facing experience<br><span class="pivot-rung">📈 Mid (P4):</span> CCFA+CCFR · CCFH · PAN NGFW Engineer · WCSE → unlocks Cyber Solutions Engineer / Pre-Sales Engineer<br><span class="pivot-rung">📈 Senior (P5-6):</span> CISSP · ISSAP · CCSP → unlocks Principal SE / Cyber SE Manager</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build CrowdStrike vs SentinelOne comparison demo. Scenario-based responses, POC plan, technical objection handling.</div></li>
            <li><span class="role-rung-tag rung-pivot-a">🔬 Detection Engineering</span> Detection Engineer · Threat Hunter · Purple Teamer<div class="pivot-daily">the candidate write the rules that spot attackers — analysing how attacks work, building detections in security tools, constantly improving what the SOC can catch. Code-adjacent, framework-heavy.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 Mid £55-90k · Senior £90-150k</span></div><div class="rung-skills"><strong>Skills:</strong> SIEM tooling · detection-as-code · threat hunting · MITRE ATT&CK mapping · purple team coordination</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires Sec+ + CySA+ + BTL1 + SAL1 defensive foundation</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · CySA+ · BTL1 · SAL1 · SPLK-1002 (Splunk Power User)<br><span class="pivot-rung">📈 Mid (P3-4):</span> BTL2 · CDSA · Splunk SCDA · GCDA · MAD → unlocks Detection Engineer / Threat Hunter<br><span class="pivot-rung">📈 Senior (P5-6):</span> Splunk SCDE · GCIH · GCFA · GREM · CCFH · ISSAP → unlocks SOC Architect / Principal Detection Engineer</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Write 20 Sigma rules covering MITRE ATT&CK techniques. Convert to Splunk SPL + Elastic + Sentinel. Public GitHub with detection-as-code structure.</div></li>
            <li><span class="role-rung-tag rung-pivot-b">⚔️ Offensive Security</span> Penetration Tester · Red Team Operator<div class="pivot-daily">the candidate is paid to break into systems — finding security holes before real attackers do. Then writing detailed reports about what the candidate found and how to fix it. Heavy lab work, portfolio-driven.</div><div class="rung-meta"><span class="meta-demand">📊 8/10</span> · <span class="meta-pay">💷 Mid £50-85k · Senior £85-150k (contract higher)</span></div><div class="rung-skills"><strong>Skills:</strong> methodology · scripting · reporting · client management · creative problem-solving</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(tooling/exploits)</em> · Bash (Linux ops) · PowerShell (AD/Windows) · JavaScript (web payloads)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires Sec+ + Pentest+ + practical lab portfolio (PT1, CJCA, CPTS)</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · CJCA · SE1 · Pentest+ + practical lab portfolio<br><span class="pivot-rung">📈 Mid (P3-4):</span> PT1 · Pentest+ · CPTS · CRT · PNPT → unlocks Penetration Tester / Junior Red Team Operator<br><span class="pivot-rung">📈 Senior (P5-6):</span> OSCP · CRTO · CCT INF · ISSAP → unlocks Senior Pen Tester / Red Team Lead / Offensive Consultant</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> HackTheBox Pro Labs (Dante to start). Complete all flags + write professional pen test report. Or do the OSCP TJnull list publicly tracked.</div></li>
            <li><span class="role-rung-tag rung-pivot-c">🏛️ GRC/Audit Specialist</span> GRC Analyst · IS Auditor · Compliance Manager<div class="pivot-daily">the candidate check that companies follow security rules and regulations. Days involve interviews, document reviews, writing audit findings, and tracking what got fixed. Less technical, more business-facing.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 Mid £50-80k · Senior £85-140k</span></div><div class="rung-skills"><strong>Skills:</strong> audit methodology · regulatory frameworks · interviewing · finding documentation · risk quantification</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(evidence/data analysis)</em> · light Python (control-testing automation)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires Sec+ + CySA+ + SC-300 identity foundation</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · CySA+ · SC-300 (identity)<br><span class="pivot-rung">📈 Mid (P3-4):</span> ISO 27001 LI · CySA+ · CAISP → unlocks GRC Analyst / Compliance Analyst<br><span class="pivot-rung">📈 Senior (P5-6):</span> CISA · CRISC · CIPP/E · CISM → unlocks Audit Manager / Risk Lead / Big 4 Advisory</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Conduct full ISO 27001 Annex A gap assessment for a fictional org. Map each control to a maturity score. Executive summary + 25-page detailed findings.</div></li>
            <li><span class="role-rung-tag rung-pivot-d">🐛 Application Security</span> AppSec Engineer · Secure Code Reviewer<div class="pivot-daily">the candidate secure the software that developers build — reviewing code for vulnerabilities, working with developers to fix them, building automated tools that catch problems. Heavy code reading.</div><div class="rung-meta"><span class="meta-demand">📊 9/10</span> · <span class="meta-pay">💷 Mid £55-95k · Senior £95-160k</span></div><div class="rung-skills"><strong>Skills:</strong> code review · web app testing · developer communication · automated SAST/DAST · vulnerability triage</div><div class="rung-langs">💻 <strong>Code:</strong> JavaScript/TypeScript <em>(web-app review)</em> · Python (SAST tooling) · SQL (injection testing)</div><span class="pivot-prereq">⇣ Pivot from Mid-tier. Requires Sec+ + Python (PCEP) + Pentest+ basics</span><div class="pivot-ladder"><span class="pivot-rung">🔓 Foundation (P1-2):</span> Sec+ · PCEP · Pentest+ basics<br><span class="pivot-rung">📈 Mid (P3-4):</span> BSCP · CPTS · PCAP → unlocks AppSec Engineer / Secure Code Reviewer<br><span class="pivot-rung">📈 Senior (P5-6):</span> CSSLP · ISSAP · OSCP · OSWE → unlocks Software Security Architect / Senior AppSec Engineer</div><div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Find + responsibly disclose 3 vulnerabilities in open-source projects via HackerOne. Or build deliberately vulnerable app with 10 documented vulnerabilities + writeups.</div></li>

            <li>
              <span class="role-rung-tag rung-pivot">🚑</span>
              <strong>Incident Response & DFIR</strong> <span class="rung-roles">— IR Analyst · DFIR Engineer · Senior Incident Responder</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Triage incident alerts, capture forensic disk/memory images, write incident timelines, run automated triage tools.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Lead complex investigations, perform deep memory and disk forensics, coordinate IR across teams, write executive briefings, support legal/HR.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Author IR programme strategy, lead crisis response in major breaches, brief CISO/board during incidents, manage external forensics vendors, mentor analysts.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 9/10</span>
                <span class="meta-pay">💷 £60-105k mid · £100-150k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Disk/memory forensics · IR playbooks · Crisis comms · Tooling (Volatility, Autopsy, X-Ways) · Vendor management</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(parsing/timelining)</em> · PowerShell (Windows live-response) · Bash (Linux/cloud artefacts)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> CySA+ + forensics fundamentals</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · CySA+ · BTL1<br>
                <span class="pivot-rung">📈 Mid:</span> GCFA · GCIH · BTL2 · CCFH<br>
                <span class="pivot-rung">🏆 Senior:</span> GREM · CISSP · ISSAP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Run a full forensic investigation on a published CTF challenge (e.g., DFIR.Science, HTB Sherlocks). Document memory analysis, disk forensics, timeline, IoCs, and produce executive-ready report.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🔭</span>
              <strong>Threat Intelligence Analyst</strong> <span class="rung-roles">— CTI Analyst · Threat Researcher · Intel Lead</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Monitor threat feeds, profile attacker TTPs from open-source reports, write daily/weekly intel summaries for SOC consumption.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Build threat actor profiles, run hunting campaigns based on intel hypotheses, brief stakeholders on emerging campaigns, manage feed quality.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Author intelligence requirements, lead intel programme strategy, advise CISO on geopolitical threat posture, manage commercial intel feed vendors (Recorded Future, Mandiant).</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 8/10</span>
                <span class="meta-pay">💷 £55-90k mid · £90-140k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Threat actor profiling · MITRE ATT&CK · Intel writing · OSINT · Strategic briefing</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(IOC enrichment, API pulls)</em> · SQL (intel queries) · light Bash</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> CySA+ + research/writing aptitude</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · CySA+<br>
                <span class="pivot-rung">📈 Mid:</span> MAD · GCTI · CTIA<br>
                <span class="pivot-rung">🏆 Senior:</span> CISSP · CISM · ChCSP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Profile one APT group using only open-source reporting (CISA, MITRE, vendor blogs). Build a threat actor profile (TTPs mapped to ATT&CK, infrastructure, targeting patterns), produce 10-page intel report.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">🔬</span>
              <strong>Malware Analyst & Reverse Engineer</strong> <span class="rung-roles">— Malware Analyst · Reverse Engineer · Threat Research Engineer</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Run automated sandbox analysis on suspicious samples, document IoCs, extract signatures, populate threat feeds.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Perform static + dynamic analysis on unknown malware samples, write YARA rules, reverse-engineer packed/obfuscated binaries, identify novel TTPs.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Lead malware analysis capability, publish original research (blogs/papers), brief executives on novel threats, design automated analysis pipelines.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 7/10</span>
                <span class="meta-pay">💷 £60-100k mid · £100-150k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> Assembly (x86/x64) · YARA · IDA Pro/Ghidra · Sandbox tooling · Threat publishing</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(Ghidra/IDA automation, unpackers)</em> · Bash · (C/asm to read)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Programming (C/Python) + Linux/Windows internals</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · Linux+<br>
                <span class="pivot-rung">📈 Mid:</span> GREM · OSCP · eCMAP<br>
                <span class="pivot-rung">🏆 Senior:</span> GREM · CISSP · ISSAP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Reverse-engineer 3 malware samples from public sources (e.g., MalwareBazaar, theZoo). Document static + dynamic analysis, extract IoCs, write YARA rules. Public GitHub with sanitised samples.</div>
            </li>
            <li>
              <span class="role-rung-tag rung-pivot">⚡</span>
              <strong>Red Team Operator</strong> <span class="rung-roles">— Red Team Operator · Adversary Emulation Engineer · Senior Red Team Lead</span>
              <div class="role-progression">
                <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Execute test plans under supervision, document findings, support social-engineering campaigns, set up basic infrastructure.</div>
                <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Plan multi-week adversary emulation engagements, develop custom tooling, run command-and-control infrastructure, evade detection.</div>
                <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Lead red team programmes, design adversary simulation scenarios mapped to specific threat actors, brief boards on findings, train junior operators.</div>
              </div>
              <div class="rung-meta">
                <span class="meta-demand">📊 Demand: 7/10</span>
                <span class="meta-pay">💷 £65-110k mid · £100-160k senior</span>
              </div>
              <div class="rung-skills"><strong>Skills:</strong> C2 frameworks (Cobalt Strike, Sliver, Mythic) · Custom tooling · Persistence techniques · OPSEC · Report writing</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(tooling/exploits)</em> · Bash (Linux ops) · PowerShell (AD/Windows) · JavaScript (web payloads)</div>
              <div class="pivot-prereq"><strong>🔓 Enter from:</strong> OSCP-level offensive + scripting fluency</div>
              <div class="pivot-ladder">
                <span class="pivot-rung">🎯 Foundation:</span> Sec+ · PenTest+ · OSCP<br>
                <span class="pivot-rung">📈 Mid:</span> CRTO · OSEP · CRTL<br>
                <span class="pivot-rung">🏆 Senior:</span> OSEE · CISSP · ISSAP
              </div>
              <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a home lab with 3-tier AD (DC, member servers, workstations). Execute a full red team kill chain: initial access, privilege escalation, lateral movement, persistence, exfiltration. Document with screenshots; map to MITRE ATT&CK.</div>
            </li>
          </ul>
        </div>

        <p class="strat-note">Junior ≈ Phase 1-2 certs · Intermediate ≈ Phase 3-4 certs · Senior/Director ≈ Phase 5-6 certs · Each track has a <strong>default J→I→S path</strong> (using core architect/engineer certs like CISSP, AZ-305, SC-100, CCSP) plus <strong>5 pivot branches</strong> (💼 SE + 4 specialisms). Pivots are alternatives or additions to the default Senior tier, not replacements — most candidates pursue default Senior + 1 chosen specialism.</p>
      </div>
    </details>

    <div class="strat-band">🪜 Highest-Earning Paths</div>
    <details class="strategy-section track-section track-top-section">
      <summary><span class="strategy-marker">🚀</span> Highest-Earning Evolution Paths · Top 10 (ranked by transition ease)</summary>
      <div class="strategy-body">
        <p class="strat-note">Ten roles with £150k+ ceilings, ranked by transition ease from relevant hands-on systems-support experience. They sit outside the standard track pivots because they cross domains and lean vendor-agnostic. Each depends on skills recorded in the tracker rather than an assumed personal background.</p>
        <ul class="pivot-roles-list">
          <li data-rank="#1">
            <span class="role-rung-tag rung-pivot">🤝</span><span class="rank-badge">#1</span>
            <strong>Customer Success Engineer / Technical Account Manager</strong> <span class="rung-roles">— CSE Associate · TAM · Senior TAM · Enterprise TAM</span><div class="rank-meta">🥇 Easiest transition — same job, vendor side</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Onboard new customers to the platform, run platform health checks, troubleshoot configuration issues, escalate complex bugs to product engineering, document customer-specific runbooks.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Manage portfolio of 10-30 customers, drive product adoption, run Quarterly Business Reviews (QBRs), identify expansion opportunities, partner with sales for renewals.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Manage 3-5 strategic enterprise accounts (£500k+ ARR each), partner with sales on retention/expansion, brief customer C-suite, influence product roadmap based on customer feedback.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 9/10</span>
              <span class="meta-pay">💷 £65-100k mid · £100-140k senior · £140-180k+ top vendors (CrowdStrike, Palo Alto, Wiz)</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Platform fluency · Customer empathy · Relationship mgmt · Cross-functional coordination · Technical troubleshooting</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Graph/Entra automation — primary)</em> · Python (Graph API, identity analytics)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Vendor platform certification + customer-facing aptitude</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · 1-2 vendor certs (CCFA · PAN NGFW Engineer · SC-200)<br>
              <span class="pivot-rung">📈 Mid:</span> Multiple vendor stack certs · CCSP · ITIL 4 MP<br>
              <span class="pivot-rung">🏆 Senior:</span> CISSP · vendor specialisms (XSIAM Engineer / CCCS)
            </div>

        <div style="background: linear-gradient(135deg, rgba(85, 214, 255, 0.08), rgba(85, 214, 255, 0.04)); border-left: 3px solid #55d6ff; padding: 12px 14px; margin: 12px 0; border-radius: 6px; font-size: 11px; line-height: 1.6;">
          <strong style="color: #a5e9ff; font-size: 12.5px;">🎯 Why Dual-Vendor = the Stronger Consultancy Position</strong>
          <p style="margin: 6px 0; color: #c0d7dc;">Carrying both CrowdStrike <em>and</em> Palo Alto at architect level isn't redundancy — it's the core of the consultancy value proposition. Four reasons it beats single-vendor specialism:</p>
          <ul style="margin: 4px 0 6px 16px; padding: 0; color: #c0d7dc;">
            <li><strong>Vendor-neutral credibility:</strong> the candidate recommend the right tool for each customer's estate, not the one vendor the candidate is locked into. Customers pay premiums for advice they can trust isn't a sales pitch.</li>
            <li><strong>Wider addressable market:</strong> CrowdStrike strength = endpoint (the IT estate); Palo Alto strength = network (where physical-security/OT/IoT devices live — cameras, controllers, readers the candidate can't put an agent on). Together they cover the full convergence surface. Most customers run one or the other; the candidate serve both.</li>
            <li><strong>Higher day rates:</strong> vendor-agnostic convergence architects command more than single-stack specialists — the candidate is harder to replace and broader in applicability.</li>
            <li><strong>Defensible moat:</strong> deep fluency in physical + OT + Microsoft + CrowdStrike + Palo Alto + AI is a combination almost no one else holds. That breadth IS the moat.</li>
          </ul>
          <p style="margin: 6px 0 0; color: #c0d7dc;"><strong style="color: #a5e9ff;">Scope discipline:</strong> both vendors are carried at <em>architect</em> level (design + recommend), not deep SOC-engineering level. The Palo Alto SecOps/XDR/XSIAM chain and CrowdStrike SIEM Analyst/Engineer certs stay <em>optional</em> — add them only if the consultancy develops a SOC-build / MSSP specialism, which is a different business from convergence architecture. Architect-grade fluency in both is the consultancy core; operator-grade engineering depth in both would be over-investment.</p>
        </div>
        <div class="why-natural"><strong>💡 Why natural for this path:</strong> the candidate ALREADY do TAM-like work in relevant hands-on experience — supporting customer deployments, troubleshooting configs, managing the vendor relationship. Pivoting to vendor-side TAM is the same job, different employer. Lower friction than SE (less sales pressure, similar pay).</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author a customer-success playbook for one platform the candidate know deeply (CrowdStrike Falcon, Sentinel, or Milestone XProtect). Cover: onboarding sequence (week 1-12), 10 most common misconfigurations + how to spot them, health-check template, QBR slide template, escalation matrix. 15-20 page document. Public GitHub.</div>
          </li>
          <li data-rank="#2">
            <span class="role-rung-tag rung-pivot">⚙️</span><span class="rank-badge">#2</span>
            <strong>Security Platform Engineer / Reliability Engineer</strong> <span class="rung-roles">— Platform Engineer · Senior Platform Engineer · Staff/Principal Platform Engineer</span><div class="rank-meta">🥈 Direct skill expansion</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Maintain SIEM/EDR/IAM platform configurations, troubleshoot ingestion failures, support patching cycles, document runbooks, monitor platform health dashboards.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Scale platforms across regions/business units, automate deployment via IaC (Terraform/Bicep), integrate platforms with adjacent systems, lead capacity planning, mentor junior engineers.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Architect multi-platform security stack (SIEM + EDR + IAM + vuln mgmt), lead vendor consolidation initiatives, define platform SLOs/SLAs, partner with security architects on strategic decisions, brief security leadership on platform investments.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 8/10</span>
              <span class="meta-pay">💷 £75-115k mid · £115-160k senior · £160-220k FAANG/financial services</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Platform engineering (SIEM/EDR/IAM) · IaC (Terraform/Bicep) · Reliability engineering · Vendor mgmt · Cross-platform integration</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Sys admin depth + scripting/automation fluency (Python/PowerShell/Bash)</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · AZ-104 · CySA+ · scripting<br>
              <span class="pivot-rung">📈 Mid:</span> SC-200 · Terraform Associate · AZ-400 · CKA<br>
              <span class="pivot-rung">🏆 Senior:</span> AZ-305 · SC-100 · CISSP · vendor architects (XSIAM Eng · NGFW Eng)
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> Systems Support at an integrator IS platform engineering — Milestone server admin, LenelS2 system administration, integration troubleshooting. Moving from physical security platforms to cyber security platforms (Sentinel/Falcon/Splunk) is incremental, not a career restart. Same muscle, different platforms.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build an IaC-managed security platform deployment in Azure. Deploy Sentinel via Bicep, configure 5 data connectors, write 10 KQL detection rules, document SLOs (data ingestion latency, alert MTTR, query performance), build a runbook for platform incidents. Public GitHub.</div>
          </li>
          <li data-rank="#3">
            <span class="role-rung-tag rung-pivot">🛡️</span><span class="rank-badge">#3</span>
            <strong>Cleared Cyber Engineer (Defence/Intelligence)</strong> <span class="rung-roles">— Cleared Sec Eng · Senior Cleared Eng · Principal/Lead Cleared Architect</span><div class="rank-meta">🥉 Clearance is the gate; skills directly transfer</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Support SC-cleared environments, maintain accredited systems, follow NCSC operational guidance, document classified networks, support audit + accreditation cycles, work List X premises.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Deploy + maintain SC-accredited security architecture, lead NCSC CAF alignment work, manage classified data lifecycle, support red/blue team exercises for cleared environments, advise cleared clients on threat posture.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Architect SC/DV-grade enterprise security for government departments or defence contractors, advise on NCSC Assured Service offerings, brief national security stakeholders, lead cleared programmes for HMG/MOD/intelligence community.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 7/10 (clearance gates supply)</span>
              <span class="meta-pay">💷 £40-65k pre-clearance · £75-110k mid (SC) · £140-220k senior (SC) · £180-300k+ DV-cleared specialist</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> NCSC frameworks · Classified network operations · Accreditation discipline · Cross-domain solutions · National security context</div><div class="rung-langs">💻 <strong>Code:</strong> Python + SQL <em>(general security scripting + log queries)</em></div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> SC clearance (achievable, 6-12 months) + Sec+ minimum + UK national status</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · Net+ · CCNA · CySA+<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP · CCSP · GICSP · GCIH · GCFA · ISO 27001 LI<br>
              <span class="pivot-rung">🏆 Senior:</span> ISSAP · CISM · UKCSC ChCSP · CSyP
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> prior experience is uniquely well-positioned for clearance: UK national, employed in an established UK physical security firm (no foreign-entity complications), already work with surveillance + access control systems (concepts that translate directly to classified environments). the relevant organisation may have SC-cleared client work — worth asking. The clearance is achievable (6-12 months), and once held, opens 40-80% premium on baseline cyber pay. DV is rarer and pays 80-120% premium.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Map a fictional UK government department's security posture against NCSC Cyber Assessment Framework (CAF). Cover all 4 objectives (Managing risk, Protecting against attack, Detecting events, Minimising impact). Identify 10 gaps + remediation plan. Position as if briefing a SIRO (Senior Information Risk Owner). 20-page report.</div>
          </li>

          <li data-rank="#4">
            <span class="role-rung-tag rung-pivot">☁️</span>
            <span class="rank-badge">#4</span>
            <strong>Cloud Solutions Architect (Hyperscaler vendor-side)</strong> <span class="rung-roles">— CSA · Senior CSA · Principal CSA · Specialist CSA</span>
            <div class="rank-meta">Natural extension of integration design work</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Support pre-sales for inbound cloud opportunities, run technical workshops with prospect engineering teams, build POC environments, write technical proposals.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Lead pre-sales engagements for £500k-£5M cloud deals, design reference architectures for prospect environments, present at customer technical reviews, build internal subject-matter content.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Architect for £5M+ strategic accounts, partner with senior sales on enterprise deals, set thought leadership content (talks, blogs, whitepapers), advise hyperscaler product teams on customer feedback.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 8/10</span>
              <span class="meta-pay">💷 £100-150k mid · £150-280k senior · £280-400k Principal at AWS/Azure/GCP</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Cloud architecture (multi-service) · Pre-sales storytelling · Customer technical workshops · Demos · Cross-team coordination</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(automation, Lambda/Functions)</em> · Bash (CLI) · PowerShell (Azure) · SQL (KQL/log queries)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> AZ-104/AWS Cloud Practitioner + 3+ years technical platform experience</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> AZ-104 · AWS SAA · SC-300<br>
              <span class="pivot-rung">📈 Mid:</span> AZ-305 · AWS SAP · SC-100 · SC-200<br>
              <span class="pivot-rung">🏆 Senior:</span> CISSP · ISSAP · TOGAF · vendor specialisations
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> the candidate already do integration architecture — different scale, same skill class. Hyperscaler CSAs are typically pulled from sysadmin or solutions-engineer roles, not from pure cyber. the "I can design and explain systems to customers" muscle is exactly what they hire for. The pay ceiling at AWS/Azure/GCP for senior CSAs significantly exceeds independent SE roles.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a multi-region Azure landing zone for a fictional 1,000-employee SaaS company. Cover identity (Entra ID + PIM), network (hub-spoke + Azure Firewall), data (encryption + Key Vault), monitoring (Defender for Cloud + Sentinel). Document as an Architecture Decision Record + present-ready slide deck.</div>
          </li>

          <li data-rank="#5">
            <span class="role-rung-tag rung-pivot">🔌</span>
            <span class="rank-badge">#5</span>
            <strong>Embedded Systems Security Engineer (vendor product side)</strong> <span class="rung-roles">— Product Sec Eng · Senior Product Sec Eng · Principal Sec Eng</span>
            <div class="rank-meta">Leverages existing product knowledge</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Review firmware update workflows for security gaps, run vulnerability assessments on company products, document product security postures, support customer security questionnaires.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Lead security design reviews for new product features, integrate SAST/DAST into firmware build pipelines, respond to coordinated vulnerability disclosures, advise hardware/firmware engineering teams.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Define product security strategy across the vendor portfolio, brief executives on security posture, lead customer-facing trust/transparency reports (e.g., SOC 2 attestations), represent the company in industry security forums.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 7/10 (niche)</span>
              <span class="meta-pay">💷 £75-115k mid · £115-180k senior · £180-250k Principal at vendors like Axis, Milestone, Hanwha, Honeywell, Schneider</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Embedded security · Firmware analysis · Coordinated vulnerability disclosure · Product threat modelling · Customer trust communication</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(protocol parsing, asset discovery)</em> · Bash (Linux/edge) · C (embedded/firmware to read)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Networking + scripting + understanding of embedded systems (familiar from physical security work)</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · Net+ · Linux+ · CySA+<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP · CSSLP · CEH · GREM<br>
              <span class="pivot-rung">🏆 Senior:</span> ISSAP · CISM · IEC 62443-CFS · UKCSC ChCSP
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> the candidate already know the products vendors make better than most of their internal engineers do — the candidate deploy and troubleshoot them at scale. Vendors specifically hire integrator engineers for product security roles because they understand real-world deployment failures. Axis, Milestone, and LenelS2 all have product security teams; prior experience is direct entry credibility.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Pick one physical security product the candidate know intimately (e.g., Axis camera, LenelS2 controller, Milestone server). Conduct a personal product security review: document threat model, identify 5 attack surfaces (network ports, default credentials, firmware update mechanism, API auth, storage), propose hardening recommendations. 12-page report formatted as a product security review for the vendor.</div>
          </li>
          <li data-rank="#6">
            <span class="role-rung-tag rung-pivot">🏦</span><span class="rank-badge">#6</span>
            <strong>Financial Services Security Engineer (VP-track)</strong> <span class="rung-roles">— Sec Engineer (Bank) · Senior Sec Eng / AVP · VP Sec Eng · Lead Sec Architect</span><div class="rank-meta">Same platform engineering, regulated context</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Maintain SIEM/EDR/IAM platforms for trading + back-office, monitor regulatory controls (FCA SYSC, PRA SS1/21), troubleshoot incidents, support compliance reviews under direction.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Lead security platform deployments across trading + corporate environments, advise on regulatory alignment, automate compliance reporting, support FCA/PRA audit cycles, manage 3rd-party security reviews.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Design security architecture for regulated workloads, brief executive risk committees, lead regulatory engagement directly with FCA/PRA, manage major incident response, set cyber strategy for the trading line of business.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 8/10</span>
              <span class="meta-pay">💷 £60-90k junior · £100-150k mid (VP-grade) · £180-300k+ senior VP / MD-track · £400k+ MD</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Platform engineering at scale · Regulatory frameworks (FCA/PRA/MiFID) · Trading platform familiarity · Stakeholder briefing · Audit response</div><div class="rung-langs">💻 <strong>Code:</strong> SQL <em>(KQL + Splunk SPL — detection-as-code)</em> · Python (enrichment) · PowerShell (Defender/Sentinel)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> AZ-104 + scripting + ability to work in regulated environment</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · CySA+ · AZ-104 · SC-300<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP · CCSP · SC-200 · SC-100 · Splunk SCDA · GCFA<br>
              <span class="pivot-rung">🏆 Senior:</span> ISSAP · CISA · CISM · CRISC · UKCSC ChCSP
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> Trading floors have heavy physical security overlay (clean rooms, badge access, surveillance recording for compliance) that mirrors the daily work. the Milestone XProtect server admin experience translates directly to managing surveillance recording compliance for regulated environments. Banks hire engineers who can credibly work with both physical and cyber controls — the dual fluency is the differentiator.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Author a fictional security architecture for a fictional FCA-regulated trading desk: SIEM coverage (Sentinel/Splunk), EDR strategy (Defender+CrowdStrike hybrid for crown-jewel endpoints), IAM model (Entra ID + PIM for traders), data flow controls for client data. Map each control to FCA SYSC requirements. 15-page Architecture Decision Record.</div>
          </li>
          <li data-rank="#7">
            <span class="role-rung-tag rung-pivot">💡</span><span class="rank-badge">#7</span>
            <strong>Security Product Manager (vendor-side)</strong> <span class="rung-roles">— Associate PM · Product Manager · Senior/Principal PM</span><div class="rank-meta">Customer empathy transfers; significant strategic shift</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Document customer pain points from sales conversations, write user stories for engineering, support small feature launches, run customer discovery interviews under supervision.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Own a product area, define roadmap for one feature line, write PRDs (Product Requirements Docs), partner with engineering on delivery, brief sales/marketing on feature releases.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Define product strategy for a major product line, manage stakeholders across executive/sales/engineering, drive cross-product initiatives, brief CEO/board, influence M&A.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 7/10 (niche-senior)</span>
              <span class="meta-pay">💷 £85-130k mid · £130-200k senior · £200-300k+ FAANG/top vendors</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Customer discovery · Roadmap planning · Technical fluency · Stakeholder mgmt · Strategic thinking</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Graph/Entra automation — primary)</em> · Python (Graph API, identity analytics)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> 5+ years technical platform experience + strong written communication</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · platform expertise in 1+ vendor stack<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP · PRINCE2 Practitioner · CCSP<br>
              <span class="pivot-rung">🏆 Senior:</span> CISM · AZ-305/SAP-C02 · TOGAF
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> Systems Support at an integrator = uniquely deep customer-side empathy. Vendor PMs are typically engineers who lacked customer exposure — the integrator background is the differentiator. Path: Systems Support → Senior Engineer/TAM → Associate PM at a vendor.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Pick a security product the candidate know (e.g., Sentinel or Milestone XProtect). Document 5 customer pain points based on real deployment experience, propose a feature addressing them, write a PRD (problem statement + user stories + success metrics + risks + competitive analysis). Public GitHub.</div>
          </li>

          <li data-rank="#8">
            <span class="role-rung-tag rung-pivot">🎯</span>
            <span class="rank-badge">#8</span>
            <strong>Enterprise Account Executive (Security Sales)</strong> <span class="rung-roles">— Inside Sales · Mid-Market AE · Enterprise AE · Strategic Account AE</span>
            <div class="rank-meta">Leap to pure sales; customer skills transfer</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Support senior AEs on enterprise deals, run discovery calls with prospects, manage sales pipeline, qualify opportunities, build account research.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Own a defined territory (15-30 named accounts or industry vertical), drive deals £100k-£1M, partner with SE/CSE on technical wins, manage forecasting + pipeline.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Manage strategic accounts (£1M+ ARR each), partner with C-suite at customer organisations, drive deals £1M-£10M+, mentor junior AEs, influence vendor product roadmap.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 9/10 (always-hiring)</span>
              <span class="meta-pay">💷 £60-90k base + £80-150k OTE · £90-140k base + £200-350k OTE senior · £150k base + £400-800k OTE strategic</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Discovery + qualification · Forecasting · Negotiation · Executive briefing · Technical-to-business translation</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(security gates/automation)</em> · Bash (Linux/containers) · YAML+Go (operators) · TypeScript (IaC/CDK)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> Customer-facing experience + technical credibility (typically 5+ years technical first)</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · vendor product certs (CCFA · NGFW Eng successor)<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP (credibility) · vendor sales methodologies (MEDDIC, BANT)<br>
              <span class="pivot-rung">🏆 Senior:</span> Industry certs become less important · executive presence + track record dominate
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> Highest absolute pay ceiling of any cyber role — top Enterprise AEs at CrowdStrike, Palo Alto, Wiz earn £600k-£1M+ OTE. Pure performance-driven. Skills transfer: the technical credibility + customer-facing fluency are the core requirements. Heavier sales discipline than TAM. Heavier numbers pressure than any other role here. But if customer-facing + competitive + outcome-driven appeals, this is the unrivalled compensation ceiling.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a complete sales playbook for one security product the candidate know well (Sentinel, CrowdStrike Falcon, or Milestone XProtect). Cover: ideal customer profile, discovery question bank (40+ questions), objection handling matrix (10 common objections), competitive battle cards vs 3 alternatives, ROI calculator template. 25-30 page playbook.</div>
          </li>

          <li data-rank="#9">
            <span class="role-rung-tag rung-pivot">💼</span><span class="rank-badge">#9</span>
            <strong>Cyber M&A / Tech Due Diligence</strong> <span class="rung-roles">— Tech DD Associate · Senior Consultant / VP · Director · Partner</span>
            <div class="rank-meta">Heavy writing + business fluency requirements</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> Run tooling-based vulnerability scans on acquisition targets, document technical findings, build vendor-stack inventories, support deal teams with technical Q&amp;A, draft sections of DD reports.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Lead full DD engagements (2-6 weeks per deal), interview target company CISOs, map security posture to investment thesis risks, write findings reports for PE clients, model cyber risk remediation costs.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Originate DD engagements with PE/banker relationships, manage portfolio of DD work across multiple deals, brief investment committees, build firm methodology IP, mentor junior consultants.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 6/10 (specialised, deal-volume-dependent)</span>
              <span class="meta-pay">💷 £60-90k associate · £100-160k mid (VP at Big 4) · £200-500k+ Director/Partner · day rates £1,500-3,500</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Technical breadth · Report writing (heavy, persuasive) · Stakeholder management · Business + financial fluency · Deal pace tolerance</div><div class="rung-langs">💻 <strong>Code:</strong> PowerShell <em>(Graph/Entra automation — primary)</em> · Python (Graph API, identity analytics)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> 5-7 years technical breadth + strong communication + business interest</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Sec+ · CySA+ · AZ-104 · technical breadth across vendor stacks<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP · CCSP · CISA · CRISC · ISO 27001 LI · ITIL 4 MP<br>
              <span class="pivot-rung">🏆 Senior:</span> CISM · UKCSC ChCSP · CSyP · CDPSE · optional MBA
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> Heavy report writing — be honest about whether this energises or drains the candidate. The path requires both technical depth AND business fluency, which is rare. the integrator role already gives the candidate "I've seen what breaks at customer scale" — exactly the muscle DD demands. But this is the longest arc (7-10 years) and the highest writing tolerance of any role we've discussed. The compensation ceiling justifies it only if the work itself genuinely interests the candidate.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Conduct a fictional cyber due diligence on a fictional UK SaaS target being acquired by PE for £50M. Build inventory: tech stack, security tooling, certifications, recent incidents. Identify 5 critical findings. Quantify remediation cost. Write a 12-page DD report formatted for an investment committee.</div>
          </li>
          <li data-rank="#10">
            <span class="role-rung-tag rung-pivot">📈</span>
            <span class="rank-badge">#10</span>
            <strong>Independent Cyber Contractor / Day-Rate Specialist</strong> <span class="rung-roles">— Contractor · Specialist Contractor · Boutique Consultant · Limited Company Director</span>
            <div class="rank-meta">Destination role — requires 7-10 years first</div>
            <div class="role-progression">
              <div class="prog-step prog-junior"><strong>📍 Junior:</strong> N/A — independent contracting requires senior credibility. Build via salaried roles first.</div>
              <div class="prog-step prog-mid"><strong>📈 Mid:</strong> Operate as a Specialist Contractor on 3-6 month engagements via Limited Company. Day rate £500-900. Mix of remote + on-site work. IR35-aware contract negotiation.</div>
              <div class="prog-step prog-senior"><strong>🏆 Senior:</strong> Top-tier specialist contractor or boutique 1-3 person consultancy. Day rate £900-1,500+. Premium niches (DV-cleared, OT, M&A DD, AI security). Build retainer relationships + repeat clients.</div>
            </div>
            <div class="rung-meta">
              <span class="meta-demand">📊 Demand: 7/10 (cyclical with market)</span>
              <span class="meta-pay">💷 £500-900 day rate mid (£100-180k annual at 200 billable days) · £900-1,500+ senior (£180-300k+ annual) · £1,500-2,500 niche specialists</span>
            </div>
            <div class="rung-skills"><strong>Skills:</strong> Deep technical specialism · Self-promotion + business development · IR35/tax compliance · Stakeholder management · Independent operation</div><div class="rung-langs">💻 <strong>Code:</strong> Python <em>(primary — model/adversarial tooling, MLOps)</em> · SQL (training-data queries)</div>
            <div class="pivot-prereq"><strong>🔓 Enter from:</strong> 7-10 years cyber experience + established network + tax/IR35 fluency</div>
            <div class="pivot-ladder">
              <span class="pivot-rung">🎯 Foundation:</span> Whatever specialism the candidate build via salaried roles first<br>
              <span class="pivot-rung">📈 Mid:</span> CISSP · niche specialism certs · industry recognition<br>
              <span class="pivot-rung">🏆 Senior:</span> UKCSC ChCSP · CSyP · specialist credentials in chosen niche
            </div>
            <div class="why-natural"><strong>💡 Why natural for this path:</strong> Not a transition role — this is a destination after building 7-10 years of expertise in a specific niche. Worth including because it represents the genuine ceiling for senior IC specialists who don't want to manage teams or sell. Many of the other roles here can lead here. the specific combination (physical security + cyber + cleared if the candidate go that route) is a genuine niche that commands premium day rates.</div>
            <div class="gateway-project"><span class="gp-icon">🎯</span><strong>Gateway Project:</strong> Build a niche specialism portfolio in something the candidate genuinely know (e.g., physical-cyber convergence). 10-page service catalogue describing: services offered, day rate, typical engagement length, deliverables, case study format. Build a LinkedIn presence around the niche. Track £-per-day ambition across 12 months.</div>
          </li>
        </ul>
      </div>
    </details>




    <div class="strat-band">🗂️ Reference &amp; Planning</div>
    <details class="strategy-section">
      <summary><span class="strategy-marker">📋</span> Application-Based Credentials</summary>
      <div class="strategy-body">
        <p>A separate sub-domain from regular study certs. These <strong>14 credentials</strong> are <strong>not single-exam events</strong> — they require evidence portfolios, professional endorsements, supervised activity records, and ongoing CPD obligations after award. Plan for them differently: months of evidence assembly, application fees, post-award CPE tracking.</p>
        <p><strong>UK positioning</strong>: The 4 UKCSC titles (ACSP/PCSP/PrCSP/ChCSP) are UK Royal Charter credentials — gold-standard for UK Government cyber roles, NCSC Assured Consultancy Scheme work, MOD/CNI sector employment. The CCP scheme closes December 2026; UKCSC titles are the replacement. The 9 ISC2/ISACA credentials (CISSP, ISSAP, CCSP, CSSLP, CISM, CISA, CRISC, AAISM, CDPSE) are global — recognised UK-wide but priced in USD. CSyP via The Security Institute is UK chartered (heritage chartered security route). Best UK strategy: pair UKCSC sovereign credentials with global ISC2/ISACA credentials. CIISec (UK chartered cyber body, route for UKCSC Process A) has chapters in London, Manchester, Bristol, Edinburgh.</p>
        <p><strong>UKCSC Professional Registration ladder</strong> (UK Cyber Security Council):</p>
        <ul>
          <li><strong>ACSP</strong> — Associate (~£362, post-Sec+, evidence portfolio + interview, 25 CPD/yr ongoing)</li>
          <li><strong>PCSP</strong> — Practitioner (specialism-specific, 3-5 years' experience)</li>
          <li><strong>PrCSP</strong> — Principal (senior practitioner, 7+ years)</li>
          <li><strong>ChCSP</strong> — Chartered (gold-standard endpoint, Royal Charter recognition, MSc-equivalent knowledge)</li>
        </ul>
        <p><strong>ISC2 application-based certs</strong> (4 — all 9-month post-exam endorsement window, $135/yr AMF, 120 CPE/3yr):</p>
        <ul>
          <li><strong>CISSP</strong> — exam + 5 years' security experience + endorsement</li>
          <li><strong>ISSAP</strong> — CISSP architect concentration, requires CISSP + 2 years' architecture experience</li>
          <li><strong>CCSP</strong> — exam + 5 years' experience including 1 year cloud security + endorsement</li>
          <li><strong>CSSLP</strong> — exam + 4 years' software security lifecycle experience + endorsement</li>
        </ul>
        <p><strong>ISACA application-based certs</strong> (5 — application within 5 years of exam pass, $45-85/yr AMF, 120 CPE/3yr):</p>
        <ul>
          <li><strong>CISM</strong> — exam + 5 years' security management experience</li>
          <li><strong>CISA</strong> — exam + 5 years' IS audit/control experience (heavy audit scrutiny)</li>
          <li><strong>CRISC</strong> — exam + 3 years' IT risk management experience</li>
          <li><strong>AAISM</strong> — exam + 3 years' AI security management experience (newest, Aug 2025 launch)</li>
          <li><strong>CDPSE</strong> — exam + 3 years' technical privacy engineering experience</li>
        </ul>
        <p><strong>UK Chartered Security Institute</strong>:</p>
        <ul>
          <li><strong>CSyP</strong> — Chartered Security Professional via The Security Institute (UK heritage chartered route, 10+ years' senior security experience)</li>
        </ul>
        <p><strong>Why they're separate</strong>: The "study and sit" model doesn't apply. Each requires:</p>
        <ul>
          <li>Evidence portfolio (months of assembly)</li>
          <li>Professional references / endorsements (someone vouches for this path)</li>
          <li>Application fee separate from any exam fee</li>
          <li>Ongoing CPD/CPE obligations to maintain</li>
        </ul>
        <p><strong>Pre-prep cycles to plan for</strong>: ACSP needs ~3 months of evidence work post-Sec+. CISSP application takes ~6 months even with experience. ISACA certs run 12-18 months end-to-end (CISA most rigorous). ChCSP is a multi-year endpoint, not a near-term goal.</p>
        <p><strong>In the cert tracker</strong>: these certs sort into their own sub-section below active study certs, with a 📋 PORTFOLIO badge and indigo accent. Each cert detail expansion contains a fully verified <strong>Application Pathway</strong> block — route, cost, timeline, 8-step sequence, evidence categories, referee guidance with LinkedIn outreach script, and pitfalls specific to that credential. All 14 guides verified May 2026 against issuing body documentation (CIISec, ISC2, ISACA, UKCSC, Security Institute).</p>
        <button class="btn-track-filter" onclick="switchTab('certifications'); setFilter('portfolio');">View portfolio certs →</button>
      </div>
    </details>

    <details class="strategy-section">
      <summary><span class="strategy-marker">📚</span> Study Stack</summary>
      <div class="strategy-body">
        <p><strong>PRIMARY platforms (always-on):</strong></p>
        <ul>
          <li><strong>Pluralsight</strong> (~£25-30/mo) — Microsoft cert paths, AWS, security tracks. John Savill is the gold standard for Azure.</li>
          <li><strong>Pocket Prep</strong> (~£75/yr) — ambient practice questions during commutes. Network+, Security+, CISSP, CySA+ banks.</li>
          <li><strong>YouTube Premium</strong> — Professor Messer (CompTIA), Jeremy's IT Lab (CCNA), John Savill (Azure), Daniel Lowrie (CCSK).</li>
          <li><strong>Udemy</strong> — gap-filler for specific certs (Adrian Cantrill AWS, Adrian Cantrill cloud security paths).</li>
        </ul>
        <p><strong>LAB platforms (project-tied):</strong></p>
        <ul>
          <li>M365 Developer tenant (free) + Azure free tier — Microsoft cert practical work</li>
          <li>TryHackMe Premium (~£12/mo) — SEC0/SEC1 ambient + SAL1/SE1/PT1 pathway</li>
          <li>Packet Tracer (free) — CCNA networking labs</li>
          <li>KodeKloud — CKA/CKS Kubernetes practice</li>
        </ul>
        <p><strong>EXAM-READY platforms (final 2-3 weeks before sit):</strong></p>
        <ul>
          <li>MeasureUp (~$21/mo subscription) — Microsoft official practice tests</li>
          <li>Boson — CompTIA, Cisco gold-standard practice</li>
          <li>Tutorials Dojo — cheap reliable AWS practice</li>
        </ul>
        <p><strong>VENDOR-NATIVE:</strong> HTB Academy, Destination Cert (CISSP), vendor portals (Microsoft Learn, AWS Skill Builder, Splunk Education).</p>
        <p><strong>FALLBACK:</strong> ChatGPT/Claude for concept clarification → Codementor £60-100/hr 2hr sessions when stuck on a specific topic.</p>
      </div>
    </details>

    <details class="strategy-section">
      <summary><span class="strategy-marker">💰</span> Cost & Capacity Reality Check</summary>
      <div class="strategy-body">
        <p><strong>Total cost:</strong> ~£7,300 across ~34 self-funded certs (estimated burn rate ~£1,000/year over 7-year horizon).</p>

        <p><strong>Employer-funded:</strong> Vendor wall (~10 certs) + LenelS2 ladder (4 certs). 3 employer-funded high-cost training items (GICSP ~£7,800, GCDA ~£7,800, IEC 62443 ~£800) only activate if specific career signals fire.</p>
        <p><strong>Hours by phase:</strong></p>
        <ul>
          <li>Phase 1: ~660h self-study + ~340h employer-funded vendor wall over 24-36 months. Self-study pace adjustable.</li>
          <li>Phase 2: ~680h of cert content. Concentrates CySA+, Linux+ (XK0-006), Server+ (lifetime), SOC labs (SAL1/SE1/CJCA), BTL1, Python (PCEP/PCAP), UKCSC PCSP. Server+ is dropable first if needed — it's lifetime-valid with no renewal pressure.</li>
          <li>Phase 3: ~570h</li>
          <li>Phase 4: ~810h</li>
          <li>Phase 5: ~430h</li>
          <li>Phase 6: ~270h</li>
          <li><strong>Total: ~3,260 hours over 7 years</strong></li>
        </ul>

      </div>
    </details>

    <div class="strategy-footer">
      <p><strong>This strategy lives in the tracker.</strong> The retired PDF has been consolidated here so there's a single source of truth. Update via cert tracker only.</p>
    </div>
  `;
}


function orderPhaseCerts(certs) {
  const tierOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
  const idSet = new Set(certs.map(c => c.id));
  const remainingDeps = new Map();
  certs.forEach(c => {
    const inScopeDeps = (c.deps || []).filter(d => idSet.has(d));
    remainingDeps.set(c.id, inScopeDeps.length);
  });
  const dependents = new Map();
  certs.forEach(c => dependents.set(c.id, []));
  certs.forEach(c => {
    (c.deps || []).forEach(d => {
      if (idSet.has(d)) dependents.get(d).push(c.id);
    });
  });
  const compareReady = (a, b) => {
    const ANCHORS = ['a-plus', 'network-plus'];
    const ai = ANCHORS.indexOf(a.id), bi = ANCHORS.indexOf(b.id);
    if (ai !== bi) { if (ai === -1) return 1; if (bi === -1) return -1; return ai - bi; }
    const aPassed = !!state.passes[a.id];
    const bPassed = !!state.passes[b.id];
    if (aPassed !== bPassed) return aPassed ? 1 : -1;
    const aPending = !!a.pending;
    const bPending = !!b.pending;
    if (aPending !== bPending) return aPending ? 1 : -1;
    const aApp = !!a.applicationBased;
    const bApp = !!b.applicationBased;
    if (aApp !== bApp) return aApp ? 1 : -1;
    if (a.gateway !== b.gateway) return a.gateway ? 1 : -1;
    const aHrs = (a.hours && a.hours[0] && a.hours[1]) ? (a.hours[0] + a.hours[1]) / 2 : 50;
    const bHrs = (b.hours && b.hours[0] && b.hours[1]) ? (b.hours[0] + b.hours[1]) / 2 : 50;
    const aEff = aHrs > 0 ? (a.roi || 0) / aHrs : 0;
    const bEff = bHrs > 0 ? (b.roi || 0) / bHrs : 0;
    if (aEff !== bEff) return bEff - aEff;
    const ta = tierOrder[a.tier] ?? 5, tb = tierOrder[b.tier] ?? 5;
    if (ta !== tb) return ta - tb;
    return (a.difficulty || 0) - (b.difficulty || 0);
  };
  const result = [];
  let ready = certs.filter(c => remainingDeps.get(c.id) === 0);
  ready.sort(compareReady);
  while (ready.length > 0) {
    const next = ready.shift();
    result.push(next);
    (dependents.get(next.id) || []).forEach(depId => {
      const newCount = remainingDeps.get(depId) - 1;
      remainingDeps.set(depId, newCount);
      if (newCount === 0) {
        const cert = certs.find(c => c.id === depId);
        if (cert) {
          let i = 0;
          while (i < ready.length && compareReady(ready[i], cert) <= 0) i++;
          ready.splice(i, 0, cert);
        }
      }
    });
  }
  if (result.length < certs.length) {
    const missing = certs.filter(c => !result.find(r => r.id === c.id));
    missing.sort(compareReady);
    result.push(...missing);
  }
  return result;
}

function renderCertifications() {
  const { filters, filterGroups } = getFilterDefs();

  const allChips = [...filters, ...Object.values(filterGroups).flatMap(g => g.chips)];
  const activeFilter = allChips.find(f => f.id === state.filter) || filters[0];
  const searchQuery = (state.searchQuery || '').trim().toLowerCase();
  const searchTest = searchQuery ? (c => {
    const haystack = [
      c.code, c.name, c.note, c.coverage,
      ...(c.skills || []), ...(c.subjects || [])
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(searchQuery);
  }) : null;

  const searchBar = `
    <div class="cert-search-bar">
      <input
        type="search"
        class="cert-search-input"
        placeholder="Search certs by name, code, skill, or subject..."
        value="${escape(state.searchQuery || '')}"
        oninput="setSearchQuery(this.value)"
        autocomplete="off">
      ${searchQuery ? `<button class="cert-search-clear" onclick="setSearchQuery('')" title="Clear search">×</button>` : ''}
    </div>`;

  const renderChip = f => {
    if (f.id === 'all') return '';
    if (f.groupToggle) {
      const isOpen = state.openFilterGroups[f.groupToggle];
      const grp = filterGroups[f.groupToggle];
      const activeChild = grp.chips.find(ch => ch.id === state.filter);
      const hasActiveChild = !!activeChild;
      const chevron = isOpen ? '▴' : '▾';
      let label = f.label.replace('▾', chevron);
      if (activeChild && !isOpen) label = activeChild.label + ' ' + chevron;
      return `<button class="filter-chip filter-group-toggle${isOpen ? ' open' : ''}${hasActiveChild ? ' has-active-child' : ''}" onclick="toggleFilterGroup('${f.groupToggle}')">${escape(label)}</button>`;
    }
    const isChild = f.id.startsWith('pv-') || f.id.endsWith('-arch') || f.id === 'cloud-arch';
    const cnt = isChild && f.test ? CERTS.filter(f.test).length : null;
    return `<button class="filter-chip${state.filter === f.id ? ' active' : ''}" onclick="setFilter('${f.id}')">${escape(f.label)}${cnt !== null ? ` <span class="chip-count">${cnt}</span>` : ''}</button>`;
  };
  const renderGroupChildren = (key) => {
    if (!state.openFilterGroups[key]) return '';
    const grp = filterGroups[key];
    return `<div class="filter-group-children" data-group="${key}">${grp.chips.map(renderChip).join('')}</div>`;
  };

  const filterBar = `
    <details class="cert-filter-disclosure" ${certFiltersExpanded() ? 'open' : ''} ontoggle="rememberCertFilters(this)">
    <summary onclick="event.preventDefault();toggleCertFilters(this.parentElement)"><span>Filters · ${escape(activeFilter.label || 'My Path')}${state.passedOnly ? ' · Passed only' : ''}</span><span class="cert-filter-expand">Expand</span><span class="cert-filter-collapse">Collapse</span></summary>
    <div class="cert-filter-bar">
      ${filters.map((f, i) => {
        const chipHtml = renderChip(f);
        const childrenHtml = f.groupToggle ? renderGroupChildren(f.groupToggle) : '';
        return chipHtml + childrenHtml;
      }).join('')}
      <button class="filter-chip chip-overlay${state.passedOnly ? ' active' : ''}" onclick="togglePassedOnly()" title="Combines with the active pathway">✅ Passed</button>
    </div></details>`;

  const blocks = [1, 2, 3, 4, 5, 6].map(ph => {
    let phaseCerts = CERTS.filter(c => certPhase(c) === ph).filter(activeFilter.test);
    if (state.passedOnly) phaseCerts = phaseCerts.filter(c => state.passes[c.id]);
    if (searchTest) phaseCerts = phaseCerts.filter(searchTest);
    let certs = orderPhaseCerts(phaseCerts);
    const customOrder = (state.certOrder || {})[ph];
    if (customOrder && customOrder.length && !window.CertTrackerV3?.focusedRoute?.scoped()) {
      certs = [...certs].sort((a, b) => {
        const ia = customOrder.indexOf(a.id), ib = customOrder.indexOf(b.id);
        return (ia < 0 ? 9999 : ia) - (ib < 0 ? 9999 : ib);
      });
    }
    if(window.CertTrackerV3?.focusedRoute?.scoped())certs=window.CertTrackerV3.focusedRoute.ordered(certs);
    certs=[...certs].sort((a,b)=>(state.passes[a.id]?1:0)-(state.passes[b.id]?1:0));
    if (certs.length === 0) return '';
    const totalCerts = phaseCerts.length;
    const passed = phaseCerts.filter(c => state.passes[c.id]).length;
    const remaining = CERTS.filter(c => certPhase(c) === ph && !state.passes[c.id] && c.roi > 0);
    const avgROI = remaining.length ? (remaining.reduce((s, c) => s + c.roi, 0) / remaining.length).toFixed(1) : null;
    const isOpen = state.openPhase === ph;
    const numClass = passed === totalCerts ? 'done' : passed > 0 ? 'partial' : 'pending';

    const isDefaultFilter = state.filter === 'all' || state.filter === 'not-passed';
    const filterTest = typeof activeFilter?.test === 'function' ? activeFilter.test : null;
    const nextRecommended = isDefaultFilter ? nextCoreCert() : nextCoreCert(filterTest);
    if(nextRecommended&&certs.some(c=>c.id===nextRecommended.id))certs=[nextRecommended,...certs.filter(c=>c.id!==nextRecommended.id)];
    const rows = isOpen ? certs.map(cert => renderCertRow(cert, nextRecommended && cert.id === nextRecommended.id)).join('') : '';

    return `
      <div class="phase-block ph${ph}">
        <button class="phase-header" onclick="togglePhase(${ph})">
          <div class="phase-header-left">
            <span class="phase-num ${numClass}">${ph}</span>
            <div>
              <div class="phase-header-title">Phase ${ph}: ${escape(trackerPhaseSpec(ph).name)} <span class="phase-stage-tag">${phaseStage(ph)}</span></div>
              <div class="phase-header-meta">${passed}/${totalCerts} passed · ${(() => { const e = phaseETA(ph); return e ? `≈ ${e}` : escape(trackerPhaseSpec(ph).window); })()}${avgROI ? ` · Avg ROI ${avgROI}` : ''}</div>
              ${trackerPhaseSpec(ph).roles ? `<div class="phase-header-roles"><span class="phr-band">${escape(trackerPhaseSpec(ph).band)}</span> Opens: ${trackerPhaseSpec(ph).roles.map(r => escape(r)).join(' · ')}</div>` : ''}
            </div>
          </div>
          <span class="phase-toggle">${isOpen ? '−' : '+'}</span>
        </button>
        ${rows}
      </div>`;
  }).join('');

  return `
    <p style="font-size:11px;color:var(--dim);margin-bottom:10px">Tap a cert to expand. Enter pass dates for auto-renewal and expiry tracking.</p>
    ${searchBar}
    ${filterBar}
    ${blocks || `<div class="empty-filter-state"><div class="icon">🔍</div><h3>No certs match this ${searchQuery ? 'search' : 'filter'}</h3><p>${searchQuery ? 'Try clearing the search or broadening the filter.' : 'Try clearing the filter or selecting a different one. The "All" chip will show every cert in the plan.'}</p></div>`}`;
}

function renderApplicationGuide(cert) {
  const g = cert.applicationGuide;
  if (!g) return '';
  const isVerified = !!g.verified;
  const openByDefault = isVerified;

  const stepsHTML = (g.steps || []).map(s => `
    <div class="appguide-step">
      <div class="appguide-step-title">${escape(s.title)}</div>
      <div class="appguide-step-detail">${escape(s.detail)}</div>
    </div>`).join('');

  const evidenceHTML = (g.evidence || []).length ? `
    <div class="appguide-section">
      <div class="appguide-section-label">📁 Evidence to assemble</div>
      <ul class="appguide-list">
        ${g.evidence.map(e => `<li>${escape(e)}</li>`).join('')}
      </ul>
    </div>` : '';

  const refereesHTML = g.referees ? `
    <div class="appguide-section">
      <div class="appguide-section-label">🤝 Referees / endorsers</div>
      <p class="appguide-text">${escape(g.referees.guidance || '')}</p>
      ${g.referees.whoToAsk && g.referees.whoToAsk.length ? `
        <div class="appguide-subsection-label">Who to approach</div>
        <ul class="appguide-list">
          ${g.referees.whoToAsk.map(p => `<li>${escape(p)}</li>`).join('')}
        </ul>` : ''}
      ${g.referees.outreachTemplate ? `
        <div class="appguide-subsection-label">LinkedIn / email outreach script</div>
        <div class="appguide-quote">${escape(g.referees.outreachTemplate)}</div>` : ''}
    </div>` : '';

  const pitfallsHTML = (g.pitfalls || []).length ? `
    <div class="appguide-section">
      <div class="appguide-section-label">⚠ Common pitfalls</div>
      <ul class="appguide-list">
        ${g.pitfalls.map(p => `<li>${escape(p)}</li>`).join('')}
      </ul>
    </div>` : '';

  const verifyBanner = isVerified
    ? `<div class="appguide-verified">✓ Verified ${escape(g.verified)} — guidance reflects current requirements as of this date.</div>`
    : `<div class="appguide-unverified">⚠ <strong>Placeholder guidance.</strong> Verify current requirements at <strong>${escape(g.verifyAt || 'the issuing body')}</strong> before applying. Steps and pitfalls below are generic best practice — cert-specific specifics need verification in a future session.</div>`;

  return `
    <details class="appguide-block" ${openByDefault ? 'open' : ''}>
      <summary class="appguide-summary">
        <span class="appguide-summary-icon">📋</span>
        <span class="appguide-summary-title">Application Pathway</span>
        <span class="appguide-summary-status">${isVerified ? '<span class="appguide-status-verified">VERIFIED</span>' : '<span class="appguide-status-placeholder">PLACEHOLDER</span>'}</span>
      </summary>
      <div class="appguide-body">
        ${verifyBanner}
        <div class="appguide-meta-grid">
          <div class="appguide-meta">
            <div class="appguide-meta-label">Route</div>
            <div class="appguide-meta-value">${escape(g.route || 'TBD')}</div>
          </div>
          <div class="appguide-meta">
            <div class="appguide-meta-label">Cost</div>
            <div class="appguide-meta-value">${escape(g.cost || 'TBD')}</div>
          </div>
          <div class="appguide-meta">
            <div class="appguide-meta-label">Timeline</div>
            <div class="appguide-meta-value">${escape(g.timeline || 'TBD')}</div>
          </div>
        </div>
        <div class="appguide-section">
          <div class="appguide-section-label">📋 Step-by-step</div>
          <div class="appguide-steps">${stepsHTML}</div>
        </div>
        ${evidenceHTML}
        ${refereesHTML}
        ${pitfallsHTML}
        ${g.note ? `<div class="appguide-footnote">${escape(g.note)}</div>` : ''}
      </div>
    </details>`;
}

function phaseStage(ph) {
  if(window.CertTrackerV3?.focusedRoute?.scoped())return 'Locked curriculum';
  if (ph <= 2) return 'Entry tier';
  if (ph <= 4) return 'Mid-career';
  return 'Senior tier';
}

function pathwayOf(cert) {
  const id = cert.id;
  const code = cert.code || '';
  if (['lca','lcp','lce','lcda'].includes(id)) return 'LenelS2';
  if (['mcit','mcie','mcde'].includes(id)) return 'Milestone';
  if (id === 'acp') return 'Axis';
  if (id === 'cmss' || id === 'ccna') return 'Cisco';
  if (['a-plus','network-plus','security-plus','secai-plus','cysa-plus','linux-plus','server-plus','pentest-plus','securityx','autoops-plus'].includes(id)) return 'CompTIA';
  if (/^(AZ|SC|MS|MD|AI)-/i.test(code)) return 'Microsoft';
  if (id.startsWith('aws-')) return 'AWS';
  if (['cissp','ccsp','csslp','issap'].includes(id)) return 'ISC2';
  if (['cism','crisc','aaism','cisa','cdpse'].includes(id)) return 'ISACA';
  if (id === 'caisp') return 'Practical DevSecOps';
  if (id === 'mad') return 'MITRE';
  if (['gicsp','gcda','gcih','grid','grem','gcfa'].includes(id)) return 'GIAC';
  if (id.startsWith('thm-')) return 'TryHackMe';
  if (id.startsWith('htb-')) return 'HackTheBox';
  if (id === 'bcs-esa') return 'BCS';
  if (id === 'togaf-10') return 'Open Group';
  if (['prince2-prac','itil-4-foundation','itil-4-mp'].includes(id)) return 'AXELOS';
  if (['btl1','btl2'].includes(id)) return 'Security Blue Team';
  if (['cipp-e','aigp'].includes(id)) return 'IAPP';
  if (id === 'ccsk') return 'CSA';
  if (id === 'asis-psp') return 'ASIS';
  if (id === 'csyp') return 'Security Institute';
  if (['ukcsc-assoc','ukcsc-princ','ukcsc-chart'].includes(id)) return 'UKCSC';
  if (['iec-62443-cfs','iec-62443-cra'].includes(id)) return 'ISA';
  if (['crest-crt','crest-cct'].includes(id)) return 'CREST';
  if (id === 'bscp') return 'PortSwigger';
  if (id === 'iso-27001-li') return 'PECB';
  if (id.startsWith('splunk-')) return 'Splunk';
  if (['crowdstrike-ccf','crowdstrike-ccfh'].includes(id)) return 'CrowdStrike';
  if (id.startsWith('pan-')) return 'Palo Alto';
  if (id === 'wiz-cse') return 'Wiz';
  if (['pcep','pcap'].includes(id)) return 'Python Institute';
  if (['cka','cks','kcsa'].includes(id)) return 'Linux Foundation';
  if (['terraform','hashicorp-vault'].includes(id)) return 'HashiCorp';
  if (['oscp','oswe'].includes(id)) return 'Offensive Security';
  if (id === 'crto') return 'Zero-Point Security';
  if (id === 'pnpt') return 'TCM Security';
  return 'Other';
}

function pathwayIcon(cert) {
  const p = pathwayOf(cert);
  const icons = {
    'CompTIA': '🅒', 'Microsoft': '🪟', 'AWS': '🟧',
    'LenelS2': '🔓', 'Milestone': '📹', 'Axis': '🎥',
    'Cisco': '🌐', 'UKCSC': '🇬🇧', 'TryHackMe': '🪤', 'HackTheBox': '📦',
    'ISC2': '🛡️', 'ISACA': '⚖️', 'GIAC': '🎯', 'Splunk': '🔍',
    'BCS': '📚', 'Open Group': '🌍', 'AXELOS': '📊',
    'Security Blue Team': '🔷', 'IAPP': '🔐', 'CSA': '☁️',
    'ASIS': '🏛️', 'Security Institute': '🎓', 'ISA': '🏭',
    'CREST': '👑', 'PECB': '📜', 'CrowdStrike': '🦅',
    'Palo Alto': '🌳', 'Wiz': '✨', 'Python Institute': '🐍',
    'Linux Foundation': '🐧', 'HashiCorp': '⚙️',
    'Offensive Security': '🥷', 'TCM Security': '🔨',
    'MITRE': '🧭', 'Practical DevSecOps': '🔧', 'PortSwigger': '🕷️', 'Zero-Point Security': '🗡️'
  };
  return icons[p] || '◽';
}


function renderCertRow(cert, isNext = false) {
  const pd = state.passes[cert.id] || '';
  const { status, days, expiry } = expiryInfo(cert, pd);
  const info = TRACK_INFO[cert.track];
  const isOpen = !!state.openCerts[cert.id];
  const certNotes = state.notes[cert.id] || { text: '', link: '', imageData: '' };
  const hasNotes = certNotes.text || certNotes.link || certNotes.imageData;
  const ps = priorityScore(cert);
  const mt = medalTier(cert);

  const dotClass = pd
    ? 'passed'
    : status === 'URGENT' || status === 'EXPIRED'
      ? 'urgent'
      : status === 'WARN'
        ? 'warn'
        : '';

  const summary = `
    <div class="cert-summary${cert.tracks && cert.tracks.length === 0 ? ' parked' : ''}" role="button" tabindex="0" aria-expanded="${state.openCerts[cert.id] ? 'true' : 'false'}" onclick="toggleCert('${cert.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleCert('${cert.id}');}">
      <button class="cert-status-dot ${dotClass}" onclick="event.stopPropagation(); toggleComplete('${cert.id}')" title="${pd ? 'Completed — tap to undo' : 'Tap to mark complete'}" aria-label="Toggle completion">${pd ? '✓' : ''}</button>
      ${certNotes.imageData ? `<img src="${escape(certNotes.imageData)}" class="cert-badge-img" alt="">` : (pd ? certMedallionHTML(cert) : '')}
      <div class="cert-summary-main">
        <div class="cert-name-row">
          ${isNext ? `<span class="badge badge-next">▶ NEXT UP</span>` : ''}
          <span class="cert-name ${pd ? 'passed' : ''}">${escape(cert.name)}</span>
          ${cert.code ? `<span class="cert-code">${escape(cert.code)}</span>` : ''}
          ${state.filter === 'my-path' ? '' : `<button class="mypath-star${state.myPath?.[cert.id] ? ' active' : ''}" onclick="event.stopPropagation(); toggleMyPath('${cert.id}')" title="${state.myPath?.[cert.id] ? 'Remove from My Path' : 'Add to My Path'}" aria-pressed="${state.myPath?.[cert.id] ? 'true' : 'false'}">${state.myPath?.[cert.id] ? 'PATH −' : 'PATH +'}</button>`}
        </div>
        <div class="cert-meta-row">
          ${pd ? `<span class="badge badge-held">✓ HELD${state.passes[cert.id] ? ' · ' + formatPassDate(state.passes[cert.id]) : ''}</span>` : ''}
          ${state.skipped[cert.id] ? `<span class="badge badge-skipped">⊘ SKIPPED</span>` : ''}
          ${cert.pending && !pd ? `<span class="badge badge-pending" title="Awaiting external prerequisite (e.g. partner portal access)">⏳ PENDING</span>` : ''}
          ${cert.applicationBased && !pd ? `<span class="badge badge-portfolio" title="Application-based credential — evidence portfolio + endorsements + CPD obligations. Not a single exam.">📋 PORTFOLIO</span>` : ''}
          ${cert.gateway ? `<span class="badge badge-gateway" title="Gateway cert — unblocks Phase progression">🔑 GATEWAY</span>` : ''}
          ${cert.roi > 0 ? `<span class="badge badge-signature signature-tier-${cert.tier}" title="Career ROI ${cert.roi}/10 · Tier ${cert.tier} · Difficulty ${cert.difficulty}/10">ROI ${cert.roi} · ${cert.tier}${cert.difficulty > 0 ? ' · D'+cert.difficulty : ''}</span>` : ''}
          ${cert.tracks && cert.tracks.length === 0 ? `<span class="badge badge-parked" title="Parked — VoIP track deferred until commercial trigger">⏸ PARKED</span>` : ''}
          ${cert.tracks && cert.tracks.length > 0 && cert.tracks.length < 3 ? cert.tracks.map(t => `<span class="badge badge-track badge-track-${t}" title="${t === 'A' ? 'Cloud Security' : t === 'B' ? 'Physical Security' : 'Cyber Security'}">${t}</span>`).join('') : ''}
          ${cert.tracks && cert.tracks.length === 3 ? `<span class="badge badge-track badge-track-all" title="Foundation cert — serves all three tracks">A·B·C</span>` : ''}
          <span class="badge badge-pathway" title="Parent vendor or programme">${pathwayIcon(cert)} ${pathwayOf(cert)}</span>
          ${cert.seVariant ? `<span class="badge badge-se" title="Serves Sales Engineer / pre-sales roles">💼 SE</span>` : ''}
          ${cert.employer ? `<span class="badge badge-employer">Employer £</span>` : cert.free ? `<span class="badge badge-free">Free</span>` : `<span class="cert-cost-inline">${escape(cert.cost)}</span>`}
          ${cert.cvValue ? `<span class="badge badge-cv" title="Estimated £ added to earning power — UK market signal, not a guarantee; non-additive across certs">+${cert.cvValue >= 1000 ? '£' + (cert.cvValue / 1000).toFixed(cert.cvValue % 1000 ? 1 : 0) + 'k' : '£' + cert.cvValue} CV</span>` : ''}
          ${cert.validity === 12 ? `<span class="badge badge-1yr" title="1-year validity — renewal urgency">1yr ⚠</span>` : ''}
          ${pd ? statusBadgeHTML(status, days) : ''}
        </div>
      </div>
      <button class="cert-expand-toggle">${isOpen ? '▲' : '▼'}</button>
    </div>`;

  if (!isOpen) return `<div class="cert-row roi-${cert.roi || 0} ${pd ? 'passed' : ''} ${cert.gateway ? 'gateway' : ''} ${isNext ? 'is-next' : ''} ${state.skipped[cert.id] ? 'is-skipped' : ''} ${cert.pending && !pd ? 'is-pending' : ''} ${cert.applicationBased && !pd ? 'is-portfolio' : ''}" data-cid="${cert.id}" data-cph="${certPhase(cert)}" data-m="${mt}"><span class="drag-handle" title="Hold and drag to reorder">⠿</span>${summary}</div>`;

  const deps = (cert.deps || []).map(id => CERTS.find(c => c.id === id)).filter(Boolean);
  const depsPassed = deps.every(d => state.passes[d.id]);

  const details = `
    <div class="cert-details">
      <div class="cert-details-grid">
        ${cert.difficulty > 0 ? `<div class="cert-stat"><div class="cert-stat-label">Difficulty</div><div class="cert-stat-value">${cert.difficulty}/10</div></div>` : ''}
        ${cert.roi > 0 ? `<div class="cert-stat"><div class="cert-stat-label">Career ROI</div><div class="cert-stat-value">${cert.roi}/10</div></div>` : ''}
        ${cert.hours[1] > 0 ? `<div class="cert-stat"><div class="cert-stat-label">Study hours</div><div class="cert-stat-value">${cert.hours[0]}–${cert.hours[1]}</div></div>` : ''}
        ${cert.validity ? `<div class="cert-stat"><div class="cert-stat-label">Validity</div><div class="cert-stat-value">${cert.validity} months</div></div>` : ''}
      </div>
      ${cert.roles && cert.roles.length ? `
        <div class="cert-roles">
          <div class="cert-roles-label">🎯 Roles this helps the candidate apply for</div>
          <div class="cert-roles-list">${cert.roles.map(r => `<span class="role-pill">${escape(r)}</span>`).join('')}</div>
        </div>` : ''}
      ${cert.marketNote ? `<div class="cert-marketnote">📣 ${escape(cert.marketNote)}</div>` : ''}
      ${cert.expReq ? `<div class="cert-marketnote">🛂 <strong>Experience gate:</strong> ${escape(cert.expReq)} — the exam is the flight; this is the visa.</div>` : ''}
      ${cert.cvValue ? `<div class="cert-cv-line">Estimated CV value <strong>+£${cert.cvValue.toLocaleString()}</strong><span class="cert-cv-cav"> /yr earning-power signal — UK market estimate, not a guarantee; non-additive</span>${cert.verifiedAt ? `<span class="cert-cv-cav"> · data verified ${escape(cert.verifiedAt)}</span>` : ''}</div>` : ''}
      ${state.simMode && !state.passes[cert.id] ? `<button class="sim-pass-btn${state.simPasses[cert.id] ? ' on' : ''}" onclick="simTogglePass('${cert.id}')">${state.simPasses[cert.id] ? '🧪 Simulated pass — tap to remove' : '🧪 Simulate pass'}</button>` : ''}
      ${cert.projectRec ? `
        <div class="cert-project">
          <div class="cert-project-label">📦 Portfolio project</div>
          ${escape(cert.projectRec)}
        </div>` : ''}
      ${cert.skills && cert.skills.length ? `
        <div class="cert-skill-tags">
          ${cert.skills.map(s => `<span class="cert-skill-tag">${escape(s)}</span>`).join('')}
        </div>` : ''}
      ${cert.subjects && cert.subjects.length ? `
        <div style="margin-top:8px;padding:8px 10px;background:var(--surface-2);border-left:3px solid #55d6ff;border-radius:4px;font-size:12px;line-height:1.55">
          <strong style="color:#55d6ff;font-size:10px;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:5px">🏷️ Subjects & technical depth</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${cert.subjects.map(s => `<span style="display:inline-block;padding:2px 8px;background:rgba(85,214,255,0.12);color:#1a7a99;border-radius:10px;font-size:11px;font-weight:500">${escape(s)}</span>`).join('')}</div>
        </div>` : ''}
      ${deps.length ? `
        <div style="margin-top:8px;font-size:10px;color:var(--dim)">
          <strong>Requires:</strong> ${deps.map(d => `<span style="color:${state.passes[d.id] ? 'var(--green-text)' : 'var(--amber-text)'}">${state.passes[d.id] ? '✓' : '○'} ${escape(d.name)}</span>`).join(' · ')}
          ${!depsPassed ? `<br><span style="color:var(--amber);font-weight:600">⚠ Dependencies not yet complete</span>` : ''}
        </div>` : ''}
      ${cert.applicationGuide ? renderApplicationGuide(cert) : ''}
      ${cert.examFormat ? `<div class="cert-format" style="margin-top:8px;padding:8px 10px;background:var(--surface-2);border-left:3px solid var(--blue);border-radius:4px;font-size:12px;line-height:1.5"><strong style="color:var(--blue);font-size:10px;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:3px">📋 Exam format</strong>${escape(cert.examFormat)}</div>` : ''}
      ${cert.coverage ? `<div class="cert-coverage" style="margin-top:8px;padding:8px 10px;background:var(--surface-2);border-left:3px solid var(--amber);border-radius:4px;font-size:12px;line-height:1.55"><strong style="color:var(--amber);font-size:10px;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:3px">📚 Subject coverage & depth</strong>${escape(cert.coverage)}</div>` : ''}
      ${cert.prerequisites ? `<div class="cert-prereq" style="margin-top:8px;padding:8px 10px;background:var(--surface-2);border-left:3px solid var(--green);border-radius:4px;font-size:12px;line-height:1.55"><strong style="color:var(--green);font-size:10px;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:3px">🎯 Prerequisite skills</strong>${escape(cert.prerequisites)}</div>` : ''}
      ${cert.studyMaterials ? `<div class="cert-materials" style="margin-top:8px;padding:8px 10px;background:var(--surface-2);border-left:3px solid var(--purple);border-radius:4px;font-size:12px;line-height:1.55"><strong style="color:var(--purple);font-size:10px;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:3px">📖 Recommended study materials</strong>${escape(cert.studyMaterials)}</div>` : ''}
      ${cert.tutorFlag ? `<div class="cert-tutor" style="margin-top:8px;padding:8px 10px;background:var(--amber-bg);border-left:3px solid var(--amber);border-radius:4px;font-size:12px;line-height:1.55;color:var(--amber-text)"><strong style="color:var(--amber-text);font-size:10px;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:3px">👨‍🏫 Tutoring flag</strong>${escape(cert.tutorFlag)}</div>` : ''}
      <div class="cert-note" style="margin-top:8px">${escape(cert.note)}</div>
      <div class="cert-inputs">
        <div class="cert-input-block">
          <label class="cert-input-label">Exam booked</label>
          <input type="date" value="${escape(state.exams[cert.id] || '')}" onchange="updateExam('${cert.id}', this.value)">
          <div class="cert-status-row">${examBadgeHTML(cert.id)}</div>
        </div>
        <div class="cert-input-block">
          <label class="cert-input-label">Pass date</label>
          <input type="date" value="${escape(pd)}" onchange="updatePass('${cert.id}', this.value)">
          <div class="cert-status-row">${statusBadgeHTML(status, days)}</div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" onclick="toggleNotes('${cert.id}')" style="flex:1">
          ${state.openCerts[cert.id + '_notes'] ? '▲ Hide notes' : `▼ ${hasNotes ? 'Notes / link / badge' : 'Add notes / link / badge'}`}
        </button>
        <button class="btn btn-secondary btn-sm" onclick="toggleSkip('${cert.id}')" style="flex:0 0 auto" title="${state.skipped[cert.id] ? 'Restore this cert to the plan' : 'Drop this cert from the plan (Lifeboat / Realistic path)'}">
          ${state.skipped[cert.id] ? '↩ Un-skip' : '⊘ Skip'}
        </button>
      </div>
      ${state.openCerts[cert.id + '_notes'] ? renderNotesPanel(cert, certNotes) : ''}
    </div>`;

  return `<div class="cert-row roi-${cert.roi || 0} ${pd ? 'passed' : ''} ${cert.gateway ? 'gateway' : ''} ${isNext ? 'is-next' : ''} ${state.skipped[cert.id] ? 'is-skipped' : ''} ${cert.pending && !pd ? 'is-pending' : ''} ${cert.applicationBased && !pd ? 'is-portfolio' : ''}" data-cid="${cert.id}" data-cph="${certPhase(cert)}" data-m="${mt}"><span class="drag-handle" title="Hold and drag to reorder">⠿</span>${summary}${details}</div>`;
}

function renderNotesPanel(cert, certNotes) {
  return `
    <div class="cert-notes-panel">
      <div class="cert-notes-row">
        <label>Notes</label>
        <textarea class="cert-notes-input" placeholder="Study resources, booking ref, strategy notes..."
          oninput="updateNote('${cert.id}','text',this.value)">${escape(certNotes.text || '')}</textarea>
      </div>
      <div class="cert-notes-row">
        <label>Link (Credly, booking, study material)</label>
        <input type="url" class="cert-link-input" placeholder="https://..." value="${escape(certNotes.link || '')}"
          oninput="updateNote('${cert.id}','link',this.value)">
        ${certNotes.link && /^https?:\/\//i.test(certNotes.link) ? `<a href="${escape(certNotes.link)}" target="_blank" rel="noopener" class="cert-link-open">↗ Open link</a>` : ''}
      </div>
      <div class="cert-notes-row">
        <label>Badge image</label>
        ${certNotes.imageData ? `
          <div class="badge-preview">
            <img src="${escape(certNotes.imageData)}" style="width:48px;height:48px;border-radius:6px;object-fit:contain;background:var(--surface-2);border:1px solid var(--border)">
            <button class="badge-remove-btn" onclick="removeBadgeImage('${cert.id}')">✕ Remove</button>
          </div>` : `
          <label class="badge-upload-btn">
            📁 Upload badge image (PNG, JPG)
            <input type="file" accept="image/*" onchange="uploadBadgeImage('${cert.id}', this)">
          </label>`}
      </div>
    </div>`;
}


let certFiltersPreference;
function certFiltersExpanded() {
  if (certFiltersPreference === undefined) {
    let stored=null;try { stored=localStorage.getItem('ct-cert-filters-expanded'); } catch {}
    certFiltersPreference=stored==='true'?true:stored==='false'?false:!window.matchMedia('(max-width: 640px)').matches;
  }
  return certFiltersPreference;
}
function rememberCertFilters(element) {
  if (!element.isConnected) return;
  certFiltersPreference=element.open;
  try { localStorage.setItem('ct-cert-filters-expanded',String(element.open)); } catch {}
}
function toggleCertFilters(element) {
  element.open=!element.open;
  rememberCertFilters(element);
}
function toggleFilterGroup(name) {
  state.openFilterGroups = state.openFilterGroups || {};
  const wasOpen = state.openFilterGroups[name];
  state.openFilterGroups = {};              // accordion: only one group open
  state.openFilterGroups[name] = !wasOpen;
  localStorage.setItem('cert.openFilterGroups', JSON.stringify(state.openFilterGroups));
  rerenderCurrentTab();
}


function trackerPhaseSpec(ph) { return window.CertTrackerV3?.focusedRoute?.scoped()?window.CertTrackerV3.focusedRoute.definition.phases[ph]:PHASES[ph]; }

function toggleMyPath(certId) {
  state.myPath = state.myPath || {};
  if (state.myPath[certId]) delete state.myPath[certId];
  else state.myPath[certId] = true;
  save.myPath();
  rerenderCurrentTab();
}

function benchCert(id) {
  if (state.myPath) { delete state.myPath[id]; }
  if (state.phaseOverrides && state.phaseOverrides[id] !== undefined) { delete state.phaseOverrides[id]; try { localStorage.setItem('ct2-phase-ovr', JSON.stringify(state.phaseOverrides)); } catch {} }
  if (state.certOrder) { Object.keys(state.certOrder).forEach(ph => { state.certOrder[ph] = (state.certOrder[ph]||[]).filter(x => x !== id); }); try { localStorage.setItem('ct2-order', JSON.stringify(state.certOrder)); } catch {} }
  try { localStorage.setItem(SK.myPath, JSON.stringify(state.myPath)); } catch {}
  showToast && showToast('Benched — still in catalogue');
  rerenderCurrentTab();
}
function toggleArtifact(ph) {
  state.artifacts[ph] = !state.artifacts[ph];
  try { localStorage.setItem('ct2-artifacts', JSON.stringify(state.artifacts)); } catch {}
  rerenderCurrentTab();
}
function togglePartner(k) {
  state.partners[k] = !state.partners[k];
  try { localStorage.setItem('ct2-partners', JSON.stringify(state.partners)); } catch {}
  rerenderCurrentTab();
}

(function initCertDrag() {
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.drag-handle');
    if (!h) return;
    const row = h.closest('.cert-row');
    if (!row) return;
    e.preventDefault();
    const parent = row.parentElement;
    drag = { row, parent, ph: row.dataset.cph, startY: e.clientY };
    row.classList.add('dragging');
    row.setPointerCapture && h.setPointerCapture(e.pointerId);
  }, { passive: false });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    e.preventDefault();
    const vh = window.innerHeight;
    if (e.clientY > vh - 110) window.scrollBy({ top: Math.min(16, 5 + (e.clientY - (vh - 110)) * 0.12), behavior: 'instant' });
    else if (e.clientY < 140) window.scrollBy({ top: -Math.min(16, 5 + (140 - e.clientY) * 0.12), behavior: 'instant' });
    drag.row.style.pointerEvents = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    drag.row.style.pointerEvents = '';
    const blk = under && under.closest && under.closest('.phase-block');
    document.querySelectorAll('.phase-header.drop-target').forEach(x => x.classList.remove('drop-target'));
    drag.targetPhase = null;
    if (blk) {
      const phMatch = [...blk.classList].find(c => /^ph[1-6]$/.test(c));
      const tph = phMatch ? phMatch.slice(2) : null;
      if (tph && tph !== drag.ph) {
        drag.targetPhase = tph;
        const hd = blk.querySelector('.phase-header');
        hd && hd.classList.add('drop-target');
      }
    }
    const siblings = [...drag.parent.querySelectorAll('.cert-row[data-cph="' + drag.ph + '"]')].filter(r => r !== drag.row);
    let placed = false;
    for (const sib of siblings) {
      const r = sib.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { drag.parent.insertBefore(drag.row, sib); placed = true; break; }
    }
    if (!placed && siblings.length) {
      const last = siblings[siblings.length - 1];
      last.nextSibling ? drag.parent.insertBefore(drag.row, last.nextSibling) : drag.parent.appendChild(drag.row);
    }
  }, { passive: false });
  document.addEventListener('pointerup', () => {
    if (!drag) return;
    drag.row.classList.remove('dragging');
    document.querySelectorAll('.phase-header.drop-target').forEach(x => x.classList.remove('drop-target'));
    if (drag.targetPhase) {
      const id = drag.row.dataset.cid;
      const newPh = parseInt(drag.targetPhase, 10);
      state.phaseOverrides = state.phaseOverrides || {};
      state.phaseOverrides[id] = newPh;
      state.certOrder = state.certOrder || {};
      state.certOrder[drag.ph] = (state.certOrder[drag.ph] || []).filter(x => x !== id);
      state.certOrder[newPh] = [...(state.certOrder[newPh] || []).filter(x => x !== id), id];
      try {
        localStorage.setItem('ct2-phase-ovr', JSON.stringify(state.phaseOverrides));
        localStorage.setItem('ct2-order', JSON.stringify(state.certOrder));
      } catch {}
      showToast && showToast('Moved to Phase ' + newPh);
      drag = null;
      rerenderCurrentTab();
      return;
    }
    const order = [...drag.parent.querySelectorAll('.cert-row[data-cph="' + drag.ph + '"]')].map(r => r.dataset.cid);
    state.certOrder = state.certOrder || {};
    state.certOrder[drag.ph] = order;
    try { localStorage.setItem('ct2-order', JSON.stringify(state.certOrder)); } catch {}
    drag = null;
  });
})();

function togglePassedOnly() {
  state.passedOnly = !state.passedOnly;
  try { localStorage.setItem('cert.passedOnly', state.passedOnly ? '1' : '0'); } catch {}
  rerenderCurrentTab();
}

function setFilter(f) {
  state.filter = (state.filter === f) ? 'all' : f;
  save.filter();
  rerenderCurrentTab();
}
let _searchTimer = null;
function setSearchQuery(q) {
  state.searchQuery = q;
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    rerenderCurrentTab();
    requestAnimationFrame(() => {
      const input = document.querySelector('.cert-search-input');
      if (input && document.activeElement !== input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });
  }, 160);
}
function toggleCert(id) {
  state.openCerts[id] = !state.openCerts[id];
  rerenderCurrentTab();
}

function toggleComplete(id) {
  const cert = CERTS.find(c => c.id === id);
  const nm = cert ? cert.name : 'Certification';
  if (state.passes[id]) {
    delete state.passes[id];
    save.passes();
    announce(nm + ' marked not complete');
    rerenderCurrentTab();
    showToast('Marked not complete');
  } else {
    state.passes[id] = today();
    save.passes();
    announce(nm + ' completed \u2014 ' + medalTier(cert) + ' badge earned');
    rerenderCurrentTab();
    showToast('\u2713 ' + (cert ? cert.code : '') + ' completed', 'Undo', () => { delete state.passes[id]; save.passes(); rerenderCurrentTab(); });
  }
}
function dismissBackup() { state.dismissedBackup = true; renderApp(); }
const BADGE_COLORS = {
  'CompTIA':['#c8202f','#e0453f'], 'Microsoft':['#0067b8','#3aa0e3'], 'Cisco':['#0a5c7a','#1ba0d7'],
  'AWS':['#b96b00','#ff9900'], 'ISC2':['#5a1a8a','#8e44c9'], 'ISACA':['#0a3c54','#1d7099'],
  'GIAC':['#1f2d52','#3a5fa0'], 'ISA':['#004a8f','#0a76c2'], 'Palo Alto':['#c2401f','#fa582d'],
  'CrowdStrike':['#b3122e','#e01a3b'], 'Esri':['#005e95','#0aa0e0'], 'Axis':['#7a6000','#caa400'],
  'Milestone':['#0a3d7a','#1565c0'], 'LenelS2':['#1f3a5f','#365f9e'], 'Splunk':['#cc3300','#ff6b00'],
  'UKCSC':['#0b2a4a','#24507e'], 'ASIS':['#1a2c4a','#2a4a7a'], 'Python Institute':['#2a567f','#4b8bbe'],
  'Practical DevSecOps':['#1a5e4a','#27a07a'], 'Offensive Security':['#16361f','#2f7a45'],
  'Linux Foundation':['#1a1a40','#3a3a8a'], 'TryHackMe':['#7a1f2b','#c5283d'], 'HackTheBox':['#1f5c1f','#3fa33f'],
  'PECB':['#0a4a6e','#1d7aa8'], 'CREST':['#2a1a5e','#4a3a9e'], 'PortSwigger':['#a35a00','#e8821a'],
  'CSA':['#0a4a6e','#1d7aa8'], 'IAPP':['#1a3a5e','#2f6ea0'], 'HashiCorp':['#3a1a6e','#5a3ac2'],
  'Security Blue Team':['#0a2c5e','#1d50a0'], 'BCS':['#0a3a5e','#1d6ea0'], 'Open Group':['#3a1a5e','#6a3a9e'],
  'AXELOS':['#5e1a3a','#9e3a6a'], 'MITRE':['#1a3a5e','#2f6ea0'], 'Security Institute':['#1a2c4a','#2a4a7a'],
  'Wiz':['#1a2c4a','#3a5fc2'], 'Zero-Point Security':['#222','#4a4a4a'], 'TCM Security':['#1a3a2a','#2f7a4a']
};
function badgeVendor(cert) {
  const id = cert.id || '';
  if (/62443/.test(id)) return 'ISA';
  if (id === 'gaips') return 'GIAC';
  if (id.startsWith('arcgis') || id.startsWith('esri')) return 'Esri';
  return pathwayOf(cert);
}
function badgeColors(cert) { return BADGE_COLORS[badgeVendor(cert)] || ['#334155','#68838b']; }
function badgeText(cert) {
  let t = cert.code || '';
  if (!t) t = (cert.name || '').replace(/[^A-Za-z0-9 ]/g,'').split(/\s+/).map(w=>w[0]).join('').slice(0,4);
  t = t.replace('62443-','').replace('Expert','EXP');
  return t.toUpperCase();
}
const BADGE_LABELS = {
  'security-plus':'SEC+','network-plus':'NET+','a-plus':'A+','cysa-plus':'CSA+',
  'linux-plus':'LX+','secai-plus':'AI+','ccna':'CCNA','cmss':'CMSS',
  'gicsp':'GICSP','grid':'GRID','gaips':'GAIPS','caisp':'CAISP',
  'cissp':'CISSP','ccsp':'CCSP','crisc':'CRISC','issap':'ISSAP',
  'az-900':'AZ-900','az-104':'AZ-104','az-305':'AZ-305','ai-901':'AI-901',
  'sc-900':'SC-900','sc-200':'SC-200','sc-300':'SC-300','sc-500':'SC-500',
  'sc-401':'SC-401','sc-100':'SC-100',
  'iec-62443-cfs':'CFS','iec-62443-cds':'CDS','iec-62443-cra':'CRA',
  'iec-62443-cms':'CMS','iec-62443-expert':'EXP',
  'gcp-ace':'ACE','saa-c03':'SAA','clf-c02':'CLP',
  'pcep':'PCEP','pcap':'PCAP',
  'arcgis-foundation':'ARCF','arcgis-associate':'ARCA',
  'esri-dev-found':'EADF','arcgis-py-api':'EPYA','esri-online-admin':'EAOA',
  'arcules-csp':'ARCS',
  'mcit':'MCIT','mcie':'MCIE','mcde':'MCDE',
  'acp':'ACP','lca':'LCA','lcp':'LCP','lce':'LCE','lcda':'LCDA',
  'ukcsc-assoc':'ACSP','ukcsc-pract':'PCSP','ukcsc-princ':'PrCSP','ukcsc-chart':'ChCSP',
  'cismp':'CISMP','itil-4-foundation':'ITIL4','sabsa-found':'SABSA','bcs-esa':'ESA',
  'psp':'PSP','csyp':'CSyP','ccsk':'CCSK','iso-27001-li':'27001',
  'ccfa':'CCFA','ccfr':'CCFR','ccfh':'CCFH','cccs':'CCCS','ccis':'CCIS',
};
const CERT_ACCENTS = {
  'security-plus':'#e02030','network-plus':'#1a8ae0','a-plus':'#e86a10',
  'cysa-plus':'#00b4c0','linux-plus':'#4caf50','secai-plus':'#8c5af0',
  'cissp':'#b050e8','ccsp':'#8838c0','crisc':'#20a080','issap':'#c058f0',
  'gicsp':'#d4a830','grid':'#8080e0','gaips':'#30b0e0','caisp':'#30c890',
  'saa-c03':'#ff9900','clf-c02':'#e08800','gcp-ace':'#e8a000',
  'iec-62443-expert':'#b0d020',
};
function badgeLabel(cert) { return BADGE_LABELS[cert.id] || badgeText(cert); }
function badgeShapeType(vendor) {
  if (['CompTIA','Cisco','AWS','Python Institute','Esri','HashiCorp',
       'Practical DevSecOps','TryHackMe','HackTheBox','TCM Security',
       'Zero-Point Security','Security Blue Team','Linux Foundation',
       'Offensive Security'].includes(vendor)) return 'hex';
  if (['ISC2','GIAC','UKCSC','ASIS','CrowdStrike','CREST'].includes(vendor)) return 'shield';
  if (['ISA','PECB','ISACA','CSA','IAPP','MITRE','BCS',
       'Open Group','AXELOS','Security Institute'].includes(vendor)) return 'seal';
  return 'square';
}
function shade(hex, pct) {
  hex = (hex || '#888888').replace('#','');
  if (hex.length === 3) hex = hex.split('').map(function(x){return x+x;}).join('');
  var r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
  if (pct >= 0) { r += (255-r)*pct; g += (255-g)*pct; b += (255-b)*pct; }
  else { var f = 1+pct; r*=f; g*=f; b*=f; }
  return '#' + [r,g,b].map(function(v){ return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); }).join('');
}
const CAPSTONE_CERTS = new Set(['cissp','iec-62443-expert','ukcsc-chcsp','csyp','issap','sc-100']);
function medalScore(c){ return (c.difficulty||0) + 0.8*((certPhase(c)||1)-1) + 0.4*(c.roi||0) + (c.gateway&&!CAPSTONE_CERTS.has(c.id)?1:0); }
let _MEDAL_RANK = null;
function medalRankMap(){
  if(_MEDAL_RANK) return _MEDAL_RANK;
  const sorted=[...CERTS].sort((a,b)=>(b.roi||0)-(a.roi||0)||(b.difficulty||0)-(a.difficulty||0)||(b.phase||0)-(a.phase||0));
  const n=sorted.length; _MEDAL_RANK={};
  sorted.forEach((c,i)=>{const p=i/n; _MEDAL_RANK[c.id]= p<.05?'diamond':p<.15?'platinum':p<.35?'gold':p<.65?'silver':'bronze';});
  return _MEDAL_RANK;
}
function medalTier(c){ if(CAPSTONE_CERTS.has(c.id)) return 'diamond'; return medalRankMap()[c.id]||'bronze'; }
function certBadgeSVG(cert) {
  const vendor = badgeVendor(cert);
  const label = badgeLabel(cert);
  const cols = badgeColors(cert);
  const c1 = cols[0], c2 = cols[1];
  const accent = CERT_ACCENTS[cert.id] || c2;
  const TIER_SHAPE = { bronze:'seal', silver:'square', gold:'hex', platinum:'shield', diamond:'gem' };
  const shape = TIER_SHAPE[medalTier(cert)] || badgeShapeType(vendor);
  const gid = (cert.id || '').replace(/[^a-z0-9]/g,'');
  const mtier = medalTier(cert);
  const fs = label.length <= 3 ? 16 : label.length <= 4 ? 14 : label.length <= 5 ? 12 : label.length <= 6 ? 10.5 : 9;
  const METALS = {
    bronze:   ['#ffdfb3','#e8965a','#ffc98f','#a85a22','#5e2f10'],  /* lantern copper */
    silver:   ['#ffffff','#b8c0cc','#e8ecf2','#7d8694','#454c58'],  /* neutral steel */
    gold:     ['#fff6d4','#ffc94d','#ffe9a8','#d19a2e','#7a5410'],  /* lantern gold */
    platinum: ['#f3e9ff','#b57aff','#d9b8ff','#7a3fd6','#3d1a78'],  /* amethyst */
    diamond:  ['#eafcff','#4dd8ff','#aef1ff','#189ed6','#0a4a68']   /* vivid crystal cyan */
  };
  const metal = METALS[mtier] || METALS.silver;
  /* per-tier face cores — each rank is a different material world */
  const FACES = {
    bronze:   ['#96601f','#43250a'],  /* lantern copper */
    silver:   ['#8b94a6','#39404f'],  /* cold neutral steel */
    gold:     ['#e0ae3a','#7a520f'],  /* blazing amber */
    platinum: ['#9a5cf5','#3d1a78'],  /* deep amethyst */
    diamond:  ['#2fb3e6','#00cdb7']   /* cyan->magenta crystal */
  };
  const faceC = FACES[mtier] || FACES.silver;
  const c1n = faceC[1], c2n = faceC[0];
  const PHASE_NEON = {1:'#55d6ff',2:'#00cdb7',3:'#3ee6a0',4:'#ffc94d',5:'#ff684c',6:'#6cb8c9'};
  const accentN = PHASE_NEON[certPhase(cert)] || '#00eff5';
  const faceTop = shade(c2n, 0.12);

  let outer, inner, midband = '', beading = '';
  if (shape === 'hex') {
    outer = '<polygon points="30,2 54.5,16 54.5,44 30,58 5.5,44 5.5,16"';
    inner = '<polygon points="30,7.0 50.1,18.5 50.1,41.5 30,53.0 9.9,41.5 9.9,18.5"';
  } else if (shape === 'shield') {
    outer = '<path d="M30,3 L53,9.5 L53,33 Q53,51 30,58 Q7,51 7,33 L7,9.5 Z"';
    inner = '<path d="M30,8.4 L48,13.6 L48,33 Q48,46.4 30,52.2 Q12,46.4 12,33 L12,13.6 Z"';
    midband = '<path d="M30,5.6 L50.6,11.4 L50.6,33 Q50.6,49 30,55 Q9.4,49 9.4,33 L9.4,11.4 Z" fill="none" stroke="MB" stroke-width="0.9" opacity="0.85"/>';
  } else if (shape === 'seal') {
    outer = '<circle cx="30" cy="30" r="28"';
    inner = '<circle cx="30" cy="30" r="24.8"';  /* thin bronze band */
    let dots = '';
    for (let i = 0; i < 22; i++) { const ang = i / 22 * 2 * Math.PI; const x = (30 + 25.2 * Math.cos(ang)).toFixed(2), y = (30 + 25.2 * Math.sin(ang)).toFixed(2); dots += '<circle cx="' + x + '" cy="' + y + '" r="0.85" fill="#0a1020" opacity="0.28"/>'; }
    beading = dots;
  } else if (shape === 'gem') {
    outer = '<polygon points="30,2 47,10 58,30 47,50 30,58 13,50 2,30 13,10"';
    inner = '<polygon points="30,8.2 43.3,14.4 51.8,30 43.3,45.6 30,51.8 16.7,45.6 8.2,30 16.7,14.4"';
    midband = '<polygon points="30,5 45.8,12.4 55.9,30 45.8,47.6 30,55 14.2,47.6 4.1,30 14.2,12.4" fill="none" stroke="MB" stroke-width="0.9" opacity="0.85"/>';
  } else {
    outer = '<rect x="3.5" y="4.5" width="53" height="51" rx="9"';
    inner = '<rect x="7.6" y="8.6" width="44.8" height="42.8" rx="5.5"';
  }

  let sun = '';
  let sparkles = '';
  const spk = (x,y,sz) => '<path d="M'+x+','+(y-sz)+' L'+(x+sz*0.3)+','+(y-sz*0.3)+' L'+(x+sz)+','+y+' L'+(x+sz*0.3)+','+(y+sz*0.3)+' L'+x+','+(y+sz)+' L'+(x-sz*0.3)+','+(y+sz*0.3)+' L'+(x-sz)+','+y+' L'+(x-sz*0.3)+','+(y-sz*0.3)+' Z" fill="#fff" opacity="0.9"/>';
  if (mtier === 'bronze') {
    /* brushed lantern metal: quiet horizontal etch lines */
    [21,27,33,39].forEach(y => { sun += '<line x1="9" y1="'+y+'" x2="51" y2="'+y+'" stroke="#ffdfb3" stroke-width="1.1" opacity="0.25"/>'; });
  } else if (mtier === 'silver') {
    /* crescent moon watermark */
    sun += '<circle cx="37" cy="20" r="9" fill="#ffffff" opacity="0.42"/>' +
           '<circle cx="40.5" cy="17.5" r="8.2" fill="'+faceC[0]+'"/>';
  } else if (mtier === 'gold') {
    /* full sunburst rays — the lantern blazing */
    for (let i2 = 0; i2 < 24; i2 += 2) {
      const a0 = i2/24*2*Math.PI, a1 = (i2+1)/24*2*Math.PI;
      sun += '<path d="M30,30 L'+(30+34*Math.cos(a0)).toFixed(1)+','+(30+34*Math.sin(a0)).toFixed(1)+
             ' L'+(30+34*Math.cos(a1)).toFixed(1)+','+(30+34*Math.sin(a1)).toFixed(1)+' Z" fill="#fff3c4" opacity="0.26"/>';
    }
  } else if (mtier === 'platinum') {
    /* full moon + halo rings */
    sun += '<circle cx="30" cy="25" r="12" fill="#ffffff" opacity="0.30"/>' +
           '<circle cx="30" cy="25" r="16.5" fill="none" stroke="#ffffff" stroke-width="0.9" opacity="0.20"/>' +
           '<circle cx="30" cy="25" r="21" fill="none" stroke="#ffffff" stroke-width="0.7" opacity="0.12"/>';
    sparkles = spk(45.5,13,1.7);
  } else if (mtier === 'diamond') {
    /* faceted crystal shards, cyan/pink iridescence */
    sun += '<polygon points="30,3 45,30 30,57 15,30" fill="#aef1ff" opacity="0.30"/>' +
           '<polygon points="7,17 30,30 11,45" fill="#ffa3e8" opacity="0.26"/>' +
           '<polygon points="53,15 30,30 49,47" fill="#e2f9ff" opacity="0.30"/>' +
           '<line x1="30" y1="3" x2="30" y2="57" stroke="#fff" stroke-width="0.7" opacity="0.35"/>';
    sparkles = spk(46.5,11.5,2.5) + spk(12.5,15,1.5) + spk(50,40,1.3);
  }

  const defs = '<defs>' +
    '<linearGradient id="mtl' + gid + '" x1="0.05" y1="0.05" x2="0.92" y2="0.95">' +
      '<stop offset="0" stop-color="' + metal[0] + '"/><stop offset="0.3" stop-color="' + metal[1] + '"/>' +
      '<stop offset="0.5" stop-color="' + metal[2] + '"/><stop offset="0.64" stop-color="' + metal[3] + '"/>' +
      '<stop offset="1" stop-color="' + metal[4] + '"/></linearGradient>' +
    '<linearGradient id="fc' + gid + '" x1="0.3" y1="0.02" x2="0.7" y2="1">' +
      '<stop offset="0" stop-color="' + faceTop + '"/><stop offset="1" stop-color="' + c1n + '"/></linearGradient>' +
    '<linearGradient id="gl' + gid + '" gradientUnits="userSpaceOnUse" x1="30" y1="4" x2="30" y2="44">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0.4"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.06"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="ds' + gid + '" gradientUnits="userSpaceOnUse" x1="30" y1="58" x2="30" y2="33">' +
      '<stop offset="0" stop-color="#00060e" stop-opacity="0.42"/><stop offset="1" stop-color="#00060e" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="hs' + gid + '" cx="0.32" cy="0.22" r="0.5">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0.48"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="cl' + gid + '">' + inner + ' /></clipPath>' +
    '</defs>';

  let ornament = '';
  if (mtier === 'silver') {
    /* corner rivets on the plaque */
    [[9.5,10.5],[50.5,10.5],[9.5,49.5],[50.5,49.5]].forEach(p => {
      ornament += '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1.9" fill="'+metal[1]+'" stroke="#fff" stroke-width="0.5" stroke-opacity="0.6"/>';
    });
  } else if (mtier === 'gold') {
    /* star crest overlapping the top vertex */
    ornament += '<path d="M30,1 L32.2,6 L37.5,6.6 L33.5,10.2 L34.7,15.4 L30,12.6 L25.3,15.4 L26.5,10.2 L22.5,6.6 L27.8,6 Z" fill="#ffe08a" stroke="#7a5410" stroke-width="0.7"/>';
  } else if (mtier === 'platinum') {
    /* three-point crown across the shield top */
    ornament += '<path d="M17,8 L20,1.5 L23.5,7 L30,0.5 L36.5,7 L40,1.5 L43,8 Z" fill="'+metal[2]+'" stroke="'+metal[3]+'" stroke-width="0.7"/>';
  } else if (mtier === 'diamond') {
    /* starburst spikes at the diagonals + iridescent edge */
    [[45,45],[135,45],[225,45],[315,45]].forEach(a => {
      const r1=21, r2=29.5, ang=a[0]*Math.PI/180, w=3.2*Math.PI/180;
      const x1=(30+r1*Math.cos(ang-w)).toFixed(1), y1=(30+r1*Math.sin(ang-w)).toFixed(1);
      const xt=(30+r2*Math.cos(ang)).toFixed(1),  yt=(30+r2*Math.sin(ang)).toFixed(1);
      const x2=(30+r1*Math.cos(ang+w)).toFixed(1), y2=(30+r1*Math.sin(ang+w)).toFixed(1);
      ornament += '<polygon points="'+x1+','+y1+' '+xt+','+yt+' '+x2+','+y2+'" fill="#c9f2ff" stroke="#8ee7ff" stroke-width="0.4" opacity="0.95"/>';
    });
  }

  const txt = '<text x="30" y="31.6" font-family="\'Arial Black\',\'Arial\',sans-serif" font-size="' + fs +
    '" font-weight="900" fill="#fff" stroke="#0a1224" stroke-width="0.5" stroke-opacity="0.32" paint-order="stroke"' +
    ' text-anchor="middle" dominant-baseline="central" letter-spacing="0.2">' + escape(label) + '</text>';

  midband = midband.replace('MB', metal[4]);
  return '<svg viewBox="0 0 60 60" class="cbm-svg" xmlns="http://www.w3.org/2000/svg">' + defs +
    outer + ' fill="url(#mtl' + gid + ')"/>' +
    midband +
    beading +
    outer + ' fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="0.6"/>' +
    sparkles +
    inner + ' fill="url(#fc' + gid + ')"/>' +
    '<g clip-path="url(#cl' + gid + ')">' +
      sun +
      '<rect x="0" y="0" width="60" height="60" fill="url(#gl' + gid + ')"/>' +
      '<ellipse cx="22" cy="15" rx="20" ry="13" fill="url(#hs' + gid + ')"/>' +
      '<rect x="0" y="0" width="60" height="60" fill="url(#ds' + gid + ')"/>' +
      inner + ' fill="none" stroke="#05060a" stroke-opacity="0.34" stroke-width="2.4"/>' +
    '</g>' +
    inner + ' fill="none" stroke="' + metal[3] + '" stroke-width="1.6" stroke-opacity="0.95"/>' +
    ornament +
    txt +
  '</svg>';
}
function certMedallionHTML(cert) {
  const _mt = medalTier(cert); const _ml = _mt.charAt(0).toUpperCase()+_mt.slice(1);
  return `<span class="cert-badge-medallion cbm-tier-${_mt}" title="${escape(cert.name)} \u2014 completed (${_ml})">${certBadgeSVG(cert)}<span class="cbm-check">\u2713</span></span>`;
}
function toggleNotes(id) {
  state.openCerts[id + '_notes'] = !state.openCerts[id + '_notes'];
  rerenderCurrentTab();
}
function togglePhase(ph) {
  state.openPhase = state.openPhase === ph ? null : ph;
  save.openPh();
  rerenderCurrentTab();
}
function rerenderCurrentTab() {
  setTimeout(() => {
    const countEl = document.getElementById('mypath-count');
    if (countEl) countEl.textContent = Object.keys(state.myPath || {}).length;
  }, 50);
  renderTabContent();
  updateHeaderCount(); // keep the scoped header in sync with the active filter
}

function updateExam(id, date) {
  const cert=CERTS.find(c=>c.id===id),CT=window.CertTrackerV3;
  if(date&&(!CT.util.validIsoDate(date)||!CT.credentials.eligibility(cert).eligible)){showToast('Exam unavailable or date invalid — check the issuer requirements.');return;}
  if (date) state.exams[id] = date; else delete state.exams[id];
  save.exams();
  rerenderCurrentTab();
  updateHeaderCount();
}
function updatePass(id, date) {
  const CT=window.CertTrackerV3;
  if(date&&(!CT.util.validIsoDate(date)||date>CT.dates.localDateStamp())){showToast('Use a valid past or present exam pass date.');return;}
  CT.storage.captureUndoPoint('exam pass');
  if (date) state.passes[id] = date; else delete state.passes[id];
  if (date && state.skipped[id]) { delete state.skipped[id]; }
  const renewed = [];
  if (date && RENEWAL_CHAINS[id]) {
    RENEWAL_CHAINS[id].forEach(rid => {
      if (state.passes[rid]) {
        state.customization.credentials=state.customization.credentials||{};
        state.customization.credentials[rid]={...state.customization.credentials[rid],renewedAt:date};
        renewed.push(CERTS.find(c => c.id === rid)?.name);
      }
    });
  }
  CT.storage.persistAll();
  CT.events.emit('state-saved',{key:'passes',at:new Date().toISOString()});
  if (renewed.length > 0) showToast(`Auto-renewed: ${renewed.filter(Boolean).join(', ')}`);
  rerenderCurrentTab();
  updateHeaderCount();
}
function toggleSkip(id) {
  if (state.skipped[id]) {
    delete state.skipped[id];
    save.skipped();
    showToast('Cert un-skipped');
  } else {
    if (state.passes[id]) {
      showToast('Cert is already passed — cannot skip');
      return;
    }
    state.skipped[id] = today();
    save.skipped();
    showToast('Cert marked skipped — will not appear in next-up');
  }
  rerenderCurrentTab();
}
function updateNote(certId, field, value) {
  if (!state.notes[certId]) state.notes[certId] = { text: '', link: '', imageData: '' };
  state.notes[certId][field] = value;
  save.notes();
}
function uploadBadgeImage(certId, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 500000) showToast('Large image — consider smaller file');
  const reader = new FileReader();
  reader.onload = e => {
    if (!state.notes[certId]) state.notes[certId] = { text: '', link: '', imageData: '' };
    state.notes[certId].imageData = e.target.result;
    save.notes();
    rerenderCurrentTab();
    showToast('Badge saved');
  };
  reader.readAsDataURL(file);
}
function removeBadgeImage(certId) {
  if (!state.notes[certId]) return;
  state.notes[certId].imageData = '';
  save.notes();
  rerenderCurrentTab();
}

function showToast(msg, actionLabel, actionFn) {
  document.querySelectorAll('.toast').forEach(e => e.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  const s = document.createElement('span'); s.textContent = msg; t.appendChild(s);
  if (actionLabel && actionFn) {
    const b = document.createElement('button');
    b.className = 'toast-action'; b.textContent = actionLabel;
    b.onclick = () => { actionFn(); t.remove(); };
    t.appendChild(b);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), actionLabel ? 5000 : 3000);
}
function announce(msg) {
  let r = document.getElementById('a11y-live');
  if (!r) { r = document.createElement('div'); r.id = 'a11y-live'; r.setAttribute('aria-live','polite'); r.setAttribute('role','status'); r.className = 'sr-only'; document.body.appendChild(r); }
  r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 60);
}

function exportICS() {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CertTracker//Generic//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  let count = 0;
  CERTS.forEach(cert => {
    const ed = state.exams[cert.id];
    if (!ed) return;
    const d = new Date(ed).toISOString().replace(/[-:]/g, '').split('.')[0].slice(0, 8);
    lines.push('BEGIN:VEVENT', `UID:cert-${cert.id}-exam@certtracker`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${d}`,
      `SUMMARY:📝 EXAM: ${cert.name}`, `DESCRIPTION:${cert.name} exam day.`,
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', `DESCRIPTION:⚠ ${cert.name} exam in 7 days`, 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:⚠ ${cert.name} exam tomorrow`, 'END:VALARM',
      'END:VEVENT');
    count++;
  });
  CERTS.forEach(cert => {
    const pd = state.passes[cert.id];
    if (!pd || !cert.validity) return;
    const expiry = addMonths(pd, cert.validity);
    const d = expiry.toISOString().replace(/[-:]/g, '').split('.')[0].slice(0, 8);
    lines.push('BEGIN:VEVENT', `UID:cert-${cert.id}-expiry@certtracker`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${d}`,
      `SUMMARY:🔴 EXPIRES: ${cert.name}`, `DESCRIPTION:${cert.name} expires today.`,
      'BEGIN:VALARM', 'TRIGGER:-P90D', 'ACTION:DISPLAY', `DESCRIPTION:⚠ ${cert.name} expires in 90 days`, 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P30D', 'ACTION:DISPLAY', `DESCRIPTION:⚠ ${cert.name} expires in 30 days`, 'END:VALARM',
      'END:VEVENT');
    count++;
  });
  lines.push('END:VCALENDAR');
  if (count === 0) { showToast('No dates to export'); return; }
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cert-tracker-calendar.ics';
  a.click();
  showToast(`Exported ${count} events`);
}

function phaseETA(ph) {
  const pace = (state.pace2 && Date.now() >= new Date('2026-09-01')) ? state.pace2 : (state.studyTarget || 13);
  let hrs = 0;
  CERTS.filter(c => state.myPath[c.id] && certPhase(c) <= ph && !state.passes[c.id] && !state.skipped[c.id])
       .forEach(c => hrs += (c.hours ? (c.hours[0]+c.hours[1])/2 : 0));
  if (hrs <= 0 || pace <= 0) return null;
  const eta = new Date(Date.now() + (hrs/pace)*7*86400000);
  return eta.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function exportJSON() {
  const data = {
    version: 2,
    exported: new Date().toISOString(),
    passes: state.passes,
    exams: state.exams,
    notes: state.notes,
    studyLog: state.studyLog,
    skipped: state.skipped,
    myPath: state.myPath,
    filter: state.filter,
    currentSalary: state.currentSalary,
    pace2: state.pace2,
    expLog: state.expLog,
    artifacts: state.artifacts,
    partners: state.partners,
    certOrder: state.certOrder,
    phaseOverrides: state.phaseOverrides,
    eventsDismissed: state.eventsDismissed,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cert-tracker-backup-${today()}.json`;
  a.click();
  state.lastBackup = new Date().toISOString(); save.backup();
  showToast('Backup downloaded');
  renderApp();
}

function exportCV() {
  const passed = CERTS.filter(c => state.passes[c.id]);
  if (passed.length === 0) {
    showToast('No passed certs yet — pass some first');
    return;
  }

  const groupOf = c => {
    const id = c.id, code = (c.code || '').toUpperCase();
    if (id === 'cissp' || id === 'cism' || id.includes('ukcsc') || id === 'aigp' || id === 'aaism' || id === 'caisp') return 'Security · Governance & Management';
    if (id.includes('security-plus') || id.includes('cysa') || id.includes('secai') || id.includes('sc-') || id === 'ccsp' || code.startsWith('SC-')) return 'Security · Cloud, Identity & Operations';
    if (id.includes('htb') || id.includes('thm') || id === 'oscp') return 'Security · Defensive & Offensive Practical';
    if (id.includes('cka') || id.includes('cks')) return 'Cloud · Containers';
    if (code.startsWith('AZ-') || id === 'ai-901' || code === 'TA-004' || id === 'saa-c03') return 'Cloud · Azure & Multi-cloud';
    if (id === 'ms-721' || id === 'md-102' || id === 'ab-900' || id === 'sc-900' || id === 'az-900') return 'Cloud · Microsoft Fundamentals & M365';
    if (id === 'network-plus' || id === 'ccna' || id === 'cmss' || id === 'a-plus' || id === 'linux-plus') return 'Foundations · IT & Networking';
    if (id === 'acp' || id.startsWith('mc') || id.startsWith('lc') || id.includes('paxton') || id.includes('honeywell') || id.includes('netbox')) return 'Physical Security · VMS, Access Control & Cameras';
    if (id === 'pcep' || id === 'pcap') return 'Programming · Python';
    return 'Other';
  };

  const groupOrder = [
    'Security · Governance & Management',
    'Security · Cloud, Identity & Operations',
    'Security · Defensive & Offensive Practical',
    'Cloud · Azure & Multi-cloud',
    'Cloud · Containers',
    'Cloud · Microsoft Fundamentals & M365',
    'Physical Security · VMS, Access Control & Cameras',
    'Foundations · IT & Networking',
    'Programming · Python',
    'Other',
  ];

  const grouped = {};
  passed.forEach(c => {
    const g = groupOf(c);
    (grouped[g] = grouped[g] || []).push(c);
  });

  Object.keys(grouped).forEach(g => {
    grouped[g].sort((a, b) => (b.gateway ? 1 : 0) - (a.gateway ? 1 : 0) || (b.roi || 0) - (a.roi || 0));
  });

  let md = `# Certifications\n\n_Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} from cert tracker · ${passed.length} certs held_\n\n`;

  groupOrder.forEach(g => {
    if (!grouped[g] || !grouped[g].length) return;
    md += `## ${g}\n\n`;
    grouped[g].forEach(c => {
      const passDate = state.passes[c.id];
      const dateStr = passDate ? new Date(passDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '';
      const codePart = c.code ? ` (${c.code})` : '';
      md += `- **${c.name}**${codePart}${dateStr ? ` — ${dateStr}` : ''}\n`;
    });
    md += '\n';
  });

  md = md.replace(/\n+$/, '\n');

  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `certifications-${today()}.md`;
  a.click();
  showToast(`Exported ${passed.length} certs to markdown`);
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !data.passes) throw new Error();
        state.passes     = data.passes || {};
        state.exams      = data.exams || {};
        state.notes      = data.notes || {};
        state.studyLog   = data.studyLog || [];
        state.skipped    = data.skipped || state.skipped || {};
        if (data.myPath) state.myPath = data.myPath;
        if (data.filter) state.filter = data.filter;
        if (typeof data.currentSalary === 'number') state.currentSalary = data.currentSalary;
        if (typeof data.pace2 === 'number') state.pace2 = data.pace2;
        if (Array.isArray(data.expLog)) state.expLog = data.expLog;
        if (data.artifacts) { state.artifacts = data.artifacts; try { localStorage.setItem('ct2-artifacts', JSON.stringify(state.artifacts)); } catch {} }
        if (data.partners) { state.partners = data.partners; try { localStorage.setItem('ct2-partners', JSON.stringify(state.partners)); } catch {} }
        if (data.certOrder) { state.certOrder = data.certOrder; try { localStorage.setItem('ct2-order', JSON.stringify(state.certOrder)); } catch {} }
        if (data.phaseOverrides) { state.phaseOverrides = data.phaseOverrides; try { localStorage.setItem('ct2-phase-ovr', JSON.stringify(state.phaseOverrides)); } catch {} }
        if (Array.isArray(data.eventsDismissed)) state.eventsDismissed = data.eventsDismissed;
        save.passes(); save.exams(); save.cpe(); save.notes(); save.gates(); save.study();
        try {
          localStorage.setItem(SK.skipped, JSON.stringify(state.skipped));
          if (data.myPath) localStorage.setItem(SK.myPath, JSON.stringify(state.myPath));
          if (data.filter) localStorage.setItem(SK.filter, state.filter);
          localStorage.setItem(SK.salary, String(state.currentSalary));
          localStorage.setItem(SK.pace2, String(state.pace2));
          localStorage.setItem(SK.explog, JSON.stringify(state.expLog));
          localStorage.setItem(SK.eventsDis, JSON.stringify(state.eventsDismissed));
        } catch {}
        renderApp();
        showToast('Backup restored');
      } catch {
        showToast('Error: invalid backup');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

loadState();
