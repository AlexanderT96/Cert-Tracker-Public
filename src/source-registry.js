// Cert Tracker v4.1 — audited official-source registry for the critical pathway.
// This layer is intentionally separate from certs.js so provenance can be reviewed
// and refreshed without rewriting the career catalogue itself.
(function initSourceRegistry(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before source-registry.js');

  const VERIFIED = '2026-09-01';
  const registry = {
    'a-plus': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/a/core-1-and-2-v15/', note: 'Official CompTIA A+ V15 certification page; exam codes 220-1201 and 220-1202.' },
    'network-plus': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/network/', note: 'Official CompTIA Network+ certification page for N10-009.' },
    'security-plus': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/security/', note: 'Official CompTIA Security+ certification page for SY0-701.' },
    'secai-plus': { level: 'VENDOR', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/', note: 'Official CompTIA certification catalogue; cert-specific SecAI+ URL remains a tracked provenance gap.' },
    'az-900': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/', note: 'Official Microsoft Azure Fundamentals certification page.' },
    'ai-901': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/', note: 'Official Microsoft Azure AI Fundamentals page; current exam AI-901.' },
    'az-104': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/', note: 'Official Microsoft Azure Administrator Associate certification page.' },
    'az-802': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/windows-server-hybrid-administrator/', note: 'Official Microsoft Windows Server Hybrid Administrator Associate page; AZ-802 is the consolidated exam path during the 2026 transition.' },
    'terraform': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://developer.hashicorp.com/certifications/infrastructure-automation', note: 'Official HashiCorp certification page for Terraform Associate (004).' },
    'az-400': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/az-400/', note: 'Official Microsoft AZ-400 exam page.' },
    'sc-300': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/', note: 'Official Microsoft Identity and Access Administrator Associate certification page.' },
    'sc-500': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/', note: 'Official Microsoft Cloud and AI Security Engineer Associate certification page.' },
    'ccnp-enterprise': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html', note: 'Official Cisco CCNP Enterprise page; ENCOR plus one concentration, with ENARSI represented in this roadmap.' },
    'ccie-enterprise': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html', note: 'Official Cisco CCIE Enterprise Infrastructure certification page.' },
    'cka': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.cncf.io/training/certification/cka/', note: 'Official CNCF Certified Kubernetes Administrator page.' },
    'az-305': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/az-305/', note: 'Official Microsoft AZ-305 exam page.' },
    'cissp': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isc2.org/certifications/cissp', note: 'Official ISC2 CISSP certification page.' },
    'iec-62443-expert': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/isa-iec-62443-cybersecurity-certificate-program', note: 'Official ISA/IEC 62443 Cybersecurity Certificate Program page; confirms automatic Expert designation after all four specialist certificates.' },
    'isa95-fund': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/isa-95-iec-62264-enterprise-control-system-integra', note: 'Official ISA-95/IEC 62264 E-CSI Fundamentals Specialist certificate-program page.' },
    'isa-cap-associate': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/cap-associate-certificate-program', note: 'Official ISA CAP Associate certificate page; confirms review-course eligibility route and one-year CAP experience credit.' },
    'isa-cap': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/cap', note: 'Official ISA Certified Automation Professional page.' },
    'isa-apm': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/automation-project-management-specialist-certifica', note: 'Official ISA Automation Project Management Specialist certificate page.' },
    'isa-61511-sis-fund': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/safety-certificates', note: 'Official ISA/IEC 61511 Safety Certificate Program page.' },
    'isa-61511-sil-select': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/safety-certificates', note: 'Official ISA/IEC 61511 Safety Certificate Program page.' },
    'isa-61511-sil-verify': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/safety-certificates', note: 'Official ISA/IEC 61511 Safety Certificate Program page.' },
    'isa-61511-expert': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/safety-certificates', note: 'Official ISA/IEC 61511 Safety Certificate Program page; Expert is automatic after all three specialist certificates.' },
    'bcs-arch-found': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-foundation-certificate-in-architecture-concepts-and-domains/', note: 'Official BCS Architecture Foundation page.' },
    'bcs-arch-solution': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-specialist-architecture-awards/', note: 'Official BCS Specialist Architecture Awards page; Solution Architecture award.' },
    'bcs-arch-security': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-specialist-architecture-awards/', note: 'Official BCS Specialist Architecture Awards page; Security Architecture award.' },
    'bcs-arch-cloud': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-specialist-architecture-awards/', note: 'Official BCS Specialist Architecture Awards page; Cloud Infrastructure Architecture award.' }
  };

  CT.sourceRegistry = Object.freeze(Object.fromEntries(
    Object.entries(registry).map(([id, value]) => [id, Object.freeze({ ...value })])
  ));
})(window);
