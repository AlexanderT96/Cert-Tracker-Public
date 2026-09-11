Warning: truncated output (original token count: 73257)
Total output lines: 3157

// ═══════════════════════════════════════════════════════════════════════════
// CERT TRACKER — UI RENDERER
// ═══════════════════════════════════════════════════════════════════════════

// State and persistence are defined in src/state-core.js.

// ───── HELPERS ────────────────────────────────────────────────────────────
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

// ───── PRIORITY SCORING ───────────────────────────────────────────────────
// P1 = must-do gateway · P2 = core spine · P3 = triggered conditional / employer-funded
// P4 = situational conditional · P5 = optional / drop-first
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

// Generate 2-3 specific actions for the next-up cert.
// Heuristics combine cert id, exam booking status, deps state, and study log activity.
function weeklyActions(cert) {
  if (!cert) return [];
  const actions = [];
  const id = cert.id;
  const code = cert.code || '';
  const examBooked = !!state.exams[id];
  const examDate = examBooked ? new Date(state.exams[id]) : null;
  const daysToExam = examDate ? Math.floor((examDate - new Date()) / 86400000) : null;
  const depsMet = !cert.deps || cert.deps.every(d => state.passes[d]);

  // Deps not met → first action is unblocking
  if (!depsMet) {
    const blocker = cert.deps.find(d => !state.passes[d]);
    const blockerCert = CERTS.find(c => c.id === blocker);
    if (blockerCert) {
      actions.push(`⚠ Pass ${blockerCert.code || blockerCert.name} first — it's the dependency unlocking ${code || cert.name}.`);
    }
  }

  // Exam already booked, urgent
  if (examBooked && daysToExam !== null && daysToExam >= 0 && daysToExam <= 14) {
    actions.push(`📝 Exam in ${daysToExam} day${daysToExam === 1 ? '' : 's'} — switch from study mode to practice exams. 80%+ on Boson/Dion practice before exam day.`);
  } else if (!examBooked && depsMet) {
    actions.push(`📅 Book the exam window. Picking a date forces commitment and reveals pace gaps early.`);
  }

  // Cert-specific study suggestions
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

  // Generic fallback if nothing cert-specific
  if (actions.length === 0) {
    actions.push(`📚 Begin study with the official ${code || cert.name} learning path.`);
    actions.push('🛠 Identify one hands-on lab task that mirrors a real exam objective.');
  }

  // Cap at 3 to avoid overwhelm
  return actions.slice(0, 3);
}
function currentPhase() {
  for (let p = 1; p <= 6; p++) {
    if (CERTS.filter(c => certPhase(c) === p && c.track === 'CORE').some(c => !state.passes[c.id])) return p;
  }
  return 6;
}
function nextCoreCert(filterTest) {
  // Prefer the highest-priority unpassed cert in the current phase whose deps are met.
  // Falls back to any unpassed P1/P2, then any unpassed CORE.
  // When filterTest is provided, search ONLY within filtered certs (filter-aware mode).
  const ph = currentPhase();
  const depsMet = cert => !cert.deps || cert.deps.every(d => state.passes[d]);

  // If a filter is active, search across all phases within that filter.
  // Otherwise, restrict to current phase (original behaviour).
  const pool = filterTest
    ? CERTS.filter(c => filterTest(c) && !state.passes[c.id] && !state.skipped[c.id])
    : CERTS.filter(c => certPhase(c) === ph && !state.passes[c.id] && !state.skipped[c.id]);

  const candidates = pool
    .map(c => ({ cert: c, ps: priorityScore(c), depsOK: depsMet(c), inCurrentPhase: certPhase(c) === ph }))
    .sort((a, b) => {
      // Filter-aware mode prefers current-phase certs first; otherwise stays unchanged
      if (filterTest && a.inCurrentPhase !== b.inCurrentPhase) return a.inCurrentPhase ? -1 : 1;
      // Prefer deps-met, then highest priority, then lowest difficulty
      if (a.depsOK !== b.depsOK) return a.depsOK ? -1 : 1;
      if (a.ps !== b.ps) return b.ps - a.ps;
      return (a.cert.difficulty || 0) - (b.cert.difficulty || 0);
    });
  return candidates[0]?.cert || null;
}

// ───── NOTIFICATIONS ──────────────────────────────────────────────────────
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

// ───── DEADLINE BANNERS ───────────────────────────────────────────────────
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
  // Data-freshness nudge: cert market data ages — re-verify ~every 6 months
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

// ───── RENDER ─────────────────────────────────────────────────────────────
// Shared scope resolver — maps the active filter chip to a cert set, used by BOTH the header and the dashboard
// so they always agree. 'all' → whole database; 🌟 My Path → the plan; a pathway chip → that pathway.
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

// End goal per filter chip — each chip's ROI optimises toward its own destination role + band
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
// Parse a band like "£55–75k" or "£90–130k+" to its midpoint in £
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
// Effective passes: real passes, plus hypothetical ones while the what-if simulator is on
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
  // Workspace changes start at the top. Restoring a longer tab's offset can
  // strand a shorter mobile page inside a large blank scroll range.
  const y = window.CertTrackerTabNavigation ? 0 : window.scrollY;
  if (state.currentTab === 'dashboard')      el.innerHTML = renderDashboard();
  if (state.currentTab === 'strategy')       el.innerHTML = renderStrategy();
  if (state.currentTab === 'certifications') el.innerHTML = renderCertifications();
  requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'instant' }));
}

function switchTab(tab) { state.currentTab = tab; renderApp(); }

// Only re-render the header count (not whole DOM)
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

// ───── DASHBOARD ──────────────────────────────────────────────────────────
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


  // Collapsible filter groups — child chips appear inline when group is opened
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

  // ── Active scope ── shared with the header via getScope(), so the two always agree.
  const { test: scopeTest, label: scopeLabel, certs: scopeCerts, scoped } = getScope();

  const nxt = nextCoreCert(scopeTest);
  const total = scopeCerts.length;
  const passed = scopeCerts.filter(c => state.passes[c.id]).length;
  const overallPct = total ? Math.round(passed / total * 100) : 0;

  const gatewayCerts = scopeCerts.filter(c => c.gateway);
  const gatewayPassed = gatewayCerts.filter(c => state.passes[c.id]).length;

  // Investment tracker (scoped, self-funded)
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

  // Medal shelf
  const _TIERS = ['diamond','platinum','gold','silver','bronze'];
  const _TM = { diamond:['💎','Diamond','#8ee7ff'], platinum:['🏆','Platinum','#e2d9f7'], gold:['🥇','Gold','#ffc94d'], silver:['🥈','Silver','#c9bff0'], bronze:['🥉','Bronze','#e8965a'] };
  const _tc = {}; _TIERS.forEach(t => _tc[t] = { e: 0, n: 0 });
  scopeCerts.forEach(c => { const t = medalTier(c); if (_tc[t]) { _tc[t].n++; if (state.passes[c.id]) _tc[t].e++; } });
  const trophyRows = _TIERS.map(t => { const m = _TM[t], x = _tc[t]; const pct = x.n ? Math.round(x.e / x.n * 100) : 0;
    return `<div class="trophy-row"><span class="trophy-ico">${m[0]}</span><span class="trophy-name" style="color:${m[1] === 'Silver' || m[1] === 'Platinum' ? '#c0d7dc' : m[2]}">${m[1]}</span><span class="trophy-bar"><span class="trophy-bar-fill" style="width:${pct}%;background:${m[2]}"></span></span><span class="trophy-count">${x.e}<span style="opacity:.5">/${x.n}</span></span></div>`;
  }).join('');
  // ── Funding Exposure (dim 2): self-funded £ across unpassed path certs ──
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

  // ── Partner Status (dim 7): partner-gated certs stall without these ──
  const PARTNER_VENDORS = ['Milestone','Axis','LenelS2','Genetec','Claroty','Nozomi Networks'];
  const partnerCard = `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--ph1)"></span>Partner Status <span style="font-weight:500;color:var(--dim);text-transform:none;letter-spacing:0">· gate check</span></div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Partner-gated certs stall without these. Verify each with the relevant organisation — front-load asks while goodwill is high.</div>
        ${PARTNER_VENDORS.map(v => `<label style="display:flex;gap:8px;align-items:center;font-size:12px;padding:4px 0;cursor:pointer"><input type="checkbox" ${state.partners[v] ? 'checked' : ''} onchange="togglePartner('${v}')" style="accent-color:var(--green)"><span style="${state.partners[v] ? 'color:var(--green-text)' : ''}">${v}${state.partners[v] ? ' ✓ verified' : ''}</span></label>`).join('')}
      </div>`;

  // ── Tail Review (dim 3): the C/D-tier long tail, one-tap benchable ──
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
        // Pace outlook — deadline-free: remaining hours ÷ pace = ETA
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

  // Expiry panel
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

  // Phase progress
  const phaseHTML = [1, 2, 3, 4, 5, 6].map(p => {
    // Apply active filter to phase counts so totals reflect filtered view
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

  // Track progress
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

  // Priority breakdown — how many P1-P5 passed vs total
  const prioLevels = [5, 4, 3, 2, 1];
  const prioRows = prioLevels.map(lvl => {
    const certsAtLvl = CERTS.filter(c => priorityScore(c) === lvl);
    if (certsAtLvl.length === 0) return '';
    const passedAtLvl = certsAtLvl.filter(c => state.passes[c.id]).length;
    const pct = certsAtLvl.length > 0 ? Math.round(passedAtLvl / certsAtLvl.length * 100) : 0;
    const barColor = lvl === 5 ? 'var(--red)' : lvl === 4 ? 'var(--amber)' : lvl === 3 ? 'var(--blue)' : 'var(--slate)';
    return `…43257 tokens truncated…mail outreach script</div>
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
  // Vendor wall (physical security)
  if (['lca','lcp','lce','lcda'].includes(id)) return 'LenelS2';
  if (['mcit','mcie','mcde'].includes(id)) return 'Milestone';
  if (id === 'acp') return 'Axis';
  if (id === 'cmss' || id === 'ccna') return 'Cisco';
  // CompTIA
  if (['a-plus','network-plus','security-plus','secai-plus','cysa-plus','linux-plus','server-plus','pentest-plus','securityx','autoops-plus'].includes(id)) return 'CompTIA';
  // Microsoft (role + fundamentals)
  if (/^(AZ|SC|MS|MD|AI)-/i.test(code)) return 'Microsoft';
  // AWS
  if (id.startsWith('aws-')) return 'AWS';
  // ISC2
  if (['cissp','ccsp','csslp','issap'].includes(id)) return 'ISC2';
  // ISACA
  if (['cism','crisc','aaism','cisa','cdpse'].includes(id)) return 'ISACA';
  if (id === 'caisp') return 'Practical DevSecOps';
  if (id === 'mad') return 'MITRE';
  // GIAC/SANS
  if (['gicsp','gcda','gcih','grid','grem','gcfa'].includes(id)) return 'GIAC';
  // TryHackMe / HackTheBox
  if (id.startsWith('thm-')) return 'TryHackMe';
  if (id.startsWith('htb-')) return 'HackTheBox';
  // BCS / Open Group / AXELOS
  if (id === 'bcs-esa') return 'BCS';
  if (id === 'togaf-10') return 'Open Group';
  if (['prince2-prac','itil-4-foundation','itil-4-mp'].includes(id)) return 'AXELOS';
  // Security Blue Team
  if (['btl1','btl2'].includes(id)) return 'Security Blue Team';
  // IAPP
  if (['cipp-e','aigp'].includes(id)) return 'IAPP';
  // CSA
  if (id === 'ccsk') return 'CSA';
  // ASIS
  if (id === 'asis-psp') return 'ASIS';
  // Security Institute
  if (id === 'csyp') return 'Security Institute';
  // UKCSC
  if (['ukcsc-assoc','ukcsc-princ','ukcsc-chart'].includes(id)) return 'UKCSC';
  // ISA
  if (['iec-62443-cfs','iec-62443-cra'].includes(id)) return 'ISA';
  // CREST
  if (['crest-crt','crest-cct'].includes(id)) return 'CREST';
  if (id === 'bscp') return 'PortSwigger';
  // PECB
  if (id === 'iso-27001-li') return 'PECB';
  // Splunk
  if (id.startsWith('splunk-')) return 'Splunk';
  // Vendor cyber/cloud SE
  if (['crowdstrike-ccf','crowdstrike-ccfh'].includes(id)) return 'CrowdStrike';
  if (id.startsWith('pan-')) return 'Palo Alto';
  if (id === 'wiz-cse') return 'Wiz';
  // Python Institute
  if (['pcep','pcap'].includes(id)) return 'Python Institute';
  // Linux Foundation
  if (['cka','cks','kcsa'].includes(id)) return 'Linux Foundation';
  // HashiCorp
  if (['terraform','hashicorp-vault'].includes(id)) return 'HashiCorp';
  // Offensive Security
  if (['oscp','oswe'].includes(id)) return 'Offensive Security';
  if (id === 'crto') return 'Zero-Point Security';
  // TCM Security
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
          <button class="mypath-star${state.myPath && state.myPath[cert.id] ? ' active' : ''}" onclick="event.stopPropagation(); toggleMyPath('${cert.id}')" title="${state.myPath && state.myPath[cert.id] ? 'Remove from My Path' : 'Add to My Path'}">${state.myPath && state.myPath[cert.id] ? '★' : '☆'}</button>
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
  // Persist synchronously; native toggle events may run after a redraw.
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
    // edge auto-scroll so other phases are reachable mid-drag
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
  // Clicking the active filter again toggles it off (returns to "all")
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

  // tier-specific core engraving (clipped to the face)
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

  // tier ornaments — external hardware that changes the silhouette
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

// ───── UPDATE HANDLERS ────────────────────────────────────────────────────
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
  // Passing a cert removes any "skipped" status
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

// ───── PHASE GATES ────────────────────────────────────────────────────────
// ───── STUDY LOG ──────────────────────────────────────────────────────────
// ───── CPE ────────────────────────────────────────────────────────────────
// ───── EXPORTS ────────────────────────────────────────────────────────────
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
  // Live estimate: remaining unpassed/unskipped/self-funded hours in this and prior phases ÷ pace
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
  // Generate CV-ready markdown grouping passed certs by CV-friendly domain.
  // Vendor-agnostic groupings that hiring managers actually scan for.
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

  // Group order matters — most senior signals first
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

  // Sort each group: gateway first, then by ROI desc
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

  // Strip trailing whitespace
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

// ───── INIT ───────────────────────────────────────────────────────────────
loadState();
// bootstrap.js renders once after every workspace module is registered.
