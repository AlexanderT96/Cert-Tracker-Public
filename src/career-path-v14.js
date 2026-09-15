// Nexus V14 — convergence-focused My Path overlay.
(function initCareerPathV14(global){
  'use strict';
  const base=global.CERT_TRACKER_FOCUSED_ROUTE;
  if(!base)return;
  const groups=[
    ['Convergence foundation and immediate bridge',['a-plus','network-plus','mcit','mcde','arcules-csp','ccna','acp','mcie'],'Use existing physical-security depth as the base. CCNA is the foreground milestone; Axis ACP and Milestone MCIE remain role-aligned supporting milestones.'],
    ['Integration, systems and security foundations',['briefcam-tech','security-plus','linux-plus','az-802','az-104','az-700','sc-300','pcep'],'Broaden from VMS support into access/integration, operating systems, hybrid networking, identity and light automation without competing with the active foreground milestone.'],
    ['Enterprise network, security and automation depth',['ccnp-enterprise','crowdstrike-ccfa','pan-netsec-pro','sc-500','pcap'],'Build the network-security, endpoint, firewall and automation depth expected in senior integration and solutions-engineering roles.'],
    ['Converged solution and security architecture',['az-305','sc-100','cissp'],'Shift from implementation knowledge to requirements-led design, cloud/security architecture, governance and defensible cross-domain decisions.'],
    ['Experience-gated expert capstone',['ccie-enterprise'],'Keep expert networking visible as a long-horizon differentiator, but gate it behind demonstrated architecture/integration value rather than treating it as a near-term prerequisite.']
  ];
  const ids=Object.freeze(groups.flatMap(group=>group[1]));
  const phases=Object.freeze(Object.fromEntries(groups.map(([title,certs,sub],i)=>[i+1,Object.freeze({title,name:title,sub,layer:sub,window:'Self-paced',certs:Object.freeze(certs),artifact:null,roles:null,applyOut:null})])));
  const aiAutomation=Object.freeze({
    id:'automation-ai',
    title:'Python automation and applied AI',
    status:'OPTIONAL',
    why:'Python stays a background capability until it can support automation/integration work without displacing the active networking and security-platform milestones. AI credentials activate only after the mapped Python foundation is evidenced.',
    certs:Object.freeze(['pcep','pcap','pcpp1','ai-901','ai-103']),
    resources:Object.freeze([])
  });
  const focusTracks=Object.freeze([...(base.focusTracks||[]),...(base.focusTracks||[]).some(track=>track.id==='automation-ai')?[]:[aiAutomation]]);
  const auditIds=Object.freeze([...new Set([...(base.auditIds||[]),...ids,...focusTracks.flatMap(track=>track.certs||[])])]);
  const previousIds=Object.freeze([...(base.ids||[])]);
  const previousPaths=Object.freeze([previousIds,...(base.previousPaths||[])]);
  const executionPolicy=Object.freeze({
    mode:'CONVERGENCE_FOREGROUND_WITH_EVIDENCE_GATES',
    foreground:Object.freeze(['ccna','acp','mcie']),
    primary:'ccna',
    supporting:Object.freeze(['acp','mcie']),
    complementary:Object.freeze(['pcep','pcap','pcpp1']),
    evidenceRule:'A certification may establish knowledge but cannot advance a capability beyond KNOWLEDGE without practical evidence.',
    rule:'Protect the active CCNA milestone. Use Axis ACP and Milestone MCIE as role-aligned supporting study. Promote optional branches only when a live role, repeated market evidence, a prerequisite or a real project creates measurable convergence leverage.'
  });
  global.CERT_TRACKER_FOCUSED_ROUTE=Object.freeze({...base,id:'security-convergence-v14',title:'Security Convergence Engineering & Architecture',ids,phases,focusTracks,auditIds,previousIds,previousPaths,executionPolicy});
  global.CERT_TRACKER_DEFAULT_PATH=ids;
})(window);
